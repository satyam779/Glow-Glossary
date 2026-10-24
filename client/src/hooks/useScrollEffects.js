import { useEffect } from 'react';
import { useLocation } from 'react-router';
import Lenis from 'lenis';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The active Lenis instance (if any), so route changes can scroll through it.
let lenis = null;

// Buttery wheel scrolling on the public pages. Lenis drives the real window scroll,
// so window.scrollY (and everything that reads it) stays truthful.
export function useSmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return undefined;
    lenis = new Lenis({ autoRaf: true, lerp: 0.09 });
    return () => {
      lenis?.destroy();
      lenis = null;
    };
  }, []);
}

export function scrollToTarget(target, { immediate = false } = {}) {
  if (lenis) lenis.scrollTo(target, { immediate, offset: 0 });
  else if (typeof target === 'number') window.scrollTo(0, target);
  else target.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' });
}

// New page: start at the top. "#section" links: glide to the section (once it exists).
export function useRouteScroll() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      scrollToTarget(0, { immediate: true });
      return undefined;
    }
    let tries = 0;
    const find = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) scrollToTarget(el);
      else if (tries++ < 20) timer = setTimeout(find, 100);
    };
    let timer = setTimeout(find, 60);
    return () => clearTimeout(timer);
  }, [pathname, hash]);
}

// Landing page: section reveals, parallax on [data-speed] elements, and the light/dark nav switch.
export function useScrollEffects() {
  useEffect(() => {
    const sections = [...document.querySelectorAll('main section, footer section')];
    const movers = [...document.querySelectorAll('[data-speed]')];
    const still = reducedMotion();

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.25 }
    );
    sections.forEach((s) => io.observe(s));

    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;

      if (!still) {
        for (const el of movers) {
          const sec = el.closest('section');
          if (!sec) continue;
          const p = -sec.getBoundingClientRect().top / vh;
          const speed = parseFloat(el.dataset.speed) || 0;
          el.style.transform = `translate3d(0, ${(p * speed * vh).toFixed(1)}px, 0)`;
        }
      }

      const probe = vh * 0.06;
      const current = sections.find((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= probe && r.bottom > probe;
      });
      document.body.classList.toggle('on-dark', current?.dataset.theme === 'dark');
      document.body.classList.toggle('scrolled', window.scrollY > 30);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.body.classList.remove('on-dark', 'scrolled');
    };
  }, []);
}

// Simple reveal-on-scroll for inner pages (same .reveal styles as the landing page).
export function useReveal(deps = []) {
  useEffect(() => {
    const els = [...document.querySelectorAll('.page .reveal-group')];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
