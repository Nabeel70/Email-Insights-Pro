
'use client';

import React from 'react';
import type { Campaign } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type CampaignListTableProps = {
  data: Campaign[];
};

export function CampaignListTable({ data }: CampaignListTableProps) {
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'processing':
        return 'outline';
      default:
        return 'outline';
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
            <Table>
                <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Sent</TableHead>
                    <TableHead>Date Created</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((campaign) => (
                        <TableRow key={campaign.campaign_uid}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell>{campaign.subject}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(campaign.status)}>{campaign.status}</Badge>
                            </TableCell>
                            <TableCell>{campaign.send_at ? new Date(campaign.send_at.replace(' ', 'T')).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>{campaign.created_at ? new Date(campaign.created_at.replace(' ', 'T')).toLocaleDateString() : 'N/A'}</TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                No campaigns found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
