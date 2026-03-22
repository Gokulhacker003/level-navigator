import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Room, NavigationResult, NavigationStep, FLOOR_LABELS } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Navigation, ArrowRight, Footprints, Building2, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRoomNodeId } from '@/lib/seed-data';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NavigationSidebarProps {
  rooms: Room[];
  selectedSource: string | null;
  selectedDest: string | null;
  onSelectSource: (nodeId: string | null) => void;
  onSelectDest: (nodeId: string | null) => void;
  onNavigate: () => void;
  onClearRoute: () => void;
  navigationResult: NavigationResult | null;
  onStepClick: (step: NavigationStep, index: number) => void;
  currentStepIndex: number;
  onPrevStep: () => void;
  onNextStep: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  rooms,
  selectedSource,
  selectedDest,
  onSelectSource,
  onSelectDest,
  onNavigate,
  onClearRoute,
  navigationResult,
  onStepClick,
  currentStepIndex,
  onPrevStep,
  onNextStep,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();
  const [viewportHeight, setViewportHeight] = useState(800);
  const [sheetOffset, setSheetOffset] = useState(180);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartOffset = useRef(0);

  const normalizeRoomSearch = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

  useEffect(() => {
    const updateHeight = () => setViewportHeight(window.innerHeight);
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const sheetHeight = useMemo(() => {
    const candidate = Math.round(viewportHeight * 0.76);
    return Math.max(420, Math.min(candidate, viewportHeight - 56));
  }, [viewportHeight]);

  const snapOffsets = useMemo(() => {
    const collapsedVisible = 150;
    const midVisible = 340;
    return {
      expanded: 0,
      mid: Math.max(0, sheetHeight - Math.min(midVisible, sheetHeight - 40)),
      collapsed: Math.max(0, sheetHeight - collapsedVisible),
    };
  }, [sheetHeight]);

  useEffect(() => {
    if (!isMobile) return;
    setSheetOffset(snapOffsets.mid);
  }, [isMobile, snapOffsets.mid]);

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = normalizeRoomSearch(searchQuery);
    return rooms.filter(
      r => normalizeRoomSearch(r.room_name).includes(q) || normalizeRoomSearch(r.room_number).includes(q)
    ).slice(0, 8);
  }, [rooms, searchQuery]);

  const roomOptions = useMemo(() => {
    return [...rooms].sort((a, b) => a.room_name.localeCompare(b.room_name));
  }, [rooms]);

  const NONE = '__none__';

  const maxOffset = snapOffsets.collapsed;

  const onHandlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    setIsDragging(true);
    dragStartY.current = event.clientY;
    dragStartOffset.current = sheetOffset;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile || !isDragging) return;
    const delta = event.clientY - dragStartY.current;
    const nextOffset = Math.max(0, Math.min(maxOffset, dragStartOffset.current + delta));
    setSheetOffset(nextOffset);
  };

  const onHandlePointerUp = () => {
    if (!isMobile || !isDragging) return;
    const offsets = [snapOffsets.expanded, snapOffsets.mid, snapOffsets.collapsed];
    const nearest = offsets.reduce((best, candidate) => {
      return Math.abs(candidate - sheetOffset) < Math.abs(best - sheetOffset) ? candidate : best;
    }, snapOffsets.mid);
    setSheetOffset(nearest);
    setIsDragging(false);
  };

  const panelContainerClass = isMobile
    ? 'fixed inset-x-0 bottom-0 z-40 px-2 pb-2'
    : 'w-80 h-full border-r border-sidebar-border';

  const panelClass = isMobile
    ? 'flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-slate-50/95 text-slate-800 shadow-[0_-10px_30px_rgba(15,23,42,0.18)] backdrop-blur-lg'
    : 'flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground';

  return (
    <div className={panelContainerClass}>
      <div
        className={`${panelClass} ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
        style={isMobile ? { height: `${sheetHeight}px`, transform: `translateY(${sheetOffset}px)` } : undefined}
      >
        {isMobile && (
          <div
            className="touch-none px-4 pb-2 pt-2"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
          >
            <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-300" />
          </div>
        )}

        {/* Header */}
        <div className={`border-b ${isMobile ? 'border-slate-200 px-3 pb-3' : 'border-sidebar-border p-4'}`}>
          <div className="mb-2 flex items-center gap-2">
            <Building2 className={`h-5 w-5 ${isMobile ? 'text-sky-600' : 'text-sidebar-primary'}`} />
            <h1 className={`font-bold ${isMobile ? 'text-base text-slate-900' : 'text-lg text-sidebar-primary-foreground'}`}>Indoor Navigation</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search room or number"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`h-10 rounded-2xl pl-9 text-sm ${isMobile ? 'border-slate-200 bg-white text-slate-900' : 'border-sidebar-border bg-sidebar-accent text-sidebar-foreground'}`}
            />
          </div>

          {/* Search results */}
          {filteredRooms.length > 0 && (
            <div className={`mt-2 max-h-40 overflow-y-auto rounded-xl ${isMobile ? 'border border-slate-200 bg-white' : 'bg-sidebar-accent'}`}>
              {filteredRooms.map(room => (
                <button
                  key={room.room_number}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${isMobile ? 'hover:bg-sky-50' : 'hover:bg-sidebar-primary/10'}`}
                  onClick={() => {
                    const nodeId = getRoomNodeId(room.room_number, room.floor);
                    if (!selectedSource) {
                      onSelectSource(nodeId);
                    } else {
                      onSelectDest(nodeId);
                    }
                    setSearchQuery('');
                  }}
                >
                  <div>
                    <span className="font-medium">{room.room_name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{room.room_number}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{FLOOR_LABELS[room.floor]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Source / Destination */}
        <div className={`border-b ${isMobile ? 'border-slate-200 p-3' : 'border-sidebar-border p-4'} space-y-3`}>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Source</label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <Select
                  value={selectedSource ?? NONE}
                  onValueChange={(value) => onSelectSource(value === NONE ? null : value)}
                >
                  <SelectTrigger className={`h-10 rounded-xl text-sm ${isMobile ? 'border-slate-200 bg-white' : 'bg-sidebar-accent border-sidebar-border'}`}>
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {roomOptions.map((room) => {
                      const nodeId = getRoomNodeId(room.room_number, room.floor);
                      return (
                        <SelectItem key={nodeId} value={nodeId}>
                          {room.room_name} ({room.room_number}) - {FLOOR_LABELS[room.floor]}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Destination</label>
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-nav-selected shrink-0" />
                <Select
                  value={selectedDest ?? NONE}
                  onValueChange={(value) => onSelectDest(value === NONE ? null : value)}
                >
                  <SelectTrigger className={`h-10 rounded-xl text-sm ${isMobile ? 'border-slate-200 bg-white' : 'bg-sidebar-accent border-sidebar-border'}`}>
                    <SelectValue placeholder="Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {roomOptions.map((room) => {
                      const nodeId = getRoomNodeId(room.room_number, room.floor);
                      return (
                        <SelectItem key={nodeId} value={nodeId}>
                          {room.room_name} ({room.room_number}) - {FLOOR_LABELS[room.floor]}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            onClick={onNavigate}
            disabled={!selectedSource || !selectedDest}
            className={`h-11 w-full gap-2 rounded-xl text-sm font-semibold ${isMobile ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md hover:from-sky-500 hover:to-blue-500' : ''}`}
            size="sm"
          >
            <Footprints className="h-4 w-4" />
            Find Route
          </Button>

          <Button onClick={onClearRoute} variant="outline" className={`h-10 w-full gap-2 rounded-xl ${isMobile ? 'border-slate-200 bg-white hover:bg-slate-100' : ''}`} size="sm">
            <RotateCcw className="h-4 w-4" />
            Clear Route
          </Button>
        </div>

        {/* Directions */}
        {navigationResult && (
          <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-3 pb-4 pt-2' : 'p-4'}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Directions</h3>
              <span className="text-[10px] text-muted-foreground">
                {navigationResult.floorsVisited.length > 1
                  ? `${navigationResult.floorsVisited.length} floors`
                  : '1 floor'}
              </span>
            </div>

            <div className="mb-3 flex items-center gap-2">
              <Button
                onClick={onPrevStep}
                variant="outline"
                size="sm"
                className={`h-9 flex-1 rounded-xl ${isMobile ? 'border-slate-200 bg-white' : ''}`}
                disabled={currentStepIndex <= 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <div className="min-w-20 text-center text-[10px] text-muted-foreground">
                {navigationResult.steps.length === 0 ? '0 / 0' : `${currentStepIndex + 1} / ${navigationResult.steps.length}`}
              </div>
              <Button
                onClick={onNextStep}
                variant="outline"
                size="sm"
                className={`h-9 flex-1 rounded-xl ${isMobile ? 'border-slate-200 bg-white' : ''}`}
                disabled={currentStepIndex >= navigationResult.steps.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1.5">
              {navigationResult.steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => onStepClick(step, i)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    i === currentStepIndex
                      ? (isMobile ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-200' : 'bg-sidebar-primary/20 text-sidebar-primary-foreground')
                      : (isMobile ? 'bg-white hover:bg-slate-100' : 'hover:bg-sidebar-accent')
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      step.isFloorChange
                        ? 'bg-nav-stairs text-white'
                        : (isMobile ? 'bg-slate-200 text-slate-700' : 'bg-sidebar-accent text-sidebar-foreground')
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-xs leading-4">{step.instruction}</p>
                      {step.isFloorChange && (
                        <span className="text-[10px] text-nav-stairs font-medium flex items-center gap-1 mt-0.5">
                          <ArrowRight className="h-3 w-3" />
                          Continue on {FLOOR_LABELS[step.floor]}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info when no navigation */}
        {!navigationResult && !searchQuery && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Choose source and destination, then tap Find Route</p>
              <p className="text-[10px] mt-1 opacity-60">The map will show only your route and important points</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
