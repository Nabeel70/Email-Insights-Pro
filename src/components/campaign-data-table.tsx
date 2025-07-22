'use client';

import React, { useState, useMemo } from 'react';
import type { Campaign } from '@/lib/data';
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
  data: Campaign[];
};

export function CampaignDataTable({ data }: CampaignDataTableProps) {
  const [filter, setFilter] = useState('');

  const filteredData = useMemo(() => {
    if (!filter) return data;
    return data.filter(campaign =>
      campaign.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [data, filter]);

  return (
    <Card>
        <div className="flex items-center justify-between p-4 border-b">
            <div className="w-full max-w-sm">
                 <Input
                    placeholder="Filter campaigns by name..."
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
                    <DropdownMenuItem onClick={() => exportAsJson(filteredData)}>
                        <FileJson className="mr-2 h-4 w-4" />
                        <span>Export as JSON</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportAsCsv(filteredData)}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Export as CSV</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportAsXml(filteredData)}>
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
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Sends</TableHead>
                    <TableHead className="text-right">Opens</TableHead>
                    <TableHead className="text-right">Open Rate</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Unsubscribes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.map(campaign => (
                    <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{new Date(campaign.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{campaign.sends.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{campaign.opens.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{campaign.openRate.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{campaign.clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{campaign.clickThroughRate.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{campaign.unsubscribes.toLocaleString()}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    </Card>
  );
}
