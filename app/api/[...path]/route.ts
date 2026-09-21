import {localFiles} from '@/server/files.mjs';
import { openDatabase } from '@/server/database.mjs';
import { createService } from '@/server/service.mjs';
import { createResendMailer, createConsoleMailer } from '@/server/mail.mjs';
import { initialData } from '@/lib/data';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
let service: ReturnType<typeof createService> | undefined;
function handle(request: Request) {
  const url = new URL(request.url);
  const mail = process.env.LMS_EMAIL_API_KEY
    ? createResendMailer({ apiKey: process.env.LMS_EMAIL_API_KEY, from: process.env.LMS_EMAIL_FROM || 'Tekskillup Academy <no-reply@tekskillup.academy>' })
    : createConsoleMailer();
  service ??= createService(openDatabase(), initialData.courses, { setupToken: process.env.LMS_SETUP_TOKEN, origin: process.env.LMS_ORIGIN || url.origin, files: localFiles(), mail, stripe: { secretKey: process.env.STRIPE_SECRET_KEY, webhookSecret: process.env.STRIPE_WEBHOOK_SECRET, prices: { 'pro-monthly': process.env.STRIPE_PRICE_PRO_MONTHLY, 'pro-yearly': process.env.STRIPE_PRICE_PRO_YEARLY }, portalConfigurationId: process.env.STRIPE_PORTAL_CONFIGURATION_ID } });
  return service.handle(request);
}
export const GET=handle;
export const POST=handle;
export const PUT=handle;
export const PATCH=handle;
export const DELETE=handle;
