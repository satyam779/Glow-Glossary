import { useEffect } from 'react';
import SiteFooter from '../components/SiteFooter';

// Wrapper for every page except Home: solid (frosted) nav, page title, compact footer.
export default function PageShell({ title, className = '', children }) {
  useEffect(() => {
    document.body.classList.add('scrolled', 'inner', 'loaded');
    return () => document.body.classList.remove('scrolled', 'inner', 'loaded');
  }, []);

  useEffect(() => {
    document.title = title ? `${title} · Glow Glossary` : 'Glow Glossary';
  }, [title]);

  return (
    <>
      <main className={`page ${className}`}>{children}</main>
      <SiteFooter />
    </>
  );
}
