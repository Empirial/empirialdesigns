import { getFunctions, httpsCallable } from "firebase/functions";

import { firebaseApp } from "./firebase";
import type { AppRole } from "./auth";
import type { LeadStatus } from "./types";

export const firebaseFunctions = getFunctions(firebaseApp);

export interface SalesAssistantMessage {
  role: "user" | "assistant";
  content: string;
}
export interface SalesAssistantInput {
  messages: SalesAssistantMessage[];
  lead?: { business: string; industry: string; status: string } | undefined;
}
export interface SalesAssistantResult {
  reply: string;
}
export const callSalesAssistant = httpsCallable<SalesAssistantInput, SalesAssistantResult>(
  firebaseFunctions,
  "salesAssistant",
);

// One typed wrapper per Cloud Function (functions/src/callable/*.ts) so
// every page that needs one imports it from here instead of calling
// httpsCallable() directly with a bare string name and untyped payload.

export interface LogCallInput {
  leadId: string;
  status: LeadStatus;
  // Explicit `| undefined` (not just `?:`) since the root tsconfig has
  // exactOptionalPropertyTypes — call sites build these with ternaries/`||`
  // that produce `T | undefined`, which needs the property type to say so.
  note?: string | undefined;
  followUpAt?: string | undefined;
  dealServiceId?: string | undefined;
  dealValue?: number | undefined;
}
export interface LogCallResult {
  leadId: string;
  noteId: string | null;
  activityId: string;
  followUpId: string | null;
  dealId: string | null;
}
export const callLogCall = httpsCallable<LogCallInput, LogCallResult>(firebaseFunctions, "logCall");

export const callBulkAssignLeads = httpsCallable<
  { leadIds: string[]; agentUid: string },
  { assigned: number }
>(firebaseFunctions, "bulkAssignLeads");

export const callBulkSetLeadStatus = httpsCallable<
  { leadIds: string[]; status: LeadStatus },
  { updated: number }
>(firebaseFunctions, "bulkSetLeadStatus");

export const callBulkDeleteLeads = httpsCallable<{ leadIds: string[] }, { deleted: number }>(
  firebaseFunctions,
  "bulkDeleteLeads",
);

export const callSetDealPayment = httpsCallable<
  { dealId: string; status: "Pending" | "Approved" | "Paid" },
  { dealId: string; status: string }
>(firebaseFunctions, "setDealPayment");

export const callToggleAgentStatus = httpsCallable<
  { agentId: string },
  { agentId: string; status: "Active" | "Inactive" }
>(firebaseFunctions, "toggleAgentStatus");

export interface InviteUserResult {
  uid: string;
  email: string;
  tempPassword: string;
}
export interface InviteUserInput {
  email: string;
  displayName: string;
  role: AppRole;
  // Only used when role is "agent" — see functions/src/callable/users.ts.
  phone?: string | undefined;
  jobTitle?: ("Sales Agent" | "Senior Agent" | "Team Lead") | undefined;
  monthlyTarget?: number | undefined;
  targetDeals?: number | undefined;
  commissionRateOverride?: number | undefined;
  teamLeadId?: string | undefined;
}
export const callInviteUser = httpsCallable<InviteUserInput, InviteUserResult>(
  firebaseFunctions,
  "inviteUser",
);

export const callChangeUserRole = httpsCallable<{ uid: string; role: AppRole }, { uid: string; role: AppRole }>(
  firebaseFunctions,
  "changeUserRole",
);

export const callRemoveUser = httpsCallable<{ uid: string }, { uid: string }>(
  firebaseFunctions,
  "removeUser",
);

export const callResetUserPassword = httpsCallable<{ uid: string }, { uid: string; email: string; tempPassword: string }>(
  firebaseFunctions,
  "resetUserPassword",
);

export const callPermanentlyDeleteUser = httpsCallable<{ uid: string }, { uid: string }>(
  firebaseFunctions,
  "permanentlyDeleteUser",
);

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  role: "Sales Agent" | "Senior Agent" | "Team Lead";
  status: "Active" | "Inactive";
  online: boolean;
  monthlyTarget: number;
  targetDeals: number;
  callsToday: number;
  callsThisWeek: number;
}

export const callGetMyTeam = httpsCallable<void, { team: TeamMember[] }>(firebaseFunctions, "getMyTeam");

export const callSetAgentTeamLead = httpsCallable<
  { agentId: string; teamLeadId: string | null },
  { agentId: string; teamLeadId: string | null }
>(firebaseFunctions, "setAgentTeamLead");

export const callSetAgentJobTitle = httpsCallable<
  { agentId: string; jobTitle: "Sales Agent" | "Senior Agent" | "Team Lead" },
  { agentId: string; jobTitle: "Sales Agent" | "Senior Agent" | "Team Lead" }
>(firebaseFunctions, "setAgentJobTitle");

export interface SeedDemoDataResult {
  servicesSeeded: number;
  scriptsSeeded: number;
  leadsSeeded: number;
  agentsFoundForAssignment: number;
}
export const callSeedDemoData = httpsCallable<{ force?: boolean }, SeedDemoDataResult>(
  firebaseFunctions,
  "seedDemoData",
);

export interface LeaderboardRow {
  agentId: string;
  name: string;
  initials: string;
  revenue: number;
  deals: number;
  rank: number;
}
export const callGetTeamLeaderboard = httpsCallable<void, { leaderboard: LeaderboardRow[] }>(
  firebaseFunctions,
  "getTeamLeaderboard",
);

export interface ImportRow {
  business: string;
  contactPerson?: string | undefined;
  role?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  industry?: string | undefined;
  location?: string | undefined;
  value?: number | undefined;
  source?: string | undefined;
}
export interface ImportLeadsResult {
  imported: number;
  skippedDuplicates: number;
  errors: { index: number; reason: string }[];
}
export const callImportLeads = httpsCallable<{ rows: ImportRow[] }, ImportLeadsResult>(
  firebaseFunctions,
  "importLeads",
);

export interface QuoteLineItem {
  serviceId: string;
  name: string;
  price: number;
}
export interface CreateQuoteResult {
  quoteId: string;
  total: number;
  items: QuoteLineItem[];
}
export const callCreateQuote = httpsCallable<{ leadId: string; serviceIds: string[] }, CreateQuoteResult>(
  firebaseFunctions,
  "createQuote",
);
