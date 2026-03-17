import { FloorType, GraphEdge, Room, Waypoint } from './types';

type FloorCode = FloorType;
type Point = { x: number; y: number };
type Graph = Record<string, Record<string, number>>;

type BaseNodeMeta = {
  block: string;
  roomNumber: number;
  originalName: string;
};

const BASE_WAYPOINTS: Record<string, Point> = {
  'Auditorium 1': { x: 950, y: 260 },
  'Auditorium 2': { x: 950, y: 655 },
  'Seminar Hall': { x: 950, y: 455 },
  'Lab 1': { x: 690, y: 605 },
  'Lab 2': { x: 865, y: 605 },
  'Lab 3': { x: 865, y: 515 },
  'Lab 4': { x: 865, y: 325 },
  'Lab 5': { x: 810, y: 310 },
  'PT room': { x: 725, y: 310 },
  'Store Room': { x: 675, y: 310 },
  'Transport Office': { x: 625, y: 310 },
  'AIDS Department': { x: 690, y: 555 },
  "2nd AIDS 'A'": { x: 690, y: 475 },
  "1st AIDS 'B'": { x: 690, y: 395 },
  'Green Room': { x: 690, y: 345 },
  'Boys RestRoom': { x: 595, y: 605 },
  'Girls RestRoom': { x: 395, y: 605 },
  'VIP Pantry': { x: 355, y: 605 },
  'VIP Waiting Area': { x: 310, y: 605 },
  'Pantry': { x: 175, y: 605 },
  'VIP Dining': { x: 135, y: 605 },
  'Chairman Office': { x: 115, y: 605 },
  'Principle Office': { x: 95, y: 605 },
  'OAT': { x: 810, y: 455 },
  'Admin Office': { x: 310, y: 365 },
  'Reception': { x: 135, y: 455 },
  'Master Board Room': { x: 135, y: 515 },
  'OAK leaf': { x: 135, y: 555 },
  'Exam Cell': { x: 310, y: 495 },
  'Meeting Room': { x: 310, y: 555 },
  'Zig Zag Steps': { x: 495, y: 310 },
  'Admission Office': { x: 395, y: 310 },
  'Falcon Hall': { x: 310, y: 310 },
  'Harmony': { x: 145, y: 310 },
  'CDC': { x: 185, y: 310 },
  'Symphony': { x: 95, y: 310 },
  'Waiting Hall': { x: 135, y: 355 },
  'OSSIS Hall': { x: 205, y: 605 },
  'D Block': { x: 865, y: 455 },
  'D Block 2': { x: 865, y: 605 },
  'D Block 3': { x: 865, y: 310 },
  'C Block': { x: 690, y: 455 },
  'C Block 2': { x: 690, y: 605 },
  'C Block 3': { x: 690, y: 310 },
  'Middle Block': { x: 515, y: 455 },
  'Middle Block 2': { x: 515, y: 605 },
  'Middle Block 3': { x: 515, y: 310 },
  'B Block': { x: 310, y: 455 },
  'B Block 2': { x: 310, y: 605 },
  'B Block 3': { x: 310, y: 310 },
  'A Block': { x: 135, y: 455 },
  'A Block 2': { x: 135, y: 605 },
  'A Block 3': { x: 135, y: 310 },
};

