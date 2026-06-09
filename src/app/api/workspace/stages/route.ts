import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["ACTIVE", "CLOSED_LOST"]),
});

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const stages = await prisma.leadStage.findMany({
      where: { workspaceId: workspace.id },
      orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
    });
    return NextResponse.json(stages);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await req.json();
    const data = createSchema.parse(body);

    const maxOrder = await prisma.leadStage.aggregate({
      where: { workspaceId: workspace.id },
      _max: { displayOrder: true },
    });

    const stage = await prisma.leadStage.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        category: data.category,
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (err) {
    console.error("[POST /api/workspace/stages]", err);
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
