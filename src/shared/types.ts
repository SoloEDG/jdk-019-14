export interface Point {
  x: number;
  y: number;
}
export interface Node extends Point {
  in: Point;
  out: Point;
}
export interface Shape {
  id: string;
  name: string;
  nodes: Node[];
  closed: boolean;
  fill: string;
  stroke: string;
  width: number;
  opacity: number;
  group?: string;
}
export interface NodeRef {
  id: string;
  index: number;
}
export interface Document {
  shapes: Shape[];
  selected: string[];
  nodeSel: NodeRef[];
  tool: string;
  zoom: number;
}
