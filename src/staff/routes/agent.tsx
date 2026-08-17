import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import {
  getCurrentAuthUser,
  getMockStaffProfile,
  hasStaffSession,
  toStaffRoute,
  waitForOwnProfile,
} from "@staff/lib/auth";

// Mirrors src/routes/admin.tsx — see that file's comment for how this nests
// every "agent.*.tsx" route underneath automatically.
export const Route = createFileRoute("/agent")({
  beforeLoad: async ({ location }) => {
    if (!hasStaffSession()) {
      throw redirect({ to: "/login", search: { redirect: toStaffRoute(location.pathname) } });
    }

    const mockProfile = getMockStaffProfile();
    if (mockProfile) {
      if (mockProfile.role !== "agent") throw redirect({ to: "/admin/dashboard" });
      if (location.pathname === "/agent") throw redirect({ to: "/agent/dashboard" });
      return;
    }

    const user = await getCurrentAuthUser();
    if (!user) {
      throw redirect({ to: "/login", search: { redirect: toStaffRoute(location.pathname) } });
    }

    const profile = await waitForOwnProfile(user.uid, { retries: 2, delayMs: 400 });
    if (!profile) {
      throw redirect({ to: "/login", search: { redirect: toStaffRoute(location.pathname) } });
    }

    if (profile.role !== "agent") {
      throw redirect({ to: "/admin/dashboard" });
    }

    if (location.pathname === "/agent") {
      throw redirect({ to: "/agent/dashboard" });
    }
  },
  component: () => <Outlet />,
});
