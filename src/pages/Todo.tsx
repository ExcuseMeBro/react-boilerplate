import Default from '@/layouts/Default.tsx';
import { useAppDispatch, useTypedSelector } from '@/store';
import { CounterServices } from '@/reducers/CounterSlice';
import { useTranslation } from 'react-i18next';
export default function Todo() {
  const { t, i18n } = useTranslation();

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const dispatch = useAppDispatch();
  const count = useTypedSelector((state) => state.Counter.count);

  const increment = () => {
    dispatch(CounterServices.actions.incrementNumber());
  };
  return (
    <Default>
      <main className="mx-3">
        <p className="text-3xl text-blue-500">{t('hello')}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeLang('en')}
            className="pointer-events-auto rounded-md bg-indigo-600 px-3 py-2 text-[0.8125rem] font-semibold leading-5 text-white hover:bg-indigo-500">
            English
          </button>
          <button
            onClick={() => changeLang('uz')}
            className="pointer-events-auto rounded-md bg-indigo-600 px-3 py-2 text-[0.8125rem] font-semibold leading-5 text-white hover:bg-indigo-500">
            Uzbek
          </button>
        </div>
        <p className="text-3xl text-red-500">Todos pages</p>
        <button
          onClick={() => increment()}
          className="pointer-events-auto rounded-md bg-indigo-600 px-3 py-2 text-[0.8125rem] font-semibold leading-5 text-white hover:bg-indigo-500">
          Count {count}
        </button>
      </main>
    </Default>
  );
}
