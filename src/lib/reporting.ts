
import type { Campaign, CampaignStats, DailyReport } from './types';
import { formatDateString } from './utils';

export function generateDailyReport(campaigns: Campaign[], stats: (CampaignStats | null)[]): DailyReport[] {
  // Safeguard: Filter out any null or undefined stats to prevent crashes.
  const validStats = stats.filter((s): s is CampaignStats => s !== null && s !== undefined);

  if (!campaigns || !validStats || campaigns.length === 0 || validStats.length === 0) {
    return [];
  }

  const campaignMap = new Map(campaigns.map(c => [c.campaign_uid, c]));
  const reports: DailyReport[] = [];

  for (const campaignStats of validStats) {
    const campaign = campaignMap.get(campaignStats.campaign_uid);

    if (campaign && typeof campaignStats.delivery_success_count === 'number' && campaignStats.delivery_success_count > 0) {
      
      const totalSent = campaignStats.processed_count ?? 0;
      const delivered = campaignStats.delivery_success_count;
      const uniqueOpens = campaignStats.unique_opens_count ?? 0;
      const uniqueClicks = campaignStats.unique_clicks_count ?? 0;
      
      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 100;
      const openRate = delivered > 0 ? (uniqueOpens / delivered) * 100 : 0;
      // Click Rate should be based on unique opens (Click-to-Open Rate), not deliveries.
      const clickRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;
      
      const reportDate = campaign.send_at || campaign.date_added;

      reports.push({
        campaignUid: campaign.campaign_uid,
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

  return reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
