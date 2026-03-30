import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runCheck } from "@/lib/checks/runCheck";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Authenticate
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Verify the monitor exists and belongs to this user
  const { id } = await params;
  const monitor = await prisma.monitor.findUnique({ where: { id } });

  if (!monitor || monitor.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 3. Run the check — manual runs never reschedule the automated check
  const outcome = await runCheck(id, { updateNextCheckAt: false });

  return NextResponse.json(outcome);
}
