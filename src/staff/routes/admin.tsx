import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import {
  getCurrentAuthUser,
  getMockStaffProfile,
  hasStaffSession,
  toStaffRoute,
  waitForOwnProfile,
} from "@staff/lib/auth";

// Pathless-in-spirit layout route: TanStack Router's file-based generator
// nests every "admin.*.tsx" file under this one automatically because its
// path ("/admin") is a prefix of theirs — see the Phase 1 plan for why this
// guards all 12 existing admin pages without editing any of them.
export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (!hasStaffSession()) {
      throw redirect({ to: "/login", search: { redirect: toStaffRoute(location.pathname) } });
    }

    const mockProfile = getMockStaffProfile();
    if (mockProfile) {
      if (mockProfile.role !== "admin") throw redirect({ to: "/agent/dashboard" });
      if (location.pathname === "/admin") throw redirect({ to: "/admin/dashboard" });
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

    if (profile.role !== "admin") {
      throw redirect({ to: "/agent/dashboard" });
    }

    if (location.pathname === "/admin") {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  component: () => <Outlet />,
});
