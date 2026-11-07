import type { RouteObject } from "react-router-dom";
import HomePage from "@/App";
import DefaultLayout from "@/layouts/Default";
import { RouteError, RouteLoading } from "@/components/layout/RouteStatus";

export function createRoutes(): RouteObject[] {
  return [
    {
      path: "/",
      element: <DefaultLayout />,
      hydrateFallbackElement: <RouteLoading />,
      errorElement: <RouteError />,
      children: [
        { index: true, element: <HomePage /> },
        {
          path: "todos",
          hydrateFallbackElement: <RouteLoading />,
          errorElement: <RouteError />,
          lazy: async () => ({ Component: (await import("@/pages/Todo")).default }),
        },
        {
          path: "animation",
          hydrateFallbackElement: <RouteLoading />,
          errorElement: <RouteError />,
          lazy: async () => ({ Component: (await import("@/pages/Animation")).default }),
        },
      ],
    },
  ];
}
