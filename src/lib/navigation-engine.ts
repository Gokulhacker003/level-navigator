import { FloorType, NavigationResult, NavigationStep, FLOOR_LABELS, MapNode } from './types';

interface GraphNode {
  id: string;
  neighbors: Map<string, number>;
}

interface QueueEntry {
  id: string;
  distance: number;
}

class MinHeap {
  private data: QueueEntry[] = [];

  get size(): number {
    return this.data.length;
  }

  push(entry: QueueEntry) {
    this.data.push(entry);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): QueueEntry | null {
    if (this.data.length === 0) return null;
    if (this.data.length === 1) return this.data.pop() ?? null;

    const top = this.data[0];
    this.data[0] = this.data.pop()!;
    this.bubbleDown(0);
    return top;
  }

  private bubbleUp(index: number) {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.data[parent].distance <= this.data[current].distance) break;
      [this.data[parent], this.data[current]] = [this.data[current], this.data[parent]];
      current = parent;
    }
  }

  private bubbleDown(index: number) {
    let current = index;
    const last = this.data.length - 1;

    while (true) {
      const left = current * 2 + 1;
      const right = current * 2 + 2;
      let smallest = current;

      if (left <= last && this.data[left].distance < this.data[smallest].distance) {
        smallest = left;
      }

      if (right <= last && this.data[right].distance < this.data[smallest].distance) {
        smallest = right;
      }

      if (smallest === current) break;
      [this.data[current], this.data[smallest]] = [this.data[smallest], this.data[current]];
      current = smallest;
    }
  }
}

export class NavigationEngine {
  private graph: Map<string, GraphNode> = new Map();
  private nodes: Map<string, MapNode> = new Map();

  clear() {
    this.graph.clear();
    this.nodes.clear();
  }

  addNode(node: MapNode) {
    this.nodes.set(node.id, node);
    if (!this.graph.has(node.id)) {
      this.graph.set(node.id, { id: node.id, neighbors: new Map() });
    }
  }

  addEdge(from: string, to: string, distance: number) {
    const fromNode = this.graph.get(from);
    const toNode = this.graph.get(to);
    if (fromNode && toNode) {
      const existingForward = fromNode.neighbors.get(to);
      const existingReverse = toNode.neighbors.get(from);
      const nextForward = existingForward === undefined ? distance : Math.min(existingForward, distance);
      const nextReverse = existingReverse === undefined ? distance : Math.min(existingReverse, distance);
      fromNode.neighbors.set(to, nextForward);
      toNode.neighbors.set(from, nextReverse);
    }
  }

  getNode(id: string): MapNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): MapNode[] {
    return Array.from(this.nodes.values());
  }

  getNodesOnFloor(floor: FloorType): MapNode[] {
    return Array.from(this.nodes.values()).filter(n => n.floor === floor);
  }

  getRouteGroupsOnFloor(path: string[], floor: FloorType): MapNode[][] {
    const groups: MapNode[][] = [];
    let currentGroup: MapNode[] = [];

    for (let i = 0; i < path.length - 1; i += 1) {
      const fromNode = this.nodes.get(path[i]);
      const toNode = this.nodes.get(path[i + 1]);

      if (!fromNode || !toNode) continue;

      const isSameFloorSegment = fromNode.floor === floor && toNode.floor === floor;
      if (!isSameFloorSegment) {
        if (currentGroup.length > 1) {
          groups.push(currentGroup);
        }
        currentGroup = [];
        continue;
      }

      if (currentGroup.length === 0) {
        currentGroup = [fromNode, toNode];
        continue;
      }

      const lastNodeInGroup = currentGroup[currentGroup.length - 1];
      if (lastNodeInGroup.id === fromNode.id) {
        currentGroup.push(toNode);
      } else {
        if (currentGroup.length > 1) {
          groups.push(currentGroup);
        }
        currentGroup = [fromNode, toNode];
      }
    }

    if (currentGroup.length > 1) {
      groups.push(currentGroup);
    }

    return groups;
  }

  findPath(startId: string, endId: string): NavigationResult | null {
    if (!this.graph.has(startId) || !this.graph.has(endId)) return null;

    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const visited = new Set<string>();
    const queue = new MinHeap();

    for (const id of this.graph.keys()) {
      distances.set(id, Infinity);
      previous.set(id, null);
    }
    distances.set(startId, 0);
    queue.push({ id: startId, distance: 0 });

    while (queue.size > 0) {
      const currentEntry = queue.pop();
      if (!currentEntry) break;

      const current = currentEntry.id;
      if (visited.has(current)) continue;
      visited.add(current);

      if (current === endId) break;

      const node = this.graph.get(current)!;
      for (const [neighbor, weight] of node.neighbors) {
        if (visited.has(neighbor)) continue;
        // Add floor-change penalty (weight 5) to prefer same-floor routes
        const neighborNode = this.nodes.get(neighbor);
        const currentNode = this.nodes.get(current);
        const penalty = neighborNode && currentNode && neighborNode.floor !== currentNode.floor ? 5 : 0;
        const alt = distances.get(current)! + weight + penalty;
        if (alt < distances.get(neighbor)!) {
          distances.set(neighbor, alt);
          previous.set(neighbor, current);
          queue.push({ id: neighbor, distance: alt });
        }
      }
    }

    if (distances.get(endId) === Infinity) return null;

    // Reconstruct path
    const path: string[] = [];
    let current: string | null = endId;
    while (current !== null) {
      path.unshift(current);
      current = previous.get(current) ?? null;
    }

    // Generate steps
    const steps: NavigationStep[] = [];
    const floorsVisited = new Set<FloorType>();

    for (let i = 0; i < path.length - 1; i++) {
      const fromNode = this.nodes.get(path[i]);
      const toNode = this.nodes.get(path[i + 1]);
      if (!fromNode || !toNode) continue;

      floorsVisited.add(fromNode.floor);
      floorsVisited.add(toNode.floor);

      const isFloorChange = fromNode.floor !== toNode.floor;
      let instruction: string;

      if (isFloorChange) {
        const connectorType = fromNode.type === 'lift' || toNode.type === 'lift' ? 'lift' : 'stairs';
        instruction = `Take the ${connectorType} from ${fromNode.label} (${FLOOR_LABELS[fromNode.floor]}) to ${toNode.label} (${FLOOR_LABELS[toNode.floor]})`;
      } else if (toNode.type === 'room') {
        instruction = `Walk to ${toNode.label}`;
      } else if (toNode.type === 'stairs' || toNode.type === 'lift') {
        instruction = `Head towards the ${toNode.type} (${toNode.label})`;
      } else if (toNode.type === 'entrance') {
        instruction = `Go to ${toNode.label}`;
      } else {
        instruction = `Continue through corridor`;
      }

      steps.push({
        instruction,
        floor: isFloorChange ? toNode.floor : fromNode.floor,
        fromNode: path[i],
        toNode: path[i + 1],
        isFloorChange,
      });
    }

    return {
      path,
      distance: distances.get(endId)!,
      steps,
      floorsVisited: Array.from(floorsVisited),
    };
  }
}

export const navigationEngine = new NavigationEngine();
