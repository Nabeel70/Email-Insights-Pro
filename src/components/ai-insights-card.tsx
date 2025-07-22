'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Terminal } from 'lucide-react';
import { getAiInsights } from '@/app/actions';
import type { Campaign } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type AiInsightsCardProps = {
  campaigns: Campaign[];
};

export function AiInsightsCard({ campaigns }: AiInsightsCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null);

    const result = await getAiInsights(campaigns);

    if (result.success) {
      setInsights(result.insights);
    } else {
      setError(result.error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: result.error,
      })
    }
    setIsLoading(false);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="pt-6 flex-1 flex flex-col justify-center items-center text-center">
        {isLoading ? (
          <div className="w-full space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6 mx-auto" />
          </div>
        ) : insights ? (
          <div className="text-left whitespace-pre-wrap font-mono text-sm">
             {insights}
          </div>
        ) : error ? (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-primary/10 rounded-full">
                <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Click the button to analyze your campaign data and get actionable insights from our AI.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateInsights} disabled={isLoading} className="w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          {isLoading ? 'Analyzing...' : 'Generate Insights'}
        </Button>
      </CardFooter>
    </Card>
  );
}
