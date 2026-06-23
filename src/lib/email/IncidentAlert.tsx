import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";

export type IncidentAlertProps = {
  kind: "opened" | "closed";
  incidentType: "FAILURE" | "LATENCY";
  monitorName: string;
  monitorUrl: string;
  statusPageUrl: string;
  occurredAt: Date;
};

export function IncidentAlert({
  kind,
  incidentType,
  monitorName,
  monitorUrl,
  statusPageUrl,
  occurredAt,
}: IncidentAlertProps) {
  const isOpened = kind === "opened";
  const isFailure = incidentType === "FAILURE";

  const title = isOpened
    ? isFailure
      ? `${monitorName} is down`
      : `${monitorName} is experiencing high latency`
    : `${monitorName} has recovered`;

  const accentColor = isOpened ? "#ef4444" : "#22c55e";

  const bodyText = isOpened
    ? isFailure
      ? `We detected a service failure on ${monitorName} (${monitorUrl}). The monitor has been failing consecutively and an incident has been opened.`
      : `We detected high latency on ${monitorName} (${monitorUrl}). Response times have exceeded the configured threshold consecutively.`
    : `${monitorName} (${monitorUrl}) has returned to normal. The incident has been closed.`;

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Accent bar */}
          <Section style={{ ...styles.accentBar, backgroundColor: accentColor }} />

          <Section style={styles.content}>
            <Heading style={styles.heading}>{title}</Heading>
            <Text style={styles.bodyText}>{bodyText}</Text>

            <Hr style={styles.hr} />

            {/* Details grid */}
            <Section>
              <Row>
                <Column style={styles.labelCol}>
                  <Text style={styles.label}>Monitor</Text>
                </Column>
                <Column>
                  <Text style={styles.value}>{monitorName}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={styles.labelCol}>
                  <Text style={styles.label}>URL</Text>
                </Column>
                <Column>
                  <Text style={styles.value}>{monitorUrl}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={styles.labelCol}>
                  <Text style={styles.label}>Type</Text>
                </Column>
                <Column>
                  <Text style={styles.value}>{incidentType}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={styles.labelCol}>
                  <Text style={styles.label}>{isOpened ? "Opened" : "Resolved"}</Text>
                </Column>
                <Column>
                  <Text style={styles.value}>
                    {occurredAt.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZoneName: "short",
                    })}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr style={styles.hr} />

            <Text style={styles.footer}>
              View the status page:{" "}
              <a href={statusPageUrl} style={styles.link}>
                {statusPageUrl}
              </a>
            </Text>
            <Text style={styles.footer}>
              You&apos;re receiving this because you own this monitor on API Sentinel.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    margin: "40px auto",
    maxWidth: "520px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e4e4e7",
  },
  accentBar: {
    height: "4px",
    width: "100%",
  },
  content: {
    padding: "32px 32px 24px",
  },
  heading: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#09090b",
    margin: "0 0 12px",
  },
  bodyText: {
    fontSize: "14px",
    color: "#52525b",
    lineHeight: "1.6",
    margin: "0 0 20px",
  },
  hr: {
    borderColor: "#e4e4e7",
    margin: "20px 0",
  },
  labelCol: {
    width: "100px",
  },
  label: {
    fontSize: "12px",
    color: "#a1a1aa",
    margin: "4px 0",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  value: {
    fontSize: "13px",
    color: "#09090b",
    margin: "4px 0",
    fontWeight: "500",
  },
  footer: {
    fontSize: "12px",
    color: "#a1a1aa",
    margin: "4px 0",
  },
  link: {
    color: "#6366f1",
  },
};
