import { Composition } from 'remotion';
import { HeroAnimation } from './HeroAnimation';

export default function RemotionRoot() {
  return (
    <Composition
      component={HeroAnimation}
      defaultProps={{
        title: 'React Boilerplate',
        subtitle: 'REST • JWT • i18n • Remotion',
      }}
      durationInFrames={150}
      fps={30}
      height={1080}
      id="HeroAnimation"
      width={1920}
    />
  );
}
