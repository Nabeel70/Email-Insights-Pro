'use client';

import React, { useState, useMemo } from 'react';
import type { DailyReport } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileText, FileCode } from 'lucide-react';
import { exportAsJson, exportAsCsv, exportAsXml } from '@/lib/export';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

type CampaignDataTableProps = {
  data: DailyReport[];
};

export function CampaignDataTable({ data }: CampaignDataTableProps) {
  const [filter, setFilter] = useState('');

  const filteredData = useMemo(() => {
    if (!filter) return data;
    return data.filter(report =>
      report.campaignName.toLowerCase().includes(filter.toLowerCase()) ||
      report.subject.toLowerCase().includes(filter.toLowerCase())
    );
  }, [data, filter]);

  return (
    <Card>
        <div className="flex items-center justify-between p-4 border-b">
            <div className="w-full max-w-sm">
                 <Input
                    placeholder="Filter by campaign name or subject..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full"
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => exportAsJson(filteredData, 'daily_report.json')}>
                        <FileJson className="mr-2 h-4 w-4" />
                        <span>Export as JSON</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportAsCsv(filteredData, 'daily_report.csv')}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Export as CSV</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportAsXml(filteredData, 'daily_report.xml')}>
                        <FileCode className="mr-2 h-4 w-4" />
                        <span>Export as XML</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <ScrollArea className="h-[400px]">
            <Table>
                <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Sends</TableHead>
                    <TableHead className="text-right">Opens</TableHead>
                    <TableHead className="text-right">Open Rate</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Click Rate</TableHead>
                    <TableHead className="text-right">Unsubscribes</TableHead>
                    <TableHead className="text-right">Bounces</TableHead>
                    <TableHead className="text-right">Delivery Rate</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length > 0 ? (
                        filteredData.map((report, index) => (
                        <TableRow key={index}>
                            <TableCell>{report.date}</TableCell>
                            <TableCell className="font-medium">{report.campaignName}</TableCell>
                            <TableCell>{report.subject}</TableCell>
                            <TableCell className="text-right">{report.totalSent.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{report.opens.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{report.openRate.toFixed(2)}%</TableCell>
                            <TableCell className="text-right">{report.clicks.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{report.clickRate.toFixed(2)}%</TableCell>
                            <TableCell className="text-right">{report.unsubscribes.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{report.bounces.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{report.deliveryRate.toFixed(2)}%</TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={11} className="h-24 text-center">
                                No reports found. Try syncing from the API.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
    </Card>
  );
}
