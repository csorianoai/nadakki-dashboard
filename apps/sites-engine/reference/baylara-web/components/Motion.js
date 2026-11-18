'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// 1) Over-image header: transparent at the top, solid once the page scrolls.
// 2) Scroll reveal: only elements still below the fold get hidden, then fade in when they enter.
//    Content already on screen (and everything without JS) is never hidden, so there is no flash or layout shift.
export default function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const header = document.querySelector('.header-overlay');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const els = [...document.querySelectorAll('[data-reveal]')].filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px' });
    for (const el of els) { el.classList.add('reveal'); io.observe(el); }
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
