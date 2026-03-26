"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOptionalSession } from "@/lib/session";
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

async function getOwnedMonitor(id: string, userId: string) {
  const monitor = await prisma.monitor.findUnique({ where: { id } });
  if (!monitor || monitor.userId !== userId) return null;
  return monitor;
}

export async function createMonitor(values: MonitorFormValues) {
  const session = await getOptionalSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  const parsed = MonitorFormSchema.safeParse(values);
  if (!parsed.success)
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };

  const slug = await generateSlug(parsed.data.name);

  try {
    await prisma.monitor.create({
      data: { userId: session.user.id, slug, ...parsed.data },
    });
  } catch {
    return { success: false as const, error: "Failed to create monitor" };
  }

  revalidatePath("/dashboard/monitors");
  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function updateMonitor(id: string, values: MonitorFormValues) {
  const session = await getOptionalSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  const existing = await getOwnedMonitor(id, session.user.id);
  if (!existing) return { success: false as const, error: "Not found" };

  const parsed = MonitorFormSchema.safeParse(values);
  if (!parsed.success)
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };

  try {
    await prisma.monitor.update({ where: { id }, data: parsed.data });
  } catch {
    return { success: false as const, error: "Failed to update monitor" };
  }

  revalidatePath("/dashboard/monitors");
  return { success: true as const };
}

export async function deleteMonitor(id: string) {
  const session = await getOptionalSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  const existing = await getOwnedMonitor(id, session.user.id);
  if (!existing) return { success: false as const, error: "Not found" };

  try {
    await prisma.monitor.delete({ where: { id } });
  } catch {
    return { success: false as const, error: "Failed to delete monitor" };
  }

  revalidatePath("/dashboard/monitors");
  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function toggleMonitor(id: string, isActive: boolean) {
  const session = await getOptionalSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  const existing = await getOwnedMonitor(id, session.user.id);
  if (!existing) return { success: false as const, error: "Not found" };

  try {
    await prisma.monitor.update({ where: { id }, data: { isActive } });
  } catch {
    return { success: false as const, error: "Failed to update monitor" };
  }

  revalidatePath("/dashboard/monitors");
  return { success: true as const };
}
