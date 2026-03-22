import { FormEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { isAdminUser, signOutCurrentSession } from '@/lib/auth-roles';
import { ADMIN_LOGIN_PATH } from '@/lib/auth-routes';
import type { FloorType, WaypointType } from '@/lib/types';

const FLOOR_OPTIONS: FloorType[] = ['G', 'F', 'S', 'T'];
const WAYPOINT_TYPE_OPTIONS: WaypointType[] = ['room', 'corridor', 'stairs', 'lift', 'entrance', 'block'];
const BLOCK_OPTIONS = ['A', 'B', 'C', 'D', 'M'] as const;
const STATIC_MAP_BY_FLOOR: Record<FloorType, string> = {
  G: '/floor-maps/ground.png',
  F: '/floor-maps/first.png',
  S: '/floor-maps/second.png',
  T: '/floor-maps/third.png',
};

type MarkerPercent = {
  x: number;
  y: number;
};

type ManagedWaypoint = {
  id: string;
  name: string;
  room_id: string | null;
  floor: FloorType;
  block: string;
  type: WaypointType;
  x: number;
  y: number;
};

type ManagedEdge = {
  id: string;
  from_node: string;
  to_node: string;
  from_waypoint_id: string | null;
  to_waypoint_id: string | null;
  distance: number;
  floor: FloorType | null;
  is_vertical: boolean;
};

type EdgeSelectionMode = 'current' | 'next' | 'previous';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [authLoading, setAuthLoading] = useState(true);

  const [waypointName, setWaypointName] = useState('');
  const [waypointRoomId, setWaypointRoomId] = useState('');
  const [waypointFloor, setWaypointFloor] = useState<FloorType>('G');
  const [waypointBlock, setWaypointBlock] = useState('A');
  const [waypointType, setWaypointType] = useState<WaypointType>('corridor');
  const [waypointX, setWaypointX] = useState('');
  const [waypointY, setWaypointY] = useState('');
  const [waypointLoading, setWaypointLoading] = useState(false);
  const [waypointMapUrl, setWaypointMapUrl] = useState<string>(STATIC_MAP_BY_FLOOR.G);
  const [waypointMarkerPercent, setWaypointMarkerPercent] = useState<MarkerPercent | null>(null);
  const [editingWaypointId, setEditingWaypointId] = useState<string | null>(null);
  const waypointSectionRef = useRef<HTMLDivElement | null>(null);
  const waypointMapImgRef = useRef<HTMLImageElement | null>(null);

  const [selectedCurrentNode, setSelectedCurrentNode] = useState<string | null>(null);
  const [selectedNextNode, setSelectedNextNode] = useState<string | null>(null);
  const [selectedPreviousNode, setSelectedPreviousNode] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<EdgeSelectionMode>('current');
  const [edgeMapFloor, setEdgeMapFloor] = useState<FloorType>('G');
  const [filterEdgeNodesByMapFloor, setFilterEdgeNodesByMapFloor] = useState(true);
  const [edgeDistance, setEdgeDistance] = useState('');
  const [edgeFloor, setEdgeFloor] = useState<FloorType>('G');
  const [edgeVertical, setEdgeVertical] = useState(false);
  const [edgeBidirectional, setEdgeBidirectional] = useState(false);
  const [edgeLoading, setEdgeLoading] = useState(false);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const edgeSectionRef = useRef<HTMLDivElement | null>(null);
  const edgeMapImgRef = useRef<HTMLImageElement | null>(null);
  const [edgeMapUrl, setEdgeMapUrl] = useState<string>(STATIC_MAP_BY_FLOOR.G);
  const [edgeMapNaturalSize, setEdgeMapNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const [waypointRows, setWaypointRows] = useState<ManagedWaypoint[]>([]);
  const [edgeRows, setEdgeRows] = useState<ManagedEdge[]>([]);
  const [manageLoading, setManageLoading] = useState(false);

  const [mapFloor, setMapFloor] = useState<FloorType>('G');
  const [mapFile, setMapFile] = useState<File | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  const loadManageData = useCallback(async () => {
    setManageLoading(true);
    try {
      const [waypointsRes, edgesRes] = await Promise.all([
        supabase.from('waypoints').select('id,name,room_id,floor,block,type,x,y').order('floor', { ascending: true }).order('name', { ascending: true }).limit(200),
        supabase.from('graph_edges').select('id,from_node,to_node,from_waypoint_id,to_waypoint_id,distance,floor,is_vertical').order('from_node', { ascending: true }).order('to_node', { ascending: true }).limit(200),
      ]);

      if (waypointsRes.error) throw waypointsRes.error;
      if (edgesRes.error) throw edgesRes.error;

      setWaypointRows((waypointsRes.data ?? []) as ManagedWaypoint[]);
      setEdgeRows((edgesRes.data ?? []) as ManagedEdge[]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load admin data.';
      toast({ title: 'Load failed', description: message, variant: 'destructive' });
    } finally {
      setManageLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const verifyAdminSession = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        const user = data.user;
        if (!user) {
          navigate(ADMIN_LOGIN_PATH, { replace: true });
          return;
        }

        const admin = await isAdminUser(user.id);
        if (!admin) {
          await signOutCurrentSession();
          toast({
            title: 'Access denied',
            description: 'Only admin users can access this page.',
            variant: 'destructive',
          });
          navigate(ADMIN_LOGIN_PATH, { replace: true });
          return;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Session validation failed.';
        toast({ title: 'Access check failed', description: message, variant: 'destructive' });
        navigate(ADMIN_LOGIN_PATH, { replace: true });
        return;
      } finally {
        setAuthLoading(false);
      }
    };

    void verifyAdminSession();
  }, [navigate, toast]);

  useEffect(() => {
    if (!authLoading) {
      void loadManageData();
    }
  }, [authLoading, loadManageData]);

  const blockValue = useMemo(() => waypointBlock.trim().toUpperCase() || 'A', [waypointBlock]);

  useEffect(() => {
    const loadWaypointMapPreview = async () => {
      try {
        const { data, error } = await supabase
          .from('floor_maps')
          .select('image_url')
          .eq('floor', waypointFloor)
          .maybeSingle();

        if (error) {
          setWaypointMapUrl(STATIC_MAP_BY_FLOOR[waypointFloor]);
          return;
        }

        setWaypointMapUrl(data?.image_url || STATIC_MAP_BY_FLOOR[waypointFloor]);
      } catch {
        setWaypointMapUrl(STATIC_MAP_BY_FLOOR[waypointFloor]);
      }
    };

    void loadWaypointMapPreview();
  }, [waypointFloor]);

  useEffect(() => {
    const loadEdgeMapPreview = async () => {
      try {
        const { data, error } = await supabase
          .from('floor_maps')
          .select('image_url')
          .eq('floor', edgeMapFloor)
          .maybeSingle();

        if (error) {
          setEdgeMapUrl(STATIC_MAP_BY_FLOOR[edgeMapFloor]);
          return;
        }

        setEdgeMapUrl(data?.image_url || STATIC_MAP_BY_FLOOR[edgeMapFloor]);
      } catch {
        setEdgeMapUrl(STATIC_MAP_BY_FLOOR[edgeMapFloor]);
      }
    };

    void loadEdgeMapPreview();
  }, [edgeMapFloor]);

  const waypointById = useMemo(() => {
    return new Map(waypointRows.map((wp) => [wp.id, wp]));
  }, [waypointRows]);

  const edgeSelectableWaypoints = useMemo(() => {
    if (!filterEdgeNodesByMapFloor) return waypointRows;
    return waypointRows.filter((wp) => wp.floor === edgeMapFloor);
  }, [edgeMapFloor, filterEdgeNodesByMapFloor, waypointRows]);

  const edgeMapWaypoints = useMemo(() => {
    return waypointRows.filter((wp) => wp.floor === edgeMapFloor);
  }, [edgeMapFloor, waypointRows]);

  const buildUndirectedEdgeKey = useCallback((fromId: string, toId: string, floor: FloorType | null) => {
    const a = fromId < toId ? fromId : toId;
    const b = fromId < toId ? toId : fromId;
    return `${a}::${b}::${floor ?? 'NONE'}`;
  }, []);

  const existingEdgeKeys = useMemo(() => {
    const keys = new Set<string>();
    edgeRows.forEach((edge) => {
      if (!edge.from_waypoint_id || !edge.to_waypoint_id) return;
      keys.add(buildUndirectedEdgeKey(edge.from_waypoint_id, edge.to_waypoint_id, edge.floor));
    });
    return keys;
  }, [buildUndirectedEdgeKey, edgeRows]);

  const getWaypointLabel = useCallback((id: string | null) => {
    if (!id) return 'None';
    const wp = waypointById.get(id);
    return wp ? `${wp.name} (ID: ${wp.id})` : 'Unknown waypoint';
  }, [waypointById]);

  const applyNodeSelection = useCallback((role: EdgeSelectionMode, nodeId: string | null) => {
    if (!nodeId) {
      if (role === 'current') setSelectedCurrentNode(null);
      if (role === 'next') setSelectedNextNode(null);
      if (role === 'previous') setSelectedPreviousNode(null);
      return;
    }

    const conflictsCurrent = role !== 'current' && selectedCurrentNode === nodeId;
    const conflictsNext = role !== 'next' && selectedNextNode === nodeId;
    const conflictsPrevious = role !== 'previous' && selectedPreviousNode === nodeId;
    if (conflictsCurrent || conflictsNext || conflictsPrevious) {
      toast({
        title: 'Duplicate selection',
        description: 'A node cannot be used for multiple roles (Current/Next/Previous).',
        variant: 'destructive',
      });
      return;
    }

    if (role === 'current') setSelectedCurrentNode(nodeId);
    if (role === 'next') setSelectedNextNode(nodeId);
    if (role === 'previous') setSelectedPreviousNode(nodeId);
  }, [selectedCurrentNode, selectedNextNode, selectedPreviousNode, toast]);

  const handleEdgeMapMarkerClick = useCallback((nodeId: string) => {
    if (!selectedCurrentNode && selectionMode !== 'current') {
      applyNodeSelection('current', nodeId);
      setSelectionMode('next');
      return;
    }

    applyNodeSelection(selectionMode, nodeId);
  }, [applyNodeSelection, selectedCurrentNode, selectionMode]);

  const handleEdgeMapLoad = () => {
    const image = edgeMapImgRef.current;
    if (!image || !image.naturalWidth || !image.naturalHeight) {
      setEdgeMapNaturalSize(null);
      return;
    }
    setEdgeMapNaturalSize({ w: image.naturalWidth, h: image.naturalHeight });
  };

  const getEdgeDistance = (from: ManagedWaypoint, to: ManagedWaypoint): number => {
    if (edgeDistance.trim()) {
      const manualDistance = Number(edgeDistance);
      return Number.isFinite(manualDistance) ? manualDistance : NaN;
    }
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100;
  };

  const handleWaypointMapClick = (event: MouseEvent<HTMLImageElement>) => {
    const image = waypointMapImgRef.current;
    if (!image) return;

    const rect = image.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) {
      return;
    }

    const xPercent = localX / rect.width;
    const yPercent = localY / rect.height;
    const naturalX = xPercent * image.naturalWidth;
    const naturalY = yPercent * image.naturalHeight;

    setWaypointX(naturalX.toFixed(2));
    setWaypointY(naturalY.toFixed(2));
    setWaypointMarkerPercent({ x: xPercent, y: yPercent });
  };

  const handleWaypointMapLoad = () => {
    const image = waypointMapImgRef.current;
    if (!image || !image.naturalWidth || !image.naturalHeight) return;

    const parsedX = Number(waypointX);
    const parsedY = Number(waypointY);

    if (!Number.isNaN(parsedX) && !Number.isNaN(parsedY) && parsedX >= 0 && parsedY >= 0) {
      const xPercent = parsedX / image.naturalWidth;
      const yPercent = parsedY / image.naturalHeight;
      if (xPercent >= 0 && xPercent <= 1 && yPercent >= 0 && yPercent <= 1) {
        setWaypointMarkerPercent({ x: xPercent, y: yPercent });
        return;
      }
    }

    if (!waypointX && !waypointY) {
      setWaypointX((image.naturalWidth / 2).toFixed(2));
      setWaypointY((image.naturalHeight / 2).toFixed(2));
      setWaypointMarkerPercent({ x: 0.5, y: 0.5 });
    }
  };

  const submitWaypoint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWaypointLoading(true);

    try {
      const x = Number(waypointX);
      const y = Number(waypointY);
      if (Number.isNaN(x) || Number.isNaN(y)) {
        throw new Error('X and Y must be valid numbers.');
      }

      const normalizedRoomId = waypointRoomId.trim().toUpperCase();
      if (waypointType === 'room' && !normalizedRoomId) {
        throw new Error('Room ID is required when waypoint type is room.');
      }

      const payload = {
        name: waypointName.trim(),
        room_id: waypointType === 'room' ? normalizedRoomId : null,
        floor: waypointFloor,
        block: blockValue,
        type: waypointType,
        x,
        y,
      };

      const { error } = editingWaypointId
        ? await supabase.from('waypoints').update(payload as never).eq('id', editingWaypointId)
        : await supabase.from('waypoints').upsert(payload as never, { onConflict: 'name,floor' });

      if (error) throw error;

      toast({
        title: editingWaypointId ? 'Waypoint updated' : 'Waypoint saved',
        description: editingWaypointId
          ? 'Waypoint updated successfully.'
          : 'Waypoint inserted or updated successfully for this floor/name.',
      });
      setEditingWaypointId(null);
      setWaypointName('');
      setWaypointRoomId('');
      setWaypointX('');
      setWaypointY('');
      setWaypointMarkerPercent(null);
      await loadManageData();
    } catch (error: unknown) {
      const postgrestError = error as { code?: string; message?: string; details?: string };
      const message = postgrestError.code === '23505'
        ? 'Duplicate waypoint conflict. Use a different room ID/name or edit the existing row.'
        : error instanceof Error
          ? error.message
          : 'Failed to save waypoint.';
      toast({ title: 'Waypoint save failed', description: message, variant: 'destructive' });
    } finally {
      setWaypointLoading(false);
    }
  };

  const submitGraphEdge = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEdgeLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Your admin session has expired. Please sign in again.');
      }

      const admin = await isAdminUser(session.user.id);
      if (!admin) {
        throw new Error('Your account does not have admin role permissions for graph edge writes.');
      }

      if (!selectedCurrentNode || !selectedNextNode) {
        throw new Error('Please select Current Node and Next Node.');
      }

      if (selectedCurrentNode === selectedNextNode) {
        throw new Error('Current Node and Next Node must be different.');
      }

      if (selectedPreviousNode && (selectedPreviousNode === selectedCurrentNode || selectedPreviousNode === selectedNextNode)) {
        throw new Error('Previous Node must be different from Current and Next nodes.');
      }

      if (edgeDistance.trim()) {
        const manualDistance = Number(edgeDistance);
        if (Number.isNaN(manualDistance) || manualDistance <= 0) {
          throw new Error('Distance must be a positive number.');
        }
      }

      const currentWaypoint = waypointById.get(selectedCurrentNode);
      const nextWaypoint = waypointById.get(selectedNextNode);
      const previousWaypoint = selectedPreviousNode ? waypointById.get(selectedPreviousNode) : null;

      if (!currentWaypoint || !nextWaypoint || (selectedPreviousNode && !previousWaypoint)) {
        throw new Error('Selected waypoints are not valid. Please refresh and try again.');
      }

      const connections: Array<{ from: ManagedWaypoint; to: ManagedWaypoint }> = [
        { from: currentWaypoint, to: nextWaypoint },
      ];
      if (previousWaypoint) {
        connections.push({ from: previousWaypoint, to: currentWaypoint });
      }

      if (edgeBidirectional && !editingEdgeId) {
        connections.push(...connections.map((c) => ({ from: c.to, to: c.from })));
      }

      const dedupedConnections = Array.from(
        new Map(connections.map((c) => [`${c.from.id}->${c.to.id}`, c])).values(),
      );

      const payloadRows = dedupedConnections.map((connection) => ({
        from_node: connection.from.name,
        to_node: connection.to.name,
        from_waypoint_id: connection.from.id,
        to_waypoint_id: connection.to.id,
        distance: getEdgeDistance(connection.from, connection.to),
        floor: edgeFloor,
        is_vertical: edgeVertical,
      }));

      if (payloadRows.some((row) => Number.isNaN(row.distance) || row.distance <= 0)) {
        throw new Error('Distance is invalid. Use a positive number or clear it for auto-calc.');
      }

      if (editingEdgeId) {
        const updateRow = payloadRows[0];
        const updateKey = buildUndirectedEdgeKey(
          updateRow.from_waypoint_id,
          updateRow.to_waypoint_id,
          updateRow.floor,
        );
        const conflictingExisting = edgeRows.some((edge) => {
          if (edge.id === editingEdgeId) return false;
          if (!edge.from_waypoint_id || !edge.to_waypoint_id) return false;
          return buildUndirectedEdgeKey(edge.from_waypoint_id, edge.to_waypoint_id, edge.floor) === updateKey;
        });
        if (conflictingExisting) {
          throw new Error('This edge already exists for the selected floor.');
        }
      }

      const rowsToInsert = editingEdgeId
        ? payloadRows
        : payloadRows.filter((row) => {
            const key = buildUndirectedEdgeKey(row.from_waypoint_id, row.to_waypoint_id, row.floor);
            return !existingEdgeKeys.has(key);
          });

      if (!editingEdgeId && rowsToInsert.length === 0) {
        throw new Error('All selected edges already exist. Choose different nodes or floor.');
      }

      const { error } = editingEdgeId
        ? await supabase.from('graph_edges').update(rowsToInsert[0]).eq('id', editingEdgeId)
        : await supabase.from('graph_edges').insert(rowsToInsert);

      if (error) throw error;

      toast({
        title: editingEdgeId ? 'Graph edge updated' : 'Graph edge added',
        description: editingEdgeId
          ? 'Edge updated successfully.'
          : `${rowsToInsert.length} edge${rowsToInsert.length > 1 ? 's' : ''} inserted successfully.`,
      });
      setEditingEdgeId(null);
      setSelectedCurrentNode(null);
      setSelectedNextNode(null);
      setSelectedPreviousNode(null);
      setSelectionMode('current');
      setEdgeDistance('');
      setEdgeFloor('G');
      setEdgeVertical(false);
      setEdgeBidirectional(false);
      await loadManageData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add graph edge.';
      const postgrestError = error as { code?: string; message?: string; details?: string; hint?: string };
      const message = errorMessage.includes('403')
        ? 'Write denied by database policy (403). Confirm you are signed in as an admin and run latest Supabase migrations.'
        : postgrestError.code === '23505'
          ? 'Duplicate edge for this node pair/floor. Choose a different connection.'
          : postgrestError.message
            ? `${postgrestError.message}${postgrestError.details ? ` (${postgrestError.details})` : ''}`
        : errorMessage;
      toast({ title: 'Graph edge insert failed', description: message, variant: 'destructive' });
    } finally {
      setEdgeLoading(false);
    }
  };

  const submitFloorMap = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMapLoading(true);

    try {
      if (!mapFile) {
        throw new Error('Please choose an image file first.');
      }

      const ext = mapFile.name.split('.').pop() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const storagePath = `${mapFloor}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('floor-maps')
        .upload(storagePath, mapFile, { upsert: true, contentType: mapFile.type || undefined });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('floor-maps').getPublicUrl(storagePath);
      const publicUrl = data.publicUrl;

      const { error: upsertError } = await supabase.from('floor_maps').upsert(
        {
          floor: mapFloor,
          image_url: publicUrl,
          uploaded_at: new Date().toISOString(),
        },
        { onConflict: 'floor' },
      );

      if (upsertError) throw upsertError;

      toast({ title: 'Floor map uploaded', description: 'Image and metadata saved successfully.' });
      setMapFile(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload floor map.';
      toast({ title: 'Floor map upload failed', description: message, variant: 'destructive' });
    } finally {
      setMapLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutCurrentSession();
    navigate(ADMIN_LOGIN_PATH, { replace: true });
  };

  const handleDeleteWaypoint = async (id: string) => {
    const ok = window.confirm('Delete this waypoint?');
    if (!ok) return;

    try {
      const { error } = await supabase.from('waypoints').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Waypoint deleted' });
      await loadManageData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete waypoint.';
      toast({ title: 'Delete failed', description: message, variant: 'destructive' });
    }
  };

  const handleEditWaypoint = (wp: ManagedWaypoint) => {
    setEditingWaypointId(wp.id);
    setWaypointName(wp.name);
    setWaypointRoomId(wp.room_id ?? '');
    setWaypointFloor(wp.floor);
    setWaypointBlock(wp.block);
    setWaypointType(wp.type);
    setWaypointX(String(wp.x));
    setWaypointY(String(wp.y));
    setWaypointMarkerPercent(null);
    waypointSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelWaypointEdit = () => {
    setEditingWaypointId(null);
    setWaypointName('');
    setWaypointRoomId('');
    setWaypointFloor('G');
    setWaypointBlock('A');
    setWaypointType('corridor');
    setWaypointX('');
    setWaypointY('');
    setWaypointMarkerPercent(null);
  };

  const handleDeleteEdge = async (id: string) => {
    const ok = window.confirm('Delete this graph edge?');
    if (!ok) return;

    try {
      const { error } = await supabase.from('graph_edges').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Graph edge deleted' });
      await loadManageData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete edge.';
      toast({ title: 'Delete failed', description: message, variant: 'destructive' });
    }
  };

  const handleEditEdge = async (edge: ManagedEdge) => {
    setEditingEdgeId(edge.id);
    const fromWaypointId = edge.from_waypoint_id
      ?? waypointRows.find((wp) => wp.name === edge.from_node)?.id
      ?? null;
    const toWaypointId = edge.to_waypoint_id
      ?? waypointRows.find((wp) => wp.name === edge.to_node)?.id
      ?? null;

    setSelectedCurrentNode(fromWaypointId);
    setSelectedNextNode(toWaypointId);
    setSelectedPreviousNode(null);
    setSelectionMode('current');
    setEdgeDistance(String(edge.distance));
    setEdgeFloor(edge.floor ?? 'G');
    setEdgeVertical(edge.is_vertical);
    setEdgeBidirectional(false);
    const fromFloor = fromWaypointId ? waypointById.get(fromWaypointId)?.floor : edge.floor;
    if (fromFloor) setEdgeMapFloor(fromFloor);
    edgeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdgeEdit = () => {
    setEditingEdgeId(null);
    setSelectedCurrentNode(null);
    setSelectedNextNode(null);
    setSelectedPreviousNode(null);
    setSelectionMode('current');
    setEdgeDistance('');
    setEdgeFloor('G');
    setEdgeVertical(false);
    setEdgeBidirectional(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking admin access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin Data Manager</h1>
            <p className="text-sm text-muted-foreground">Add waypoints, graph edges, and floor map images.</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
        </div>

        <Card ref={waypointSectionRef}>
          <CardHeader>
            <CardTitle>{editingWaypointId ? 'Edit Waypoint' : 'Add Waypoint'}</CardTitle>
            <CardDescription>
              {editingWaypointId ? 'Update the selected waypoint row.' : 'Create a new point in the waypoints table.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitWaypoint}>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="wp-name">Name</Label>
                <Input id="wp-name" value={waypointName} onChange={(e) => setWaypointName(e.target.value)} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="wp-room-id">Room ID</Label>
                <Input
                  id="wp-room-id"
                  value={waypointRoomId}
                  onChange={(e) => setWaypointRoomId(e.target.value.toUpperCase())}
                  placeholder="AG101"
                  required={waypointType === 'room'}
                />
                <p className="text-xs text-muted-foreground">Required for room type. Example: AG101</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wp-floor">Floor</Label>
                <select
                  id="wp-floor"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={waypointFloor}
                  onChange={(e) => setWaypointFloor(e.target.value as FloorType)}
                >
                  {FLOOR_OPTIONS.map((floor) => (
                    <option key={floor} value={floor}>{floor}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wp-block">Block</Label>
                <select
                  id="wp-block"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={waypointBlock}
                  onChange={(e) => setWaypointBlock(e.target.value)}
                >
                  {BLOCK_OPTIONS.map((block) => (
                    <option key={block} value={block}>{block}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wp-type">Type</Label>
                <select
                  id="wp-type"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={waypointType}
                  onChange={(e) => setWaypointType(e.target.value as WaypointType)}
                >
                  {WAYPOINT_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wp-x">X</Label>
                <Input id="wp-x" value={waypointX} onChange={(e) => setWaypointX(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wp-y">Y</Label>
                <Input id="wp-y" value={waypointY} onChange={(e) => setWaypointY(e.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={waypointLoading}>
                    {waypointLoading ? 'Saving...' : editingWaypointId ? 'Update waypoint' : 'Add waypoint'}
                  </Button>
                  {editingWaypointId && (
                    <Button type="button" variant="outline" onClick={cancelWaypointEdit}>
                      Cancel edit
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Set Position From Floor Image</Label>
                <p className="text-xs text-muted-foreground">Click on the map to auto-fill X and Y for this waypoint.</p>
                <div className="relative inline-block border rounded-md overflow-hidden bg-muted/20">
                  <img
                    ref={waypointMapImgRef}
                    src={waypointMapUrl}
                    alt={`Floor ${waypointFloor} map preview`}
                    className="max-h-[420px] w-auto max-w-full cursor-crosshair select-none"
                    onLoad={handleWaypointMapLoad}
                    onClick={handleWaypointMapClick}
                    draggable={false}
                  />
                  {waypointMarkerPercent && (
                    <span
                      className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-red-500"
                      style={{ left: `${waypointMarkerPercent.x * 100}%`, top: `${waypointMarkerPercent.y * 100}%` }}
                    />
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card ref={edgeSectionRef}>
          <CardHeader>
            <CardTitle>{editingEdgeId ? 'Edit Graph Edge' : 'Add Graph Edge'}</CardTitle>
            <CardDescription>
              {editingEdgeId
                ? 'Update the selected edge using dropdown and map selection.'
                : 'Build edges visually: Current -> Next, and optionally Previous -> Current.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitGraphEdge}>
              <div className="space-y-2">
                <Label htmlFor="edge-current">Current Node</Label>
                <select
                  id="edge-current"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedCurrentNode ?? ''}
                  onChange={(e) => applyNodeSelection('current', e.target.value || null)}
                  required
                >
                  <option value="">Select current node</option>
                  {selectedCurrentNode && !edgeSelectableWaypoints.some((wp) => wp.id === selectedCurrentNode) && waypointById.get(selectedCurrentNode) && (
                    <option value={selectedCurrentNode}>
                      {waypointById.get(selectedCurrentNode)?.name} (ID: {selectedCurrentNode}) - {waypointById.get(selectedCurrentNode)?.floor} [selected]
                    </option>
                  )}
                  {edgeSelectableWaypoints.map((wp) => (
                    <option key={wp.id} value={wp.id}>
                      {wp.name} (ID: {wp.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edge-next">Next Node</Label>
                <select
                  id="edge-next"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedNextNode ?? ''}
                  onChange={(e) => applyNodeSelection('next', e.target.value || null)}
                  required
                >
                  <option value="">Select next node</option>
                  {selectedNextNode && !edgeSelectableWaypoints.some((wp) => wp.id === selectedNextNode) && waypointById.get(selectedNextNode) && (
                    <option value={selectedNextNode}>
                      {waypointById.get(selectedNextNode)?.name} (ID: {selectedNextNode}) - {waypointById.get(selectedNextNode)?.floor} [selected]
                    </option>
                  )}
                  {edgeSelectableWaypoints.map((wp) => (
                    <option key={wp.id} value={wp.id}>
                      {wp.name} (ID: {wp.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edge-previous">Previous Node (optional)</Label>
                <select
                  id="edge-previous"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedPreviousNode ?? ''}
                  onChange={(e) => applyNodeSelection('previous', e.target.value || null)}
                >
                  <option value="">None</option>
                  {selectedPreviousNode && !edgeSelectableWaypoints.some((wp) => wp.id === selectedPreviousNode) && waypointById.get(selectedPreviousNode) && (
                    <option value={selectedPreviousNode}>
                      {waypointById.get(selectedPreviousNode)?.name} (ID: {selectedPreviousNode}) - {waypointById.get(selectedPreviousNode)?.floor} [selected]
                    </option>
                  )}
                  {edgeSelectableWaypoints.map((wp) => (
                    <option key={wp.id} value={wp.id}>
                      {wp.name} (ID: {wp.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edge-distance">Distance (optional)</Label>
                <Input
                  id="edge-distance"
                  value={edgeDistance}
                  onChange={(e) => setEdgeDistance(e.target.value)}
                  placeholder="Leave empty for auto-calc"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edge-floor">Floor</Label>
                <select
                  id="edge-floor"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={edgeFloor}
                  onChange={(e) => setEdgeFloor(e.target.value as FloorType)}
                >
                  {FLOOR_OPTIONS.map((floor) => (
                    <option key={floor} value={floor}>{floor}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edge-map-floor">Map Floor</Label>
                <select
                  id="edge-map-floor"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={edgeMapFloor}
                  onChange={(e) => setEdgeMapFloor(e.target.value as FloorType)}
                >
                  {FLOOR_OPTIONS.map((floor) => (
                    <option key={floor} value={floor}>{floor}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={selectionMode === 'current' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectionMode('current')}
                >
                  Select Current
                </Button>
                <Button
                  type="button"
                  variant={selectionMode === 'next' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectionMode('next')}
                >
                  Select Next
                </Button>
                <Button
                  type="button"
                  variant={selectionMode === 'previous' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectionMode('previous')}
                >
                  Select Previous
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={cancelEdgeEdit}>
                  Clear Selection
                </Button>
              </div>
              <div className="md:col-span-2 rounded-md border border-input bg-muted/20 p-3 text-xs space-y-1">
                <p><span className="font-medium text-blue-700">Current</span>: {getWaypointLabel(selectedCurrentNode)}</p>
                <p><span className="font-medium text-green-700">Next</span>: {getWaypointLabel(selectedNextNode)}</p>
                <p><span className="font-medium text-orange-700">Previous</span>: {getWaypointLabel(selectedPreviousNode)}</p>
                <p className="text-muted-foreground">Active map-click role: {selectionMode}</p>
              </div>
              <div className="md:col-span-2 rounded-md border border-input p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    id="edge-filter-map-floor"
                    type="checkbox"
                    checked={filterEdgeNodesByMapFloor}
                    onChange={(e) => setFilterEdgeNodesByMapFloor(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edge-filter-map-floor">Filter node dropdowns by map floor</Label>
                </div>
                <p className="text-xs text-muted-foreground">Click a marker to assign it to the active role (Current/Next/Previous).</p>
                <p className="text-xs text-muted-foreground">Selected nodes are preserved when you change Map Floor, so you can connect Ground floor to upper floors.</p>
                <div className="relative inline-block border rounded-md overflow-hidden bg-muted/20">
                  <img
                    ref={edgeMapImgRef}
                    src={edgeMapUrl}
                    alt={`Graph edge map floor ${edgeMapFloor}`}
                    className="max-h-[420px] w-auto max-w-full select-none"
                    onLoad={handleEdgeMapLoad}
                    draggable={false}
                  />
                  {edgeMapNaturalSize && (
                    <>
                      <svg className="pointer-events-none absolute inset-0 h-full w-full">
                        {selectedCurrentNode && selectedNextNode && (() => {
                          const c = waypointById.get(selectedCurrentNode);
                          const n = waypointById.get(selectedNextNode);
                          if (!c || !n || c.floor !== edgeMapFloor || n.floor !== edgeMapFloor) return null;
                          return (
                            <line
                              x1={`${(c.x / edgeMapNaturalSize.w) * 100}%`}
                              y1={`${(c.y / edgeMapNaturalSize.h) * 100}%`}
                              x2={`${(n.x / edgeMapNaturalSize.w) * 100}%`}
                              y2={`${(n.y / edgeMapNaturalSize.h) * 100}%`}
                              stroke="#16a34a"
                              strokeWidth="2"
                              strokeDasharray="6 4"
                            />
                          );
                        })()}
                        {selectedPreviousNode && selectedCurrentNode && (() => {
                          const p = waypointById.get(selectedPreviousNode);
                          const c = waypointById.get(selectedCurrentNode);
                          if (!p || !c || p.floor !== edgeMapFloor || c.floor !== edgeMapFloor) return null;
                          return (
                            <line
                              x1={`${(p.x / edgeMapNaturalSize.w) * 100}%`}
                              y1={`${(p.y / edgeMapNaturalSize.h) * 100}%`}
                              x2={`${(c.x / edgeMapNaturalSize.w) * 100}%`}
                              y2={`${(c.y / edgeMapNaturalSize.h) * 100}%`}
                              stroke="#ea580c"
                              strokeWidth="2"
                              strokeDasharray="6 4"
                            />
                          );
                        })()}
                      </svg>
                      {edgeMapWaypoints.map((wp) => {
                        const isCurrent = selectedCurrentNode === wp.id;
                        const isNext = selectedNextNode === wp.id;
                        const isPrevious = selectedPreviousNode === wp.id;
                        const background = isCurrent
                          ? '#2563eb'
                          : isNext
                            ? '#16a34a'
                            : isPrevious
                              ? '#ea580c'
                              : '#64748b';

                        return (
                          <button
                            key={`edge-map-${wp.id}`}
                            type="button"
                            title={`${wp.name} (ID: ${wp.id})`}
                            onClick={() => handleEdgeMapMarkerClick(wp.id)}
                            className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow"
                            style={{
                              left: `${(wp.x / edgeMapNaturalSize.w) * 100}%`,
                              top: `${(wp.y / edgeMapNaturalSize.h) * 100}%`,
                              backgroundColor: background,
                            }}
                          />
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="edge-vertical"
                  type="checkbox"
                  checked={edgeVertical}
                  onChange={(e) => setEdgeVertical(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="edge-vertical">Is vertical transition</Label>
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="edge-bidirectional"
                  type="checkbox"
                  checked={edgeBidirectional}
                  onChange={(e) => setEdgeBidirectional(e.target.checked)}
                  className="h-4 w-4"
                  disabled={!!editingEdgeId}
                />
                <Label htmlFor="edge-bidirectional">Create bidirectional edges</Label>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={edgeLoading}>
                    {edgeLoading ? 'Saving...' : editingEdgeId ? 'Update graph edge' : 'Add graph edge'}
                  </Button>
                  {editingEdgeId && (
                    <Button type="button" variant="outline" onClick={cancelEdgeEdit}>
                      Cancel edit
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Floor Map Image</CardTitle>
            <CardDescription>Upload image to storage and save it into floor_maps.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitFloorMap}>
              <div className="space-y-2">
                <Label htmlFor="map-floor">Floor</Label>
                <select
                  id="map-floor"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={mapFloor}
                  onChange={(e) => setMapFloor(e.target.value as FloorType)}
                >
                  {FLOOR_OPTIONS.map((floor) => (
                    <option key={floor} value={floor}>{floor}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="map-file">Image file</Label>
                <Input
                  id="map-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setMapFile(e.target.files?.[0] ?? null)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={mapLoading}>{mapLoading ? 'Uploading...' : 'Upload floor map'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Waypoints</CardTitle>
            <CardDescription>Edit or delete waypoint rows.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <Button variant="outline" onClick={() => void loadManageData()} disabled={manageLoading}>
                {manageLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Room ID</th>
                    <th className="text-left p-2">Floor</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Block</th>
                    <th className="text-left p-2">X</th>
                    <th className="text-left p-2">Y</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {waypointRows.map((wp) => (
                    <tr key={wp.id} className="border-t">
                      <td className="p-2">{wp.name}</td>
                      <td className="p-2">{wp.room_id ?? '-'}</td>
                      <td className="p-2">{wp.floor}</td>
                      <td className="p-2">{wp.type}</td>
                      <td className="p-2">{wp.block}</td>
                      <td className="p-2">{wp.x}</td>
                      <td className="p-2">{wp.y}</td>
                      <td className="p-2 space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => handleEditWaypoint(wp)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => void handleDeleteWaypoint(wp.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Graph Edges</CardTitle>
            <CardDescription>Edit or delete graph edge rows.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">From</th>
                    <th className="text-left p-2">To</th>
                    <th className="text-left p-2">Distance</th>
                    <th className="text-left p-2">Floor</th>
                    <th className="text-left p-2">Vertical</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {edgeRows.map((edge) => (
                    <tr key={edge.id} className="border-t">
                      <td className="p-2">{edge.from_node}</td>
                      <td className="p-2">{edge.to_node}</td>
                      <td className="p-2">{edge.distance}</td>
                      <td className="p-2">{edge.floor ?? 'None'}</td>
                      <td className="p-2">{edge.is_vertical ? 'Yes' : 'No'}</td>
                      <td className="p-2 space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => void handleEditEdge(edge)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => void handleDeleteEdge(edge.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
