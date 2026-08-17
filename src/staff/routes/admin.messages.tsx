import { createFileRoute, useSearch } from "@tanstack/react-router";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { AgentInbox } from "@staff/components/messaging/agent-inbox";

export const Route = createFileRoute("/admin/messages")({
  validateSearch: (search: Record<string, unknown>) => ({ agent: typeof search.agent === "string" ? search.agent : undefined }),
  component: PageAdminMessages,
});
function PageAdminMessages() {
  const { agent } = useSearch({ from: "/admin/messages" });
  return <AppShell><PageHeader title="Messages" subtitle="Private conversations with your sales agents." crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Messages" }]} /><div className="mt-6"><AgentInbox admin initialAgentId={agent} /></div></AppShell>;
}
