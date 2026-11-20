import { doc } from "../../../shared/document";
import type { Node, Point } from "../../../shared/types";
export function move(n: Node, p: Point) {
  const dx = p.x - n.x,
    dy = p.y - n.y;
  n.in.x += dx;
  n.in.y += dy;
  n.out.x += dx;
  n.out.y += dy;
  n.x = p.x;
  n.y = p.y;
}
export function moveSelection(dx: number, dy: number) {
  for (const r of doc.nodeSel) {
    const n = doc.shapes.find((s) => s.id === r.id)?.nodes[r.index];
    if (n) move(n, { x: n.x + dx, y: n.y + dy });
  }
}
