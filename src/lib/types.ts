export type FloorType = 'G' | 'F' | 'S' | 'T';
export type WaypointType = 'room' | 'corridor' | 'stairs' | 'lift' | 'entrance' | 'block';

export const FLOOR_LABELS: Record<FloorType, string> = {
  G: 'Ground Floor',
  F: 'First Floor',
  S: 'Second Floor',
  T: 'Third Floor',
};

export const FLOOR_ORDER: FloorType[] = ['G', 'F', 'S', 'T'];

export interface Room {
  id: string;
  room_number: string;
  room_name: string;
  floor: FloorType;
  block: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Waypoint {
  id: string;
  name: string;
  floor: FloorType;
  x: number;
  y: number;
  type: WaypointType;
  block: string;
}

export interface GraphEdge {
  id: string;
  from_node: string;
  to_node: string;
  from_waypoint_id?: string | null;
  to_waypoint_id?: string | null;
  distance: number;
  floor: FloorType | null;
  is_vertical: boolean;
}

export interface FloorMap {
  id: string;
  floor: FloorType;
  image_url: string | null;
  uploaded_at: string;
}

export interface NavigationStep {
  instruction: string;
  floor: FloorType;
  fromNode: string;
  toNode: string;
  isFloorChange: boolean;
}

export interface NavigationResult {
  path: string[];
  distance: number;
  steps: NavigationStep[];
  floorsVisited: FloorType[];
}

export interface MapNode {
  id: string;
  x: number;
  y: number;
  floor: FloorType;
  type: WaypointType;
  label: string;
}
