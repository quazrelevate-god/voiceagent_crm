import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";
import { z } from "zod";

const fetchSchema = z.object({ bolnaCallId: z.string(), leadId: z.string() });

// Called by the client after polling Bolna to get post-call data and update the CRM
export async function POST(req: NextRequest) {
  try {
    const { workspace } = await requireWorkspace();
    const { bolnaCallId, leadId } = fetchSchema.parse(await req.json());

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, workspaceId: workspace.id },
    });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const bolnaApiKey = process.env.BOLNA_API_KEY;
    const bolnaBaseUrl = process.env.BOLNA_API_BASE_URL;

    if (!bolnaApiKey || !bolnaBaseUrl) {
      return NextResponse.json({ error: "Bolna AI not configured" }, { status: 503 });
    }

    const bolnaRes = await fetch(`${bolnaBaseUrl}/v1/call/${bolnaCallId}`, {
      headers: { Authorization: `Bearer ${bolnaApiKey}` },
    });

    if (!bolnaRes.ok) {
      return NextResponse.json({ error: "Bolna API error" }, { status: 502 });
    }

    const callData = await bolnaRes.json();
    const summary: string | undefined = callData.call_summary ?? callData.summary;
    const intention: string | undefined = callData.intention ?? callData.intent;
    const feedback: string | undefined = callData.call_status ?? callData.outcome;
    const duration: number | undefined = callData.duration_seconds ?? callData.duration;
    const extractedFields: Record<string, string> = callData.extracted_data ?? {};

    // Find matching CallFeedback
    let callFeedbackId: string | undefined;
    if (feedback) {
      const cfMatch = await prisma.callFeedback.findFirst({
        where: { workspaceId: workspace.id, name: { equals: feedback, mode: "insensitive" } },
      });
      callFeedbackId = cfMatch?.id;
    }

    // Update the call log
    await prisma.callLog.updateMany({
      where: { bolnaCallId, leadId },
      data: {
        callFeedbackId,
        duration,
        aiCallSummary: summary,
        aiIntention: intention,
        bolnaPayload: callData,
        endedAt: new Date(),
      },
    });

    // Append AI summary as a note
    if (summary) {
      await prisma.leadNote.create({
        data: { leadId, isAiNote: true, content: `**AI Call Summary:**\n${summary}` },
      });
    }

    // Update lead stage based on intention
    if (intention) {
      const lowerIntent = intention.toLowerCase();
      if (lowerIntent.includes("negative") || lowerIntent.includes("not interested") || lowerIntent.includes("lost")) {
        const lostStage = await prisma.leadStage.findFirst({
          where: { workspaceId: workspace.id, category: "CLOSED_LOST" },
          orderBy: { displayOrder: "asc" },
        });
        if (lostStage) {
          await prisma.lead.update({ where: { id: leadId }, data: { stageId: lostStage.id } });
        }
      } else if (lowerIntent.includes("positive") || lowerIntent.includes("interested") || lowerIntent.includes("won")) {
        const wonStage = await prisma.leadStage.findFirst({
          where: { workspaceId: workspace.id, category: "CLOSED_WON" },
          orderBy: { displayOrder: "asc" },
        });
        if (wonStage) {
          await prisma.lead.update({ where: { id: leadId }, data: { stageId: wonStage.id } });
        }
      }
    }

    // Back-fill empty lead fields from extracted data
    if (Object.keys(extractedFields).length > 0) {
      const fieldDefs = await prisma.leadFieldDefinition.findMany({
        where: { workspaceId: workspace.id },
      });

      for (const fieldDef of fieldDefs) {
        const extractedValue = extractedFields[fieldDef.name.toLowerCase()] ?? extractedFields[fieldDef.name];
        if (!extractedValue) continue;

        const existing = await prisma.leadFieldValue.findUnique({
          where: { leadId_fieldDefId: { leadId, fieldDefId: fieldDef.id } },
        });

        // Only fill in if the field is currently empty
        if (!existing?.value) {
          await prisma.leadFieldValue.upsert({
            where: { leadId_fieldDefId: { leadId, fieldDefId: fieldDef.id } },
            update: { value: extractedValue },
            create: { leadId, fieldDefId: fieldDef.id, value: extractedValue },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/bolna/fetch-result]", err);
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 422 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
