import { FloorType, NavigationResult, NavigationStep, FLOOR_LABELS, MapNode } from './types';

interface GraphNode {
  id: string;
  neighbors: Map<string, number>;
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
      fromNode.neighbors.set(to, distance);
      toNode.neighbors.set(from, distance);
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

  findPath(startId: string, endId: string): NavigationResult | null {
    if (!this.graph.has(startId) || !this.graph.has(endId)) return null;

    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    for (const id of this.graph.keys()) {
      distances.set(id, Infinity);
      previous.set(id, null);
      unvisited.add(id);
    }
    distances.set(startId, 0);

    while (unvisited.size > 0) {
      let current: string | null = null;
      let minDist = Infinity;
      for (const id of unvisited) {
        const d = distances.get(id)!;
        if (d < minDist) {
          minDist = d;
          current = id;
        }
      }

      if (current === null || current === endId) break;
      unvisited.delete(current);

      const node = this.graph.get(current)!;
      for (const [neighbor, weight] of node.neighbors) {
        if (!unvisited.has(neighbor)) continue;
        // Add floor-change penalty (weight 5) to prefer same-floor routes
        const neighborNode = this.nodes.get(neighbor);
        const currentNode = this.nodes.get(current);
        const penalty = neighborNode && currentNode && neighborNode.floor !== currentNode.floor ? 5 : 0;
        const alt = minDist + weight + penalty;
        if (alt < distances.get(neighbor)!) {
          distances.set(neighbor, alt);
          previous.set(neighbor, current);
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
        instruction = `Take the ${connectorType} from ${FLOOR_LABELS[fromNode.floor]} to ${FLOOR_LABELS[toNode.floor]}`;
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
