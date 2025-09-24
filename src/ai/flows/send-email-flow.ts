
'use server';
/**
 * @fileOverview A flow for sending emails using nodemailer.
 *
 * - sendEmail - A function that handles sending an email.
 * - sendEmailWithNodemailer - A helper function to send email via nodemailer.
 * - sendEmailTool - A Genkit tool that uses the helper to send an email.
 */

import { ai } from '@/ai/genkit';
import { SendEmailInputSchema, SendEmailOutputSchema, type SendEmailInput, type SendEmailOutput } from '@/lib/types';
import { z } from 'zod';
import nodemailer from 'nodemailer';

async function sendEmailWithNodemailer(input: SendEmailInput): Promise<{ success: boolean }> {
    const { to, subject, body } = input;
    
    // Basic validation for environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.FROM_EMAIL) {
        throw new Error('Missing required SMTP environment variables.');
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: to,
        subject: subject,
        text: body, // For now, sending the markdown as plain text.
        html: `<pre>${body}</pre>` // Or you can convert markdown to HTML here.
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to: ${to}`);
        return { success: true };
    } catch (error) {
        console.error('Nodemailer error:', error);
        // Re-throw the error so the flow can catch it
        throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
}


const sendEmailTool = ai.defineTool(
    {
        name: 'sendEmailTool',
        description: 'Sends an email to a specified recipient using nodemailer.',
        inputSchema: SendEmailInputSchema,
        outputSchema: z.object({ success: z.boolean() })
    },
    sendEmailWithNodemailer
);


const sendEmailFlow = ai.defineFlow(
    {
        name: 'sendEmailFlow',
        inputSchema: SendEmailInputSchema,
        outputSchema: SendEmailOutputSchema,
    },
    async (input) => {
        
        await sendEmailWithNodemailer(input);

        return {
            message: `The report has been successfully sent to ${input.to}.`
        };
    }
);

export async function sendEmail(input: SendEmailInput): Promise<SendEmailOutput> {
    return sendEmailFlow(input);
}
