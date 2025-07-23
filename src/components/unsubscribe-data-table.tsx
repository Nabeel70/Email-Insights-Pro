
'use client';

import React, { useState, useMemo } from 'react';
import type { Subscriber } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from './ui/button';
import { Download, FileCode, FileJson, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { exportAsCsv, exportAsJson, exportAsXml } from '@/lib/export';
import { formatDateString } from '@/lib/utils';

type UnsubscribeDataTableProps = {
  data: Subscriber[];
};

export function UnsubscribeDataTable({ data }: UnsubscribeDataTableProps) {
  const [filter, setFilter] = useState('');

  const filteredData = useMemo(() => {
    if (!filter) return data;
    return data.filter(subscriber =>
      subscriber.fields?.EMAIL?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [data, filter]);

  // We need a simple object for export, not the nested structure.
  const exportableData = useMemo(() => {
    return filteredData.map(sub => ({
        email: sub.fields?.EMAIL ?? 'N/A',
        unsubscribe_date: formatDateString(sub.date_added),
    }));
  }, [filteredData]);

  return (
    <Card>
        <div className="flex items-center justify-between p-4 border-b">
            <div className="w-full max-w-sm">
                 <Input
                    placeholder="Filter by email..."
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
                    <DropdownMenuItem onClick={() => exportAsJson(exportableData, 'unsubscribes.json')}>
                        <FileJson className="mr-2 h-4 w-4" />
                        <span>Export as JSON</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportAsCsv(exportableData, 'unsubscribes.csv')}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Export as CSV</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportAsXml(exportableData, 'unsubscribes.xml')}>
                        <FileCode className="mr-2 h-4 w-4" />
                        <span>Export as XML</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <ScrollArea className="h-[600px]">
            <Table>
                <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Date Unsubscribed</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.map((subscriber) => (
                    <TableRow key={subscriber.subscriber_uid}>
                        <TableCell className="font-medium">{subscriber.fields?.EMAIL ?? 'N/A'}</TableCell>
                        <TableCell>{formatDateString(subscriber.date_added)}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
        {filteredData.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
                No unsubscribed users found.
            </div>
        )}
    </Card>
  );
}
