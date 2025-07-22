import type { Campaign, CampaignStats, DailyReport } from './data';

export function generateDailyReport(campaigns: Campaign[], stats: CampaignStats[]): DailyReport[] {
  const statsMap = new Map(stats.map(s => [s.campaign_uid, s]));

  const reports = campaigns
    .filter(c => c.status === 'sent')
    .map(campaign => {
      const campaignStats = statsMap.get(campaign.campaign_uid);
      if (!campaignStats) {
        return null;
      }

      const deliveryRate = campaignStats.delivered / campaignStats.total_sent;
      const openRate = campaignStats.unique_opens / campaignStats.delivered;
      const clickRate = campaignStats.unique_clicks / campaignStats.delivered;

      return {
        date: new Date(campaign.send_at).toISOString().split('T')[0],
        campaignName: campaign.name,
        fromName: campaign.from_name,
        subject: campaign.subject,
        totalSent: campaignStats.total_sent,
        opens: campaignStats.unique_opens,
        clicks: campaignStats.unique_clicks,
        unsubscribes: campaignStats.unsubscribes,
        bounces: campaignStats.bounces,
        deliveryRate: parseFloat((deliveryRate * 100).toFixed(2)),
        openRate: parseFloat((openRate * 100).toFixed(2)),
        clickRate: parseFloat((clickRate * 100).toFixed(2)),
      };
    })
    .filter((report): report is DailyReport => report !== null);

  return reports;
}
