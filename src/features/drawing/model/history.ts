import { ref } from "vue";
import { doc } from "../../../shared/document";
import type { NodeRef } from "../../../shared/types";
const past: string[] = [];
const future: string[] = [];
export const revision = ref(0);
function snapshot() {
  return JSON.stringify({
    shapes: doc.shapes,
    selected: doc.selected,
    nodeSel: doc.nodeSel,
  });
}
export function beginEdit() {
  past.push(snapshot());
  if (past.length > 100) past.shift();
  future.length = 0;
}
function install(state: string) {
  const data = JSON.parse(state);
  doc.shapes = data.shapes;
  doc.selected = (data.selected || []).filter((id: string) =>
    doc.shapes.some((s) => s.id === id),
  );
  doc.nodeSel = (data.nodeSel || []).filter((r: NodeRef) => {
    const s = doc.shapes.find((x) => x.id === r?.id);
    return s && Number.isInteger(r.index) && r.index >= 0 && r.index < s.nodes.length;
  });
  revision.value++;
}
export function undo() {
  const state = past.pop();
  if (state) {
    future.push(snapshot());
    install(state);
  }
}
export function redo() {
  const state = future.pop();
  if (state) {
    past.push(snapshot());
    install(state);
  }
}
