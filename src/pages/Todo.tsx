import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { todosService } from '@/features/todos';
import { counterActions } from '@/reducers/CounterSlice';
import { useAppDispatch, useAppSelector } from '@/store';

const sampleTodoKeys = ['api', 'auth', 'i18n', 'animation'] as const;

export default function TodoPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const count = useAppSelector((state) => state.counter.count);

  const todosQuery = useQuery({
    queryKey: ['todos'],
    queryFn: todosService.list,
    enabled: false,
  });

  const todos =
    todosQuery.data ?? sampleTodoKeys.map((key) => ({ id: key, title: t(`todos.samples.${key}`) }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-14">
      <div className="mb-8 flex flex-col gap-3">
        <h1 className="text-4xl font-black tracking-tight text-slate-950">{t('todos.title')}</h1>
        <p className="max-w-2xl text-slate-600">{t('todos.description')}</p>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {t('todos.apiNote')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3">
            {todos.map((todo) => (
              <article
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                key={todo.id}
              >
                <span className="font-semibold text-slate-800">{todo.title}</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  REST
                </span>
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-black text-slate-950">{t('todos.counter', { count })}</p>
          <button
            className="mt-5 w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-500"
            onClick={() => dispatch(counterActions.increment())}
            type="button"
          >
            {t('todos.increment')}
          </button>
        </aside>
      </div>
    </main>
  );
}
