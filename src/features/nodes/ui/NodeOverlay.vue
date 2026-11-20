<script setup lang="ts">
import { beginEdit } from "../../drawing";

import { doc } from "../../../shared/document";
import { moveSelection } from "../model/move";
import { coordinates } from "../lib/coordinates";
import { clickNode, nodeSelected } from "../model/selection";
import { insertAt, segmentCount } from "../model/insert";
import { deleteState, previewOutlines } from "../model/delete";
import type { Shape } from "../../../shared/types";
function drag(e: PointerEvent, s: Shape, index: number, kind: string) {
  e.stopPropagation();
  const wasSelected = nodeSelected(s.id, index);
  if (kind === "anchor" && !wasSelected) clickNode(s.id, index, e.shiftKey);
  const n = s.nodes[index];
  const svg = (e.target as SVGElement).ownerSVGElement!;
  let began = false,
    moved = false,
    last = coordinates(e, svg);
  const f = (ev: PointerEvent) => {
    const p = coordinates(ev, svg);
    if (!began) {
      beginEdit();
      began = true;
    }
    moved = true;
    if (kind === "anchor") moveSelection(p.x - last.x, p.y - last.y);
    else Object.assign(kind === "in" ? n.in : n.out, p);
    last = p;
  };
  window.addEventListener("pointermove", f);
  window.addEventListener(
    "pointerup",
    () => {
      window.removeEventListener("pointermove", f);
      if (!moved && kind === "anchor" && wasSelected)
        clickNode(s.id, index, e.shiftKey);
    },
    { once: true },
  );
}
function insert(e: PointerEvent, s: Shape, seg: number) {
  e.stopPropagation();
  const svg = (e.target as SVGElement).ownerSVGElement!;
  insertAt(s, seg, coordinates(e, svg));
}
function segPath(s: Shape, i: number) {
  const a = s.nodes[i],
    b = s.nodes[(i + 1) % s.nodes.length];
  return `M ${a.x} ${a.y} C ${a.out.x} ${a.out.y} ${b.in.x} ${b.in.y} ${b.x} ${b.y}`;
}
</script>
<template>
  <g v-for="s in doc.shapes.filter((s) => doc.selected.includes(s.id))" :key="s.id"
    ><template v-if="doc.tool === 'nodes' && !deleteState.active"
      ><path
        v-for="i in segmentCount(s)"
        :key="'hit' + i"
        :d="segPath(s, i - 1)"
        stroke="transparent"
        :stroke-width="10 / doc.zoom"
        fill="none"
        style="cursor: copy"
        @pointerdown="insert($event, s, i - 1)" /></template
    ><g v-for="(n, i) in s.nodes" :key="i"
      ><path
        :d="`M${n.in.x},${n.in.y} L${n.x},${n.y} L${n.out.x},${n.out.y}`"
        stroke="#9974ec"
        fill="none" /><circle
        v-for="k in ['in', 'out'] as const"
        :cx="n[k].x"
        :cy="n[k].y"
        r="4"
        fill="white"
        stroke="#8052df"
        @pointerdown="drag($event, s, i, k)" /><circle
        v-if="!s.closed && (i === 0 || i === s.nodes.length - 1)"
        :cx="n.x"
        :cy="n.y"
        r="7"
        fill="none"
        stroke="#8052df"
        stroke-dasharray="2 2" /><rect
        :x="n.x - 4"
        :y="n.y - 4"
        width="8"
        height="8"
        :fill="nodeSelected(s.id, i) ? '#8052df' : 'white'"
        stroke="#8052df"
        data-testid="anchor"
        @pointerdown="drag($event, s, i, 'anchor')" /></g
  ></g>
  <g v-if="deleteState.active"
    ><template v-for="(p, i) in previewOutlines()" :key="i"
      ><path
        :d="p.before"
        fill="none"
        stroke="#2f2451"
        stroke-opacity=".45"
        stroke-dasharray="5 4" /><path
        :d="p.after"
        fill="none"
        stroke="#e8789e"
        stroke-width="1.5" /><path
        v-for="(m, j) in p.marks"
        :key="j"
        :d="`M${m.x - 4},${m.y - 4} L${m.x + 4},${m.y + 4} M${m.x - 4},${m.y + 4} L${m.x + 4},${m.y - 4}`"
        stroke="#e8789e"
        stroke-width="1.5" /></template
  ></g>
</template>
