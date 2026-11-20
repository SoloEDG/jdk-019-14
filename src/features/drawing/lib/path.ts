import type { Shape } from "../../../shared/types";
export function path(s: Shape) {
  const n = s.nodes;
  if (!n.length) return "";
  if (n.length === 1) return `M ${n[0].x} ${n[0].y}`;
  const closed = s.closed;
  let d = `M ${n[0].x} ${n[0].y}`;
  for (let i = 1; i < n.length + (closed ? 1 : 0); i++) {
    const a = n[i - 1],
      b = n[i % n.length];
    d += ` C ${a.out.x} ${a.out.y} ${b.in.x} ${b.in.y} ${b.x} ${b.y}`;
  }
  return d + (closed ? " Z" : "");
}
