import { RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";

import "./staff-theme.css";
import { getRouter } from "./router";

// Mounted at /staff/* by App.tsx's React Router route — this is where the
// staff/CRM portal (a separate TanStack Router app) grafts onto the main
// site's React Router tree. The two routers coexist independently: React
// Router owns everything outside /staff, TanStack Router owns everything
// inside it (basepath: "/staff" in router.tsx keeps its internal route
// matching aligned with the real browser URL). See docs/CRM_STAFF_PORTAL.md.
const router = getRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function StaffPortal() {
  useEffect(() => {
    const root = document.documentElement;
    const hadDarkMode = root.classList.contains("dark");
    root.classList.add("staff-portal-active");

    return () => {
      root.classList.remove("staff-portal-active");
      root.classList.toggle("dark", hadDarkMode);
    };
  }, []);

  return <RouterProvider router={router} />;
}
