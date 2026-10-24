import { useCallback, useEffect, useState } from 'react';
import { Loader } from '../components/Chrome';
import Hero from '../components/Hero';
import Press from '../components/Press';
import Story from '../components/Story';
import Craft from '../components/Craft';
import Compare from '../components/Compare';
import Ritual from '../components/Ritual';
import Shop from '../components/Shop';
import Community from '../components/Community';
import Footer from '../components/Footer';
import TinCanvas from '../components/TinCanvas';
import { useScrollEffects } from '../hooks/useScrollEffects';

const MIN_LOADER_MS = 1200;
const MAX_LOADER_MS = 6000;

// The loader and the tin's drop-in play once per visit, not every time you come back to Home.
let introPlayed = false;

export default function Home() {
  const [loaded, setLoaded] = useState(introPlayed);
  useScrollEffects();

  const [start] = useState(() => performance.now());
  const finish = useCallback(() => {
    const left = introPlayed ? 0 : Math.max(0, MIN_LOADER_MS - (performance.now() - start));
    setTimeout(() => setLoaded(true), left);
  }, [start]);

  useEffect(() => {
    const id = setTimeout(() => setLoaded(true), MAX_LOADER_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (loaded) introPlayed = true;
    document.body.classList.toggle('loaded', loaded);
    return () => document.body.classList.remove('loaded');
  }, [loaded]);

  useEffect(() => {
    document.title = 'Glow Glossary · Mastercraft Matcha';
  }, []);

  return (
    <>
      <Loader done={loaded} />
      <TinCanvas play={loaded} onReady={finish} />
      <main className="landing">
        <Hero />
        <Press />
        <Story />
        <Craft />
        <Compare />
        <Ritual />
        <Shop />
        <Community />
      </main>
      <Footer />
    </>
  );
}
