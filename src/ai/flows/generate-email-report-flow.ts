'use server';
/**
 * @fileOverview Generates an email report from daily campaign statistics.
 *
 * - generateEmailReport - A function that creates an email summary.
 */

import { ai } from '@/ai/genkit';
import { EmailReportInputSchema, EmailReportOutputSchema, type EmailReportInput, type EmailReportOutput } from '@/lib/types';
import { googleAI } from '@genkit-ai/googleai';


export async function generateEmailReport(input: EmailReportInput): Promise<EmailReportOutput> {
  return generateEmailReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEmailReportPrompt',
  input: { schema: EmailReportInputSchema },
  output: { schema: EmailReportOutputSchema },
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are an expert email marketing analyst. Your task is to generate a concise daily performance report email.

Analyze the following campaign data from today and yesterday.

{{#if todayReports}}
**Today's Campaigns:**
{{#each todayReports}}
- Campaign: "{{campaignName}}"
  - Date: {{date}}
  - Subject: "{{subject}}"
  - Sent: {{totalSent}}
  - Opens: {{opens}} ({{openRate}}%)
  - Clicks: {{clicks}} ({{clickRate}}%)
  - Unsubscribes: {{unsubscribes}}
{{/each}}
{{/if}}

{{#if yesterdayReports}}
**Yesterday's Campaigns:**
{{#each yesterdayReports}}
- Campaign: "{{campaignName}}"
  - Date: {{date}}
  - Subject: "{{subject}}"
  - Sent: {{totalSent}}
  - Opens: {{opens}} ({{openRate}}%)
  - Clicks: {{clicks}} ({{clickRate}}%)
  - Unsubscribes: {{unsubscribes}}
{{/each}}
{{/if}}

Based on this data, write an email body that:
1. Starts with a brief, high-level summary of the overall performance in the last 24 hours.
2. Includes the segmented lists for "Today's Campaigns" and "Yesterday's Campaigns" if data exists for them.
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
    if (input.todayReports.length === 0 && input.yesterdayReports.length === 0) {
      return {
        subject: 'No Campaigns Sent in Last 48 Hours',
        body: 'There were no email campaigns sent today or yesterday.',
      };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
