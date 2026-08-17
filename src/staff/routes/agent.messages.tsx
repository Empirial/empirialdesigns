import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@staff/components/layout/app-shell";
import { PageHeader } from "@staff/components/shared/page-header";
import { AgentInbox } from "@staff/components/messaging/agent-inbox";
export const Route = createFileRoute("/agent/messages")({ component: PageAgentMessages });
function PageAgentMessages() { return <AppShell><PageHeader title="Messages" subtitle="Your private conversation with the admin team." crumbs={[{ label: "Agent", to: "/agent/dashboard" }, { label: "Messages" }]} /><div className="mt-6"><AgentInbox admin={false} /></div></AppShell>; }
