import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@staff/lib/firebase";
import { firebaseAuth, getMockStaffProfile } from "@staff/lib/auth";
import { followUps as mockFollowUps } from "@staff/lib/mock-data";
import { countCallsToday, type CallLogRow } from "@staff/lib/call-logs-data";
import {
  LEAD_STATUSES,
  type Agent,
  type Deal,
  type FollowUp,
  type Lead,
  type Service,
} from "@staff/lib/types";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Real replacement for the old static `revenueOverTime` mock import — buckets
// the fetched deals by closedAt month and sums value/commission per month.
export function computeRevenueOverTime(deals: Deal[], span = 7) {
  const now = new Date();
  const order: string[] = [];
  const buckets = new Map<string, { month: string; revenue: number; commission: number }>();
  for (let i = span - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    order.push(key);
    buckets.set(key, { month: MONTH_LABELS[d.getMonth()]!, revenue: 0, commission: 0 });
  }
  for (const deal of deals) {
    const closed = new Date(deal.closedAt);
    const key = `${closed.getFullYear()}-${closed.getMonth()}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.revenue += deal.value;
      bucket.commission += deal.commission;
    }
  }
  return order.map((key) => buckets.get(key)!);
}

// Same field-mapping pattern as followups-data.ts's useMyFollowUps(), just
// unscoped (no agentUid filter) since there's no admin "all follow-ups"
// hook yet — see the summary note on this decision.
function mapFollowUpDoc(id: string, data: DocumentData): FollowUp {
  return {
    id,
    leadId: data.leadId,
    agentId: data.agentUid,
    reason: data.reason,
    previousNote: data.previousNote,
    dueAt: data.dueAt instanceof Timestamp ? data.dueAt.toDate().toISOString() : new Date().toISOString(),
    status: data.status,
  };
}

export function useAllFollowUps() {
  return useQuery({
    queryKey: ["followUps", "all"],
    queryFn: async () => {
      if (getMockStaffProfile()) return mockFollowUps;
      const snap = await getDocs(collection(db, "followUps"));
      return snap.docs.map((d) => mapFollowUpDoc(d.id, d.data()));
    },
  });
}

// The signed-in admin's own profile, for the dashboard greeting only — this
// used to show `currentAgent` (an agent) on an admin page, which was odd.
export function useOwnProfile() {
  const uid = firebaseAuth.currentUser?.uid;
  return useQuery({
    queryKey: ["staffUsers", "me", uid],
    queryFn: async () => {
      const mockProfile = getMockStaffProfile();
      if (mockProfile) return { displayName: mockProfile.displayName };
      const snap = await getDoc(doc(db, "staffUsers", uid!));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        displayName: (data.displayName as string | undefined) ?? (data.email as string | undefined) ?? "Admin",
      };
    },
    enabled: Boolean(uid),
  });
}

// auditLog is written by every mutating Cloud Function (functions/src/lib/audit.ts),
// admin-readable per firestore.rules — used here in place of a cross-lead
// activity feed (there's no "all leads' activities" hook; activities are a
// per-lead subcollection). See summary for what this changes about the panel.
export interface AuditEntry {
  id: string;
  action: string;
  actorUid: string;
  at: string;
}

export function useRecentAuditLog(take = 10) {
  return useQuery({
    queryKey: ["auditLog", "recent", take],
    queryFn: async () => {
      if (getMockStaffProfile()) return [] as AuditEntry[];
      const snap = await getDocs(query(collection(db, "auditLog"), orderBy("at", "desc"), limit(take)));
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          action: data.action as string,
          actorUid: data.actorUid as string,
          at: data.at instanceof Timestamp ? data.at.toDate().toISOString() : new Date().toISOString(),
        } satisfies AuditEntry;
      });
    },
  });
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function useDashboardMetrics(
  leads: Lead[],
  agents: Agent[],
  deals: Deal[],
  services: Service[],
  followUps: FollowUp[],
  callLogs: CallLogRow[] = [],
) {
  /* --------------------------- Revenue over time --------------------------- */
  const revenueOverTime = useMemo(() => computeRevenueOverTime(deals), [deals]);

  /* ------------------------------ KPIs ------------------------------ */
  const totalLeads = leads.length;
  const assignedLeads = leads.filter((l) => l.assignedAgentId).length;
  // Real, from callLogs (written by logCall()) — agents/{uid}.callsToday is
  // never incremented by anything and is always 0 in production.
  const callsToday = countCallsToday(callLogs);
  const interestedLeads = leads.filter((l) => l.status === "Interested").length;
  const followUpsDue = followUps.filter((f) => f.status === "Open").length;
  const closedDeals = deals.length;
  const revenueGenerated = deals.reduce((sum, d) => sum + d.value, 0);
  const outstandingCommissions = deals
    .filter((d) => d.paymentStatus !== "Paid")
    .reduce((sum, d) => sum + d.commission, 0);

  /* --------------------------- Pipeline data --------------------------- */
  const pipelineData = useMemo(
    () =>
      LEAD_STATUSES.map((status) => ({
        status,
        count: leads.filter((l) => l.status === status).length,
      })).filter((s) => s.count > 0),
    [leads],
  );

  const statusBreakdown = useMemo(
    () =>
      LEAD_STATUSES.map((status) => ({
        name: status,
        value: leads.filter((l) => l.status === status).length,
      })).filter((s) => s.value > 0),
    [leads],
  );

  /* --------------------------- Leaderboard --------------------------- */
  const leaderboard = useMemo(() => {
    return agents
      .map((agent) => {
        const agentDeals = deals.filter((d) => d.agentId === agent.id);
        const revenue = agentDeals.reduce((sum, d) => sum + d.value, 0);
        const agentLeads = leads.filter((l) => l.assignedAgentId === agent.id);
        const conversion = agentLeads.length ? Math.round((agentDeals.length / agentLeads.length) * 100) : 0;
        return {
          agent,
          deals: agentDeals.length,
          revenue,
          conversion,
          progress: agent.monthlyTarget ? Math.min(100, Math.round((revenue / agent.monthlyTarget) * 100)) : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [agents, deals, leads]);

  /* --------------------------- Recent deals --------------------------- */
  const recentDeals = useMemo(
    () => [...deals].sort((a, b) => +new Date(b.closedAt) - +new Date(a.closedAt)).slice(0, 6),
    [deals],
  );

  /* --------------------------- Follow-ups --------------------------- */
  const upcomingFollowUps = useMemo(
    () =>
      followUps
        .filter((f) => f.status === "Open")
        .sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt))
        .slice(0, 5),
    [followUps],
  );

  /* --------------------------- Services --------------------------- */
  const topServices = useMemo(() => {
    return services
      .map((svc) => ({
        service: svc,
        revenue: deals.filter((d) => d.serviceId === svc.id).reduce((sum, d) => sum + d.value, 0),
      }))
      .filter((s) => s.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [services, deals]);

  const unassignedLeads = leads.filter((l) => !l.assignedAgentId);

  return {
    totalLeads,
    assignedLeads,
    callsToday,
    interestedLeads,
    followUpsDue,
    closedDeals,
    revenueGenerated,
    outstandingCommissions,
    pipelineData,
    statusBreakdown,
    leaderboard,
    recentDeals,
    upcomingFollowUps,
    topServices,
    unassignedLeads,
    revenueOverTime,
  };
}
