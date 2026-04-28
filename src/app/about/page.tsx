import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { LandingPage } from "@/components/marketing/LandingPage";

// Always accessible — no redirect. Authenticated users see adapted CTAs
// ("Go to dashboard") instead of sign-up focused ones.
export default async function AboutPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <LandingPage isAuthenticated={!!session} />;
}
