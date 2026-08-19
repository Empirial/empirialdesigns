import type { Agent, Deal, Lead, LeadStatus } from "@staff/lib/types";
import { countCallsToday, type CallLogRow } from "@staff/lib/call-logs-data";

// A lead in one of these statuses has never had a call logged against it yet
// (logCall() always moves the lead off "New"/"Assigned" to a real outcome
// status — see functions-staff/src/callable/logCall.ts). "Not Called" is the
// one status an admin can also set by hand for the same "still needs a first
// call" meaning. Used to answer "how many leads does this agent have left to
// call" across the agents list, agent profile, and admin leads quick-assign.
export const UNCALLED_LEAD_STATUSES: readonly LeadStatus[] = ["New", "Assigned", "Not Called"];

export function isUncalledLead(lead: Pick<Lead, "status">): boolean {
  return (UNCALLED_LEAD_STATUSES as readonly string[]).includes(lead.status);
}

export interface AgentStats {
  agent: Agent;
  leads: Lead[];
  leadsCount: number;
  remainingToCall: number;
  interested: number;
  closedWon: number;
  closedLost: number;
  callsToday: number;
  conversion: number;
  revenue: number;
  commission: number;
  commissionPaid: number;
  commissionOutstanding: number;
  deals: Deal[];
}

export function computeAgentStats(agent: Agent, leads: Lead[], deals: Deal[], callLogs: CallLogRow[] = []): AgentStats {
  const agentLeads = leads.filter((l) => l.assignedAgentId === agent.id);
  const agentDeals = deals.filter((d) => d.agentId === agent.id);
  const closedWon = agentLeads.filter((l) => l.status === "Closed Won").length;
  const closedLost = agentLeads.filter((l) => l.status === "Closed Lost").length;
  const interested = agentLeads.filter((l) => l.status === "Interested").length;
  const totalTouched = agentLeads.filter((l) => l.status !== "New" && l.status !== "Assigned").length;
  const conversion = totalTouched > 0 ? Math.round((closedWon / totalTouched) * 100) : 0;
  const revenue = agentDeals.reduce((s, d) => s + d.value, 0);
  const commission = agentDeals.reduce((s, d) => s + d.commission, 0);
  const commissionPaid = agentDeals
    .filter((d) => d.paymentStatus === "Paid")
    .reduce((s, d) => s + d.commission, 0);
  const commissionOutstanding = commission - commissionPaid;

  return {
    agent,
    leads: agentLeads,
    leadsCount: agentLeads.length,
    remainingToCall: agentLeads.filter(isUncalledLead).length,
    interested,
    closedWon,
    closedLost,
    // Real, derived from callLogs (written by logCall()) — agent.callsToday
    // itself is never incremented by anything and is always 0 in production.
    callsToday: countCallsToday(callLogs, agent.id),
    conversion,
    revenue,
    commission,
    commissionPaid,
    commissionOutstanding,
    deals: agentDeals,
  };
}

export interface AgentLeadCounts {
  total: number;
  remainingToCall: number;
}

/**
 * Lightweight per-agent lead counts — for spots (admin.leads.tsx's assign/
 * quick-allocate pickers) that only have `leads` loaded and shouldn't pull in
 * deals/callLogs just to show "N leads · M left to call" next to an agent's
 * name.
 */
export function leadCountsByAgent(leads: Lead[]): Map<string, AgentLeadCounts> {
  const map = new Map<string, AgentLeadCounts>();
  for (const lead of leads) {
    if (!lead.assignedAgentId) continue;
    const cur = map.get(lead.assignedAgentId) ?? { total: 0, remainingToCall: 0 };
    cur.total += 1;
    if (isUncalledLead(lead)) cur.remainingToCall += 1;
    map.set(lead.assignedAgentId, cur);
  }
  return map;
}
