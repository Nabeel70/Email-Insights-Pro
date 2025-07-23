
'use client';

import React, { useState, useMemo } from 'react';
import type { Subscriber } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

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
        </div>
        <ScrollArea className="h-[400px]">
            <Table>
                <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Date Added</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.map((subscriber) => (
                    <TableRow key={subscriber.subscriber_uid}>
                        <TableCell className="font-medium">{subscriber.fields?.EMAIL ?? 'N/A'}</TableCell>
                        <TableCell>{subscriber.date_added ? new Date(subscriber.date_added.replace(' ', 'T')).toLocaleDateString() : 'N/A'}</TableCell>
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
