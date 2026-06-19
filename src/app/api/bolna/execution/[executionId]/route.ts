import { NextRequest, NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/workspace";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ executionId: string }> }) {
  try {
    await requireWorkspace();
    const { executionId } = await params;

    const bolnaApiKey = process.env.BOLNA_API_KEY;
    if (!bolnaApiKey) return NextResponse.json({ error: "Bolna not configured" }, { status: 503 });

    const res = await fetch(`https://api.bolna.ai/executions/${executionId}`, {
      headers: { Authorization: `Bearer ${bolnaApiKey}` },
      cache: "no-store",
    });

    if (!res.ok) return NextResponse.json({ error: "Bolna API error" }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
