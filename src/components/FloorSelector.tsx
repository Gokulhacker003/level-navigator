import React from 'react';
import { FloorType, FLOOR_LABELS, FLOOR_ORDER } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface FloorSelectorProps {
  currentFloor: FloorType;
  onFloorChange: (floor: FloorType) => void;
  onReset: () => void;
  activeFloors?: FloorType[];
}

export const FloorSelector: React.FC<FloorSelectorProps> = ({
  currentFloor,
  onFloorChange,
  onReset,
  activeFloors,
}) => {
  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground mr-1">Floor:</span>
      {FLOOR_ORDER.map(floor => {
        const isActive = activeFloors?.includes(floor);
        return (
          <Button
            key={floor}
            variant={currentFloor === floor ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFloorChange(floor)}
            className={`relative h-8 w-10 text-xs font-bold ${isActive ? 'ring-2 ring-nav-path ring-offset-1' : ''}`}
          >
            {floor}
            {isActive && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-nav-path" />
            )}
          </Button>
        );
      })}
      <div className="w-px h-6 bg-border mx-1" />
      <Button variant="ghost" size="sm" onClick={onReset} className="h-8 gap-1 text-xs">
        <RotateCcw className="h-3 w-3" />
        Reset
      </Button>
    </div>
  );
};
