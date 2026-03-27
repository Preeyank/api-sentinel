import { getRequiredSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { DEFAULT_PLAN } from "@/lib/constants/user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getRequiredSession();

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  const plan = dbUser?.plan ?? DEFAULT_PLAN;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={session.user} plan={plan} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
