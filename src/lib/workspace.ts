import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function getCurrentWorkspace() {
  const user = await getUser();
  if (!user) return null;

  const member = await prisma.user.findFirst({
    where: { id: user.id, isActive: true },
    include: { workspace: true },
  });

  return member ? { user: member, workspace: member.workspace } : null;
}

export async function requireWorkspace() {
  const ctx = await getCurrentWorkspace();
  if (!ctx) redirect("/login");
  return ctx;
}
