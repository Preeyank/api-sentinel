import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getRequiredSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

/** Use inside server actions — returns null instead of redirecting. */
export async function getOptionalSession() {
  return auth.api.getSession({ headers: await headers() });
}
