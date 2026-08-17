export const LEAD_STATUSES = [
  "New",
  "Assigned",
  "Not Called",
  "Called",
  "Interested",
  "Follow-up",
  "Proposal Sent",
  "Closed Won",
  "Closed Lost",
  "Not Interested",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type Industry =
  | "Construction"
  | "Healthcare"
  | "Funeral Services"
  | "Renewable Energy"
  | "Hospitality"
  | "Legal"
  | "Automotive"
  | "Retail"
  | "Education"
  | "Agriculture"
  | "Logistics"
  | "Beauty";

export type SALocation =
  | "Thohoyandou"
  | "Makhado"
  | "Louis Trichardt"
  | "Polokwane"
  | "Elim"
  | "Giyani"
  | "Tzaneen";

export interface Lead {
  id: string;
  business: string;
  contactPerson: string;
  role: string;
  phone: string;
  email: string;
  website?: string | undefined;
  industry: Industry;
  location: SALocation;
  address: string;
  serviceId: string | null;
  assignedAgentId: string | null;
  status: LeadStatus;
  value: number;
  source: "Cold List" | "Walk-in" | "Referral" | "Website Form" | "Facebook" | "Directory";
  lastContact: string | null;
  nextFollowUp: string | null;
  createdAt: string;
  notes: LeadNote[];
  activities: ActivityItem[];
  lostReason?: string | undefined;
}

export interface LeadNote {
  id: string;
  author: string;
  createdAt: string;
  body: string;
}

export interface ActivityItem {
  id: string;
  type: "call" | "note" | "status" | "email" | "assignment" | "deal" | "followup";
  title: string;
  detail?: string;
  actor: string;
  at: string;
}

export interface Agent {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  role: "Sales Agent" | "Senior Agent" | "Team Lead";
  status: "Active" | "Inactive";
  joinedAt: string;
  monthlyTarget: number;
  targetDeals: number;
  callsToday: number;
  callsThisWeek: number[];
  online?: boolean;
  // Payout banking details — self-service, set from the agent's own
  // profile page (agent.profile.tsx). See firestore.rules' agents/{agentId}
  // update rule for the exact self-editable field list.
  bankName?: string;
  accountNumber?: string;
  branchCode?: string;
}

export interface Service {
  id: string;
  name: string;
  short: string;
  description: string;
  price: number;
  promoPrice: number;
  commissionType: "percentage" | "fixed";
  commissionValue: number;
  status: "Active" | "Inactive";
  benefits: string[];
  pitch: string;
  objections: { objection: string; response: string }[];
  icon: string;
}

export interface Deal {
  id: string;
  leadId: string;
  business: string;
  agentId: string;
  serviceId: string;
  // Denormalized from the lead at close time by logCall() — see
  // functions/src/callable/logCall.ts. Not present on older/mock deals.
  industry?: string | null | undefined;
  value: number;
  commission: number;
  closedAt: string;
  paymentStatus: "Pending" | "Approved" | "Paid";
}

export interface FollowUp {
  id: string;
  leadId: string;
  agentId: string;
  reason: string;
  previousNote: string;
  dueAt: string;
  status: "Open" | "Completed";
}

export interface ScriptDoc {
  id: string;
  title: string;
  category:
    | "Opening"
    | "Website Sales"
    | "SEO"
    | "Apps"
    | "AI Automation"
    | "Follow-up"
    | "Objections"
    | "Closing"
    | "FAQ"
    | "Knowledge Base";
  type: "script" | "objection" | "faq" | "knowledge";
  body: string;
  updatedAt: string;
  favourite?: boolean | undefined;
}

/** Payload shared by the single Add/Edit Lead form (src/staff/components/leads-admin/lead-form-dialog.tsx)
 * and createLead()/leads.ts — one form, one write path, used from both the Leads page and the dashboard. */
export interface LeadFormPatch {
  business: string;
  contactPerson: string;
  role: string;
  phone: string;
  email: string;
  industry: Lead["industry"];
  location: Lead["location"];
  serviceId: string | null;
  source: Lead["source"];
  assignedAgentId: string | null;
  value?: number | undefined;
}

export interface Quote {
  id: string;
  leadId: string;
  business: string;
  agentUid: string;
  items: { serviceId: string; name: string; price: number }[];
  total: number;
  status: "Sent";
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  at: string;
  read: boolean;
  tone: "info" | "success" | "warning";
}
