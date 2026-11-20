import { beginEdit } from "../../drawing";
import { doc } from "../../../shared/document";
import { nearest, split } from "../lib/bezier";
import type { Point, Shape } from "../../../shared/types";

/** Number of cubic segments of a shape (closing segment included when closed). */
export function segmentCount(s: Shape) {
  return s.nodes.length < 2 ? 0 : s.nodes.length - (s.closed ? 0 : 1);
}

/** Insert a node on segment `seg` nearest to p. The outline is preserved exactly. */
export function insertAt(s: Shape, seg: number, p: Point) {
  const n = s.nodes.length;
  if (seg < 0 || seg >= segmentCount(s)) return;
  const a = s.nodes[seg],
    b = s.nodes[(seg + 1) % n];
  const t = nearest(a, b, p);
  beginEdit();
  const node = split(a, b, t);
  s.nodes.splice(seg + 1, 0, node);
  doc.nodeSel = [{ id: s.id, index: seg + 1 }];
}
