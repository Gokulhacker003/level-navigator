import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const sections = [
  { id: '1', title: '1. Introduction', content: 'The Layered Multi-Floor Indoor Navigation System is a web-based application designed to help users navigate complex multi-story buildings. Unlike outdoor navigation using GPS, indoor navigation requires a custom graph-based approach with floor-aware pathfinding. This system provides real-time route computation, interactive floor maps, and step-by-step directions across multiple floors.' },
  { id: '2', title: '2. Problem Statement', content: 'Traditional signage-based indoor navigation is inadequate in large buildings with multiple floors and blocks. Users struggle to find rooms, especially when they need to traverse multiple floors. There is a need for a digital solution that provides: accurate multi-floor routing, visual floor maps with interactive elements, automated floor transition guidance via stairs and lifts, and an admin panel for building managers to maintain the system.' },
  { id: '3', title: '3. System Architecture', content: 'The system follows a layered architecture:\n\n• Frontend Layer: React + TypeScript SPA with SVG-based maps\n• State Management: React hooks + TanStack Query for server state\n• Navigation Engine: Client-side Dijkstra algorithm with floor-aware graph\n• Backend Layer: Supabase (PostgreSQL + Auth + Storage)\n• Data Layer: Rooms, Waypoints, Graph Edges, Floor Maps tables\n\nAll components communicate through well-defined interfaces, enabling independent scaling and maintenance.' },
  { id: '4', title: '4. Layered Floor Model', content: 'Each floor acts as an independent navigation layer. Even if X/Y coordinates are identical across floors, nodes are uniquely identified using the pattern: ${name}_${floor}.\n\nFloor Identifiers:\n• G → Ground Floor\n• F → First Floor\n• S → Second Floor\n• T → Third Floor\n\nThis ensures no collision between same-position nodes on different floors. Vertical connections (stairs, lifts) bridge these layers.' },
  { id: '5', title: '5. Room Numbering System', content: 'Rooms follow the format: [Block][Floor][Number]\n\nExample: AG101\n• A → Block A\n• G → Ground Floor\n• 101 → Room Number\n\nMore examples:\n• AF201 → Block A, First Floor, Room 201\n• AS301 → Block A, Second Floor, Room 301\n• AT401 → Block A, Third Floor, Room 401\n\nUsers can search by either room name (e.g., "CS Department") or room number (e.g., "AT401").' },
  { id: '6', title: '6. Graph Implementation', content: 'The navigation graph consists of:\n\n• Room Nodes: Each room is a node with unique ID Room_${roomNumber}_${floor}\n• Waypoint Nodes: Corridors, entrances, stairs, lifts with ID ${name}_${floor}\n• Edges: Weighted connections between nodes representing walkable paths\n• Vertical Edges: Special edges connecting stair/lift nodes across floors\n\nExample node IDs:\n• Room_AG101_G, Stairs_A_G, Corridor_1_F\n\nVertical connections:\n• Stairs_A_G ↔ Stairs_A_F (distance: 8)\n• Lift_A_G ↔ Lift_A_F (distance: 4)' },
  { id: '7', title: '7. Dijkstra Algorithm', content: 'The pathfinding uses a modified Dijkstra\'s algorithm:\n\n1. Initialize distances: source = 0, all others = ∞\n2. Process unvisited node with minimum distance\n3. For each neighbor, calculate tentative distance\n4. Floor-change penalty: +5 weight for cross-floor edges\n5. Repeat until destination is reached\n6. Reconstruct path from predecessor map\n\nThe floor-change penalty ensures the algorithm prefers same-floor routes when possible, only using stairs/lifts when necessary.' },
  { id: '8', title: '8. Multi-Floor Routing', content: 'When source and destination are on different floors:\n\n1. Detect floor difference between source and destination\n2. Find nearest vertical connector (stairs or lift) on source floor\n3. Navigate to the connector on the current floor\n4. Switch floor layer via the vertical connection\n5. Continue navigation on the next floor\n6. Repeat steps 2-5 until destination floor is reached\n7. Navigate from connector to final destination room\n\nThe lift option has lower weight (4 vs 8 for stairs) to represent the ease of using an elevator.' },
  { id: '9', title: '9. UI Design', content: 'The interface consists of:\n\n• Left Sidebar: Search bar (room name/number), source/destination selection, step-by-step directions panel\n• Top Bar: Floor selector tabs (G, F, S, T), reset button, admin/docs links\n• Main Map Area: SVG-based floor layout with rooms, corridors, stairs, lifts\n\nInteractions:\n• Click room → set as destination\n• Double-click room → set as source\n• Hover room → show tooltip with details\n• Mouse wheel → zoom in/out\n• Click + drag → pan the map\n• Click direction step → jump to that floor' },
  { id: '10', title: '10. Admin Panel', content: 'The admin panel (auth-protected) provides:\n\n• Room Management: View/add/edit/delete rooms with AG101 format validation\n• Waypoint Management: Manage corridors, stairs, lifts, entrances\n• Graph Management: View and manage edges between nodes\n• Floor Maps: Upload blueprint images per floor (Supabase Storage)\n• Seed Data: One-click database population with sample data\n\nAdmin access is controlled via the user_roles table with a security-definer function to prevent RLS recursion.' },
  { id: '11', title: '11. Supabase Integration', content: 'Database tables:\n• rooms: room_number, room_name, floor, block, x, y, width, height\n• waypoints: name, floor, x, y, type, block\n• graph_edges: from_node, to_node, distance, floor, is_vertical\n• floor_maps: floor, block, blueprint_url\n• profiles: user_id, display_name, avatar_url\n• user_roles: user_id, role (admin/user)\n\nSecurity:\n• RLS enabled on all tables\n• Public read access for navigation data\n• Admin-only write access via has_role() security definer function\n• Auto-profile creation on signup via trigger' },
  { id: '12', title: '12. Performance Optimization', content: 'Key optimizations:\n\n• Client-side pathfinding: No server round-trip for route computation\n• Data caching: TanStack Query for efficient data fetching and caching\n• SVG rendering: Lightweight vector graphics vs heavy canvas/images\n• Lazy loading: Components loaded on-demand via React.lazy\n• Minimal re-renders: useCallback/useMemo for expensive computations\n• Efficient graph: Adjacency list representation for O(V + E) traversal\n• Fallback data: Seed data loaded instantly when DB is empty' },
  { id: '13', title: '13. Future Scope', content: '• 3D Visualization: Three.js integration for immersive 3D building walkthroughs\n• Real-time Positioning: Bluetooth beacon / Wi-Fi fingerprinting for live user location\n• Multi-block Support: Expand to multiple buildings with outdoor connections\n• Accessibility Routing: Wheelchair-friendly paths avoiding stairs\n• AR Navigation: Camera-based augmented reality wayfinding\n• Voice Navigation: Text-to-speech step-by-step directions\n• Analytics Dashboard: Heatmaps of popular routes and congestion\n• Mobile App: React Native version for iOS/Android\n• Offline Support: Service worker for offline navigation capability' },
];

const Documentation: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Map
          </Button>
        </Link>
        <h1 className="text-lg font-bold">System Documentation</h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Layered Multi-Floor Indoor Navigation System</h1>
          <p className="text-sm text-muted-foreground">Complete technical documentation covering architecture, algorithms, and implementation.</p>
        </div>

        {/* Table of Contents */}
        <div className="bg-card border border-border rounded-lg p-4 mb-8">
          <h2 className="text-sm font-semibold mb-3">Table of Contents</h2>
          <div className="grid grid-cols-2 gap-1">
            {sections.map(s => (
              <a key={s.id} href={`#section-${s.id}`} className="text-xs text-primary hover:underline py-0.5">
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map(section => (
            <section key={section.id} id={`section-${section.id}`} className="scroll-mt-16">
              <h2 className="text-lg font-bold mb-3 text-foreground">{section.title}</h2>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Documentation;
