import type { Node } from "../../../shared/types";
import { cloneNodes, fitCubic, sampleChain } from "./bezier";

export type DeleteMode = "tangent" | "curve";

/**
 * Pure node removal. "tangent" keeps the neighbors' handles untouched;
 * "curve" re-fits each gap so the result stays close to the original outline.
 * Returns null when every node would be removed (a path keeps at least one).
 */
export function deleteNodes(
  nodes: Node[],
  closed: boolean,
  indices: number[],
  mode: DeleteMode,
): { nodes: Node[]; closed: boolean } | null {
  const n = nodes.length;
  const remove = new Set(indices.filter((i) => i >= 0 && i < n));
  if (!remove.size) return { nodes: cloneNodes(nodes), closed };
  if (remove.size >= n) return null;
  const kept: number[] = [];
  for (let i = 0; i < n; i++) if (!remove.has(i)) kept.push(i);
  const out = kept.map((i) => ({
    x: nodes[i].x,
    y: nodes[i].y,
    in: { ...nodes[i].in },
    out: { ...nodes[i].out },
  }));
  if (mode === "curve") {
    const pairs = closed ? kept.length : kept.length - 1;
    for (let k = 0; k < pairs; k++) {
      const from = kept[k],
        to = kept[(k + 1) % kept.length];
      const gap = closed ? (to - from + n) % n : to - from;
      if (gap > 1) {
        const { c1, c2 } = fitCubic(sampleChain(nodes, closed, from, to));
        out[k].out = c1;
        out[(k + 1) % kept.length].in = c2;
      }
    }
  }
  return { nodes: out, closed: closed && out.length > 1 };
}
