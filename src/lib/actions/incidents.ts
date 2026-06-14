"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { generateTriage, type TriageResult } from "@/lib/ai/triage";

export async function generateIncidentTriage(
  incidentId: string,
): Promise<
  | { success: true; data: TriageResult }
  | { success: false; error: string }
> {
  const session = await getRequiredSession();

  // Fetch the incident and its monitor so we can verify ownership.
  // We need monitor.userId to confirm this user owns the monitor the incident
  // belongs to — same pattern used in monitors.ts via getOwnedMonitor().
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: { monitor: { select: { userId: true, slug: true } } },
  });

  if (!incident || incident.monitor.userId !== session.user.id) {
    return { success: false, error: "Incident not found" };
  }

  // Idempotency guard — triage is write-once. If it already exists, return
  // the stored result immediately without hitting Gemini. This prevents quota
  // drift if the user somehow triggers the action twice (e.g. double-click).
  if (incident.aiTriageText) {
    try {
      const existing = JSON.parse(incident.aiTriageText) as TriageResult;
      return { success: true, data: existing };
    } catch {
      // Stored JSON is malformed — fall through and regenerate.
    }
  }

  try {
    const triage = await generateTriage(incidentId);

    // Revalidate the incident detail page so the locked triage state renders
    // immediately without the user needing to manually refresh.
    revalidatePath(
      `/dashboard/monitors/${incident.monitor.slug}/incidents/${incidentId}`,
    );

    return { success: true, data: triage };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // Gemini rate limit — give the user a specific, actionable message
    // rather than a generic "something went wrong".
    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      return {
        success: false,
        error: "Daily AI quota reached. Try again tomorrow.",
      };
    }

    return { success: false, error: "Failed to generate triage. Please try again." };
  }
}
