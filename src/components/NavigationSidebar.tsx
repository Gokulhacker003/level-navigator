import React, { useState, useMemo } from 'react';
import { Room, NavigationResult, NavigationStep, FLOOR_LABELS } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Navigation, ArrowRight, Footprints, Building2, RotateCcw } from 'lucide-react';
import { getRoomNodeId } from '@/lib/seed-data';
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return rooms.filter(
      r => r.room_name.toLowerCase().includes(q) || r.room_number.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [rooms, searchQuery]);

  const getNodeLabel = (nodeId: string | null): string => {
    if (!nodeId) return 'Select on map';
    const room = rooms.find(r => getRoomNodeId(r.room_number, r.floor) === nodeId);
    return room ? `${room.room_name} (${room.room_number})` : nodeId;
  };

  const roomOptions = useMemo(() => {
    return [...rooms].sort((a, b) => a.room_name.localeCompare(b.room_name));
  }, [rooms]);

  const NONE = '__none__';

  return (
    <div className="w-80 bg-sidebar text-sidebar-foreground flex flex-col h-full overflow-hidden border-r border-sidebar-border">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-5 w-5 text-sidebar-primary" />
          <h1 className="text-lg font-bold text-sidebar-primary-foreground">Indoor Nav</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search room name or number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-sidebar-accent text-sidebar-foreground border-sidebar-border text-sm h-9"
          />
        </div>

        {/* Search results */}
        {filteredRooms.length > 0 && (
          <div className="mt-2 bg-sidebar-accent rounded-md max-h-48 overflow-y-auto">
            {filteredRooms.map(room => (
              <button
                key={room.room_number}
                className="w-full text-left px-3 py-2 text-sm hover:bg-sidebar-primary/10 flex items-center justify-between"
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
                  <span className="text-xs text-muted-foreground ml-2">{room.room_number}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{FLOOR_LABELS[room.floor]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Source / Destination */}
      <div className="p-4 space-y-3 border-b border-sidebar-border">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Source</label>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <Select
              value={selectedSource ?? NONE}
              onValueChange={(value) => onSelectSource(value === NONE ? null : value)}
            >
              <SelectTrigger className="h-9 bg-sidebar-accent border-sidebar-border text-sm">
                <SelectValue placeholder="Select source room" />
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
              <SelectTrigger className="h-9 bg-sidebar-accent border-sidebar-border text-sm">
                <SelectValue placeholder="Select destination room" />
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

        <Button
          onClick={onNavigate}
          disabled={!selectedSource || !selectedDest}
          className="w-full gap-2"
          size="sm"
        >
          <Footprints className="h-4 w-4" />
          Find Route
        </Button>

        <Button onClick={onClearRoute} variant="outline" className="w-full gap-2" size="sm">
          <RotateCcw className="h-4 w-4" />
          Clear Route
        </Button>
      </div>

      {/* Directions */}
      {navigationResult && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Directions</h3>
            <span className="text-[10px] text-muted-foreground">
              {navigationResult.floorsVisited.length > 1
                ? `${navigationResult.floorsVisited.length} floors`
                : '1 floor'}
            </span>
          </div>

          <div className="space-y-1">
            {navigationResult.steps.map((step, i) => (
              <button
                key={i}
                onClick={() => onStepClick(step, i)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  i === currentStepIndex
                    ? 'bg-sidebar-primary/20 text-sidebar-primary-foreground'
                    : 'hover:bg-sidebar-accent'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    step.isFloorChange ? 'bg-nav-stairs text-white' : 'bg-sidebar-accent text-sidebar-foreground'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs">{step.instruction}</p>
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
  );
};
