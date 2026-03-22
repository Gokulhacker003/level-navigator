import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FloorMap } from '@/components/FloorMap';
import { FloorSelector } from '@/components/FloorSelector';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import { useNavigationData } from '@/hooks/useNavigationData';
import { navigationEngine } from '@/lib/navigation-engine';
import { FloorType, NavigationResult, NavigationStep, FLOOR_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, Map as MapIcon, Search as SearchIcon, Route as RouteIcon, Shield, MapPin, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDatabaseConnection } from '@/hooks/useDatabaseConnection';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { getRoomNodeId } from '@/lib/seed-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ADMIN_LOGIN_PATH, ADMIN_PANEL_PATH } from '@/lib/auth-routes';

type MobileTab = 'map' | 'search' | 'route' | 'admin';

const Index = () => {
  const { rooms, loading, getFloorMapUrl } = useNavigationData();
  const [currentFloor, setCurrentFloor] = useState<FloorType>('G');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedDest, setSelectedDest] = useState<string | null>(null);
  const [navigationResult, setNavigationResult] = useState<NavigationResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSourceSelectorOpen, setIsSourceSelectorOpen] = useState(true);
  const [isDestSelectorOpen, setIsDestSelectorOpen] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const { status: dbStatus } = useDatabaseConnection();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const NONE = '__none__';

  const roomOptions = useMemo(() => {
    return [...rooms].sort((a, b) => a.room_name.localeCompare(b.room_name));
  }, [rooms]);

  const normalizeRoomSearch = useCallback((value: string) => {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }, []);

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = normalizeRoomSearch(searchQuery);
    return roomOptions.filter(
      (r) => normalizeRoomSearch(r.room_name).includes(q) || normalizeRoomSearch(r.room_number).includes(q)
    ).slice(0, 12);
  }, [searchQuery, roomOptions, normalizeRoomSearch]);

  useEffect(() => {
    if (loading) return;

    const sourceMissing = Boolean(selectedSource && !navigationEngine.getNode(selectedSource));
    const destMissing = Boolean(selectedDest && !navigationEngine.getNode(selectedDest));
    if (!sourceMissing && !destMissing) return;

    if (sourceMissing) {
      setSelectedSource(null);
      setIsSourceSelectorOpen(true);
    }

    if (destMissing) {
      setSelectedDest(null);
      setIsDestSelectorOpen(true);
    }

    setNavigationResult(null);
    setCurrentStepIndex(0);
    toast({
      title: 'Selection updated',
      description: 'Node cannot be found in the current page. Please reselect source or destination.',
      variant: 'destructive',
    });
  }, [selectedSource, selectedDest, loading, toast]);

  const nodeLabelMap = useMemo(() => {
    const pairs = roomOptions.map((room) => {
      const nodeId = getRoomNodeId(room.room_number, room.floor);
      return [nodeId, `${room.room_name} (${room.room_number})`] as const;
    });
    return new Map<string, string>(pairs);
  }, [roomOptions]);

  const getNodeLabel = useCallback((nodeId: string | null) => {
    if (!nodeId) return 'Not selected';
    return nodeLabelMap.get(nodeId) ?? nodeId;
  }, [nodeLabelMap]);

  const focusMapView = useCallback(() => {
    setMobileTab('map');
    window.requestAnimationFrame(() => {
      mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  const handleNavigate = useCallback(() => {
    if (!selectedSource || !selectedDest) return;

    const sourceNode = navigationEngine.getNode(selectedSource);
    const destNode = navigationEngine.getNode(selectedDest);
    if (!sourceNode || !destNode) {
      if (!sourceNode) {
        setSelectedSource(null);
        setIsSourceSelectorOpen(true);
      }
      if (!destNode) {
        setSelectedDest(null);
        setIsDestSelectorOpen(true);
      }
      setNavigationResult(null);
      setCurrentStepIndex(0);
      toast({
        title: 'Selection updated',
        description: 'Node cannot be found in the current page. Please reselect source or destination.',
        variant: 'destructive',
      });
      return;
    }

    const result = navigationEngine.findPath(selectedSource, selectedDest);
    if (result) {
      setNavigationResult(result);
      setCurrentStepIndex(0);
      // Switch to the source floor
      setCurrentFloor(sourceNode.floor);
      // Bring the map into view right after calculating a route.
      focusMapView();
    } else {
      toast({ title: 'No path found', description: 'Unable to find a route between these locations.', variant: 'destructive' });
    }
  }, [selectedSource, selectedDest, toast, focusMapView]);

  const handleStepClick = useCallback((step: NavigationStep, index: number) => {
    setCurrentFloor(step.floor);
    setCurrentStepIndex(index);
    focusMapView();
  }, [focusMapView]);

  const handlePrevStep = useCallback(() => {
    if (!navigationResult) return;
    const prevIndex = Math.max(0, currentStepIndex - 1);
    const prevStep = navigationResult.steps[prevIndex];
    if (!prevStep) return;
    setCurrentStepIndex(prevIndex);
    setCurrentFloor(prevStep.floor);
    focusMapView();
  }, [navigationResult, currentStepIndex, focusMapView]);

  const handleNextStep = useCallback(() => {
    if (!navigationResult) return;
    const nextIndex = Math.min(navigationResult.steps.length - 1, currentStepIndex + 1);
    const nextStep = navigationResult.steps[nextIndex];
    if (!nextStep) return;
    setCurrentStepIndex(nextIndex);
    setCurrentFloor(nextStep.floor);
    focusMapView();
  }, [navigationResult, currentStepIndex, focusMapView]);

  const handleReset = useCallback(() => {
    setSelectedSource(null);
    setSelectedDest(null);
    setNavigationResult(null);
    setCurrentStepIndex(0);
    setCurrentFloor('G');
    setIsSourceSelectorOpen(true);
    setIsDestSelectorOpen(true);
  }, []);

  const handleQuickPickRoom = useCallback((nodeId: string, floor: FloorType) => {
    setCurrentFloor(floor);
    if (!selectedSource) {
      setSelectedSource(nodeId);
      setIsSourceSelectorOpen(false);
    } else {
      setSelectedDest(nodeId);
      setIsDestSelectorOpen(false);
    }
    setSearchQuery('');
    setMobileTab('route');
  }, [selectedSource]);

  const handleSourceSelectChange = useCallback((value: string) => {
    const nextSource = value === NONE ? null : value;
    setSelectedSource(nextSource);
    setIsSourceSelectorOpen(nextSource === null);
  }, []);

  const handleDestSelectChange = useCallback((value: string) => {
    const nextDest = value === NONE ? null : value;
    setSelectedDest(nextDest);
    setIsDestSelectorOpen(nextDest === null);
  }, []);

  const mobileTabs = [
    { id: 'map' as MobileTab, label: 'Map', icon: MapIcon },
    { id: 'search' as MobileTab, label: 'Search', icon: SearchIcon },
    { id: 'route' as MobileTab, label: 'Route', icon: RouteIcon },
    { id: 'admin' as MobileTab, label: 'Admin', icon: Shield },
  ];
  const isOverlayOpen = mobileTab !== 'map';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading navigation data...</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-slate-100">
        <div ref={mapContainerRef} className="absolute inset-0 p-1 pb-16 pt-12">
          <FloorMap
            floor={currentFloor}
            floorMapUrl={getFloorMapUrl(currentFloor)}
            rooms={rooms}
            navigationResult={navigationResult}
            selectedSource={selectedSource}
            selectedDest={selectedDest}
          />
        </div>

        <div className="absolute left-2 right-2 top-2 z-30 rounded-2xl border border-slate-200/80 bg-white/90 px-2 py-1.5 shadow-sm backdrop-blur-sm">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src="/floor-maps/logo.jpg"
              alt="KPRCAS logo"
              className="h-7 w-7 rounded-md border border-slate-200 bg-white object-cover"
              onError={(event) => {
                event.currentTarget.src = '/floor-maps/logo.jpg';
              }}
            />
            <span className="truncate text-xs font-semibold tracking-tight text-slate-700">Indoor Nav</span>
          </div>
          <div className="mt-1 flex justify-end">
            <FloorSelector
              currentFloor={currentFloor}
              onFloorChange={setCurrentFloor}
              activeFloors={navigationResult?.floorsVisited}
            />
          </div>
        </div>

        {isOverlayOpen && (
          <button
            type="button"
            aria-label="Close panel"
            className="absolute inset-0 z-35 bg-black/10"
            onClick={() => setMobileTab('map')}
          />
        )}

        {mobileTab === 'search' && (
          <div className="absolute inset-x-2 bottom-[4.35rem] z-40 max-h-[40vh] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/98 shadow-[0_-10px_28px_rgba(15,23,42,0.18)] backdrop-blur-lg animate-in slide-in-from-bottom-2 duration-200">
            <div className="border-b border-slate-200 px-3 py-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search room or number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 rounded-2xl border-slate-200 bg-white pl-9 text-sm"
                />
              </div>
            </div>
            <div className="max-h-[30vh] overflow-y-auto p-2">
              {filteredRooms.length === 0 ? (
                <div className="rounded-2xl bg-white p-3 text-center text-xs text-slate-500">
                  Type to find rooms quickly.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredRooms.map((room) => {
                    const nodeId = getRoomNodeId(room.room_number, room.floor);
                    return (
                      <button
                        key={nodeId}
                        onClick={() => handleQuickPickRoom(nodeId, room.floor)}
                        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left hover:bg-sky-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">{room.room_name}</p>
                          <p className="text-[11px] text-slate-500">{room.room_number}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                          {FLOOR_LABELS[room.floor]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {mobileTab === 'route' && (
          <div className="absolute inset-x-2 bottom-[4.35rem] z-40 max-h-[50vh] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/98 shadow-[0_-10px_28px_rgba(15,23,42,0.18)] backdrop-blur-lg animate-in slide-in-from-bottom-2 duration-200">
            <div className="space-y-3 border-b border-slate-200 p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Source</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-sky-600" />
                    {selectedSource && !isSourceSelectorOpen ? (
                      <button
                        type="button"
                        onClick={() => setIsSourceSelectorOpen(true)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-left text-xs font-medium text-slate-700"
                      >
                        {getNodeLabel(selectedSource)}
                      </button>
                    ) : (
                      <Select
                        value={selectedSource ?? NONE}
                        onValueChange={handleSourceSelectChange}
                      >
                        <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-xs">
                          <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>None</SelectItem>
                          {roomOptions.map((room) => {
                            const nodeId = getRoomNodeId(room.room_number, room.floor);
                            return (
                              <SelectItem key={nodeId} value={nodeId}>
                                {room.room_name} ({room.room_number})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Destination</label>
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-emerald-600" />
                    {selectedDest && !isDestSelectorOpen ? (
                      <button
                        type="button"
                        onClick={() => setIsDestSelectorOpen(true)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-left text-xs font-medium text-slate-700"
                      >
                        {getNodeLabel(selectedDest)}
                      </button>
                    ) : (
                      <Select
                        value={selectedDest ?? NONE}
                        onValueChange={handleDestSelectChange}
                      >
                        <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-xs">
                          <SelectValue placeholder="Destination" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>None</SelectItem>
                          {roomOptions.map((room) => {
                            const nodeId = getRoomNodeId(room.room_number, room.floor);
                            return (
                              <SelectItem key={nodeId} value={nodeId}>
                                {room.room_name} ({room.room_number})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleNavigate}
                disabled={!selectedSource || !selectedDest}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-sm font-semibold text-white shadow-md"
              >
                Find Route
              </Button>

              <Button onClick={handleReset} variant="outline" className="h-10 w-full rounded-xl border-slate-200 bg-white text-xs">
                Clear Route
              </Button>
            </div>

            {navigationResult && (
              <div className="max-h-[28vh] overflow-y-auto p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Directions</h3>
                  <span className="text-[10px] text-slate-500">
                    {navigationResult.steps.length === 0 ? '0 / 0' : `${currentStepIndex + 1} / ${navigationResult.steps.length}`}
                  </span>
                </div>

                <div className="mb-2 flex items-center gap-2">
                  <Button
                    onClick={handlePrevStep}
                    variant="outline"
                    size="sm"
                    className="h-9 flex-1 rounded-xl border-slate-200 bg-white"
                    disabled={currentStepIndex <= 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    variant="outline"
                    size="sm"
                    className="h-9 flex-1 rounded-xl border-slate-200 bg-white"
                    disabled={currentStepIndex >= navigationResult.steps.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {navigationResult.steps.map((step, index) => (
                    <button
                      key={`${step.fromNode}-${index}`}
                      onClick={() => handleStepClick(step, index)}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${
                        index === currentStepIndex
                          ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-200'
                          : 'bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {step.instruction}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {mobileTab === 'admin' && (
          <div className="absolute inset-x-2 bottom-[4.35rem] z-40 rounded-3xl border border-slate-200 bg-slate-50/98 p-3 shadow-[0_-10px_28px_rgba(15,23,42,0.18)] backdrop-blur-lg animate-in slide-in-from-bottom-2 duration-200">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Admin Access</h3>
            <p className="mb-3 text-xs text-slate-500">Manage maps, rooms, and route data.</p>
            <div className="grid grid-cols-2 gap-2">
              <Link to={ADMIN_LOGIN_PATH}>
                <Button variant="outline" className="h-10 w-full rounded-xl border-slate-200 bg-white text-xs">
                  Admin Login
                </Button>
              </Link>
              <Link to={ADMIN_PANEL_PATH}>
                <Button className="h-10 w-full rounded-xl bg-slate-900 text-xs text-white hover:bg-slate-800">
                  Admin Panel
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="absolute inset-x-2 bottom-2 z-50 rounded-2xl border border-slate-200/90 bg-white/95 p-1 shadow-lg backdrop-blur-sm">
          <div className="grid grid-cols-4 gap-1">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              const active = mobileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMobileTab(tab.id)}
                  className={`flex h-[52px] flex-col items-center justify-center rounded-xl text-[11px] font-medium transition-all ${
                    active
                      ? 'bg-sky-100 text-sky-700 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.25)]'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`mb-1 h-4 w-4 ${active ? 'text-sky-600' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <NavigationSidebar
        rooms={rooms}
        selectedSource={selectedSource}
        selectedDest={selectedDest}
        onSelectSource={setSelectedSource}
        onSelectDest={setSelectedDest}
        onNavigate={handleNavigate}
        onClearRoute={handleReset}
        navigationResult={navigationResult}
        onStepClick={handleStepClick}
        currentStepIndex={currentStepIndex}
        onPrevStep={handlePrevStep}
        onNextStep={handleNextStep}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/95 backdrop-blur-sm md:px-4">
          <div className="flex items-center gap-3">
            <img
              src="/floor-maps/logo.jpg"
              alt="KPRCAS logo"
              className="h-8 w-auto rounded-md border border-border object-contain bg-white md:h-9"
            />
            <FloorSelector
              currentFloor={currentFloor}
              onFloorChange={setCurrentFloor}
              activeFloors={navigationResult?.floorsVisited}
            />
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-1 rounded-full border hidden sm:inline-flex ${
                dbStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                  : dbStatus === 'disconnected'
                    ? 'bg-destructive/10 text-destructive border-destructive/30'
                    : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              DB: {dbStatus === 'connected' ? 'Connected' : dbStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
            </span>
            {!isMobile && (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="text-xs">
                    User Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" size="sm" className="text-xs">
                    Sign Up
                  </Button>
                </Link>
                <Link to="/docs">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <BookOpen className="h-3 w-3" />
                    Docs
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Map */}
        <div ref={mapContainerRef} className={`flex-1 p-2 md:p-3 ${isMobile ? 'pb-24' : ''}`}>
          <FloorMap
            floor={currentFloor}
            floorMapUrl={getFloorMapUrl(currentFloor)}
            rooms={rooms}
            navigationResult={navigationResult}
            selectedSource={selectedSource}
            selectedDest={selectedDest}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