const BASE_GRAPH: Graph = {
  'Auditorium 2': { 'Seminar Hall': 20, 'Auditorium 1': 25 },
  'Auditorium 1': { 'Seminar Hall': 10, 'Auditorium 2': 25 },
  'Seminar Hall': { 'Auditorium 1': 10, 'Auditorium 2': 20, 'D Block': 10 },
  'Lab 1': { 'D Block 2': 10, 'C Block': 20, 'Boys RestRoom': 10 },
  'Lab 2': { 'D Block 2': 10 },
  'Lab 3': { 'D Block': 20, 'D Block 2': 10 },
  'Lab 4': { 'D Block': 10, 'D Block 3': 10 },
  'Lab 5': { 'D Block 3': 10, 'PT room': 10 },
  'D Block': { 'Lab 3': 10, 'Lab 4': 15, 'Seminar Hall': 10 },
  'D Block 2': { 'Lab 2': 10, 'Lab 1': 10, 'Lab 3': 20 },
  'D Block 3': { 'Lab 4': 10, 'Lab 5': 10 },
  'PT room': { 'Lab 5': 10, 'C Block 3': 10 },
  'C Block': { "2nd AIDS 'A'": 10, "1st AIDS 'B'": 10, 'OAT': 10 },
  'C Block 2': { 'AIDS Department': 10, 'Lab 1': 10 },
  'C Block 3': { 'Green Room': 10, 'PT room': 10, 'Store Room': 10 },
  'Store Room': { 'C Block 3': 10, 'Transport Office': 10 },
  'Transport Office': { 'Store Room': 10, 'Middle Block 3': 10 },
  'AIDS Department': { "2nd AIDS 'A'": 10, 'C Block 2': 10 },
  "2nd AIDS 'A'": { 'AIDS Department': 10, 'C Block': 10 },
  "1st AIDS 'B'": { 'Green Room': 10, 'C Block': 10 },
  'Green Room': { "1st AIDS 'B'": 10, 'C Block 3': 10 },
  'Boys RestRoom': { 'Lab 1': 10, 'Middle Block 2': 10 },
  'Girls RestRoom': { 'Middle Block 2': 10, 'VIP Pantry': 10 },
  'Middle Block': { 'Middle Block 2': 10, 'Middle Block 3': 10 },
  'Middle Block 2': { 'Middle Block': 10, 'Girls RestRoom': 10, 'Boys RestRoom': 10 },
  'VIP Pantry': { 'Girls RestRoom': 10, 'VIP Waiting Area': 10 },
  'VIP Waiting Area': { 'VIP Pantry': 10, 'B Block 2': 10, 'OSSIS Hall': 10 },
  'Meeting Room': { 'B Block 2': 10, 'Exam Cell': 10 },
  'Exam Cell': { 'Meeting Room': 10, 'B Block': 10 },
  'B Block': { 'Exam Cell': 10, 'Admin Office': 10, 'A Block': 10 },
  'B Block 2': { 'VIP Waiting Area': 10, 'Meeting Room': 10 },
  'Admin Office': { 'B Block': 10, 'Falcon Hall': 10 },
  'B Block 3': { 'Admission Office': 10, 'Falcon Hall': 10, 'CDC': 10 },
  'Falcon Hall': { 'B Block 3': 10, 'Admin Office': 10 },
  'CDC': { 'B Block 3': 10, 'Harmony': 10 },
  'Harmony': { 'CDC': 10, 'A Block 3': 10 },
  'A Block': { 'B Block': 10, 'Reception': 10, 'Master Board Room': 10 },
  'A Block 2': { 'OAK leaf': 10, 'VIP Dining': 10 },
  'A Block 3': { 'Symphony': 10, 'Harmony': 10, 'Waiting Hall': 10 },
  'Symphony': { 'A Block 3': 10 },
  'Waiting Hall': { 'A Block 3': 10, 'Reception': 10 },
  'Reception': { 'A Block': 10, 'Waiting Hall': 10 },
  'Master Board Room': { 'A Block': 10, 'OAK leaf': 10 },
  'OAK leaf': { 'Master Board Room': 10, 'A Block 2': 10 },
  'VIP Dining': { 'A Block 2': 10, 'Chairman Office': 10, 'Pantry': 10 },
  'Chairman Office': { 'VIP Dining': 10, 'Principle Office': 10 },
  'Principle Office': { 'Chairman Office': 10 },
  'OAT': { 'C Block': 10 },
  'Pantry': { 'VIP Dining': 10, 'OSSIS Hall': 10 },
  'OSSIS Hall': { 'Pantry': 10, 'VIP Waiting Area': 10 },
  'Zig Zag Steps': { 'Admission Office': 10, 'Middle Block 3': 10 },
  'Middle Block 3': { 'Zig Zag Steps': 10, 'Middle Block': 10, 'Transport Office': 10 },
  'Admission Office': { 'Zig Zag Steps': 10, 'B Block 3': 10 },
};

const isBlockNode = (name: string) => name.includes('Block');
const isStairNode = (name: string) => name === 'Zig Zag Steps';

