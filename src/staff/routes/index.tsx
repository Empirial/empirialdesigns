import { createFileRoute, redirect } from "@tanstack/react-router";

// This used to render a "pick a portal" splash page with direct links into
// /admin/dashboard and /agent/dashboard — leftover scaffolding from before
// real auth existed (see git history), left in front of the actual login
// page. The dashboard routes guard themselves via beforeLoad (see
// admin.tsx/agent.tsx) so it was never a way to skip signing in, just an
// unnecessary "Frontend prototype · mock data" screen ahead of /staff/login.
// /staff now goes straight to the real login.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
