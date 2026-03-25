"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MonitorFormSchema,
  type MonitorFormValues,
} from "@/lib/validations/monitor";

async function generateSlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50) || "monitor";

  let candidate = base;
  let counter = 1;
  while (await prisma.monitor.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${counter}`;
    counter++;
  }
  return candidate;
}

async function getAuthorizedSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

export async function createMonitor(values: MonitorFormValues) {
  const session = await getAuthorizedSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  const parsed = MonitorFormSchema.safeParse(values);
  if (!parsed.success)
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };

  const slug = await generateSlug(parsed.data.name);

  await prisma.monitor.create({
    data: {
      userId: session.user.id,
      slug,
      ...parsed.data,
    },
  });

  revalidatePath("/dashboard/monitors");
  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function updateMonitor(id: string, values: MonitorFormValues) {
  const session = await getAuthorizedSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  const existing = await prisma.monitor.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id)
    return { success: false as const, error: "Not found" };

  const parsed = MonitorFormSchema.safeParse(values);
  if (!parsed.success)
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };

  await prisma.monitor.update({ where: { id }, data: parsed.data });

  revalidatePath("/dashboard/monitors");
  return { success: true as const };
}

export async function deleteMonitor(id: string) {
  const session = await getAuthorizedSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  const existing = await prisma.monitor.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id)
    return { success: false as const, error: "Not found" };

  await prisma.monitor.delete({ where: { id } });

  revalidatePath("/dashboard/monitors");
  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function toggleMonitor(id: string, isActive: boolean) {
  const session = await getAuthorizedSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  const existing = await prisma.monitor.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id)
    return { success: false as const, error: "Not found" };

  await prisma.monitor.update({ where: { id }, data: { isActive } });

  revalidatePath("/dashboard/monitors");
  return { success: true as const };
}
