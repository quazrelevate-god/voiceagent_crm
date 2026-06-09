import type {
  User,
  Workspace,
  LeadFieldDefinition,
  FieldOption,
  LeadStage,
  CallFeedback,
  Lead,
  LeadFieldValue,
  LeadNote,
  CallLog,
  ScheduledCall,
  Campaign,
  CampaignLead,
  UserRole,
  FieldType,
  StageCategory,
  CallSource,
  CampaignStatus,
} from "@/generated/prisma/client";

export type {
  User,
  Workspace,
  LeadFieldDefinition,
  FieldOption,
  LeadStage,
  CallFeedback,
  Lead,
  LeadFieldValue,
  LeadNote,
  CallLog,
  ScheduledCall,
  Campaign,
  CampaignLead,
  UserRole,
  FieldType,
  StageCategory,
  CallSource,
  CampaignStatus,
};

export type LeadFieldDefinitionWithOptions = LeadFieldDefinition & {
  options: FieldOption[];
};

export type LeadWithValues = Lead & {
  stage: LeadStage;
  assignedTo: User | null;
  fieldValues: (LeadFieldValue & { fieldDef: LeadFieldDefinition })[];
};

export type CallLogWithRelations = CallLog & {
  lead: Lead;
  user: User | null;
  callFeedback: CallFeedback | null;
};

export type CampaignWithLeads = Campaign & {
  manager: User;
  campaignLeads: (CampaignLead & { lead: Lead; assignedTo: User })[];
};

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  TEXT: "Text",
  DROPDOWN: "Dropdown",
  TAGS: "Tags",
  EMAIL: "Email",
  PHONE: "Phone",
  CHECKBOX: "Checkbox",
  DATE: "Date",
  MONEY: "Money",
  NUMBER: "Number",
  WEBSITE: "Website",
  LOCATION: "Location",
};

export const STAGE_CATEGORY_LABELS: Record<StageCategory, string> = {
  INITIAL: "Initial",
  ACTIVE: "Active",
  CLOSED_WON: "Closed — Won",
  CLOSED_LOST: "Closed — Lost",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  AGENT: "Agent",
};
