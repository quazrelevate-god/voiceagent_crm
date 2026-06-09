import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";

export async function GET(req: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? undefined;

    const logs = await prisma.callLog.findMany({
      where: {
        lead: { workspaceId: workspace.id },
        ...(userId && { userId }),
      },
      include: {
        lead: { include: { fieldValues: { include: { fieldDef: true } } } },
        user: true,
        callFeedback: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
