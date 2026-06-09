"use client";

import { useState } from "react";
import { Bot, PhoneCall, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LeadProfile } from "@/components/leads/LeadProfile";
import { cn, formatDuration } from "@/lib/utils";
import type { LeadStage, CallFeedback, User, LeadFieldDefinitionWithOptions } from "@/types";

type CallLogItem = {
  id: string;
  source: string;
  duration: number | null;
  createdAt: string | Date;
  callFeedback: CallFeedback | null;
  user: User | null;
  lead: {
    id: string;
    stage: LeadStage;
    fieldValues: { value: string | null; fieldDef: { name: string; isPrimary1: boolean; isPrimary2: boolean } }[];
  };
};

interface Props {
  callLogs: CallLogItem[];
  stages: LeadStage[];
  feedbacks: CallFeedback[];
  fieldDefs: LeadFieldDefinitionWithOptions[];
  teamMembers: User[];
}

function getLeadName(lead: CallLogItem["lead"]): string {
  const h1 = lead.fieldValues.find((fv) => fv.fieldDef.isPrimary1)?.value ?? "";
  const h2 = lead.fieldValues.find((fv) => fv.fieldDef.isPrimary2)?.value ?? "";
  return [h1, h2].filter(Boolean).join(" — ") || "Unknown Lead";
}

export function CallLogsView({ callLogs, stages, feedbacks, fieldDefs, teamMembers }: Props) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  return (
    <div className="flex h-full">
      {/* Left pane */}
      <div className="flex flex-col w-80 border-r shrink-0">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-sm">Call Logs</h2>
          <p className="text-xs text-muted-foreground">{callLogs.length} calls total</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {callLogs.map((log) => (
              <button
                key={log.id}
                onClick={() => setSelectedLeadId(log.lead.id)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                  selectedLeadId === log.lead.id && "bg-muted"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className={cn("rounded-full p-1.5 mt-0.5 shrink-0", log.source === "BOLNA_AI" ? "bg-blue-100" : "bg-muted")}>
                    {log.source === "BOLNA_AI"
                      ? <Bot className="h-3 w-3 text-blue-600" />
                      : <PhoneCall className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{getLeadName(log.lead)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {log.callFeedback && (
                        <Badge variant="outline" className="text-xs h-4 px-1">{log.callFeedback.name}</Badge>
                      )}
                      {log.duration && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />{formatDuration(log.duration)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.user?.name ?? "AI"} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            {callLogs.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-12">No call logs yet</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right pane */}
      <div className="flex-1 overflow-auto">
        {selectedLeadId ? (
          <LeadProfile
            leadId={selectedLeadId}
            stages={stages}
            feedbacks={feedbacks}
            fieldDefs={fieldDefs}
            teamMembers={teamMembers}
            onUpdate={() => {}}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <PhoneCall className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a call log to view the lead profile</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
