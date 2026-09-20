import {localFiles} from '@/server/files.mjs';
import { openDatabase } from '@/server/database.mjs';
import { createService } from '@/server/service.mjs';
import { initialData } from '@/lib/data';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const globalBackend = globalThis as typeof globalThis & { lmsService?: ReturnType<typeof createService> };
function handle(request: Request) {
  globalBackend.lmsService ??= createService(openDatabase(), initialData.courses, { setupToken: process.env.LMS_SETUP_TOKEN, origin: process.env.LMS_ORIGIN, files: localFiles() });
  return globalBackend.lmsService.handle(request);
}
export const GET=handle;
export const POST=handle;
export const PUT=handle;
export const PATCH=handle;
export const DELETE=handle;
