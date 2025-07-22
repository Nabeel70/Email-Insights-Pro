'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
  footer?: string;
};

export function StatCard({ title, value, icon, footer }: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
      {footer && (
        <CardFooter className="pt-0 -mt-2">
            <p className="text-xs text-muted-foreground">{footer}</p>
        </CardFooter>
      )}
    </Card>
  );
}
