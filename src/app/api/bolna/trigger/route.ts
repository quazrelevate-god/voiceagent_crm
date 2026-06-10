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

    if (!bolnaApiKey || !bolnaAgentId) {
      return NextResponse.json({ error: "Bolna AI not configured" }, { status: 503 });
    }

    const bolnaRes = await fetch("https://api.bolna.ai/call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bolnaApiKey}`,
      },
      body: JSON.stringify({
        agent_id: bolnaAgentId,
        recipient_phone_number: phoneField.value,
        user_data: { crm_lead_id: leadId, workspace_id: workspace.id },
      }),
    });

    if (!bolnaRes.ok) {
      const err = await bolnaRes.text();
      console.error("[Bolna trigger]", err);
      return NextResponse.json({ error: "Bolna API error", detail: err }, { status: 502 });
    }

    const bolnaData = await bolnaRes.json();
    const executionId: string = bolnaData.execution_id;

    // Create a pending call log entry
    await prisma.callLog.create({
      data: {
        leadId,
        userId: user.id,
        source: "BOLNA_AI",
        bolnaCallId: executionId,
        bolnaPayload: bolnaData,
      },
    });

    return NextResponse.json({ success: true, callId: executionId });
  } catch (err) {
    console.error("[POST /api/bolna/trigger]", err);
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
