import type { Campaign, CampaignStats, DailyReport } from './data';
import { formatDateString } from './utils';

export function generateDailyReport(campaigns: Campaign[], stats: CampaignStats[]): DailyReport[] {
  if (!campaigns || !stats) {
    return [];
  }
  const statsMap = new Map(stats.filter(s => s).map(s => [s.campaign_uid, s]));

  const reports = campaigns
    // The status can be 'sent' or 'processing' for campaigns that have stats
    .filter(c => c.status === 'sent' || c.status === 'processing')
    .map(campaign => {
      const campaignStats = statsMap.get(campaign.campaign_uid);
      
      // Use send_at as the primary date, but fall back to date_added if it's not present.
      const sendDate = campaign.send_at || campaign.date_added;

      // If there are no stats or no valid date for this campaign, skip it.
      if (!campaignStats || !sendDate) {
        return null;
      }

      const delivered = campaignStats.delivered ?? 0;
      const totalSent = campaignStats.total_sent ?? 0;
      const uniqueOpens = campaignStats.unique_opens ?? 0;
      const uniqueClicks = campaignStats.unique_clicks ?? 0;

      // Safely calculate rates, avoiding division by zero.
      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
      const openRate = delivered > 0 ? (uniqueOpens / delivered) * 100 : 0;
      const clickRate = delivered > 0 ? (uniqueClicks / delivered) * 100 : 0;

      return {
        date: formatDateString(sendDate),
        campaignName: campaign.name,
        fromName: campaign.from_name,
        subject: campaign.subject,
        totalSent: totalSent,
        opens: uniqueOpens,
        clicks: uniqueClicks,
        unsubscribes: campaignStats.unsubscribes ?? 0,
        bounces: campaignStats.bounces ?? 0,
        deliveryRate: parseFloat(deliveryRate.toFixed(2)),
        openRate: parseFloat(openRate.toFixed(2)),
        clickRate: parseFloat(clickRate.toFixed(2)),
      };
    })
    .filter((report): report is DailyReport => report !== null);

  return reports;
}
