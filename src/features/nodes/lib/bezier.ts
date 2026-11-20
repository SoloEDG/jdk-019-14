import type { Node, Point } from "../../../shared/types";

export function cubicPts(p0: Point, c1: Point, c2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y,
  };
}

export function cubic(a: Node, b: Node, t: number): Point {
  return cubicPts(a, a.out, b.in, b, t);
}

/** de Casteljau split of segment a→b at t; mutates a.out / b.in, returns the new node. */
export function split(a: Node, b: Node, t: number): Node {
  const lerp = (p: Point, q: Point): Point => ({
    x: p.x + (q.x - p.x) * t,
    y: p.y + (q.y - p.y) * t,
  });
  const q0 = lerp(a, a.out),
    q1 = lerp(a.out, b.in),
    q2 = lerp(b.in, b);
  const r0 = lerp(q0, q1),
    r1 = lerp(q1, q2);
  const m = lerp(r0, r1);
  a.out = q0;
  b.in = q2;
  return { x: m.x, y: m.y, in: r0, out: r1 };
}

/** Parameter t of the point on segment a→b closest to p (sampled + refined). */
export function nearest(a: Node, b: Node, p: Point): number {
  const dist2 = (t: number) => {
    const q = cubic(a, b, t);
    return (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
  };
  let best = 0,
    step = 1 / 32;
  for (let i = 1; i <= 32; i++) if (dist2(i * step) < dist2(best)) best = i * step;
  for (let round = 0; round < 3; round++) {
    step /= 8;
    for (const t of [best - step, best + step])
      if (t >= 0 && t <= 1 && dist2(t) < dist2(best)) best = t;
  }
  return best;
}

export function cloneNodes(nodes: Node[]): Node[] {
  return nodes.map((n) => ({
    x: n.x,
    y: n.y,
    in: { ...n.in },
    out: { ...n.out },
  }));
}

/** Exact reverse: order flipped, in/out handles swapped — geometry unchanged. */
export function reverseNodes(nodes: Node[]): Node[] {
  return nodes
    .slice()
    .reverse()
    .map((n) => ({ x: n.x, y: n.y, in: { ...n.out }, out: { ...n.in } }));
}

/** Sample the original chain of segments from node `from` to node `to` (forward, wrapping if closed). */
export function sampleChain(
  nodes: Node[],
  closed: boolean,
  from: number,
  to: number,
): Point[] {
  const n = nodes.length,
    pts: Point[] = [];
  const steps = closed ? (to - from + n) % n : to - from;
  for (let s = 0; s < steps; s++) {
    const a = nodes[(from + s) % n],
      b = nodes[(from + s + 1) % n];
    if (s === 0) pts.push({ x: a.x, y: a.y });
    for (let k = 1; k <= 12; k++) pts.push(cubic(a, b, k / 12));
  }
  return pts;
}

function nearestT(p0: Point, c1: Point, c2: Point, p3: Point, p: Point): number {
  const d2 = (t: number) => {
    const q = cubicPts(p0, c1, c2, p3, t);
    return (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
  };
  let best = 0,
    step = 1 / 32;
  for (let i = 1; i <= 32; i++) if (d2(i * step) < d2(best)) best = i * step;
  for (let round = 0; round < 3; round++) {
    step /= 8;
    for (const t of [best - step, best + step])
      if (t >= 0 && t <= 1 && d2(t) < d2(best)) best = t;
  }
  return best;
}

/**
 * Least-squares fit of a single cubic with fixed endpoints through samples
 * (Schneider's method: chord-length t, then re-parameterization passes).
 * Returns the two inner control points.
 */
export function fitCubic(samples: Point[]): { c1: Point; c2: Point } {
  const a = samples[0],
    b = samples[samples.length - 1];
  const fallback = {
    c1: { x: a.x + (b.x - a.x) / 3, y: a.y + (b.y - a.y) / 3 },
    c2: { x: a.x + ((b.x - a.x) * 2) / 3, y: a.y + ((b.y - a.y) * 2) / 3 },
  };
  const lens = [0];
  for (let i = 1; i < samples.length; i++)
    lens.push(
      lens[i - 1] +
        Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y),
    );
  const total = lens[lens.length - 1];
  if (total < 1e-9) return fallback;
  let ts = lens.map((l) => l / total);
  let result = fallback;
  for (let pass = 0; pass < 4; pass++) {
    let a11 = 0,
      a12 = 0,
      a22 = 0;
    const b1 = { x: 0, y: 0 },
      b2 = { x: 0, y: 0 };
    for (let i = 0; i < samples.length; i++) {
      const t = ts[i],
        u = 1 - t;
      const c1 = 3 * u * u * t,
        c2 = 3 * u * t * t;
      const rx = samples[i].x - (u * u * u * a.x + t * t * t * b.x),
        ry = samples[i].y - (u * u * u * a.y + t * t * t * b.y);
      a11 += c1 * c1;
      a12 += c1 * c2;
      a22 += c2 * c2;
      b1.x += c1 * rx;
      b1.y += c1 * ry;
      b2.x += c2 * rx;
      b2.y += c2 * ry;
    }
    const det = a11 * a22 - a12 * a12;
    if (Math.abs(det) < 1e-12) return result;
    result = {
      c1: { x: (b1.x * a22 - b2.x * a12) / det, y: (b1.y * a22 - b2.y * a12) / det },
      c2: { x: (a11 * b2.x - a12 * b1.x) / det, y: (a11 * b2.y - a12 * b1.y) / det },
    };
    ts = samples.map((p) => nearestT(a, result.c1, result.c2, b, p));
  }
  return result;
}
