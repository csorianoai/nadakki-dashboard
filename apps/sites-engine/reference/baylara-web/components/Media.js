import { srcSet } from '../lib/media';

// Responsive image from the registry: AVIF + WebP sources at several widths.
// `m` comes from lib/media.js (registry item or an own photo with a plain `src`).
// `priority` = first visible content: eager and high fetch priority.
export default function Media({ m, sizes = '100vw', priority = false, alt, className = 'media', decorative = false }) {
  if (!m) return null;
  const a = decorative ? '' : alt ?? m.alt ?? '';
  const common = { className, alt: a, decoding: 'async', loading: priority ? 'eager' : 'lazy', fetchPriority: priority ? 'high' : undefined };
  if (m.src) return <img src={m.src} {...common} />;
  // No ReactDOM.preload(): it travels inside Next's link prefetch payloads and would download other pages' heroes.
  // The <img> is in the initial HTML with fetchpriority="high", which the preload scanner picks up first.
  const fallback = `${m.base}-${m.widths.find((w) => w >= 1024) || m.widths.at(-1)}.webp`;
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(m, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(m, 'webp')} sizes={sizes} />
      <img src={fallback} width={m.width} height={m.height} style={m.color ? { backgroundColor: m.color } : undefined} {...common} />
    </picture>
  );
}
