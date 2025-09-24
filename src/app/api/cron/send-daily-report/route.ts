
'use server';

import { NextResponse } from 'next/server';
import { generateDailyReport } from '@/lib/reporting';
import { generateEmailReport } from '@/ai/flows/generate-email-report-flow';
import { sendEmail } from '@/ai/flows/send-email-flow';
import type { DailyReport, Campaign, CampaignStats } from '@/lib/types';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { admin } from '@/lib/server/firebase';


export async function GET(request: Request) {
  const adminDb = getAdminFirestore(admin.app());
  // 1. Authenticate the request
  const authToken = (request.headers.get('authorization') || '').split('Bearer ').at(1);
  const isCron = request.headers.get('User-Agent')?.includes('Google-Cloud-Scheduler');

  if (isCron && (!process.env.CRON_SECRET || authToken !== process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Check for recipient email
  if (!process.env.DAILY_REPORT_RECIPIENT_EMAIL) {
      console.error('CRON JOB FAILED: Missing DAILY_REPORT_RECIPIENT_EMAIL environment variable.');
      return NextResponse.json({ error: 'Recipient email not configured.' }, { status: 500 });
  }

  try {
    // 3. Fetch data from Firestore instead of the live API
    console.log('CRON: Fetching campaigns and stats from Firestore...');
    const campaignsSnapshot = await adminDb.collection('rawCampaigns').get();
    const statsSnapshot = await adminDb.collection('rawStats').get();

    const campaigns: Campaign[] = campaignsSnapshot.docs.map(doc => doc.data() as Campaign);
    const successfulStats: CampaignStats[] = statsSnapshot.docs.map(doc => doc.data() as CampaignStats);

    if (!campaigns || campaigns.length === 0) {
      console.log('CRON: No campaigns found in Firestore. No report will be sent.');
      return NextResponse.json({ message: 'No campaigns to report.' });
    }
    
    console.log(`CRON: Found ${campaigns.length} campaigns and ${successfulStats.length} stats records in Firestore.`);

    // 4. Generate the report data
    console.log('CRON: Generating daily report data...');
    const allReports = generateDailyReport(campaigns, successfulStats);

    // 5. Segment reports into today and yesterday
    const now = new Date();
    // Use UTC for server-side date calculations to avoid timezone issues
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const yesterdayUtc = new Date(todayUtc);
    yesterdayUtc.setUTCDate(yesterdayUtc.getUTCDate() - 1);
    
    const todayReports: DailyReport[] = [];
    const yesterdayReports: DailyReport[] = [];

    for (const report of allReports) {
        // Assuming report.date is in MM/DD/YYYY format from formatDateString
        const parts = report.date.split('/');
        if (parts.length !== 3) continue;
        // Create date as UTC to compare with UTC dates
        const reportDate = new Date(Date.UTC(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1])));
        if (isNaN(reportDate.getTime())) continue;

        if (reportDate.getTime() >= todayUtc.getTime()) {
            todayReports.push(report);
        } else if (reportDate.getTime() >= yesterdayUtc.getTime()) {
            yesterdayReports.push(report);
        }
    }
    
    if (todayReports.length === 0 && yesterdayReports.length === 0) {
        console.log('CRON: No campaigns sent today or yesterday based on Firestore data. No report will be sent.');
        return NextResponse.json({ message: 'No recent campaigns to report.' });
    }

    // 6. Generate the email content with AI
    console.log('CRON: Generating AI email summary...');
    const emailContent = await generateEmailReport({ todayReports, yesterdayReports });

    // 7. Send the email
    console.log(`CRON: Sending report to ${process.env.DAILY_REPORT_RECIPIENT_EMAIL}...`);
    await sendEmail({
      to: process.env.DAILY_REPORT_RECIPIENT_EMAIL,
      subject: emailContent.subject,
      body: emailContent.body,
    });
    
    console.log('CRON: Daily report sent successfully!');
    
    // 8. Log successful run to Firestore using Admin SDK
    try {
        const statusDocRef = adminDb.collection('jobStatus').doc('dailyEmailReport');
        await statusDocRef.set({
            lastSuccess: new Date().toISOString(),
            status: 'success'
        }, { merge: true });
        console.log('CRON: Successfully logged job status to Firestore.');
    } catch (dbError) {
        console.error('CRON: Could not log job status to Firestore after sending email.', dbError);
        // Do not fail the whole job if logging fails, but log the error.
    }

    return NextResponse.json({ success: true, message: 'Daily report sent successfully.' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Log job failure to Firestore using Admin SDK
     try {
        const statusDocRef = adminDb.collection('jobStatus').doc('dailyEmailReport');
        await statusDocRef.set({
            lastFailure: new Date().toISOString(),
            status: 'failure',
            error: errorMessage
        }, { merge: true });
    } catch (dbError) {
        console.error('CRON: Could not log job FAILURE status to Firestore.', dbError);
    }
    console.error('CRON JOB FAILED:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
