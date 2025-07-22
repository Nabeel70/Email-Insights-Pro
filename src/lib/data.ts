export type Campaign = {
  id: string;
  name: string;
  date: string;
  sends: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
  openRate: number;
  clickThroughRate: number;
};

export type Stat = {
  totalSends: number;
  totalOpens: number;
  totalClicks: number;
  totalUnsubscribes: number;
  avgOpenRate: number;
  avgClickThroughRate: number;
};

const campaignsData: Omit<Campaign, 'openRate' | 'clickThroughRate'>[] = [
  { id: 'cam_1', name: 'Q2 Product Update', date: '2024-06-25', sends: 12000, opens: 3200, clicks: 450, unsubscribes: 50 },
  { id: 'cam_2', name: 'Summer Sale Kickoff', date: '2024-06-20', sends: 25000, opens: 5500, clicks: 1100, unsubscribes: 120 },
  { id: 'cam_3', name: 'New Feature Announcement', date: '2024-06-15', sends: 10000, opens: 2800, clicks: 600, unsubscribes: 30 },
  { id: 'cam_4', name: 'Weekly Newsletter - June W3', date: '2024-06-10', sends: 50000, opens: 8000, clicks: 700, unsubscribes: 250 },
  { id: 'cam_5', name: 'Webinar Invitation', date: '2024-06-05', sends: 8000, opens: 2400, clicks: 500, unsubscribes: 25 },
  { id: 'cam_6', name: 'Q1 Performance Review', date: '2024-05-28', sends: 15000, opens: 3000, clicks: 300, unsubscribes: 80 },
  { id: 'cam_7', name: 'Weekly Newsletter - June W2', date: '2024-05-20', sends: 50000, opens: 7500, clicks: 650, unsubscribes: 230 },
  { id: 'cam_8', name: 'Early Access Pass', date: '2024-05-12', sends: 7500, opens: 2500, clicks: 750, unsubscribes: 15 },
];

export const getCampaigns = (): Campaign[] => {
  return campaignsData.map(c => ({
    ...c,
    openRate: parseFloat(((c.opens / c.sends) * 100).toFixed(2)),
    clickThroughRate: parseFloat(((c.clicks / c.opens) * 100).toFixed(2)),
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getTotalStats = (campaigns: Campaign[]): Stat => {
  const totalStats = campaigns.reduce((acc, c) => {
    acc.totalSends += c.sends;
    acc.totalOpens += c.opens;
    acc.totalClicks += c.clicks;
    acc.totalUnsubscribes += c.unsubscribes;
    return acc;
  }, { totalSends: 0, totalOpens: 0, totalClicks: 0, totalUnsubscribes: 0 });

  const avgOpenRate = parseFloat(((totalStats.totalOpens / totalStats.totalSends) * 100).toFixed(2));
  const avgClickThroughRate = parseFloat(((totalStats.totalClicks / totalStats.totalOpens) * 100).toFixed(2));

  return { ...totalStats, avgOpenRate, avgClickThroughRate };
};
