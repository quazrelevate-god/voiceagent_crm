# Project Rules (System Instructions) - Stack: Next.js (App Router), TypeScript, Tailwind CSS, Prisma, Supabase. 
- UI Components: Use shadcn/ui for all UI elements to ensure consistency. 
- Database: Use Prisma for all interactions. Always ensure data schemas are strictly typed. 
- Environment: Never hardcode API keys. Always use environment variables (process.env). 
- Error Handling: All API calls (especially Bolna AI integration) must have robust error handling and server-side logging. 
- Coding Style: Always use server components for data fetching. Keep components modular and reusable.

# Role & Goal
Act as a senior full-stack developer. We are building a customizable CRM (similar to TeleCRM) designed primarily for human sales teams. Once the core CRM is built, we will integrate Bolna AI so that AI voice agents can automatically log data into the same system as our human agents.

# Phase 1: Core CRM Modules (Human-Operated)

## A. Workspace Configuration (Dynamic Settings)
1. **Lead Fields:** 
   - Ability to create globally accessible custom fields (text, dropdown, tags, email, phone, checkbox, date, money, number, website, location).
   - **Lead ID:** Users must select one custom field (usually Phone Number) to act as the unique Lead ID.
   - **Primary Fields:** Users select two fields (e.g., First Name, Phone) to act as Header 1 and Header 2 in default table views.
   - Show a table of all created fields.
2. **Lead Stages:**
   - **Initial Stage:** Locked default substage called "New" (rename-able, no adding new fields).
   - **Active Stage:** Users can add unlimited custom substage fields (e.g., "Follow Up", "Meeting Booked").
   - **Closed Stage:** Contains "Won" (only one renameable substage, e.g., "Converted") and "Lost" (unlimited custom substages like "Not Interested", "High Price").
3. **Call Feedbacks:** 
   - Predefined, customizable list of call statuses (e.g., Busy, No Answer, Switched Off) to replace manual typing.

## B. Dashboard Modules (User Operations)
1. **Add Leads:** 
   - "Single Lead": Renders a form based on the dynamic Lead Fields.
   - "Batch Upload": Accepts .csv/.xlsx, allowing users to map spreadsheet columns to the CRM's Lead Fields and Stages.
2. **Search Leads:** 
   - Global search across all fields with advanced filters.
   - **Layout:** 2-pane split screen. 
     - Left Pane: List of search results.
     - Right Pane: Lead Profile View (expands on click). Shows all lead fields, Lead Stage dropdown, clickable Star Rating, and buttons for "Trigger Call", "Schedule Call", and "Add Notes".
3. **Call Logs:** 
   - Uses the same 2-pane layout as "Search Leads", but the left list shows chronologically ordered recent call logs with brief essential details.
4. **Team Members (RBAC):** 
   - Role hierarchy. Lower hierarchy cannot create workspace fields or assign leads to other teams.
5. **Campaigns:** 
   - Screen shows a list of leads. Managers select leads and assign them to specific team members with a deadline.
   - Includes a progress bar for each assignment, updated by checking a box beside each lead row.
6. **Filters:** 
   - Visual horizontal progress bars showing lead counts segmented by specific parameters (e.g., Star Rating counts, "Not Picked" vs "Not Interested" counts based on Call Feedbacks).
7. **Reports:** 
   - Leaderboards showing team progress based on time, call volume, sales revenue, etc.

# Phase 2: Bolna AI Automation Layer
Bolna AI will act as an automated user in this system. Do not use webhooks. We will use your native Claude skills feature to fetch data via Bolna's API.

- **Trigger:** Clicking "Trigger Bolna Call" in the Lead Profile starts the AI call.
- **Data Mapping:** When the call ends, the system fetches the post-call analytical JSON data and automatically updates the manual CRM fields:
  - Updates the specific **Call Feedbacks** field (e.g., "Busy" or "Answered").
  - Appends the AI `call_summary` to the Lead's **Notes**.
  - Updates the **Lead Stage** based on the AI `intention` (e.g., if intent is negative, move to Closed/Lost).
  - Updates empty **Lead Fields** (like Name or Email) if extracted during the call.

# Task Instructions
1. First, define the Database Schema (ERD) required to support the dynamic Custom Fields, Stages, and Call Logs for Phase 1. 
2. Ensure the schema allows the Bolna AI integration in Phase 2 to easily update these exact same records.
3. Wait for my approval on the schema before writing the UI code.
