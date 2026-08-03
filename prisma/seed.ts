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

  // ── Owner bootstrap ──────────────────────────────────────────────
  // The app links a login to a workspace by matching a User row whose
  // `id` equals the Supabase auth user's UUID. Seeding alone does not
  // create that row, so a fresh database would let you log in but never
  // find your workspace. Set SEED_OWNER_ID (the Supabase auth user UUID,
  // from Authentication → Users) and SEED_OWNER_EMAIL to provision it.
  const ownerId = process.env.SEED_OWNER_ID;
  const ownerEmail = process.env.SEED_OWNER_EMAIL;
  if (ownerId && ownerEmail) {
    await prisma.user.upsert({
      where: { id: ownerId },
      update: { workspaceId: workspace.id, role: "OWNER", isActive: true },
      create: {
        id: ownerId,
        workspaceId: workspace.id,
        email: ownerEmail,
        name: process.env.SEED_OWNER_NAME ?? "Owner",
        role: "OWNER",
      },
    });
    console.log("Owner user linked:", ownerId, `(${ownerEmail})`);
  } else {
    console.log(
      "No SEED_OWNER_ID / SEED_OWNER_EMAIL set — skipping owner bootstrap. " +
      "Set them to link your Supabase auth user to this workspace."
    );
  }

  console.log("Seed complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
