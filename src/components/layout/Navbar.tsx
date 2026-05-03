import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

const languages = [
  { label: 'EN', value: 'en' },
  { label: 'UZ', value: 'uz' },
  { label: 'RU', value: 'ru' },
] as const;

export default function Navbar() {
  const { i18n, t } = useTranslation();

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
      isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-950',
    );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <NavLink to="/" className="group flex flex-col">
          <span className="text-base font-black tracking-tight text-slate-950">
            {t('app.name')}
          </span>
          <span className="hidden text-xs text-slate-500 sm:block">{t('app.tagline')}</span>
        </NavLink>

        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 p-1 shadow-sm">
          <NavLink to="/" className={linkClassName}>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/todos" className={linkClassName}>
            {t('nav.todos')}
          </NavLink>
          <NavLink to="/animation" className={linkClassName}>
            {t('nav.animation')}
          </NavLink>
        </div>

        <fieldset className="flex items-center gap-1">
          <legend className="sr-only">{t('nav.language')}</legend>
          {languages.map((language) => (
            <button
              className={cn(
                'rounded-full px-3 py-2 text-xs font-bold transition-colors',
                i18n.resolvedLanguage === language.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:bg-white hover:text-slate-950',
              )}
              key={language.value}
              onClick={() => void i18n.changeLanguage(language.value)}
              type="button"
            >
              {language.label}
            </button>
          ))}
        </fieldset>
      </nav>
    </header>
  );
}
