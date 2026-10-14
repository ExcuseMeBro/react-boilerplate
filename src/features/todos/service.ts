import { api, type RequestOptions } from "@/services/http";
import type { CreateTodoRequest, Todo } from "./types";

export const todosService = {
  list(options?: RequestOptions): Promise<Todo[]> {
    return api.get<Todo[]>("/todos", options);
  },
  create(payload: CreateTodoRequest): Promise<Todo> {
    return api.post<Todo>("/todos", payload);
  },
  toggle(id: string, completed: boolean): Promise<Todo> {
    return api.patch<Todo>(`/todos/${encodeURIComponent(id)}`, { completed });
  },
  remove(id: string): Promise<void> {
    return api.delete<void>(`/todos/${encodeURIComponent(id)}`);
  },
};
