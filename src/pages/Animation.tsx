import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

const cards = ['REST', 'JWT', 'i18n', 'Biome', 'Tailwind', 'Motion'];

export default function AnimationPage() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 space-y-3"
        initial={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <h1 className="text-4xl font-black tracking-tight text-slate-950">
          {t('animation.title')}
        </h1>
        <p className="max-w-2xl text-slate-600">{t('animation.description')}</p>
      </motion.div>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 shadow-xl shadow-slate-200">
        <div className="relative min-h-[420px] overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_top_left,#4f46e5,transparent_32%),linear-gradient(135deg,#020617,#111827)] p-8 text-white">
          <motion.div
            animate={{ scale: [1, 1.08, 1], x: [0, 30, 0], y: [0, -20, 0] }}
            className="absolute right-10 top-10 h-48 w-48 rounded-full bg-indigo-500/40 blur-3xl"
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          />

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 max-w-2xl"
            initial={{ opacity: 0, y: 24 }}
            transition={{ delay: 0.1, duration: 0.45 }}
          >
            <p className="text-sm font-black uppercase tracking-[0.35em] text-indigo-200">
              {t('animation.eyebrow')}
            </p>
            <h2 className="mt-5 text-5xl font-black tracking-tight md:text-7xl">
              React Boilerplate
            </h2>
            <p className="mt-5 text-xl font-semibold text-slate-300">REST • JWT • i18n • Motion</p>
          </motion.div>

          <div className="relative z-10 mt-12 grid gap-3 sm:grid-cols-3">
            {cards.map((card, index) => (
              <motion.div
                className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-black backdrop-blur"
                initial={{ opacity: 0, y: 18 }}
                key={card}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.35 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.04, y: -4 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                {card}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
