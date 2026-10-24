import { useEffect, useRef, useState } from 'react';
import { ORIGIN } from '../content';

// Fixed, full-screen WebGL layer that hosts the flying tin. three.js is loaded lazily so the
// page paints first. `play` starts the intro drop (once the loader has lifted);
// `onReady(ok)` reports whether the 3D scene could start.
export default function TinCanvas({ play, onReady }) {
  const host = useRef(null);
  const scene = useRef(null);
  const [ready, setReady] = useState(false);
  const readyCb = useRef(onReady);
  readyCb.current = onReady;

  useEffect(() => {
    let cancelled = false;
    const fail = (err) => {
      console.warn('[Glow Glossary] 3D tin unavailable, showing photos instead.', err);
      document.documentElement.classList.add('no-webgl');
      readyCb.current?.(false);
    };

    import('../three/MatchaScene')
      .then(({ MatchaScene }) => {
        if (cancelled) return;
        const s = new MatchaScene(host.current, { origin: ORIGIN.region });
        scene.current = s;
        return s.load().then((ok) => {
          if (!ok || cancelled) return;
          setReady(true);
          readyCb.current?.(true);
        });
      })
      .catch(fail);

    return () => {
      cancelled = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => {
    if (play && ready) scene.current?.startIntro();
  }, [play, ready]);

  return <div ref={host} className={`tin-stage ${ready ? 'ready' : ''}`} aria-hidden="true" />;
}
