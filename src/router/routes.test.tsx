import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import i18n from "@/plugins/i18n";
import { store } from "@/store";
import { createRoutes } from "./routes";

const routers: ReturnType<typeof createMemoryRouter>[] = [];
const clients: QueryClient[] = [];
function setup(path: string, routes = createRoutes()) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  routers.push(router);
  return router;
}
function render(router: ReturnType<typeof createMemoryRouter>) {
  const client = new QueryClient();
  clients.push(client);
  return renderToString(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Provider>,
  );
}
afterEach(() => {
  routers.splice(0).forEach((router) => router.dispose());
  clients.splice(0).forEach((client) => client.clear());
});

const pages = [
  ["/todos", "todos.title"],
  ["/animation", "animation.title"],
] as const;

describe("lazy routes", () => {
  it.each(pages)("supports direct entry at %s", async (path, title) => {
    const router = setup(path);
    await vi.waitFor(() => expect(router.state.initialized).toBe(true));
    expect(router.state.errors).toBeNull();
    expect(render(router)).toContain(i18n.t(title));
    expect(render(router)).toContain('href="/todos"');
    expect(render(router)).toContain('href="/animation"');
  });

  it("navigates between home and both lazy pages, including back navigation", async () => {
    const router = setup("/");
    expect(render(router)).toContain(i18n.t("home.title"));
    for (const [path, title] of pages) {
      await router.navigate(path);
      expect(router.state.location.pathname).toBe(path);
      expect(router.state.errors).toBeNull();
      expect(render(router)).toContain(i18n.t(title));
    }
    await router.navigate(-1);
    expect(router.state.location.pathname).toBe("/todos");
    await router.navigate("/");
    expect(render(router)).toContain(i18n.t("home.title"));
  });

  it.each([true, false])("shows loading while a chunk is pending (direct=%s)", async (direct) => {
    const routes = createRoutes();
    let resolve!: (module: { Component: () => React.JSX.Element }) => void;
    routes[0]!.children![1]!.lazy = () =>
      new Promise((done) => {
        resolve = done;
      });
    const router = setup(direct ? "/todos" : "/", routes);
    const navigation = direct ? undefined : router.navigate("/todos");
    await vi.waitFor(() => expect(resolve).toBeTypeOf("function"));
    expect(render(router)).toContain('role="status"');
    expect(render(router)).toContain(i18n.t("route.loading"));
    if (!direct) expect(render(router)).toContain(i18n.t("home.title"));
    resolve({ Component: () => <h1>Loaded route</h1> });
    await navigation;
    await vi.waitFor(() => expect(router.state.initialized).toBe(true));
    expect(render(router)).toContain("Loaded route");
    expect(render(router)).not.toContain('role="status"');
  });

  it.each([
    ["/todos", true],
    ["/todos", false],
    ["/animation", true],
    ["/animation", false],
  ] as const)(
    "handles a rejected chunk at %s (direct=%s) without exposing the error",
    async (path, direct) => {
      const routes = createRoutes();
      routes[0]!.children!.find((route) => route.path === path.slice(1))!.lazy = () =>
        Promise.reject(new Error("private-internal-chunk-url"));
      const router = setup(direct ? path : "/", routes);
      if (!direct) await router.navigate(path);
      await vi.waitFor(() => expect(router.state.initialized).toBe(true));
      const html = render(router);
      expect(html).toContain('role="alert"');
      expect(html).toContain(i18n.t("route.error"));
      expect(html).toContain(i18n.t("route.reload"));
      expect(html).not.toContain("private-internal-chunk-url");
      await router.navigate("/");
      expect(router.state.errors).toBeNull();
      expect(render(router)).toContain(i18n.t("home.title"));
    },
  );
});
