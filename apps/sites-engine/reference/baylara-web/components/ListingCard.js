import Link from 'next/link';
import Media from './Media';

// Grid card: large horizontal photo; under it the ZONE (spaced capitals), the NAME or ADDRESS
// (bold capitals) and the price. On hover: dark layer with a framed "VIEW DETAILS".
// `item` is a pre-localized, serializable card (see lib/view.js: cardView / devCardView).
export default function ListingCard({ item, strings, priority = false }) {
  return (
    <Link href={item.href} className="pcard" data-reveal>
      <div className="ph pcard-ph">
        <Media m={item.media} decorative priority={priority} sizes="(max-width: 767px) 100vw, (max-width: 1240px) 50vw, 400px" />
        {item.sample && <span className="tag tag-sample">{strings.sample}</span>}
        <span className="pcard-cta" aria-hidden="true">{strings.details}</span>
      </div>
      <div className="pcard-body">
        {item.zoneLabel && <p className="pcard-zone">{item.zoneLabel}</p>}
        <p className="pcard-addr">{item.address || item.title}</p>
        <p className="pcard-price">{item.price}</p>
        {item.courtesy && <p className="small" style={{ fontSize: 11 }}>{strings.courtesy} {item.courtesy}</p>}
      </div>
    </Link>
  );
}
