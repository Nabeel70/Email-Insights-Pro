'use server';
/**
 * @fileOverview Generates an email report from daily campaign statistics.
 *
 * - generateEmailReport - A function that creates an email summary.
 * - EmailReportInputSchema - The Zod schema for the input.
 * - EmailReportOutputSchema - The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DailyReportSchema = z.object({
    campaignUid: z.string(),
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

export const EmailReportInputSchema = z.object({
  reports: z.array(DailyReportSchema).describe('An array of daily campaign reports from the last 24 hours.'),
});
export type EmailReportInput = z.infer<typeof EmailReportInputSchema>;

export const EmailReportOutputSchema = z.object({
  subject: z.string().describe('A compelling subject line for the email report.'),
  body: z.string().describe('The full body of the email report, formatted as plain text. Use markdown for lists and bolding.'),
});
export type EmailReportOutput = z.infer<typeof EmailReportOutputSchema>;

export async function generateEmailReport(input: EmailReportInput): Promise<EmailReportOutput> {
  return generateEmailReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEmailReportPrompt',
  input: { schema: EmailReportInputSchema },
  output: { schema: EmailReportOutputSchema },
  prompt: `You are an expert email marketing analyst. Your task is to generate a concise daily performance report email.

Analyze the following campaign data from the last 24 hours:
{{#each reports}}
- Campaign: "{{campaignName}}"
  - Subject: "{{subject}}"
  - Sent: {{totalSent}}
  - Opens: {{opens}} ({{openRate}}%)
  - Clicks: {{clicks}} ({{clickRate}}%)
  - Unsubscribes: {{unsubscribes}}
{{/each}}

Based on this data, write an email body that:
1. Starts with a brief, high-level summary of the overall performance in the last 24 hours.
2. Lists the key metrics for each individual campaign in a clear, easy-to-read format.
3. Do not include any introductory or closing remarks like "Hi Team" or "Best,". Just provide the subject and the main content of the report.
4. The entire output should be in plain text, using markdown for formatting like lists and bolding.`,
});


const generateEmailReportFlow = ai.defineFlow(
  {
    name: 'generateEmailReportFlow',
    inputSchema: EmailReportInputSchema,
    outputSchema: EmailReportOutputSchema,
  },
  async (input) => {
    if (input.reports.length === 0) {
      return {
        subject: 'No Campaigns Sent in Last 24 Hours',
        body: 'There were no email campaigns sent in the last 24 hours.',
      };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
