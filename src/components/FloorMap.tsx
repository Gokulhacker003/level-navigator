import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Room, Waypoint, FloorType, NavigationResult, MapNode } from '@/lib/types';
import { navigationEngine } from '@/lib/navigation-engine';

interface FloorMapProps {
  floor: FloorType;
  floorMapUrl: string | null;
  rooms: Room[];
  waypoints: Waypoint[];
  navigationResult: NavigationResult | null;
  selectedSource: string | null;
  selectedDest: string | null;
  onRoomClick: (roomNumber: string, floor: FloorType) => void;
  onRoomDoubleClick: (roomNumber: string, floor: FloorType) => void;
  hoveredRoom: string | null;
  onHoverRoom: (roomNumber: string | null) => void;
}

export const FloorMap: React.FC<FloorMapProps> = ({
  floor,
  floorMapUrl,
  rooms,
  waypoints,
  navigationResult,
  selectedSource,
  selectedDest,
  onRoomClick,
  onRoomDoubleClick,
  hoveredRoom,
  onHoverRoom,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapSize, setMapSize] = useState({ w: 800, h: 500 });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 500 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const floorRooms = rooms.filter(r => r.floor === floor);
  const floorWaypoints = waypoints.filter(w => w.floor === floor);

  useEffect(() => {
    if (!floorMapUrl) {
      setMapSize({ w: 800, h: 500 });
      setViewBox({ x: 0, y: 0, w: 800, h: 500 });
      return;
    }

    const img = new Image();
    img.onload = () => {
      const nextSize = { w: Math.max(300, img.naturalWidth), h: Math.max(200, img.naturalHeight) };
      setMapSize(nextSize);
      setViewBox({ x: 0, y: 0, w: nextSize.w, h: nextSize.h });
    };
    img.onerror = () => {
      setMapSize({ w: 800, h: 500 });
      setViewBox({ x: 0, y: 0, w: 800, h: 500 });
    };
    img.src = floorMapUrl;
  }, [floor, floorMapUrl]);

  // Get path segments for this floor
  const pathSegments: { x1: number; y1: number; x2: number; y2: number; isFloorChange: boolean }[] = [];
  if (navigationResult) {
    for (let i = 0; i < navigationResult.path.length - 1; i++) {
      const fromNode = navigationEngine.getNode(navigationResult.path[i]);
      const toNode = navigationEngine.getNode(navigationResult.path[i + 1]);
      if (!fromNode || !toNode) continue;
      if (fromNode.floor === floor || toNode.floor === floor) {
        if (fromNode.floor === floor && toNode.floor === floor) {
          pathSegments.push({ x1: fromNode.x, y1: fromNode.y, x2: toNode.x, y2: toNode.y, isFloorChange: false });
        } else {
          // Show segment leading to/from vertical connector on this floor
          const onFloor = fromNode.floor === floor ? fromNode : toNode;
          pathSegments.push({ x1: onFloor.x, y1: onFloor.y, x2: onFloor.x, y2: onFloor.y, isFloorChange: true });
        }
      }
    }
  }

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(v => ({
      x: v.x,
      y: v.y,
      w: Math.max(200, Math.min(1600, v.w * scale)),
      h: Math.max(125, Math.min(1000, v.h * scale)),
    }));
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleNativeWheel = (event: WheelEvent) => {
      event.preventDefault();
      handleWheel(event as unknown as React.WheelEvent);
    };

    svg.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleNativeWheel);
  }, [handleWheel]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = (e.clientX - panStart.x) * (viewBox.w / rect.width);
    const dy = (e.clientY - panStart.y) * (viewBox.h / rect.height);
    setViewBox(v => ({ ...v, x: v.x - dx, y: v.y - dy }));
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart, viewBox]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const getRoomNodeId = (roomNumber: string) => `Room_${roomNumber}_${floor}`;

  const isSourceRoom = (roomNumber: string) => selectedSource === getRoomNodeId(roomNumber);
  const isDestRoom = (roomNumber: string) => selectedDest === getRoomNodeId(roomNumber);

  const getWaypointIcon = (type: string) => {
    switch (type) {
      case 'stairs': return '🪜';
      case 'lift': return '🛗';
      case 'entrance': return '🚪';
      default: return '·';
    }
  };

  // Calculate path total length for animation
  const pathD = pathSegments
    .filter(s => !s.isFloorChange)
    .map((s, i) => (i === 0 ? `M ${s.x1} ${s.y1} L ${s.x2} ${s.y2}` : `L ${s.x2} ${s.y2}`))
    .join(' ');

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-card rounded-lg cursor-grab active:cursor-grabbing"
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid pattern */}
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" className="stroke-border" strokeWidth="0.5" opacity="0.3" />
        </pattern>
      </defs>

      {floorMapUrl ? (
        <image
          href={floorMapUrl}
          x={0}
          y={0}
          width={mapSize.w}
          height={mapSize.h}
          preserveAspectRatio="none"
        />
      ) : (
        <>
          <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="url(#grid)" />

          {/* Building outline */}
          <rect x="30" y="150" width="730" height="330" rx="8" fill="none" className="stroke-border" strokeWidth="2" strokeDasharray="8 4" />
        </>
      )}

      {/* Corridor lines */}
      {floorWaypoints.filter(w => w.type === 'corridor').length > 1 && (
        <line
          x1={floorWaypoints.filter(w => w.type === 'corridor' || w.type === 'entrance')[0]?.x ?? 0}
          y1={310}
          x2={floorWaypoints.filter(w => w.type === 'corridor').slice(-1)[0]?.x ?? 0}
          y2={310}
          className="stroke-nav-corridor"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.5"
        />
      )}

      {/* Rooms */}
      {floorRooms.map(room => {
        const isSource = isSourceRoom(room.room_number);
        const isDest = isDestRoom(room.room_number);
        const isHovered = hoveredRoom === room.room_number;

        return (
          <g
            key={room.room_number}
            onClick={() => onRoomClick(room.room_number, floor)}
            onDoubleClick={() => onRoomDoubleClick(room.room_number, floor)}
            onMouseEnter={() => onHoverRoom(room.room_number)}
            onMouseLeave={() => onHoverRoom(null)}
            className="cursor-pointer"
          >
            <rect
              x={room.x}
              y={room.y}
              width={room.width}
              height={room.height}
              rx="4"
              className={
                isSource ? 'fill-primary stroke-primary' :
                isDest ? 'fill-nav-selected stroke-nav-selected' :
                isHovered ? 'fill-accent/20 stroke-accent' :
                'fill-nav-room stroke-nav-room-stroke'
              }
              strokeWidth={isSource || isDest || isHovered ? 2.5 : 1.5}
              opacity={isSource || isDest ? 0.3 : 1}
            />
            <text
              x={room.x + room.width / 2}
              y={room.y + room.height / 2 - 6}
              textAnchor="middle"
              className="fill-foreground text-[9px] font-semibold select-none"
            >
              {room.room_name}
            </text>
            <text
              x={room.x + room.width / 2}
              y={room.y + room.height / 2 + 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[7px] select-none"
            >
              {room.room_number}
            </text>
            {isSource && (
              <circle cx={room.x + room.width / 2} cy={room.y - 10} r="5" className="fill-primary animate-pulse-node" />
            )}
            {isDest && (
              <circle cx={room.x + room.width / 2} cy={room.y - 10} r="5" className="fill-nav-selected animate-pulse-node" />
            )}
          </g>
        );
      })}

      {/* Waypoints (stairs, lifts, entrances) */}
      {floorWaypoints.filter(w => w.type !== 'corridor').map(wp => {
        const isOnPath = navigationResult?.path.includes(wp.name);
        return (
          <g key={wp.name}>
            <circle
              cx={wp.x}
              cy={wp.y}
              r={isOnPath ? 12 : 8}
              className={
                wp.type === 'stairs' ? 'fill-nav-stairs' :
                wp.type === 'lift' ? 'fill-nav-lift' :
                'fill-primary'
              }
              opacity={isOnPath ? 1 : 0.6}
              strokeWidth={isOnPath ? 2 : 0}
              stroke="white"
            />
            <text x={wp.x} y={wp.y + 4} textAnchor="middle" className="text-[10px] select-none">
              {getWaypointIcon(wp.type)}
            </text>
            <text
              x={wp.x}
              y={wp.y + 22}
              textAnchor="middle"
              className="fill-muted-foreground text-[7px] select-none"
            >
              {wp.type === 'stairs' ? 'Stairs' : wp.type === 'lift' ? 'Lift' : 'Entry'}
            </text>
          </g>
        );
      })}

      {/* Navigation path */}
      {pathD && (
        <path
          d={pathD}
          fill="none"
          className="stroke-nav-path"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 4"
          style={{
            strokeDashoffset: 0,
            animation: 'draw-path 2s ease-in-out',
          }}
        />
      )}

      {/* Floor change indicators */}
      {pathSegments.filter(s => s.isFloorChange).map((s, i) => (
        <g key={`fc-${i}`}>
          <circle cx={s.x1} cy={s.y1} r="15" className="fill-nav-stairs" opacity="0.3" />
          <circle cx={s.x1} cy={s.y1} r="8" className="fill-nav-stairs animate-pulse-node" />
        </g>
      ))}

      {/* Tooltip */}
      {hoveredRoom && (() => {
        const room = floorRooms.find(r => r.room_number === hoveredRoom);
        if (!room) return null;
        return (
          <g>
            <rect
              x={room.x + room.width + 5}
              y={room.y - 10}
              width="120"
              height="40"
              rx="6"
              className="fill-popover stroke-border"
              strokeWidth="1"
            />
            <text x={room.x + room.width + 15} y={room.y + 5} className="fill-foreground text-[9px] font-semibold">
              {room.room_name}
            </text>
            <text x={room.x + room.width + 15} y={room.y + 18} className="fill-muted-foreground text-[8px]">
              {room.room_number} · Click to navigate
            </text>
          </g>
        );
      })()}
    </svg>
  );
};
