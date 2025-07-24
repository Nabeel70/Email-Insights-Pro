
'use server';
/**
 * @fileOverview A flow for sending emails using nodemailer.
 *
 * - sendEmail - A function that handles sending an email.
 * - sendEmailTool - A Genkit tool that uses nodemailer to send an email.
 */

import { ai } from '@/ai/genkit';
import { SendEmailInputSchema, SendEmailOutputSchema, type SendEmailInput, type SendEmailOutput } from '@/lib/types';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const sendEmailTool = ai.defineTool(
    {
        name: 'sendEmailTool',
        description: 'Sends an email to a specified recipient using nodemailer.',
        inputSchema: SendEmailInputSchema,
        outputSchema: z.object({ success: z.boolean() })
    },
    async (input) => {
        const { to, subject, body } = input;
        
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
);


const sendEmailFlow = ai.defineFlow(
    {
        name: 'sendEmailFlow',
        inputSchema: SendEmailInputSchema,
        outputSchema: SendEmailOutputSchema,
    },
    async (input) => {
        
        await sendEmailTool.fn(input);

        return {
            message: `The report has been successfully sent to ${input.to}.`
        };
    }
);

export async function sendEmail(input: SendEmailInput): Promise<SendEmailOutput> {
    return sendEmailFlow(input);
}
