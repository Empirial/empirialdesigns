import type { Agent, Deal, Lead } from "@staff/lib/types";
import { countCallsToday, type CallLogRow } from "@staff/lib/call-logs-data";

export interface AgentStats {
  agent: Agent;
  leads: Lead[];
  leadsCount: number;
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
