import { api } from '@/services/http';
import type { CreateTodoRequest, Todo } from './types';

export const todosService = {
  list(): Promise<Todo[]> {
    return api.get<Todo[]>('/todos');
  },
  create(payload: CreateTodoRequest): Promise<Todo> {
    return api.post<Todo>('/todos', payload);
  },
  toggle(id: string, completed: boolean): Promise<Todo> {
    return api.patch<Todo>(`/todos/${id}`, { completed });
  },
  remove(id: string): Promise<void> {
    return api.delete<void>(`/todos/${id}`);
  },
};
