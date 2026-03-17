import { Room, Waypoint, GraphEdge, FloorType } from './types';

// Block A - 4 floors sample data
export const SEED_ROOMS: Omit<Room, 'id'>[] = [
  // Ground Floor
  { room_number: 'AG101', room_name: 'Reception', floor: 'G', block: 'A', x: 100, y: 200, width: 100, height: 70 },
  { room_number: 'AG102', room_name: 'Security Office', floor: 'G', block: 'A', x: 250, y: 200, width: 90, height: 70 },
  { room_number: 'AG103', room_name: 'Cafeteria', floor: 'G', block: 'A', x: 400, y: 200, width: 120, height: 70 },
  { room_number: 'AG104', room_name: 'Store Room', floor: 'G', block: 'A', x: 570, y: 200, width: 80, height: 70 },
  { room_number: 'AG105', room_name: 'Admin Office', floor: 'G', block: 'A', x: 100, y: 380, width: 100, height: 70 },
  { room_number: 'AG106', room_name: 'Staff Room', floor: 'G', block: 'A', x: 250, y: 380, width: 90, height: 70 },
  // First Floor
  { room_number: 'AF201', room_name: 'CS Department', floor: 'F', block: 'A', x: 100, y: 200, width: 100, height: 70 },
  { room_number: 'AF202', room_name: 'IT Lab 1', floor: 'F', block: 'A', x: 250, y: 200, width: 90, height: 70 },
  { room_number: 'AF203', room_name: 'IT Lab 2', floor: 'F', block: 'A', x: 400, y: 200, width: 120, height: 70 },
  { room_number: 'AF204', room_name: 'Seminar Hall', floor: 'F', block: 'A', x: 570, y: 200, width: 80, height: 70 },
  { room_number: 'AF205', room_name: 'Faculty Room', floor: 'F', block: 'A', x: 100, y: 380, width: 100, height: 70 },
  // Second Floor
  { room_number: 'AS301', room_name: 'Library', floor: 'S', block: 'A', x: 100, y: 200, width: 150, height: 70 },
  { room_number: 'AS302', room_name: 'Reading Room', floor: 'S', block: 'A', x: 300, y: 200, width: 100, height: 70 },
  { room_number: 'AS303', room_name: 'Conference Room', floor: 'S', block: 'A', x: 450, y: 200, width: 100, height: 70 },
  { room_number: 'AS304', room_name: 'Research Lab', floor: 'S', block: 'A', x: 100, y: 380, width: 120, height: 70 },
  // Third Floor
  { room_number: 'AT401', room_name: 'Physics Lab', floor: 'T', block: 'A', x: 100, y: 200, width: 100, height: 70 },
  { room_number: 'AT402', room_name: 'Chemistry Lab', floor: 'T', block: 'A', x: 250, y: 200, width: 100, height: 70 },
  { room_number: 'AT403', room_name: 'Electronics Lab', floor: 'T', block: 'A', x: 400, y: 200, width: 100, height: 70 },
  { room_number: 'AT404', room_name: 'Server Room', floor: 'T', block: 'A', x: 570, y: 200, width: 80, height: 70 },
];

const createFloorWaypoints = (floor: FloorType): Omit<Waypoint, 'id'>[] => [
  { name: `Entrance_A_${floor}`, floor, x: 50, y: 310, type: 'entrance', block: 'A' },
  { name: `Corridor_1_${floor}`, floor, x: 200, y: 310, type: 'corridor', block: 'A' },
  { name: `Corridor_2_${floor}`, floor, x: 370, y: 310, type: 'corridor', block: 'A' },
  { name: `Corridor_3_${floor}`, floor, x: 550, y: 310, type: 'corridor', block: 'A' },
  { name: `Stairs_A_${floor}`, floor, x: 700, y: 250, type: 'stairs', block: 'A' },
  { name: `Lift_A_${floor}`, floor, x: 700, y: 370, type: 'lift', block: 'A' },
];

export const SEED_WAYPOINTS: Omit<Waypoint, 'id'>[] = [
  ...createFloorWaypoints('G'),
  ...createFloorWaypoints('F'),
  ...createFloorWaypoints('S'),
  ...createFloorWaypoints('T'),
];

// Helper to generate room node IDs
const roomNodeId = (roomNumber: string, floor: FloorType) => `Room_${roomNumber}_${floor}`;

// Generate edges for each floor
const createFloorEdges = (floor: FloorType, rooms: Omit<Room, 'id'>[]): Omit<GraphEdge, 'id'>[] => {
  const floorRooms = rooms.filter(r => r.floor === floor);
  const edges: Omit<GraphEdge, 'id'>[] = [];

  // Connect entrance to first corridor
  edges.push({ from_node: `Entrance_A_${floor}`, to_node: `Corridor_1_${floor}`, distance: 5, floor, is_vertical: false });

  // Connect corridors in sequence
  edges.push({ from_node: `Corridor_1_${floor}`, to_node: `Corridor_2_${floor}`, distance: 5, floor, is_vertical: false });
  edges.push({ from_node: `Corridor_2_${floor}`, to_node: `Corridor_3_${floor}`, distance: 5, floor, is_vertical: false });

  // Connect last corridor to stairs and lift
  edges.push({ from_node: `Corridor_3_${floor}`, to_node: `Stairs_A_${floor}`, distance: 3, floor, is_vertical: false });
  edges.push({ from_node: `Corridor_3_${floor}`, to_node: `Lift_A_${floor}`, distance: 3, floor, is_vertical: false });

  // Connect rooms to nearest corridor
  floorRooms.forEach((room, i) => {
    const nodeId = roomNodeId(room.room_number, floor);
    const corridorIdx = room.x < 300 ? 1 : room.x < 500 ? 2 : 3;
    edges.push({ from_node: nodeId, to_node: `Corridor_${corridorIdx}_${floor}`, distance: 3, floor, is_vertical: false });
  });

  return edges;
};

// Vertical connections between floors
const createVerticalEdges = (): Omit<GraphEdge, 'id'>[] => {
  const floors: FloorType[] = ['G', 'F', 'S', 'T'];
  const edges: Omit<GraphEdge, 'id'>[] = [];

  for (let i = 0; i < floors.length - 1; i++) {
    // Stairs connections between adjacent floors
    edges.push({
      from_node: `Stairs_A_${floors[i]}`,
      to_node: `Stairs_A_${floors[i + 1]}`,
      distance: 8,
      floor: null,
      is_vertical: true,
    });
    // Lift connections between adjacent floors
    edges.push({
      from_node: `Lift_A_${floors[i]}`,
      to_node: `Lift_A_${floors[i + 1]}`,
      distance: 4,
      floor: null,
      is_vertical: true,
    });
  }

  return edges;
};

export const SEED_EDGES: Omit<GraphEdge, 'id'>[] = [
  ...createFloorEdges('G', SEED_ROOMS),
  ...createFloorEdges('F', SEED_ROOMS),
  ...createFloorEdges('S', SEED_ROOMS),
  ...createFloorEdges('T', SEED_ROOMS),
  ...createVerticalEdges(),
];

// Build node ID for a room
export function getRoomNodeId(roomNumber: string, floor: FloorType): string {
  return `Room_${roomNumber}_${floor}`;
}