const inferBlockLetter = (point: Point): string => {
  if (point.x <= 250) return 'A';
  if (point.x <= 430) return 'B';
  if (point.x <= 620) return 'M';
  if (point.x <= 790) return 'C';
  return 'D';
};

const roomNodeNames = Object.keys(BASE_WAYPOINTS).filter((name) => !isBlockNode(name) && !isStairNode(name));

const roomMetaByBaseName: Record<string, BaseNodeMeta> = {};
const countersByBlock: Record<string, number> = { A: 101, B: 101, C: 101, D: 101, M: 101 };

for (const nodeName of roomNodeNames) {
  const block = inferBlockLetter(BASE_WAYPOINTS[nodeName]);
  roomMetaByBaseName[nodeName] = {
    block,
    roomNumber: countersByBlock[block],
    originalName: nodeName,
  };
  countersByBlock[block] += 1;
}

const buildNameMapForFloor = (floorCode: FloorCode): Record<string, string> => {
  const mapping: Record<string, string> = {};

  for (const nodeName of Object.keys(BASE_WAYPOINTS)) {
    if (isStairNode(nodeName)) {
      mapping[nodeName] = `STAIR-${floorCode}`;
      continue;
    }

    if (isBlockNode(nodeName)) {
      const blockLetter = nodeName.startsWith('Middle') ? 'M' : nodeName.charAt(0);
      const suffix = nodeName.endsWith(' 2') ? '02' : nodeName.endsWith(' 3') ? '03' : '01';
      mapping[nodeName] = `${blockLetter}${floorCode}H${suffix}`;
      continue;
    }

    const meta = roomMetaByBaseName[nodeName];
    mapping[nodeName] = `${meta.block}${floorCode}${meta.roomNumber}`;
  }

  return mapping;
};

const cloneGraphWithMap = (graph: Graph, nameMap: Record<string, string>): Graph => {
  const out: Graph = {};

  for (const [fromNode, neighbors] of Object.entries(graph)) {
    const mappedFrom = nameMap[fromNode];
    if (!mappedFrom) continue;

    if (!out[mappedFrom]) out[mappedFrom] = {};

    for (const [toNode, cost] of Object.entries(neighbors)) {
      const mappedTo = nameMap[toNode];
      if (!mappedTo) continue;
      out[mappedFrom][mappedTo] = cost;
    }
  }

  return out;
};

const toRoomNodeId = (roomCode: string, floor: FloorCode) => `Room_${roomCode}_${floor}`;

const buildGraphNodeMapForFloor = (floorCode: FloorCode, nameMap: Record<string, string>): Record<string, string> => {
  const graphMap: Record<string, string> = {};

  for (const baseName of Object.keys(BASE_WAYPOINTS)) {
    const mapped = nameMap[baseName];
    if (!mapped) continue;

    graphMap[baseName] = isBlockNode(baseName) || isStairNode(baseName)
      ? mapped
      : toRoomNodeId(mapped, floorCode);
  }

  return graphMap;
};

const addUndirectedEdge = (graph: Graph, a: string, b: string, cost: number) => {
  if (!graph[a]) graph[a] = {};
  if (!graph[b]) graph[b] = {};
  graph[a][b] = cost;
  graph[b][a] = cost;
};

const floorCodeOfNode = (node: string): FloorCode | null => {
  const stairOrLift = node.match(/^(?:STAIR|LIFT)-(G|F|S|T)$/);
  if (stairOrLift) return stairOrLift[1] as FloorCode;

  const roomNode = node.match(/^Room_[A-Z](G|F|S|T)\d+_(G|F|S|T)$/);
  if (roomNode) return roomNode[2] as FloorCode;

  const hallNode = node.match(/^[A-Z](G|F|S|T)H\d{2}$/);
  if (hallNode) return hallNode[1] as FloorCode;

  const roomCode = node.match(/^[A-Z](G|F|S|T)\d+$/);
  if (roomCode) return roomCode[1] as FloorCode;

  return null;
};

const floorCodesInOrder: FloorCode[] = ['G', 'F', 'S', 'T'];
const nameMapsByFloorCode: Record<FloorCode, Record<string, string>> = {
  G: buildNameMapForFloor('G'),
  F: buildNameMapForFloor('F'),
  S: buildNameMapForFloor('S'),
  T: buildNameMapForFloor('T'),
};

