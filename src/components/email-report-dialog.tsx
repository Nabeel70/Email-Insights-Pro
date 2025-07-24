'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy } from 'lucide-react';
import type { DailyReport } from '@/lib/types';
import { generateEmailReport } from '@/ai/flows/generate-email-report-flow';
import { formatDateString } from '@/lib/utils';

type EmailReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reports: DailyReport[];
};

export function EmailReportDialog({ open, onOpenChange, reports }: EmailReportDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setSubject('');
    setBody('');

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = formatDateString(today.toISOString());
    const yesterdayStr = formatDateString(yesterday.toISOString());
    
    const todayReports = reports.filter(r => r.date === todayStr);
    const yesterdayReports = reports.filter(r => r.date === yesterdayStr);

    try {
      const result = await generateEmailReport({ todayReports, yesterdayReports });
      setSubject(result.subject);
      setBody(result.body);
    } catch (error) {
      console.error('Failed to generate email report:', error);
      toast({
        title: 'Error',
        description: 'Could not generate the email report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
    });
  };

  const hasReports = reports.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Generate Day-over-Day Email Report</DialogTitle>
          <DialogDescription>
            Generate an AI-powered summary of campaign activity from today and yesterday, ready to be sent as an email.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Button onClick={handleGenerateReport} disabled={isLoading || !hasReports}>
            {isLoading ? 'Generating...' : 'Generate with AI'}
          </Button>
          {!hasReports && <p className="text-sm text-muted-foreground">No campaigns found in the last 48 hours to report on.</p>}

          {subject && (
             <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <div className="flex items-center gap-2">
                    <Input id="subject" value={subject} readOnly />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(subject)}>
                        <Copy />
                    </Button>
                </div>
            </div>
          )}
          {body && (
            <div className="space-y-2">
                <Label htmlFor="body">Email Body</Label>
                 <div className="flex items-center gap-2">
                    <Textarea id="body" value={body} readOnly rows={15} />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(body)}>
                        <Copy />
                    </Button>
                </div>
            </div>
          )}
        </div>
         <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
