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
      
      // If a campaign has no stats, we should not attempt to create a report for it.
      if (!campaignStats) {
        return null;
      }

      const delivered = campaignStats.delivered ?? 0;
      const totalSent = campaignStats.total_sent ?? 0;
      const uniqueOpens = campaignStats.unique_opens ?? 0;
      const uniqueClicks = campaignStats.unique_clicks ?? 0;

      // Prevent division by zero errors
      const deliveryRate = totalSent > 0 ? delivered / totalSent : 0;
      const openRate = delivered > 0 ? uniqueOpens / delivered : 0;
      const clickRate = delivered > 0 ? uniqueClicks / delivered : 0;

      return {
        date: new Date(campaign.send_at.replace(' ', 'T')).toISOString().split('T')[0],
        campaignName: campaign.name,
        fromName: campaign.from_name,
        subject: campaign.subject,
        totalSent: totalSent,
        opens: uniqueOpens,
        clicks: uniqueClicks,
        unsubscribes: campaignStats.unsubscribes ?? 0,
        bounces: campaignStats.bounces ?? 0,
        deliveryRate: parseFloat((deliveryRate * 100).toFixed(2)),
        openRate: parseFloat((openRate * 100).toFixed(2)),
        clickRate: parseFloat((clickRate * 100).toFixed(2)),
      };
    })
    .filter((report): report is DailyReport => report !== null);

  return reports;
}
