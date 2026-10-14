import { describe, expect, it, vi } from "vite-plus/test";
vi.mock("@/services/http", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
import { api } from "@/services/http";
import { todosService } from "./service";

describe("todos service", () => {
  it("forwards query cancellation signals", async () => {
    const signal = new AbortController().signal;
    await todosService.list({ signal });
    expect(api.get).toHaveBeenCalledWith("/todos", { signal });
  });
  it("creates todos using JSON payloads", async () => {
    await todosService.create({ title: "Test" });
    expect(api.post).toHaveBeenCalledWith("/todos", { title: "Test" });
  });
  it("encodes route identifiers to prevent path/query injection", async () => {
    await todosService.toggle("a/b?admin=true", true);
    await todosService.remove("a/b?admin=true");
    expect(api.patch).toHaveBeenCalledWith("/todos/a%2Fb%3Fadmin%3Dtrue", { completed: true });
    expect(api.delete).toHaveBeenCalledWith("/todos/a%2Fb%3Fadmin%3Dtrue");
  });
});
