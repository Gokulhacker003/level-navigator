import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { navigationEngine } from '@/lib/navigation-engine';
import { Room, Waypoint, GraphEdge, FloorType, MapNode } from '@/lib/types';
import { SEED_ROOMS, SEED_WAYPOINTS, SEED_EDGES, getRoomNodeId } from '@/lib/seed-data';

export function useNavigationData() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingSeedData, setUsingSeedData] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, waypointsRes, edgesRes] = await Promise.all([
        supabase.from('rooms').select('*'),
        supabase.from('waypoints').select('*'),
        supabase.from('graph_edges').select('*'),
      ]);

      let loadedRooms = (roomsRes.data ?? []) as Room[];
      let loadedWaypoints = (waypointsRes.data ?? []) as Waypoint[];
      let loadedEdges = (edgesRes.data ?? []) as GraphEdge[];

      // Use seed data if database is empty
      if (loadedRooms.length === 0) {
        setUsingSeedData(true);
        loadedRooms = SEED_ROOMS.map((r, i) => ({ ...r, id: `seed-room-${i}` }));
        loadedWaypoints = SEED_WAYPOINTS.map((w, i) => ({ ...w, id: `seed-wp-${i}` }));
        loadedEdges = SEED_EDGES.map((e, i) => ({ ...e, id: `seed-edge-${i}` }));
      }

      setRooms(loadedRooms);
      setWaypoints(loadedWaypoints);
      setEdges(loadedEdges);

      // Build the navigation graph
      navigationEngine.clear();

      // Add room nodes
      loadedRooms.forEach(room => {
        const nodeId = getRoomNodeId(room.room_number, room.floor);
        navigationEngine.addNode({
          id: nodeId,
          x: room.x + room.width / 2,
          y: room.y + room.height / 2,
          floor: room.floor,
          type: 'room',
          label: `${room.room_name} (${room.room_number})`,
        });
      });

      // Add waypoint nodes
      loadedWaypoints.forEach(wp => {
        navigationEngine.addNode({
          id: wp.name,
          x: wp.x,
          y: wp.y,
          floor: wp.floor,
          type: wp.type,
          label: wp.name.replace(/_/g, ' '),
        });
      });

      // Add edges
      loadedEdges.forEach(edge => {
        navigationEngine.addEdge(edge.from_node, edge.to_node, edge.distance);
      });
    } catch (err) {
      console.error('Failed to load navigation data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { rooms, waypoints, edges, loading, usingSeedData, reload: loadData };
}
