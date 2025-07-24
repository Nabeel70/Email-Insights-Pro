
'use server';
/**
 * @fileOverview A flow for sending emails.
 *
 * - sendEmail - A function that handles sending an email.
 * - sendEmailTool - A Genkit tool that simulates an email sending API.
 */

import { ai } from '@/ai/genkit';
import { SendEmailInputSchema, SendEmailOutputSchema, type SendEmailInput, type SendEmailOutput } from '@/lib/types';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

// This is a placeholder tool. In a real application, this would be replaced
// with a call to an actual email service provider like Resend, SendGrid, etc.
const sendEmailTool = ai.defineTool(
    {
        name: 'sendEmailTool',
        description: 'Sends an email to a specified recipient.',
        inputSchema: SendEmailInputSchema,
        outputSchema: z.object({ success: z.boolean() })
    },
    async (input) => {
        console.log(`Simulating sending email to: ${input.to}`);
        console.log(`Subject: ${input.subject}`);
        // In a real implementation, you would add your email sending logic here.
        // For example, using the 'resend' package:
        // const resend = new Resend(process.env.RESEND_API_KEY);
        // await resend.emails.send({
        //     from: 'onboarding@resend.dev',
        //     to: input.to,
        //     subject: input.subject,
        //     html: input.body,
        // });
        return { success: true };
    }
);


const sendEmailFlow = ai.defineFlow(
    {
        name: 'sendEmailFlow',
        inputSchema: SendEmailInputSchema,
        outputSchema: SendEmailOutputSchema,
        model: googleAI.model('gemini-1.5-flash'),
        tools: [sendEmailTool]
    },
    async (input) => {
        
        await ai.runTool('sendEmailTool', input);

        return {
            message: `The report has been successfully sent to ${input.to}.`
        };
    }
);

export async function sendEmail(input: SendEmailInput): Promise<SendEmailOutput> {
    return sendEmailFlow(input);
}
