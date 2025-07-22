'use server';

import { campaignInsights } from '@/ai/flows/campaign-insights';
import type { Campaign } from '@/lib/data';

export async function getAiInsights(campaignData: Campaign[]) {
  try {
    const insights = await campaignInsights({ campaignData: JSON.stringify(campaignData, null, 2) });
    return { success: true, insights: insights.insights };
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return { success: false, error: "Failed to generate AI insights. Please try again later." };
  }
}
