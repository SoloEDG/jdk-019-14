import { beginEdit } from "../../drawing";
import { doc } from "../../../shared/document";
import { cloneNodes, reverseNodes } from "../lib/bezier";
import type { Shape } from "../../../shared/types";

/** Endpoints closer than this are welded into one anchor; farther ones are bridged. */
export const WELD_TOLERANCE = 2;

export interface Endpoint {
  id: string;
  end: "first" | "last";
}

export function isEndpoint(s: Shape, index: number) {
  return (
    !s.closed &&
    s.nodes.length > 0 &&
    (index === 0 || index === s.nodes.length - 1)
  );
}

/** Exactly two distinct open endpoints selected as nodes. */
export function selectedEndpoints(): [Endpoint, Endpoint] | null {
  if (doc.nodeSel.length !== 2) return null;
  const ends: Endpoint[] = [];
  for (const r of doc.nodeSel) {
    const s = doc.shapes.find((x) => x.id === r.id);
    if (!s || !isEndpoint(s, r.index)) return null;
    ends.push({ id: r.id, end: r.index === 0 ? "first" : "last" });
  }
  if (ends[0].id === ends[1].id && ends[0].end === ends[1].end) return null;
  return [ends[0], ends[1]];
}

/** Two selected open shapes → their closest endpoint pair. */
export function closestEndpoints(): [Endpoint, Endpoint] | null {
  if (doc.selected.length !== 2) return null;
  const [a, b] = doc.selected.map((id) => doc.shapes.find((s) => s.id === id));
  if (!a || !b || a.closed || b.closed || !a.nodes.length || !b.nodes.length)
    return null;
  let best: [Endpoint, Endpoint] | null = null,
    dist = Infinity;
  for (const ea of ["first", "last"] as const)
    for (const eb of ["first", "last"] as const) {
      const pa = ea === "first" ? a.nodes[0] : a.nodes[a.nodes.length - 1],
        pb = eb === "first" ? b.nodes[0] : b.nodes[b.nodes.length - 1];
      const d = Math.hypot(pa.x - pb.x, pa.y - pb.y);
      if (d < dist) {
        dist = d;
        best = [
          { id: a.id, end: ea },
          { id: b.id, end: eb },
        ];
      }
    }
  return best;
}

export function canJoin() {
  return !!(
    selectedEndpoints() ||
    (!doc.nodeSel.length && closestEndpoints())
  );
}

export function joinSelected() {
  const ends =
    selectedEndpoints() || (doc.nodeSel.length ? null : closestEndpoints());
  if (ends) join(ends[0], ends[1]);
}

/**
 * Join two open endpoints. Chains are oriented by the actual endpoint sides
 * (reversing swaps in/out handles, so geometry is preserved); near-coincident
 * endpoints weld into one anchor, distant ones are bridged by a new segment —
 * never moved. The topmost shape survives and donates id, name, style and
 * group; the other shape is consumed.
 */
export function join(a: Endpoint, b: Endpoint) {
  if (a.id === b.id) return closeShape(a.id);
  const ia = doc.shapes.findIndex((s) => s.id === a.id),
    ib = doc.shapes.findIndex((s) => s.id === b.id);
  if (ia < 0 || ib < 0) return;
  const top = ia > ib ? { e: a, i: ia } : { e: b, i: ib },
    bot = ia > ib ? { e: b, i: ib } : { e: a, i: ia };
  const topShape = doc.shapes[top.i],
    botShape = doc.shapes[bot.i];
  if (topShape.closed || botShape.closed) return;
  beginEdit();
  const botChain =
      bot.e.end === "last"
        ? cloneNodes(botShape.nodes)
        : reverseNodes(botShape.nodes),
    topChain =
      top.e.end === "first"
        ? cloneNodes(topShape.nodes)
        : reverseNodes(topShape.nodes);
  const last = botChain[botChain.length - 1],
    first = topChain[0];
  let nodes;
  if (Math.hypot(last.x - first.x, last.y - first.y) <= WELD_TOLERANCE) {
    const merged = {
      x: (last.x + first.x) / 2,
      y: (last.y + first.y) / 2,
      in: last.in,
      out: first.out,
    };
    nodes = [...botChain.slice(0, -1), merged, ...topChain.slice(1)];
  } else {
    nodes = [...botChain, ...topChain];
  }
  topShape.nodes = nodes;
  doc.shapes.splice(bot.i, 1);
  doc.selected = [topShape.id];
  doc.nodeSel = [];
}

/** Join the two endpoints of one open path: it becomes truly closed. */
function closeShape(id: string) {
  const s = doc.shapes.find((x) => x.id === id);
  if (!s || s.closed || s.nodes.length < 2) return;
  beginEdit();
  const first = s.nodes[0],
    last = s.nodes[s.nodes.length - 1];
  if (Math.hypot(first.x - last.x, first.y - last.y) <= WELD_TOLERANCE) {
    first.x = (first.x + last.x) / 2;
    first.y = (first.y + last.y) / 2;
    first.in = last.in;
    s.nodes.pop();
  }
  s.closed = true;
  doc.nodeSel = [];
}