const waypointsByFloorCode: Record<FloorCode, Record<string, Point>> = {
  G: {},
  F: {},
  S: {},
  T: {},
};

const graphByFloorCode: Record<FloorCode, Graph> = {
  G: {},
  F: {},
  S: {},
  T: {},
};

const rooms: Omit<Room, 'id'>[] = [];
const waypoints: Omit<Waypoint, 'id'>[] = [];
const roomCodesByFloor: Record<FloorCode, string[]> = { G: [], F: [], S: [], T: [] };

for (const floorCode of floorCodesInOrder) {
  const nameMap = nameMapsByFloorCode[floorCode];
  const graphNodeMap = buildGraphNodeMapForFloor(floorCode, nameMap);

  for (const [baseName, point] of Object.entries(BASE_WAYPOINTS)) {
    const mappedName = nameMap[baseName];
    waypointsByFloorCode[floorCode][mappedName] = { ...point };

    if (!isBlockNode(baseName) && !isStairNode(baseName)) {
      roomCodesByFloor[floorCode].push(mappedName);
      rooms.push({
        room_number: mappedName,
        room_name: baseName,
        floor: floorCode,
        block: roomMetaByBaseName[baseName].block,
        x: point.x,
        y: point.y,
        width: 90,
        height: 60,
      });
      continue;
    }

    const type: Waypoint['type'] = isStairNode(baseName) ? 'stairs' : 'corridor';
    const block = mappedName.startsWith('M') ? 'M' : mappedName.charAt(0);
    waypoints.push({
      name: mappedName,
      floor: floorCode,
      x: point.x,
      y: point.y,
      type,
      block,
    });
  }

  graphByFloorCode[floorCode] = cloneGraphWithMap(BASE_GRAPH, graphNodeMap);

  const liftNode = `LIFT-${floorCode}`;
  const liftPoint = BASE_WAYPOINTS['Middle Block'];
  waypointsByFloorCode[floorCode][liftNode] = { ...liftPoint };
  waypoints.push({
    name: liftNode,
    floor: floorCode,
    x: liftPoint.x,
    y: liftPoint.y,
    type: 'lift',
    block: 'M',
  });

  addUndirectedEdge(graphByFloorCode[floorCode], liftNode, nameMap['Middle Block'], 6);
  addUndirectedEdge(graphByFloorCode[floorCode], liftNode, nameMap['Middle Block 3'], 8);
}

for (let i = 0; i < floorCodesInOrder.length - 1; i += 1) {
  const current = floorCodesInOrder[i];
  const next = floorCodesInOrder[i + 1];
  addUndirectedEdge(graphByFloorCode[current], `STAIR-${current}`, `STAIR-${next}`, 9);
  addUndirectedEdge(graphByFloorCode[current], `LIFT-${current}`, `LIFT-${next}`, 7);
}

const edges: Omit<GraphEdge, 'id'>[] = [];
const seen = new Set<string>();

for (const floorCode of floorCodesInOrder) {
  const floorGraph = graphByFloorCode[floorCode];

  for (const [fromNode, neighbors] of Object.entries(floorGraph)) {
    for (const [toNode, distance] of Object.entries(neighbors)) {
      const key = [fromNode, toNode].sort().join('::');
      if (seen.has(key)) continue;
      seen.add(key);

      const fromFloor = floorCodeOfNode(fromNode);
      const toFloor = floorCodeOfNode(toNode);
      const isVertical = fromFloor !== null && toFloor !== null && fromFloor !== toFloor;

      edges.push({
        from_node: fromNode,
        to_node: toNode,
        distance,
        floor: isVertical ? null : (fromFloor ?? toFloor),
        is_vertical: isVertical,
      });
    }
  }
}

export const SEED_ROOMS: Omit<Room, 'id'>[] = rooms;
export const SEED_WAYPOINTS: Omit<Waypoint, 'id'>[] = waypoints;
export const SEED_EDGES: Omit<GraphEdge, 'id'>[] = edges;
export const ROOM_CODES_BY_FLOOR: Record<FloorCode, string[]> = roomCodesByFloor;

export function getRoomNodeId(roomNumber: string, floor: FloorType): string {
  return toRoomNodeId(roomNumber, floor);
}
