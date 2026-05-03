import { Player } from '@remotion/player';
import { useTranslation } from 'react-i18next';
import { HeroAnimation } from '@/remotion/HeroAnimation';

export default function AnimationPage() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-8 space-y-3">
        <h1 className="text-4xl font-black tracking-tight text-slate-950">
          {t('animation.title')}
        </h1>
        <p className="max-w-2xl text-slate-600">{t('animation.description')}</p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-3 shadow-xl shadow-slate-200">
        <Player
          component={HeroAnimation}
          compositionHeight={1080}
          compositionWidth={1920}
          controls
          durationInFrames={150}
          fps={30}
          inputProps={{
            title: 'React Boilerplate',
            subtitle: 'REST • JWT • i18n • Remotion',
          }}
          style={{ aspectRatio: '16 / 9', width: '100%' }}
        />
      </div>
    </main>
  );
}
