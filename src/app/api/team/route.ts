import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["ADMIN", "MANAGER", "AGENT"]),
});

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const members = await prisma.user.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(members);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspace, user: currentUser } = await requireWorkspace();

    if (!["OWNER", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const data = inviteSchema.parse(await req.json());

    const existing = await prisma.user.findFirst({
      where: { workspaceId: workspace.id, email: data.email },
    });
    if (existing) return NextResponse.json({ error: "User already exists" }, { status: 409 });

    // In production: create Supabase auth user and send invite email.
    // For now, create a placeholder that links on first login.
    const member = await prisma.user.create({
      data: {
        id: `pending_${Date.now()}`,
        workspaceId: workspace.id,
        email: data.email,
        name: data.name,
        role: data.role,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
