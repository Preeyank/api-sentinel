import { render } from "@react-email/components";
import { resend } from "@/lib/email/client";
import { IncidentAlert } from "@/lib/email/IncidentAlert";
import { ALERT_FROM_EMAIL, ALERT_SUBJECT_PREFIX } from "@/lib/constants/email";
import { prisma } from "@/lib/prisma";
import type { IncidentEvent } from "@/types/checks";

export async function sendIncidentAlert(event: IncidentEvent): Promise<void> {
  // Fetch monitor + owner email in one query — we need the owner's email as
  // the recipient and the monitor's name/url/slug for the email content.
  const monitor = await prisma.monitor.findUnique({
    where: { id: event.monitorId },
    select: {
      name: true,
      url: true,
      slug: true,
      user: { select: { email: true } },
    },
  });

  if (!monitor) return;

  const recipientEmail = monitor.user.email;
  const isOpened = event.kind === "opened";
  const isFailure = event.incidentType === "FAILURE";

  const subject = isOpened
    ? `${ALERT_SUBJECT_PREFIX} ${isFailure ? `${monitor.name} is down` : `${monitor.name} is experiencing high latency`}`
    : `${ALERT_SUBJECT_PREFIX} ${monitor.name} has recovered`;

  const statusPageUrl = `${process.env.BETTER_AUTH_URL}/status/${monitor.slug}`;

  const html = await render(
    IncidentAlert({
      kind: event.kind,
      incidentType: event.incidentType,
      monitorName: monitor.name,
      monitorUrl: monitor.url,
      statusPageUrl,
      occurredAt: new Date(),
    }),
  );

  await resend.emails.send({
    from: ALERT_FROM_EMAIL,
    to: recipientEmail,
    subject,
    html,
  });
}
