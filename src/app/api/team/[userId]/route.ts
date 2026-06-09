import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const updateSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "AGENT"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { workspace, user: currentUser } = await requireWorkspace();
    const { userId } = await params;

    if (!["OWNER", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const data = updateSchema.parse(await req.json());
    const target = await prisma.user.findFirst({ where: { id: userId, workspaceId: workspace.id } });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (target.role === "OWNER") return NextResponse.json({ error: "Cannot modify owner" }, { status: 403 });

    const updated = await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
