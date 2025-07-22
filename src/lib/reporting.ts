import type { Campaign, CampaignStats, DailyReport } from './data';

export function generateDailyReport(campaigns: Campaign[], stats: CampaignStats[]): DailyReport[] {
  if (!campaigns || !stats) {
    return [];
  }
  const statsMap = new Map(stats.map(s => [s.campaign_uid, s]));

  const reports = campaigns
    .filter(c => c.status === 'sent')
    .map(campaign => {
      const campaignStats = statsMap.get(campaign.campaign_uid);
      
      const sendDate = campaign.send_at || campaign.created_at;

      // If a campaign has no stats, or no valid date, we should not attempt to create a report for it.
      if (!campaignStats || !sendDate) {
        console.warn(`Skipping report for campaign ${campaign.campaign_uid} due to missing stats or date.`);
        return null;
      }

      const delivered = campaignStats.delivered ?? 0;
      const totalSent = campaignStats.total_sent ?? 0;
      const uniqueOpens = campaignStats.unique_opens ?? 0;
      const uniqueClicks = campaignStats.unique_clicks ?? 0;

      // Prevent division by zero errors
      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
      const openRate = delivered > 0 ? (uniqueOpens / delivered) * 100 : 0;
      const clickRate = delivered > 0 ? (uniqueClicks / delivered) * 100 : 0;

      return {
        date: new Date(sendDate.replace(' ', 'T')).toISOString().split('T')[0],
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
