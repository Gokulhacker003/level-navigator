import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigationData } from '@/hooks/useNavigationData';
import { supabase } from '@/integrations/supabase/client';
import { SEED_ROOMS, SEED_WAYPOINTS, SEED_EDGES } from '@/lib/seed-data';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Plus, Trash2, Database } from 'lucide-react';
import { FloorType, FLOOR_ORDER, FLOOR_LABELS } from '@/lib/types';

const Admin: React.FC = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const { rooms, waypoints, edges, usingSeedData, reload } = useNavigationData();
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      // Insert rooms
      const roomInserts = SEED_ROOMS.map(r => ({
        room_number: r.room_number,
        room_name: r.room_name,
        floor: r.floor as any,
        block: r.block,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
      }));
      const { error: roomErr } = await supabase.from('rooms').upsert(roomInserts, { onConflict: 'room_number' });
      if (roomErr) throw roomErr;

      // Insert waypoints
      const wpInserts = SEED_WAYPOINTS.map(w => ({
        name: w.name,
        floor: w.floor as any,
        x: w.x,
        y: w.y,
        type: w.type as any,
        block: w.block,
      }));
      const { error: wpErr } = await supabase.from('waypoints').upsert(wpInserts, { onConflict: 'name,floor' });
      if (wpErr) throw wpErr;

      // Insert edges
      const edgeInserts = SEED_EDGES.map(e => ({
        from_node: e.from_node,
        to_node: e.to_node,
        distance: e.distance,
        floor: e.floor as any,
        is_vertical: e.is_vertical,
      }));
      const { error: edgeErr } = await supabase.from('graph_edges').upsert(edgeInserts, { onConflict: 'from_node,to_node' });
      if (edgeErr) throw edgeErr;

      toast({ title: 'Data seeded', description: 'Sample navigation data has been loaded into the database.' });
      reload();
    } catch (err: any) {
      toast({ title: 'Seed failed', description: err.message, variant: 'destructive' });
    }
    setSeeding(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Map
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Admin Panel</h1>
          {!isAdmin && (
            <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">
              No admin role — read only
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{user.email}</span>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Seed data action */}
        {usingSeedData && isAdmin && (
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">Database is empty — using demo data</p>
                <p className="text-xs text-muted-foreground">Click to load sample data into your database</p>
              </div>
              <Button onClick={handleSeedData} disabled={seeding} className="gap-2">
                <Database className="h-4 w-4" />
                {seeding ? 'Seeding...' : 'Seed Database'}
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="rooms">
          <TabsList>
            <TabsTrigger value="rooms">Rooms ({rooms.length})</TabsTrigger>
            <TabsTrigger value="waypoints">Waypoints ({waypoints.length})</TabsTrigger>
            <TabsTrigger value="graph">Graph ({edges.length})</TabsTrigger>
            <TabsTrigger value="maps">Floor Maps</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rooms — Block A</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {FLOOR_ORDER.map(floor => {
                    const floorRooms = rooms.filter(r => r.floor === floor);
                    if (floorRooms.length === 0) return null;
                    return (
                      <div key={floor}>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2">{FLOOR_LABELS[floor]}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {floorRooms.map(room => (
                            <div key={room.room_number} className="flex items-center justify-between bg-muted rounded-md px-3 py-2 text-sm">
                              <div>
                                <span className="font-medium">{room.room_name}</span>
                                <span className="text-xs text-muted-foreground ml-2">{room.room_number}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">({room.x}, {room.y})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waypoints" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Waypoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {waypoints.map(wp => (
                    <div key={wp.id} className="flex items-center justify-between bg-muted rounded-md px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium">{wp.name.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-muted-foreground ml-2">{wp.type}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{FLOOR_LABELS[wp.floor]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="graph" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Graph Edges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {edges.map(edge => (
                    <div key={edge.id} className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 text-xs">
                      <span className="font-mono">{edge.from_node.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-mono">{edge.to_node.replace(/_/g, ' ')}</span>
                      <span className="ml-auto text-muted-foreground">d={edge.distance}</span>
                      {edge.is_vertical && <span className="text-nav-stairs text-[10px]">↕ vertical</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maps" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Floor Maps / Blueprints</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Blueprint upload will be available once storage is configured. Currently using programmatic SVG layouts.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
