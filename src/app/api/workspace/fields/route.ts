import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  fieldType: z.enum(["TEXT","DROPDOWN","TAGS","EMAIL","PHONE","CHECKBOX","DATE","MONEY","NUMBER","WEBSITE","LOCATION"]),
  isRequired: z.boolean().optional().default(false),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
});

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const fields = await prisma.leadFieldDefinition.findMany({
      where: { workspaceId: workspace.id },
      include: { options: { orderBy: { displayOrder: "asc" } } },
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(fields);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
    const body = await req.json();
    const data = createSchema.parse(body);

    const maxOrder = await prisma.leadFieldDefinition.aggregate({
      where: { workspaceId: workspace.id },
      _max: { displayOrder: true },
    });

    const field = await prisma.leadFieldDefinition.create({
      data: {
        workspaceId: workspace.id,
        name: data.name,
        fieldType: data.fieldType,
        isRequired: data.isRequired,
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
        options: data.options?.length
          ? {
              create: data.options.map((o, i) => ({
                label: o.label,
                value: o.value,
                displayOrder: i,
              })),
            }
          : undefined,
      },
      include: { options: true },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (err) {
    console.error("[POST /api/workspace/fields]", err);
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
