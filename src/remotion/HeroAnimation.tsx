import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface HeroAnimationProps {
  title?: string;
  subtitle?: string;
}

export function HeroAnimation({
  title = 'React Boilerplate',
  subtitle = 'REST • JWT • i18n • Remotion',
}: HeroAnimationProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const glow = interpolate(frame, [0, 90, 150], [0.15, 0.45, 0.2], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        background: 'linear-gradient(135deg, #020617 0%, #111827 48%, #312e81 100%)',
        color: 'white',
        display: 'flex',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: `rgba(99, 102, 241, ${glow})`,
          borderRadius: '999px',
          filter: 'blur(80px)',
          height: 360,
          position: 'absolute',
          transform: `scale(${1 + glow})`,
          width: 360,
        }}
      />
      <div
        style={{
          opacity: entrance,
          textAlign: 'center',
          transform: `translateY(${interpolate(entrance, [0, 1], [60, 0])}px)`,
        }}
      >
        <p
          style={{
            color: '#a5b4fc',
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: 12,
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          Production starter
        </p>
        <h1
          style={{
            fontSize: 92,
            fontWeight: 1000,
            letterSpacing: -4,
            lineHeight: 1,
            margin: '28px 0 20px',
          }}
        >
          {title}
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: 36, fontWeight: 700, margin: 0 }}>{subtitle}</p>
      </div>
    </AbsoluteFill>
  );
}
