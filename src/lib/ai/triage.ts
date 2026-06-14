import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { AI_TRIAGE_MODEL, TRIAGE_CONTEXT_CHECK_COUNT } from "@/lib/constants/ai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export type TriageResult = {
  rootCause: string;
  likelyChange: string;
  debugSteps: string[];
};

// Gemini JSON schema — enforces the exact shape we want back.
// minItems/maxItems on debugSteps keeps the output focused (3–5 steps).
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    rootCause: {
      type: "string",
      description:
        "One sentence — the most likely cause based on the evidence.",
    },
    likelyChange: {
      type: "string",
      description:
        "What probably changed recently to trigger this. If unknown, say so.",
    },
    debugSteps: {
      type: "array",
      items: { type: "string" },
      description: "3–5 concrete next steps the engineer should take.",
      minItems: 3,
      maxItems: 5,
    },
  },
  required: ["rootCause", "likelyChange", "debugSteps"],
};

export async function generateTriage(incidentId: string): Promise<TriageResult> {
  // Single query — pulls everything the prompt needs in one round-trip.
  // CheckResults are ordered newest-first so the prompt reads chronologically
  // from most recent (top) to oldest (bottom), matching how an SRE would scan.
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      monitor: {
        include: {
          checkResults: {
            orderBy: { checkedAt: "desc" },
            take: TRIAGE_CONTEXT_CHECK_COUNT,
          },
        },
      },
    },
  });

  if (!incident) throw new Error("Incident not found");

  const { monitor } = incident;
  const checks = monitor.checkResults;

  // Build the check history table — responseSnippet is capped at 200 chars
  // to keep the prompt size predictable and avoid hitting token limits.
  const checkHistoryLines = checks.map((c) => {
    const snippet = c.responseSnippet
      ? c.responseSnippet.slice(0, 200)
      : "—";
    return `${c.checkedAt.toISOString()} | ${c.statusCode ?? "—"} | ${c.latencyMs ?? "—"} ms | ${c.errorType ?? "—"} | ${snippet}`;
  });

  const userContent = `
INCIDENT
Type: ${incident.type}
Started: ${incident.startedAt.toISOString()}
Ended: ${incident.endedAt ? incident.endedAt.toISOString() : "ongoing"}
Snapshot: ${JSON.stringify(incident.incidentSnapshot ?? {})}

MONITOR
Name: ${monitor.name}
URL: ${monitor.url}
Expected status: ${monitor.expectedStatus}
Latency threshold: ${monitor.latencyThresholdMs != null ? `${monitor.latencyThresholdMs} ms` : "not set"}
Environment: ${monitor.environment}

RECENT CHECK HISTORY (newest first, up to ${TRIAGE_CONTEXT_CHECK_COUNT} rows)
Timestamp | statusCode | latencyMs | errorType | responseSnippet[:200]
${checkHistoryLines.join("\n")}
`.trim();

  const response = await ai.models.generateContent({
    model: AI_TRIAGE_MODEL,
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    config: {
      systemInstruction:
        "You are an SRE triage assistant. Reason only from the evidence provided. " +
        "If the data is insufficient to draw a conclusion, say so explicitly rather than speculate. " +
        "Output must match the schema.",
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const raw = response.text;
  if (!raw) throw new Error("Gemini returned an empty response");

  const triage = JSON.parse(raw) as TriageResult;

  // Persist in a transaction so the three fields are always written together.
  // If the UPDATE fails, nothing is committed — the caller can retry.
  await prisma.$transaction(async (tx) => {
    await tx.incident.update({
      where: { id: incidentId },
      data: {
        aiTriageText: JSON.stringify(triage),
        aiGeneratedAt: new Date(),
        aiModel: AI_TRIAGE_MODEL,
      },
    });
  });

  return triage;
}
