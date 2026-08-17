import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Mounted at /staff/* by App.tsx's React Router route (see
    // StaffPortal.tsx) — every route/Link in this app is written relative
    // to its own root ("/"), basepath is what maps that onto the real
    // /staff/* URLs so it lines up with React Router's outer route.
    basepath: "/staff",
  });

  return router;
};
