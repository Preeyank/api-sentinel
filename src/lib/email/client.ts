import { Resend } from "resend";

// Single Resend instance reused across all email sends — avoids re-creating
// the client (and its internal HTTP agent) on every call.
export const resend = new Resend(process.env.RESEND_API_KEY);
