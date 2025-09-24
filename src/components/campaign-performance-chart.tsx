'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { DailyReport } from '@/lib/types';

type ChartData = {
  name: string;
  date: string;
  'Open Rate': number;
  'Click-Through Rate': number;
}

type ChartProps = {
  data: ChartData[];
};

export function CampaignPerformanceChart({ data }: ChartProps) {

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
          <BarChart data={data.reverse()} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
