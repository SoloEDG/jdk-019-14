import { reactive } from "vue";
import type { Document } from "./types";
export const doc = reactive<Document>({
  shapes: [],
  selected: [],
  nodeSel: [],
  tool: "select",
  zoom: 1,
});
