'use server';
/**
 * @fileOverview Email campaign insight generation.
 *
 * - campaignInsights - A function that provides insights from email campaign data.
 * - CampaignInsightsInput - The input type for the campaignInsights function.
 * - CampaignInsightsOutput - The return type for the campaignInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CampaignInsightsInputSchema = z.object({
  campaignData: z.string().describe('JSON string of campaign performance data, including sends, opens, clicks, unsubscribes.'),
});
export type CampaignInsightsInput = z.infer<typeof CampaignInsightsInputSchema>;

const CampaignInsightsOutputSchema = z.object({
  insights: z.string().describe('Actionable insights to improve future campaign performance.'),
});
export type CampaignInsightsOutput = z.infer<typeof CampaignInsightsOutputSchema>;

export async function campaignInsights(input: CampaignInsightsInput): Promise<CampaignInsightsOutput> {
  return campaignInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'campaignInsightsPrompt',
  input: {schema: CampaignInsightsInputSchema},
  output: {schema: CampaignInsightsOutputSchema},
  prompt: `Analyze the following email campaign data and provide actionable insights to improve future campaign performance.\n\nCampaign Data: {{{campaignData}}}\n\nFocus on identifying underperforming campaigns, suggesting optimizations for future campaigns, and highlighting key trends.`,
});

const campaignInsightsFlow = ai.defineFlow(
  {
    name: 'campaignInsightsFlow',
    inputSchema: CampaignInsightsInputSchema,
    outputSchema: CampaignInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
