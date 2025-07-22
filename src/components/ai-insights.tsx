'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyReport } from '@/lib/data';
import { Button } from './ui/button';
import { Wand2, Loader, AlertTriangle } from 'lucide-react';
import { analyzeCampaigns, CampaignAnalysis } from '@/ai/flows/analyze-campaigns-flow';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type AiInsightsProps = {
    reports: DailyReport[];
};

export function AiInsights({ reports }: AiInsightsProps) {
    const [analysis, setAnalysis] = useState<CampaignAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyzeCampaigns(reports);
            setAnalysis(result);
        } catch (err) {
            setError('Failed to get AI insights. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (reports && reports.length > 0) {
            handleAnalysis();
        }
    }, [reports]);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className='pb-2'>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">AI Summary</CardTitle>
                    <Button onClick={handleAnalysis} size="sm" variant="outline" disabled={loading}>
                        {loading ? (
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Wand2 className="mr-2 h-4 w-4" />
                        )}
                        Regenerate
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading && (
                     <div className="flex items-center justify-center h-full py-8">
                        <div className='text-center'>
                            <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p className="text-muted-foreground">Analyzing your campaign data...</p>
                        </div>
                    </div>
                )}
                {error && (
                   <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {analysis && !loading && !error && (
                    <div className="space-y-4 text-sm">
                        <div>
                            <h3 className="font-semibold mb-1">Performance Summary</h3>
                            <p className="text-muted-foreground">{analysis.summary}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Top Campaign</h3>
                            <p className="text-muted-foreground">
                                <span className='font-medium text-foreground'>{analysis.bestCampaign.campaignName}</span>: {analysis.bestCampaign.reason}
                            </p>
                        </div>
                         <div>
                            <h3 className="font-semibold mb-1">Campaign to Improve</h3>
                            <p className="text-muted-foreground">
                                <span className='font-medium text-foreground'>{analysis.worstCampaign.campaignName}</span>: {analysis.worstCampaign.reason}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Recommendations</h3>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                {analysis.recommendations.map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
                 {!analysis && !loading && !error && (
                    <div className="text-center py-8 text-muted-foreground">
                        Click &quot;Regenerate&quot; to get AI-powered insights on your campaigns.
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}