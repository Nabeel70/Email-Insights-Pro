
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

export const getTotalStats = (dailyReports: DailyReport[]): Stat => {
  if (!dailyReports || dailyReports.length === 0) {
    return {
      totalSends: 0,
      totalOpens: 0,
      totalClicks: 0,
      totalUnsubscribes: 0,
      avgOpenRate: 0,
      avgClickThroughRate: 0,
    };
  }

  // Filter out campaigns that might be for farming
  const relevantReports = dailyReports.filter(c => !c.campaignName.toLowerCase().includes('farm'));

  const totalSends = relevantReports.reduce((sum, r) => sum + (r.totalSent || 0), 0);
  const totalOpens = relevantReports.reduce((sum, r) => sum + (r.opens || 0), 0);
  const totalClicks = relevantReports.reduce((sum, r) => sum + (r.clicks || 0), 0);
  const totalUnsubscribes = relevantReports.reduce((sum, r) => sum + (r.unsubscribes || 0), 0);
  
  const totalDelivered = relevantReports.reduce((sum, r) => sum + (r.totalSent - r.bounces), 0);

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
