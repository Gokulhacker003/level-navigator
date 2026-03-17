import React, { useState, useCallback } from 'react';
import { FloorMap } from '@/components/FloorMap';
import { FloorSelector } from '@/components/FloorSelector';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import { useNavigationData } from '@/hooks/useNavigationData';
import { navigationEngine } from '@/lib/navigation-engine';
import { FloorType, NavigationResult, NavigationStep } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDatabaseConnection } from '@/hooks/useDatabaseConnection';
import { getRoomNodeId } from '@/lib/seed-data';

const Index = () => {
  const { rooms, waypoints, loading, usingSeedData, getFloorMapUrl } = useNavigationData();
  const [currentFloor, setCurrentFloor] = useState<FloorType>('G');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedDest, setSelectedDest] = useState<string | null>(null);
  const [navigationResult, setNavigationResult] = useState<NavigationResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const { status: dbStatus } = useDatabaseConnection();
  const { toast } = useToast();

  const handleRoomClick = useCallback((roomNumber: string, floor: FloorType) => {
    const nodeId = getRoomNodeId(roomNumber, floor);
    if (selectedSource) {
      setSelectedDest(nodeId);
    } else {
      setSelectedDest(nodeId);
    }
  }, [selectedSource]);

  const handleRoomDoubleClick = useCallback((roomNumber: string, floor: FloorType) => {
    const nodeId = getRoomNodeId(roomNumber, floor);
    setSelectedSource(nodeId);
  }, []);

  const handleNavigate = useCallback(() => {
    if (!selectedSource || !selectedDest) return;
    const result = navigationEngine.findPath(selectedSource, selectedDest);
    if (result) {
      setNavigationResult(result);
      setCurrentStepIndex(0);
      // Switch to the source floor
      const sourceNode = navigationEngine.getNode(selectedSource);
      if (sourceNode) setCurrentFloor(sourceNode.floor);
    } else {
      toast({ title: 'No path found', description: 'Unable to find a route between these locations.', variant: 'destructive' });
    }
  }, [selectedSource, selectedDest, toast]);

  const handleStepClick = useCallback((step: NavigationStep) => {
    setCurrentFloor(step.floor);
    const idx = navigationResult?.steps.indexOf(step) ?? 0;
    setCurrentStepIndex(idx);
  }, [navigationResult]);

  const handleReset = useCallback(() => {
    setSelectedSource(null);
    setSelectedDest(null);
    setNavigationResult(null);
    setCurrentStepIndex(0);
    setCurrentFloor('G');
  }, []);

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
        navigationResult={navigationResult}
        onStepClick={handleStepClick}
        currentStepIndex={currentStepIndex}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <FloorSelector
            currentFloor={currentFloor}
            onFloorChange={setCurrentFloor}
            onReset={handleReset}
            activeFloors={navigationResult?.floorsVisited}
          />

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-1 rounded-full border ${
                dbStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                  : dbStatus === 'disconnected'
                    ? 'bg-destructive/10 text-destructive border-destructive/30'
                    : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              DB: {dbStatus === 'connected' ? 'Connected' : dbStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
            </span>
            {usingSeedData && (
              <span className="text-[10px] bg-accent/20 text-accent px-2 py-1 rounded-full">Demo Data</span>
            )}
            <Link to="/docs">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <BookOpen className="h-3 w-3" />
                Docs
              </Button>
            </Link>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 p-3">
          <FloorMap
            floor={currentFloor}
            floorMapUrl={getFloorMapUrl(currentFloor)}
            rooms={rooms}
            waypoints={waypoints}
            navigationResult={navigationResult}
            selectedSource={selectedSource}
            selectedDest={selectedDest}
            onRoomClick={handleRoomClick}
            onRoomDoubleClick={handleRoomDoubleClick}
            hoveredRoom={hoveredRoom}
            onHoverRoom={setHoveredRoom}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
