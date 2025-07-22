
export type Campaign = {
  campaign_uid: string;
  name: string;
  from_name: string;
  subject: string;
  send_at: string;
  status: 'sent' | 'draft' | 'scheduled' | 'processing' | 'paused';
  date_added: string;
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

export const getTotalStats = (campaigns: Campaign[], stats: CampaignStats[]): Stat => {
  if (!campaigns || !stats || stats.length === 0) {
    return {
      totalSends: 0,
      totalOpens: 0,
      totalClicks: 0,
      totalUnsubscribes: 0,
      avgOpenRate: 0,
      avgClickThroughRate: 0,
    };
  }

  // Create a map of stats for easy lookup
  const statsMap = new Map(stats.map(s => [s.campaign_uid, s]));

  // Filter campaigns to exclude those with "farm" in the name
  const relevantCampaigns = campaigns.filter(c => !c.name.toLowerCase().includes('farm'));

  // Get the stats for the relevant campaigns
  const relevantStats = relevantCampaigns
    .map(c => statsMap.get(c.campaign_uid))
    .filter((s): s is CampaignStats => s !== undefined);

  // Calculate totals based on the filtered stats
  const totalSends = relevantStats.reduce((sum, s) => sum + (s.delivered || 0), 0);
  const totalOpens = relevantStats.reduce((sum, s) => sum + (s.unique_opens || 0), 0);
  const totalClicks = relevantStats.reduce((sum, s) => sum + (s.unique_clicks || 0), 0);
  const totalUnsubscribes = relevantStats.reduce((sum, s) => sum + (s.unsubscribes || 0), 0);
  const totalDelivered = relevantStats.reduce((sum, s) => sum + (s.delivered || 0), 0);


  const avgOpenRate = totalDelivered > 0 ? parseFloat(((totalOpens / totalDelivered) * 100).toFixed(2)) : 0;
  const avgClickThroughRate = totalDelivered > 0 ? parseFloat(((totalClicks / totalDelivered) * 100).toFixed(2)) : 0;

  return {
    totalSends,
    totalOpens,
    totalClicks,
    totalUnsubscribes,
    avgOpenRate,
    avgClickThroughRate,
  };
};
