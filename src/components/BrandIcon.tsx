import EmpirialIcon from '@/assets/Brand ID/empirial-icon.png';

// The source mark (src/assets/Brand ID/empirial-icon.png) sits on a large
// padded square canvas, so a plain <img> with object-cover renders it as a
// small glyph floating in a sea of black. Zooming via background-size
// crops in on the mark itself so it actually fills the squircle badge.
export default function BrandIcon({
  size = 40,
  radius,
  className = '',
}: {
  size?: number;
  radius?: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label="EMPIRIAL"
      className={`inline-block shrink-0 overflow-hidden bg-black ring-1 ring-white/15 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? Math.round(size * 0.28),
        backgroundImage: `url(${EmpirialIcon})`,
        backgroundSize: '230% 230%',
        backgroundPosition: '50% 50%',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
