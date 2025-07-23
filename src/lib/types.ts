import { z } from 'zod';

export type Campaign = {
  campaign_uid: string;
  name: string;
  subject: string;
  status: 'sent' | 'draft' | 'scheduled' | 'processing' | 'paused';
  from_name: string;
  send_at: string;
  date_added: string;
};

export type CampaignStats = {
  campaign_uid: string;
  processed_count: number;
  unique_opens_count: number;
  unique_clicks_count: number;
  unsubscribes_count: number;
  bounces_count: number;
  delivery_success_count: number;
  timestamp?: string; // This might not be present in the new structure
};

export type DailyReport = {
  campaignUid: string;
  date: string;
  campaignName: string;
  fromName: string;
  subject: string;
  totalSent: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
  bounces: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
};

export type EmailList = {
    general: {
        list_uid: string;
        name: string;
    }
}

export type Subscriber = {
    subscriber_uid: string;
    status: 'confirmed' | 'unsubscribed';
    date_added: string;
    fields?: {
      EMAIL?: string;
    }
};

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
