import Link from 'next/link';
import Media from './Media';

// `b` is a pre-localized building view (lib/view.js → buildingView). Server- and client-safe.
// Large photo with the name over it; without its own photo the card shows its zone's image.
export default function BuildingCard({ b, s }) {
  return (
    <Link href={b.href} className="card bcard" data-reveal>
      <div className="ph ph-over" style={{ aspectRatio: '4 / 5' }}>
        {b.media && <Media m={b.media} decorative sizes="(max-width: 767px) 100vw, (max-width: 1240px) 50vw, 420px" />}
        {b.rentalTag && <span className="tag">{b.rentalTag}</span>}
        {b.sample && <span className="tag tag-sample">{s.sample}</span>}
        <div className="over">
          <p className="eyebrow">{b.zoneName}{b.oceanfront ? ` · ${s.oceanfront}` : ''}</p>
          <p className="serif over-title">{b.name}</p>
          {b.priceRange && <p className="over-sub">{b.priceRange}</p>}
        </div>
      </div>
      <div className="specs">
        {b.year && <span>{b.year}</span>}
        {b.floors && <span>{b.floors} {s.floors.toLowerCase()}</span>}
        {b.petsLabel && <span>{b.petsLabel}</span>}
      </div>
    </Link>
  );
}
