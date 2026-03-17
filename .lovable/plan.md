
# Layered Multi-Floor Indoor Navigation System

## Overview
A React + TypeScript indoor navigation app with multi-floor pathfinding, interactive maps, admin panel, and Supabase backend. Starting with Block A (4 floors: G, F, S, T), expandable to more blocks.

## Phase 1: Supabase Database Setup
- **Rooms table**: room_number (AG101 format), room_name, floor (G/F/S/T), block, x, y coordinates
- **Waypoints table**: name (e.g. Stairs_A_G), floor, x, y, type (room/corridor/stairs/lift)
- **Graph table**: from_node, to_node, distance, floor
- **Floor maps table**: floor, block, blueprint_image_url
- **User roles table** for admin access (app_role enum: admin/user)
- Auth setup with Supabase auth + profiles table
- RLS policies on all tables

## Phase 2: Core Navigation Engine
- Graph data structure with floor-aware nodes (`${name}_${floor}`)
- Vertical connections between stair/lift nodes across floors
- Modified Dijkstra algorithm supporting cross-floor routing
- Route generation: detect floor difference → route to nearest stairs → switch floor → continue → repeat until destination
- Step-by-step direction generation

## Phase 3: Interactive Map UI
- **Left Sidebar**: Search by room name/number, source/destination selection, step-by-step directions panel
- **Top Bar**: Floor selector tabs (G, F, S, T), reset button
- **Main Map Area**: SVG-based programmatic floor layout (placeholder rooms, corridors, stairs), zoom & pan with mouse/touch, animated navigation path drawing
- Room interaction: click to select destination, double-click to set source, hover for room details tooltip

## Phase 4: Floor Transition Animation
- When route crosses floors: highlight stairs/lift node → fade out current floor → load next floor → continue animated path
- Floor selector auto-switches during navigation playback

## Phase 5: Admin Panel (Auth-Protected)
- Login page for admin access
- Dashboard with tabs: Rooms, Waypoints, Graph, Floor Maps
- Add/edit/delete rooms with AG101 format validation
- Click on map to capture X,Y coordinates for new rooms/waypoints
- Upload blueprint images per floor (Supabase storage)
- Manage graph connections visually
- Add stairs/lift vertical connector nodes

## Phase 6: Seed Data
- Pre-populate Block A with sample rooms across 4 floors (e.g., AG101-Reception, AF201-CS Dept, AS301-Library, AT401-Lab)
- Sample corridors, stairs, and lift waypoints
- Graph connections for pathfinding

## Phase 7: Documentation Page
- In-app documentation route (/docs) covering: Introduction, Problem Statement, System Architecture, Layered Floor Model, Room Numbering, Graph Implementation, Dijkstra Algorithm, Multi-Floor Routing, UI Design, Admin Panel, Supabase Integration, Performance Optimization, Future Scope (3D with Three.js)

## Key Technical Decisions
- SVG-based maps (programmatic) with placeholder layouts until blueprints are uploaded
- Dijkstra's algorithm with weighted edges (distance + floor-change penalty)
- All nodes uniquely identified by `${name}_${floor}` pattern
- External Supabase for database, auth, and file storage
- Role-based admin access using security definer functions
