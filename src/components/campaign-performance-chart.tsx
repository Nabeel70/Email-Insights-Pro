'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Campaign } from '@/lib/data';
import { useMemo } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type ChartProps = {
  data: Campaign[];
};

export function CampaignPerformanceChart({ data }: ChartProps) {
  const chartData = useMemo(() => {
    return data
      .map(c => ({
        name: c.name,
        date: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        'Open Rate': c.openRate,
        'Click-Through Rate': c.clickThroughRate,
      }))
      .reverse(); // To show chronologically
  }, [data]);

  const chartConfig = {
    'Open Rate': {
      label: 'Open Rate (%)',
      color: 'hsl(var(--chart-1))',
    },
    'Click-Through Rate': {
      label: 'Click-Through Rate (%)',
      color: 'hsl(var(--chart-2))',
    },
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="pt-6 flex-1">
        <ChartContainer config={chartConfig} className="w-full h-[300px]">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Legend />
            <Bar dataKey="Open Rate" fill="var(--color-Open Rate)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Click-Through Rate" fill="var(--color-Click-Through Rate)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
