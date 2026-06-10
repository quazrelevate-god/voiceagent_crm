import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
    },
  });

  console.log("Workspace:", workspace.id);

  // Default lead stages
  const stages = [
    { name: "New", category: "INITIAL" as const, isDefault: true, displayOrder: 0 },
    { name: "Follow Up", category: "ACTIVE" as const, isDefault: false, displayOrder: 1 },
    { name: "Meeting Booked", category: "ACTIVE" as const, isDefault: false, displayOrder: 2 },
    { name: "Proposal Sent", category: "ACTIVE" as const, isDefault: false, displayOrder: 3 },
    { name: "Converted", category: "CLOSED_WON" as const, isDefault: true, displayOrder: 4 },
    { name: "Not Interested", category: "CLOSED_LOST" as const, isDefault: false, displayOrder: 5 },
    { name: "High Price", category: "CLOSED_LOST" as const, isDefault: false, displayOrder: 6 },
    { name: "No Budget", category: "CLOSED_LOST" as const, isDefault: false, displayOrder: 7 },
  ];

  for (const stage of stages) {
    await prisma.leadStage.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: stage.name } },
      update: {},
      create: { workspaceId: workspace.id, ...stage },
    });
  }

  // Default call feedbacks
  const feedbacks = [
    "Answered",
    "Busy",
    "No Answer",
    "Switched Off",
    "Not Reachable",
    "Wrong Number",
    "Call Back Later",
    "Do Not Disturb",
  ];

  for (let i = 0; i < feedbacks.length; i++) {
    await prisma.callFeedback.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: feedbacks[i] } },
      update: {},
      create: {
        workspaceId: workspace.id,
        name: feedbacks[i],
        isDefault: true,
        displayOrder: i,
      },
    });
  }

  // Default lead field definitions
  const fields = [
    { name: "Phone", fieldType: "PHONE" as const, isLeadId: true, isPrimary2: true, isSystem: true, isRequired: true, displayOrder: 0 },
    { name: "First Name", fieldType: "TEXT" as const, isPrimary1: true, isSystem: true, isRequired: false, displayOrder: 1 },
    { name: "Last Name", fieldType: "TEXT" as const, isSystem: true, displayOrder: 2 },
    { name: "Email", fieldType: "EMAIL" as const, isSystem: true, displayOrder: 3 },
    { name: "Company", fieldType: "TEXT" as const, displayOrder: 4 },
    { name: "Source", fieldType: "DROPDOWN" as const, displayOrder: 5 },
  ];

  for (const field of fields) {
    await prisma.leadFieldDefinition.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: field.name } },
      update: {},
      create: { workspaceId: workspace.id, ...field },
    });
  }

  // Add options for Source field
  const sourceField = await prisma.leadFieldDefinition.findFirst({
    where: { workspaceId: workspace.id, name: "Source" },
  });

  if (sourceField) {
    const sourceOptions = ["Website", "Referral", "Cold Call", "Social Media", "Event"];
    for (let i = 0; i < sourceOptions.length; i++) {
      await prisma.fieldOption.upsert({
        where: { fieldDefId_value: { fieldDefId: sourceField.id, value: sourceOptions[i].toLowerCase().replace(" ", "_") } },
        update: {},
        create: {
          fieldDefId: sourceField.id,
          label: sourceOptions[i],
          value: sourceOptions[i].toLowerCase().replace(" ", "_"),
          displayOrder: i,
        },
      });
    }
  }

  console.log("Seed complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
