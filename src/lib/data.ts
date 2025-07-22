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

const campaignsData: Campaign[] = [
    { campaign_uid: 'cam_1', name: 'Q2 Product Update', from_name: 'Product Team', subject: 'New Features & Improvements', send_at: '2024-06-25T14:00:00Z', status: 'sent', created_at: '2024-06-20T10:00:00Z', updated_at: '2024-06-25T14:00:00Z' },
    { campaign_uid: 'cam_2', name: 'Summer Sale Kickoff', from_name: 'Marketing Dept', subject: 'Biggest Discounts of the Season!', send_at: '2024-06-20T18:00:00Z', status: 'sent', created_at: '2024-06-18T11:00:00Z', updated_at: '2024-06-20T18:00:00Z' },
    { campaign_uid: 'cam_3', name: 'New Feature Announcement', from_name: 'Product Team', subject: 'Introducing a Smarter Way to Work', send_at: '2024-06-15T16:00:00Z', status: 'sent', created_at: '2024-06-14T09:00:00Z', updated_at: '2024-06-15T16:00:00Z' },
    { campaign_uid: 'cam_4', name: 'Weekly Newsletter - June W3', from_name: 'Content Team', subject: 'Your Weekly Dose of Insights', send_at: '2024-06-10T12:00:00Z', status: 'sent', created_at: '2024-06-10T10:00:00Z', updated_at: '2024-06-10T12:00:00Z' },
    { campaign_uid: 'cam_5', name: 'Webinar Invitation', from_name: 'Events Team', subject: 'Live Session: Mastering Email Analytics', send_at: '2024-06-05T15:00:00Z', status: 'sent', created_at: '2024-06-04T17:00:00Z', updated_at: '2024-06-05T15:00:00Z' },
    { campaign_uid: 'cam_6', name: 'Q1 Performance Review', from_name: 'Management', subject: 'Insights from the First Quarter', send_at: '2024-05-28T14:00:00Z', status: 'sent', created_at: '2024-05-27T10:00:00Z', updated_at: '2024-05-28T14:00:00Z' },
    { campaign_uid: 'cam_7', name: 'Weekly Newsletter - June W2', from_name: 'Content Team', subject: 'Top Stories This Week', send_at: '2024-05-20T12:00:00Z', status: 'sent', created_at: '2024-05-20T09:00:00Z', updated_at: '2024-05-20T12:00:00Z' },
    { campaign_uid: 'cam_8', name: 'Early Access Pass', from_name: 'VIP Club', subject: 'You\'re Invited: Get Early Access', send_at: '2024-05-12T17:00:00Z', status: 'sent', created_at: '2024-05-10T13:00:00Z', updated_at: '2024-05-12T17:00:00Z' },
];


const campaignStatsData: CampaignStats[] = [
    { campaign_uid: 'cam_1', total_sent: 12000, unique_opens: 3200, unique_clicks: 450, unsubscribes: 50, bounces: 120, complaints: 5, delivered: 11880, timestamp: '2024-06-25T15:00:00Z' },
    { campaign_uid: 'cam_2', total_sent: 25000, unique_opens: 5500, unique_clicks: 1100, unsubscribes: 120, bounces: 300, complaints: 10, delivered: 24700, timestamp: '2024-06-20T19:00:00Z' },
    { campaign_uid: 'cam_3', total_sent: 10000, unique_opens: 2800, unique_clicks: 600, unsubscribes: 30, bounces: 100, complaints: 2, delivered: 9900, timestamp: '2024-06-15T17:00:00Z' },
    { campaign_uid: 'cam_4', total_sent: 50000, unique_opens: 8000, unique_clicks: 700, unsubscribes: 250, bounces: 500, complaints: 25, delivered: 49500, timestamp: '2024-06-10T13:00:00Z' },
    { campaign_uid: 'cam_5', total_sent: 8000, unique_opens: 2400, unique_clicks: 500, unsubscribes: 25, bounces: 80, complaints: 3, delivered: 7920, timestamp: '2024-06-05T16:00:00Z' },
    { campaign_uid: 'cam_6', total_sent: 15000, unique_opens: 3000, unique_clicks: 300, unsubscribes: 80, bounces: 150, complaints: 8, delivered: 14850, timestamp: '2024-05-28T15:00:00Z' },
    { campaign_uid: 'cam_7', total_sent: 50000, unique_opens: 7500, unique_clicks: 650, unsubscribes: 230, bounces: 450, complaints: 22, delivered: 49550, timestamp: '2024-05-20T13:00:00Z' },
    { campaign_uid: 'cam_8', total_sent: 7500, unique_opens: 2500, unique_clicks: 750, unsubscribes: 15, bounces: 50, complaints: 1, delivered: 7450, timestamp: '2024-05-12T18:00:00Z' },
];

export const getCampaigns = (): Campaign[] => {
  return [...campaignsData].sort((a, b) => new Date(b.send_at).getTime() - new Date(a.send_at).getTime());
};

export const getCampaignStats = (): CampaignStats[] => {
  return campaignStatsData;
};

export const getTotalStats = (stats: CampaignStats[]): Stat => {
  const totalStats = stats.reduce((acc, s) => {
    acc.totalSends += s.total_sent;
    acc.totalOpens += s.unique_opens;
    acc.totalClicks += s.unique_clicks;
    acc.totalUnsubscribes += s.unsubscribes;
    return acc;
  }, { totalSends: 0, totalOpens: 0, totalClicks: 0, totalUnsubscribes: 0, totalDelivered: 0 });

  const totalDelivered = stats.reduce((sum, s) => sum + s.delivered, 0);

  const avgOpenRate = parseFloat(((totalStats.totalOpens / totalDelivered) * 100).toFixed(2));
  const avgClickThroughRate = parseFloat(((totalStats.totalClicks / totalDelivered) * 100).toFixed(2));

  return { ...totalStats, avgOpenRate, avgClickThroughRate };
};
