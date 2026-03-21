import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { navigationEngine } from '@/lib/navigation-engine';
import { Room, Waypoint, GraphEdge, FloorMap, FloorType } from '@/lib/types';
import { getRoomNodeId, SEED_EDGES, SEED_ROOMS, SEED_WAYPOINTS } from '../lib/seed-data';
import { normalizeFloorMapUrl } from '@/lib/floor-map-url';

const buildNameFloorKey = (name: string, floor: FloorType) => `${name}::${floor}`;

export function useNavigationData() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [floorMaps, setFloorMaps] = useState<FloorMap[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [waypointsRes, edgesRes, floorMapsRes] = await Promise.all([
        supabase.from('waypoints').select('*'),
        supabase.from('graph_edges').select('*'),
        supabase.from('floor_maps').select('*'),
      ]);

      const dbWaypoints = (waypointsRes.data ?? []) as Waypoint[];
      const dbEdges = (edgesRes.data ?? []) as GraphEdge[];

      const loadedWaypoints = dbWaypoints.length > 0
        ? dbWaypoints
        : SEED_WAYPOINTS.map((waypoint) => ({ id: waypoint.name, ...waypoint }));

      const loadedRooms = loadedWaypoints
        .filter((wp) => wp.type === 'room')
        .map((wp, index) => ({
          id: `derived-room-${index}`,
          room_number: wp.name,
          room_name: wp.name,
          floor: wp.floor,
          block: wp.block,
          x: wp.x,
          y: wp.y,
          width: 90,
          height: 60,
        } as Room));

      const effectiveRooms = loadedRooms.length > 0
        ? loadedRooms
        : SEED_ROOMS.map((room, index) => ({ id: `seed-room-${index}`, ...room }));

      const loadedEdges = dbEdges.length > 0
        ? dbEdges
        : SEED_EDGES.map((edge, index) => ({ id: `seed-edge-${index}`, ...edge }));
      const loadedFloorMaps = (floorMapsRes.data ?? []) as FloorMap[];

      setRooms(effectiveRooms);
      setWaypoints(loadedWaypoints);
      setEdges(loadedEdges);
      setFloorMaps(loadedFloorMaps);

      // Build the navigation graph
      navigationEngine.clear();

      const waypointById = new Map<string, Waypoint>();
      const waypointIdByNameFloor = new Map<string, string>();
      const waypointIdsByName = new Map<string, string[]>();

      loadedWaypoints.forEach((wp) => {
        waypointById.set(wp.id, wp);
        waypointIdByNameFloor.set(buildNameFloorKey(wp.name, wp.floor), wp.id);
        const existingIds = waypointIdsByName.get(wp.name) ?? [];
        existingIds.push(wp.id);
        waypointIdsByName.set(wp.name, existingIds);
      });

      // Add room nodes
      effectiveRooms.forEach(room => {
        const nodeId = getRoomNodeId(room.room_number, room.floor);
        navigationEngine.addNode({
          id: nodeId,
          x: room.x,
          y: room.y,
          floor: room.floor,
          type: 'room',
          label: `${room.room_name} (${room.room_number})`,
        });
      });

      // Add waypoint nodes
      loadedWaypoints.forEach(wp => {
        navigationEngine.addNode({
          id: wp.id,
          x: wp.x,
          y: wp.y,
          floor: wp.floor,
          type: wp.type,
          label: wp.name.replace(/_/g, ' '),
        });
      });

      // Bridge room selection nodes to actual room waypoints.
      loadedWaypoints
        .filter((wp) => wp.type === 'room')
        .forEach((wp) => {
          const roomNodeId = getRoomNodeId(wp.name, wp.floor);
          navigationEngine.addEdge(roomNodeId, wp.id, 1);
        });

      const resolveLegacyNodeId = (legacyNode: string, floor: FloorType | null): string | null => {
        if (!legacyNode) return null;
        if (waypointById.has(legacyNode)) return legacyNode;
        if (legacyNode.startsWith('Room_')) return legacyNode;

        if (floor) {
          const byFloor = waypointIdByNameFloor.get(buildNameFloorKey(legacyNode, floor));
          if (byFloor) return byFloor;
        }

        const byName = waypointIdsByName.get(legacyNode);
        if (!byName || byName.length === 0) return null;
        if (byName.length === 1) return byName[0];

        if (floor) {
          const floorMatch = byName.find((id) => waypointById.get(id)?.floor === floor);
          if (floorMatch) return floorMatch;
        }

        return byName[0];
      };

      // Add edges
      loadedEdges.forEach(edge => {
        const fromNode = edge.from_waypoint_id
          ? edge.from_waypoint_id
          : resolveLegacyNodeId(edge.from_node, edge.floor);
        const toNode = edge.to_waypoint_id
          ? edge.to_waypoint_id
          : resolveLegacyNodeId(edge.to_node, edge.floor);

        if (!fromNode || !toNode) return;
        navigationEngine.addEdge(fromNode, toNode, edge.distance);
      });
    } catch (err) {
      console.error('Failed to load navigation data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getFloorMapUrl = useCallback((floor: FloorType) => {
    const staticMapByFloor: Record<FloorType, string> = {
      G: '/floor-maps/ground.png',
      F: '/floor-maps/first.png',
      S: '/floor-maps/second.png',
      T: '/floor-maps/third.png',
    };

    const fromDb = floorMaps.find(fm => fm.floor === floor);

    return normalizeFloorMapUrl(fromDb?.image_url) ?? staticMapByFloor[floor];
  }, [floorMaps]);

  const getFloorMapUrlByBlock = useCallback((floor: FloorType, _block = 'A') => {
    const staticMapByFloor: Record<FloorType, string> = {
      G: '/floor-maps/ground.png',
      F: '/floor-maps/first.png',
      S: '/floor-maps/second.png',
      T: '/floor-maps/third.png',
    };
    const fromDb = floorMaps.find(fm => fm.floor === floor);

    return normalizeFloorMapUrl(fromDb?.image_url) ?? staticMapByFloor[floor];
  }, [floorMaps]);

  return { rooms, waypoints, edges, floorMaps, getFloorMapUrl, getFloorMapUrlByBlock, loading, reload: loadData };
}
