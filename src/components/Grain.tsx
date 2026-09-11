/**
 * Fixed film grain over the whole page. Static: the noise is generated once
 * by an SVG turbulence filter and never moves, so it costs nothing per frame
 * and needs no reduced-motion exception.
 */
const NOISE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>`,
  );

export default function Grain() {
  return <div aria-hidden="true" className="grain" style={{ backgroundImage: `url("${NOISE}")` }} />;
}
