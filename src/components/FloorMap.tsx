import React, { useState, useEffect, useMemo } from 'react';
import { Room, FloorType, NavigationResult, WaypointType } from '@/lib/types';
import { navigationEngine } from '@/lib/navigation-engine';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { MapPin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  userPosition: _userPosition,
}) => {
  const [mapSize, setMapSize] = useState({ w: 800, h: 500 });
  const isMobile = useIsMobile();

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

  const routeGroupsOnFloor = useMemo(() => {
    if (!navigationResult) return [];
    return navigationEngine.getRouteGroupsOnFloor(navigationResult.path, floor);
  }, [navigationResult, floor]);

  const routeNodesOnFloor = useMemo(() => {
    const nodeById = new Map<string, { id: string; x: number; y: number; type: WaypointType }>();
    routeGroupsOnFloor.forEach((group) => {
      group.forEach((node) => {
        if (!nodeById.has(node.id)) {
          nodeById.set(node.id, { id: node.id, x: node.x, y: node.y, type: node.type });
        }
      });
    });
    return Array.from(nodeById.values());
  }, [routeGroupsOnFloor]);

  const midRouteDots = routeNodesOnFloor.filter((node) => (
    node.id !== selectedSource
    && node.id !== selectedDest
    && node.type !== 'corridor'
    && node.type !== 'block'
  ));

  const floorTransitionMarkers = useMemo(() => {
    if (!navigationResult) {
      return [] as Array<{ id: string; x: number; y: number; kind: 'departure' | 'arrival' }>;
    }

    const markers: Array<{ id: string; x: number; y: number; kind: 'departure' | 'arrival' }> = [];

    navigationResult.steps.forEach((step) => {
      if (!step.isFloorChange) return;

      const fromNode = navigationEngine.getNode(step.fromNode);
      const toNode = navigationEngine.getNode(step.toNode);
      if (!fromNode || !toNode) return;

      if (fromNode.floor === floor) {
        markers.push({
          id: `${step.fromNode}-${step.toNode}-from`,
          x: fromNode.x,
          y: fromNode.y,
          kind: 'departure',
        });
      }

      if (toNode.floor === floor) {
        markers.push({
          id: `${step.fromNode}-${step.toNode}-to`,
          x: toNode.x,
          y: toNode.y,
          kind: 'arrival',
        });
      }
    });

    return markers;
  }, [navigationResult, floor]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-card">
      <TransformWrapper
        key={`${floor}-${hasRoute ? 'routed' : 'idle'}`}
        initialScale={isMobile ? (hasRoute ? 3.0 : 2.6) : (hasRoute ? 1.8 : 1.4)}
        minScale={0.4}
        maxScale={4}
        centerOnInit
        wheel={{ step: 0.12 }}
        pinch={{ disabled: !isMobile }}
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
              {hasRoute && routeGroupsOnFloor.map((group, idx) => {
                const groupPoints = group.map((node) => `${node.x},${node.y}`).join(' ');
                return (
                  <React.Fragment key={`route-group-${idx}`}>
                    <polyline
                      points={groupPoints}
                      stroke="rgba(255,255,255,0.95)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <polyline
                      points={groupPoints}
                      className="stroke-nav-path"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      strokeDasharray="9 6"
                      style={{ animation: 'draw-path 0.9s ease-out' }}
                    />
                  </React.Fragment>
                );
              })}

              {hasRoute && sourceNode && sourceNode.floor === floor && (
                <g transform={`translate(${sourceNode.x}, ${sourceNode.y})`}>
                  <circle r="6" fill="#10b981" stroke="white" strokeWidth="2" />
                </g>
              )}

              {hasRoute && destNode && destNode.floor === floor && (
                <g transform={`translate(${destNode.x}, ${destNode.y})`}>
                  <circle r="6" fill="#ef4444" stroke="white" strokeWidth="2" />
                </g>
              )}

              {hasRoute && destNode && destNode.floor === floor && (
                <g transform={`translate(${destNode.x}, ${destNode.y})`}>
                  <foreignObject x="-16" y="-32" width="32" height="32">
                    <MapPin
                      className="h-8 w-8 text-red-500"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth={1.8}
                    />
                  </foreignObject>
                </g>
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

              {hasRoute && floorTransitionMarkers.map((marker) => (
                <g key={marker.id} transform={`translate(${marker.x}, ${marker.y})`}>
                  <circle
                    r="8"
                    fill={marker.kind === 'arrival' ? '#3b82f6' : '#f59e0b'}
                    stroke="white"
                    strokeWidth="2"
                    opacity="0.95"
                  />
                  <circle
                    r="12"
                    fill="none"
                    stroke={marker.kind === 'arrival' ? '#3b82f6' : '#f59e0b'}
                    strokeWidth="2"
                    opacity="0.45"
                  />
                </g>
              ))}
            </svg>

          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};
