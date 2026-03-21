import React, { useState, useEffect, useMemo } from 'react';
import { Room, FloorType, NavigationResult } from '@/lib/types';
import { navigationEngine } from '@/lib/navigation-engine';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { MapPin } from 'lucide-react';

interface FloorMapProps {
  floor: FloorType;
  floorMapUrl: string | null;
  rooms: Room[];
  navigationResult: NavigationResult | null;
  selectedSource: string | null;
  selectedDest: string | null;
  userPosition?: { x: number; y: number; floor: FloorType } | null;
}

export const FloorMap: React.FC<FloorMapProps> = ({
  floor,
  floorMapUrl,
  rooms,
  navigationResult,
  selectedSource,
  selectedDest,
  userPosition,
}) => {
  const [mapSize, setMapSize] = useState({ w: 800, h: 500 });

  const floorRooms = useMemo(() => rooms.filter((r) => r.floor === floor), [rooms, floor]);

  useEffect(() => {
    if (!floorMapUrl) {
      setMapSize({ w: 800, h: 500 });
      return;
    }

    const img = new Image();
    img.onload = () => {
      const nextSize = { w: Math.max(300, img.naturalWidth), h: Math.max(200, img.naturalHeight) };
      setMapSize(nextSize);
    };
    img.onerror = () => {
      setMapSize({ w: 800, h: 500 });
    };
    img.src = floorMapUrl;
  }, [floorMapUrl]);

  const sourceNode = selectedSource ? navigationEngine.getNode(selectedSource) : null;
  const destNode = selectedDest ? navigationEngine.getNode(selectedDest) : null;
  const hasRoute = Boolean(navigationResult && selectedSource && selectedDest);

  const routeNodesOnFloor = useMemo(() => {
    if (!navigationResult) return [];
    return navigationResult.path
      .map((nodeId) => {
        const node = navigationEngine.getNode(nodeId);
        if (!node || node.floor !== floor) return null;
        return { id: nodeId, x: node.x, y: node.y, type: node.type };
      })
      .filter((node): node is { id: string; x: number; y: number; type: string } => node !== null);
  }, [navigationResult, floor]);

  const pathPoints = routeNodesOnFloor.map((node) => `${node.x},${node.y}`).join(' ');

  const midRouteDots = routeNodesOnFloor.filter((node) => (
    node.id !== selectedSource
    && node.id !== selectedDest
    && node.type !== 'corridor'
    && node.type !== 'block'
  ));

  const activeFloorChangeMessage = useMemo(() => {
    if (!navigationResult) return null;
    const floorChangeStep = navigationResult.steps.find((step) => {
      if (!step.isFloorChange) return false;
      const fromNode = navigationEngine.getNode(step.fromNode);
      return fromNode?.floor === floor;
    });
    return floorChangeStep?.instruction ?? null;
  }, [navigationResult, floor]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-card">
      <TransformWrapper
        key={`${floor}-${hasRoute ? 'routed' : 'idle'}`}
        initialScale={hasRoute ? 1.8 : 1.4}
        minScale={0.4}
        maxScale={4}
        centerOnInit
        wheel={{ step: 0.12 }}
        pinch={{ disabled: true }}
        doubleClick={{ disabled: true }}
        panning={{ velocityDisabled: true }}
      >
        <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full !flex !items-center !justify-center">
          <div className="relative select-none" style={{ width: `${mapSize.w}px`, height: `${mapSize.h}px` }}>
            {floorMapUrl ? (
              <img
                src={floorMapUrl}
                alt={`${floor} floor map`}
                draggable={false}
                className="absolute inset-0 h-full w-full object-fill pointer-events-none"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,.2)_1px,transparent_1px),linear-gradient(0deg,rgba(148,163,184,.2)_1px,transparent_1px)] bg-[size:40px_40px]" />
            )}

            <svg
              className="absolute inset-0 h-full w-full pointer-events-none"
              viewBox={`0 0 ${mapSize.w} ${mapSize.h}`}
              preserveAspectRatio="none"
            >
              {hasRoute && routeNodesOnFloor.length > 1 && (
                <>
                  <polyline
                    points={pathPoints}
                    stroke="rgba(255,255,255,0.95)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <polyline
                    points={pathPoints}
                    className="stroke-nav-path"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    strokeDasharray="9 6"
                    style={{ animation: 'draw-path 0.9s ease-out' }}
                  />
                </>
              )}

              {hasRoute && midRouteDots.map((node) => (
                <circle
                  key={`mid-dot-${node.id}`}
                  cx={node.x}
                  cy={node.y}
                  r="3"
                  className="fill-nav-path"
                  opacity="0.85"
                />
              ))}
            </svg>

            <div className="absolute inset-0">
              {hasRoute && sourceNode && sourceNode.floor === floor && (
                <div
                  className="absolute"
                  style={{ left: sourceNode.x, top: sourceNode.y, transform: 'translate(-50%, -100%)' }}
                >
                  <MapPin className="h-8 w-8 text-emerald-500 drop-shadow" fill="#10b981" stroke="#ffffff" strokeWidth={1.8} />
                </div>
              )}

              {hasRoute && destNode && destNode.floor === floor && (
                <div
                  className="absolute"
                  style={{ left: destNode.x, top: destNode.y, transform: 'translate(-50%, -100%)' }}
                >
                  <MapPin className="h-8 w-8 text-red-500 drop-shadow" fill="#ef4444" stroke="#ffffff" strokeWidth={1.8} />
                </div>
              )}

              {userPosition && userPosition.floor === floor && (
                <div
                  className="absolute"
                  style={{ left: userPosition.x, top: userPosition.y, transform: 'translate(-50%, -50%)' }}
                >
                  <div className="h-4 w-4 rounded-full bg-blue-500 ring-4 ring-blue-300/70 shadow-md animate-pulse" />
                </div>
              )}
            </div>

            {hasRoute && activeFloorChangeMessage && (
              <div className="absolute left-3 top-3 rounded-md border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs text-amber-900 shadow-sm">
                {activeFloorChangeMessage}
              </div>
            )}

            {!hasRoute && floorRooms.length > 0 && (
              <div className="absolute left-3 top-3 rounded-md border border-border bg-card/95 px-3 py-2 text-xs text-muted-foreground shadow-sm">
                Select source and destination, then tap Find Route.
              </div>
            )}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};
