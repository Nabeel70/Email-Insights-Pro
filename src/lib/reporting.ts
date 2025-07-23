
import type { Campaign, CampaignStats, DailyReport } from './data';
import { formatDateString } from './utils';

export function generateDailyReport(campaigns: Campaign[], stats: (CampaignStats | null)[]): DailyReport[] {
  if (!campaigns || !stats || campaigns.length === 0 || stats.length === 0) {
    return [];
  }

  // Create a Map for efficient lookup of stats by campaign_uid.
  // Filter out any null/undefined entries in the stats array first.
  const statsMap = new Map(stats.filter((s): s is CampaignStats => !!s).map(s => [s.campaign_uid, s]));

  const reports: DailyReport[] = [];

  for (const campaign of campaigns) {
    const campaignStats = statsMap.get(campaign.campaign_uid);

    // CORE FIX: Only generate a report if we have stats AND the campaign has actual deliveries.
    // This is the most reliable way to determine if a campaign is reportable.
    if (campaignStats && typeof campaignStats.delivery_success_count === 'number' && campaignStats.delivery_success_count > 0) {
      
      const totalSent = campaignStats.processed_count ?? 0;
      const delivered = campaignStats.delivery_success_count; // We know this is a number > 0
      const uniqueOpens = campaignStats.unique_opens_count ?? 0;
      const uniqueClicks = campaignStats.unique_clicks_count ?? 0;

      // Safely calculate rates, we know `delivered` is non-zero here.
      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 100;
      const openRate = (uniqueOpens / delivered) * 100;
      // Click-through rate is usually calculated as (unique clicks / delivered emails) * 100
      const clickRate = (uniqueClicks / delivered) * 100;
      
      // Use the most relevant date for the report.
      const reportDate = campaign.send_at || campaign.date_added;

      reports.push({
        date: formatDateString(reportDate),
        campaignName: campaign.name,
        fromName: campaign.from_name,
        subject: campaign.subject,
        totalSent: totalSent,
        opens: uniqueOpens,
        clicks: uniqueClicks,
        unsubscribes: campaignStats.unsubscribes_count ?? 0,
        bounces: campaignStats.bounces_count ?? 0,
        deliveryRate: parseFloat(deliveryRate.toFixed(2)),
        openRate: parseFloat(openRate.toFixed(2)),
        clickRate: parseFloat(clickRate.toFixed(2)),
      });
    }
  }

  // Sort reports by date, most recent first.
  return reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
