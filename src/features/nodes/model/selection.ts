import { doc } from "../../../shared/document";
export function select(id: string, multi: boolean) {
  const s = doc.shapes.find((s) => s.id === id);
  const ids = s?.group
    ? doc.shapes.filter((x) => x.group === s.group).map((x) => x.id)
    : [id];
  doc.selected = multi ? [...new Set([...doc.selected, ...ids])] : ids;
  doc.nodeSel = [];
}
export function clickNode(id: string, index: number, multi: boolean) {
  if (!multi) {
    doc.nodeSel = [{ id, index }];
    return;
  }
  const i = doc.nodeSel.findIndex((r) => r.id === id && r.index === index);
  doc.nodeSel =
    i >= 0
      ? doc.nodeSel.filter((_, k) => k !== i)
      : [...doc.nodeSel, { id, index }];
}
export function nodeSelected(id: string, index: number) {
  return doc.nodeSel.some((r) => r.id === id && r.index === index);
}
