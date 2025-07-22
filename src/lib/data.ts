export type Campaign = {
  campaign_uid: string;
  name: string;
  from_name: string;
  subject: string;
  send_at: string;
  status: 'sent' | 'draft' | 'scheduled';
  created_at: string;
  updated_at: string;
};

export type CampaignStats = {
  campaign_uid: string;
  total_sent: number;
  unique_opens: number;
  unique_clicks: number;
  unsubscribes: number;
  bounces: number;
  complaints: number;
  delivered: number;
  timestamp: string;
};

export type DailyReport = {
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

export type Stat = {
  totalSends: number;
  totalOpens: number;
  totalClicks: number;
  totalUnsubscribes: number;
  avgOpenRate: number;
  avgClickThroughRate: number;
};

export const getTotalStats = (stats: CampaignStats[]): Stat => {
  if (!stats || stats.length === 0) {
    return {
      totalSends: 0,
      totalOpens: 0,
      totalClicks: 0,
      totalUnsubscribes: 0,
      avgOpenRate: 0,
      avgClickThroughRate: 0,
    };
  }
  
  const totalStats = stats.reduce((acc, s) => {
    acc.totalSends += s.total_sent;
    acc.totalOpens += s.unique_opens;
    acc.totalClicks += s.unique_clicks;
    acc.totalUnsubscribes += s.unsubscribes;
    return acc;
  }, { totalSends: 0, totalOpens: 0, totalClicks: 0, totalUnsubscribes: 0, totalDelivered: 0 });

  const totalDelivered = stats.reduce((sum, s) => sum + s.delivered, 0);

  const avgOpenRate = totalDelivered > 0 ? parseFloat(((totalStats.totalOpens / totalDelivered) * 100).toFixed(2)) : 0;
  const avgClickThroughRate = totalDelivered > 0 ? parseFloat(((totalStats.totalClicks / totalDelivered) * 100).toFixed(2)) : 0;

  return { ...totalStats, avgOpenRate, avgClickThroughRate };
};
