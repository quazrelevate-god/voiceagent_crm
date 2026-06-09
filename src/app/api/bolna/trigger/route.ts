import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const triggerSchema = z.object({ leadId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const { workspace, user } = await requireWorkspace();
    const { leadId } = triggerSchema.parse(await req.json());

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, workspaceId: workspace.id },
      include: { fieldValues: { include: { fieldDef: true } } },
    });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    // Build recipient data from lead's Phone field
    const phoneField = lead.fieldValues.find((fv: { fieldDef: { fieldType: string }; value: string | null }) => fv.fieldDef.fieldType === "PHONE");
    if (!phoneField?.value) {
      return NextResponse.json({ error: "Lead has no phone number" }, { status: 422 });
    }

    const bolnaApiKey = process.env.BOLNA_API_KEY;
    const bolnaAgentId = process.env.BOLNA_AGENT_ID;
    const bolnaBaseUrl = process.env.BOLNA_API_BASE_URL;

    if (!bolnaApiKey || !bolnaAgentId || !bolnaBaseUrl) {
      return NextResponse.json({ error: "Bolna AI not configured" }, { status: 503 });
    }

    const bolnaRes = await fetch(`${bolnaBaseUrl}/v1/agent/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bolnaApiKey}`,
      },
      body: JSON.stringify({
        agent_id: bolnaAgentId,
        recipient_phone_number: phoneField.value,
        metadata: { crm_lead_id: leadId, workspace_id: workspace.id },
      }),
    });

    if (!bolnaRes.ok) {
      const err = await bolnaRes.text();
      console.error("[Bolna trigger]", err);
      return NextResponse.json({ error: "Bolna API error", detail: err }, { status: 502 });
    }

    const bolnaData = await bolnaRes.json();

    // Create a pending call log entry
    await prisma.callLog.create({
      data: {
        leadId,
        userId: user.id,
        source: "BOLNA_AI",
        bolnaCallId: bolnaData.call_id ?? bolnaData.id,
        bolnaPayload: bolnaData,
      },
    });

    return NextResponse.json({ success: true, callId: bolnaData.call_id ?? bolnaData.id });
  } catch (err) {
    console.error("[POST /api/bolna/trigger]", err);
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
