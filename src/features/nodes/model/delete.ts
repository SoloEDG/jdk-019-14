import { reactive } from "vue";
import { beginEdit, path } from "../../drawing";
import { doc } from "../../../shared/document";
import { deleteNodes, type DeleteMode } from "../lib/surgery";
import type { Point } from "../../../shared/types";

export type { DeleteMode } from "../lib/surgery";

export interface DeleteTarget {
  id: string;
  indices: number[];
}
export const deleteState = reactive({
  active: false,
  mode: "curve" as DeleteMode,
  targets: [] as DeleteTarget[],
  error: "",
});

export function requestDelete() {
  if (!doc.nodeSel.length) return;
  const byShape = new Map<string, number[]>();
  for (const r of doc.nodeSel) {
    if (!byShape.has(r.id)) byShape.set(r.id, []);
    byShape.get(r.id)!.push(r.index);
  }
  const targets: DeleteTarget[] = [];
  let skipped = 0;
  for (const [id, indices] of byShape) {
    const s = doc.shapes.find((x) => x.id === id);
    if (!s) continue;
    if (indices.length >= s.nodes.length) skipped++;
    else targets.push({ id, indices: indices.sort((a, b) => a - b) });
  }
  deleteState.mode = "curve";
  deleteState.targets = targets;
  deleteState.error = skipped
    ? "A path keeps at least one node — deselect nodes or delete the layer instead."
    : "";
  deleteState.active = true;
}

export function cancelDelete() {
  deleteState.active = false;
  deleteState.targets = [];
  deleteState.error = "";
}

export function confirmDelete() {
  if (!deleteState.targets.length) return;
  beginEdit();
  for (const t of deleteState.targets) {
    const s = doc.shapes.find((x) => x.id === t.id);
    if (!s) continue;
    const r = deleteNodes(s.nodes, s.closed, t.indices, deleteState.mode);
    if (!r) continue;
    s.nodes = r.nodes;
    s.closed = r.closed;
  }
  doc.nodeSel = [];
  cancelDelete();
}

/** Before/after outlines per affected shape, for the difference preview. */
export function previewOutlines(): {
  before: string;
  after: string;
  marks: Point[];
}[] {
  const out = [];
  for (const t of deleteState.targets) {
    const s = doc.shapes.find((x) => x.id === t.id);
    if (!s) continue;
    const r = deleteNodes(s.nodes, s.closed, t.indices, deleteState.mode);
    if (!r) continue;
    out.push({
      before: path(s),
      after: path({ ...s, nodes: r.nodes, closed: r.closed }),
      marks: t.indices
        .filter((i) => i >= 0 && i < s.nodes.length)
        .map((i) => ({ x: s.nodes[i].x, y: s.nodes[i].y })),
    });
  }
  return out;
}
