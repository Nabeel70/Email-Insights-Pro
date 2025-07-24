
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
import { Copy, Send } from 'lucide-react';
import type { DailyReport } from '@/lib/types';
import { generateEmailReport } from '@/ai/flows/generate-email-report-flow';
import { sendEmail } from '@/ai/flows/send-email-flow';

type EmailReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reports: DailyReport[];
};

export function EmailReportDialog({ open, onOpenChange, reports }: EmailReportDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setSubject('');
    setBody('');

    try {
      const now = new Date();
      
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

      const todayReports: DailyReport[] = [];
      const yesterdayReports: DailyReport[] = [];

      for (const report of reports) {
        // Report date is 'MM/DD/YYYY', convert it to a Date object for comparison
        const parts = report.date.split('/');
        if (parts.length !== 3) continue;
        
        const reportDate = new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));

        if (isNaN(reportDate.getTime())) continue;

        if (reportDate.getTime() >= startOfToday.getTime()) {
          todayReports.push(report);
        } else if (reportDate.getTime() >= startOfYesterday.getTime()) {
          yesterdayReports.push(report);
        }
      }
      
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

  const handleSendReport = async () => {
    if (!recipientEmail || !subject || !body) {
        toast({ title: 'Missing Information', description: 'Please enter a recipient email and generate a report first.', variant: 'destructive' });
        return;
    }
    setIsSending(true);
    try {
        const result = await sendEmail({ to: recipientEmail, subject, body });
        toast({
            title: 'Report Sent!',
            description: result.message,
        });
        onOpenChange(false); // Close dialog on success
    } catch (error) {
        console.error('Failed to send email:', error);
        toast({
            title: 'Sending Failed',
            description: (error as Error).message || 'Could not send the email report.',
            variant: 'destructive',
        });
    } finally {
        setIsSending(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
    });
  };

  const hasReports = reports.length > 0;
  const isReportGenerated = subject && body;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Generate & Send Day-over-Day Report</DialogTitle>
          <DialogDescription>
            Generate an AI summary of campaign activity from today and yesterday, then send it as an email.
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
                        <Copy className="h-4 w-4" />
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
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          )}

          {isReportGenerated && (
            <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Email Address</Label>
                    <Input 
                        id="recipient" 
                        type="email"
                        placeholder="recipient@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        disabled={isSending}
                    />
                </div>
                <Button onClick={handleSendReport} disabled={isSending || !recipientEmail}>
                    <Send className="mr-2 h-4 w-4" />
                    {isSending ? 'Sending...' : 'Send Report'}
                </Button>
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
