'use server';
/**
 * @fileOverview This flow analyzes email campaign data to provide insights and recommendations.
 * 
 * - analyzeCampaigns - A function that takes daily campaign reports and returns an analysis.
 * - CampaignAnalysisSchema - The Zod schema for the analysis output.
 * - CampaignAnalysis - The TypeScript type for the analysis output.
 */

import { ai } from '@/ai/genkit';
import type { DailyReport } from '@/lib/data';
import { z } from 'zod';

// Define the schema for a single campaign report, to be used in the array
const DailyReportSchema = z.object({
    date: z.string(),
    campaignName: z.string(),
    fromName: z.string(),
    subject: z.string(),
    totalSent: z.number(),
    opens: z.number(),
    clicks: z.number(),
    unsubscribes: z.number(),
    bounces: z.number(),
    deliveryRate: z.number(),
    openRate: z.number(),
    clickRate: z.number(),
});

// Define the input schema as an array of daily reports
const CampaignAnalysisInputSchema = z.array(DailyReportSchema);

// Define the output schema for the analysis
export const CampaignAnalysisSchema = z.object({
  summary: z.string().describe('A brief summary of the overall campaign performance.'),
  bestCampaign: z.object({
    campaignName: z.string().describe('The name of the best performing campaign.'),
    reason: z.string().describe('The reason why this campaign was the best, based on key metrics.'),
  }),
  worstCampaign: z.object({
    campaignName: z.string().describe('The name of the worst performing campaign.'),
    reason: z.string().describe('The reason why this campaign was the worst, based on key metrics.'),
  }),
  recommendations: z.array(z.string()).describe('A list of actionable recommendations to improve future campaigns.'),
});
export type CampaignAnalysis = z.infer<typeof CampaignAnalysisSchema>;


// The exported function that will be called from the frontend
export async function analyzeCampaigns(reports: DailyReport[]): Promise<CampaignAnalysis> {
  return campaignAnalysisFlow(reports);
}

// Define the Genkit prompt
const campaignAnalysisPrompt = ai.definePrompt({
    name: 'campaignAnalysisPrompt',
    input: { schema: CampaignAnalysisInputSchema },
    output: { schema: CampaignAnalysisSchema },
    prompt: `You are an expert email marketing analyst. Analyze the following daily campaign reports and provide a summary of the performance, identify the best and worst performing campaigns, and offer actionable recommendations.

    Focus on open rate, click-through rate, and unsubscribe rate as the primary indicators of performance.

    Data:
    {{{json input}}}
    `,
});

// Define the Genkit flow
const campaignAnalysisFlow = ai.defineFlow(
  {
    name: 'campaignAnalysisFlow',
    inputSchema: CampaignAnalysisInputSchema,
    outputSchema: CampaignAnalysisSchema,
  },
  async (reports) => {
    const { output } = await campaignAnalysisPrompt(reports);
    if (!output) {
      throw new Error('Failed to generate campaign analysis.');
    }
    return output;
  }
);
