import { beginEdit } from "../../drawing";
import { doc } from "../../../shared/document";
import type { Shape } from "../../../shared/types";

export function canBreak(): boolean {
  if (doc.nodeSel.length !== 1) return false;
  const r = doc.nodeSel[0];
  const s = doc.shapes.find((x) => x.id === r.id);
  if (!s || s.nodes.length < 2) return false;
  return s.closed || (r.index > 0 && r.index < s.nodes.length - 1);
}

/**
 * Break at the selected node. A closed path opens at that node (the node is
 * duplicated into the two new endpoints, geometry unchanged); an open path
 * splits into two sibling shapes that keep style and group membership.
 */
export function breakAtSelection() {
  if (!canBreak()) return;
  const { id, index } = doc.nodeSel[0];
  const s = doc.shapes.find((x) => x.id === id)!;
  beginEdit();
  if (s.closed) {
    const rot = [...s.nodes.slice(index), ...s.nodes.slice(0, index)];
    const first = rot[0];
    rot.push({
      x: first.x,
      y: first.y,
      in: { ...first.in },
      out: { ...first.out },
    });
    s.nodes = rot;
    s.closed = false;
    doc.nodeSel = [
      { id: s.id, index: 0 },
      { id: s.id, index: s.nodes.length - 1 },
    ];
  } else {
    const cut = s.nodes[index];
    const tail = s.nodes.splice(index);
    tail.shift();
    s.nodes.push({
      x: cut.x,
      y: cut.y,
      in: { ...cut.in },
      out: { x: cut.x, y: cut.y },
    });
    const copy: Shape = {
      ...s,
      id: crypto.randomUUID(),
      name: s.name + " copy",
      nodes: [
        { x: cut.x, y: cut.y, in: { x: cut.x, y: cut.y }, out: { ...cut.out } },
        ...tail,
      ],
    };
    doc.shapes.splice(doc.shapes.indexOf(s) + 1, 0, copy);
    doc.selected = [s.id, copy.id];
    doc.nodeSel = [
      { id: s.id, index: s.nodes.length - 1 },
      { id: copy.id, index: 0 },
    ];
  }
}
