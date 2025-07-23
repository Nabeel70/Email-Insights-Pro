
import type { DailyReport } from './types';

export type Stat = {
  totalSends: number;
  totalOpens: number;
  totalClicks: number;
  totalUnsubscribes: number;
  avgOpenRate: number;
  avgClickThroughRate: number;
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
