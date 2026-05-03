import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { env } from '@/config/env';

const featureKeys = ['rest', 'auth', 'tooling', 'i18n'] as const;

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto grid min-h-[calc(100vh-81px)] max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-600">
            {t('home.eyebrow')}
          </p>
          <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
            {t('home.title')}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">{t('home.description')}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            to="/todos"
          >
            {t('home.ctaPrimary')}
          </Link>
          <Link
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
            to="/animation"
          >
            {t('home.ctaSecondary')}
          </Link>
        </div>
      </section>

      <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
        <div className="mb-5 rounded-3xl bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-indigo-200">
            {t('auth.status', { strategy: env.authStrategy })}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{t('auth.jwtHint')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {featureKeys.map((feature) => (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4" key={feature}>
              <p className="text-sm font-bold text-slate-900">{t(`home.features.${feature}`)}</p>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}
