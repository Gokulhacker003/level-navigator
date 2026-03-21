# INDOOR NAVIGATION SYSTEM
## Complete Project Documentation

## Abstract
Indoor Navigation System is a web-based indoor navigation platform developed to solve one of the most common operational problems in large educational institutions: finding exact locations inside multi-block and multi-floor campus buildings in minimum time. In conventional campus environments, navigation still depends heavily on printed signboards, static floor plans, and manual instructions from security or administrative staff. These methods are often insufficient for first-time visitors, newly admitted students, parents, event participants, and even students moving between unfamiliar departments. Delays caused by navigation confusion lead to loss of time, missed sessions, and poor user experience. The proposed system addresses this issue by introducing a digital, data-driven, and scalable navigation model that can guide users from any valid source point to any valid destination point inside the campus.

The core idea of this project is to represent the campus as a weighted graph, where each location is modeled as a waypoint node and each valid movement connection is modeled as an edge with distance/cost. This model is well suited for indoor route computation because it can represent rooms, corridors, entrances, stairs, and lifts in a single unified structure. Once source and destination are selected, the routing engine computes the least-cost path and returns an ordered sequence of nodes. This sequence is converted into clear, human-readable navigation instructions and displayed with floor-aware context so users can understand both horizontal movement and vertical transitions across floors. To improve route realism, floor-change transitions are treated carefully, and route generation supports practical movement behavior instead of naive straight-line assumptions.

From an implementation perspective, the system uses a modern full-stack architecture with clear modular separation. The frontend is developed using React with TypeScript and Vite, enabling component-based design, strong typing, and fast build performance. The user interface includes source/destination selection, floor controls, route step visualization, and map rendering. The backend uses Supabase with PostgreSQL, where navigation entities such as waypoints, graph edges, floor maps, and role metadata are stored. Data integrity is maintained through schema constraints and enum types, while security is enforced using Row Level Security (RLS) policies and role-based access rules. This combination ensures that navigation data remains publicly readable for users, but modification operations are restricted to authorized admin roles.

A major strength of the system is operational robustness. The application is designed with fallback behavior so that navigation remains functional even when backend records are temporarily unavailable. In such cases, predefined seed datasets are loaded into memory and used to construct the runtime graph. This improves reliability during initial deployment, testing phases, and temporary connectivity issues. The system also supports floor map URL resolution with static fallback assets, which prevents map rendering failures and ensures continuity of visual guidance.

The project contributes both practical utility and technical learning outcomes. Practically, it reduces dependency on manual navigation support and enables faster room discovery across campus infrastructure. Technically, it demonstrates end-to-end engineering of a real-world location intelligence solution, including graph modeling, algorithmic route computation, secured cloud data management, and interactive web visualization. The modular design allows easy extension for future features such as live crowd-aware rerouting, accessibility-specific route profiles, mobile-first interaction patterns, QR-based location initialization, and analytics for campus movement optimization. Overall, Indoor Navigation System provides a reliable, extensible, and institution-ready digital navigation framework that improves day-to-day campus experience while establishing a strong foundation for future smart-campus services.

## 1. Introduction
Campus environments have evolved into dense, multi-structure ecosystems that include academic blocks, laboratories, administrative offices, seminar halls, service rooms, and common utility areas spread across different floors and wings. While this growth improves institutional capacity, it also creates a significant navigation challenge for students, visitors, and staff. In most institutions, people still depend on static signboards, printed maps, and verbal guidance from support personnel to find destinations. These methods work only to a limited extent and often fail when users must move between unfamiliar blocks, crowded corridors, or vertically connected floors. As a result, users spend unnecessary time locating rooms, miss academic or administrative appointments, and experience avoidable stress, especially during admissions, examinations, events, and first-week orientation periods.

The need for an intelligent indoor navigation system emerges from this practical gap between physical infrastructure and user wayfinding efficiency. A modern institution requires a digital platform that can interpret location data, compute navigable paths, and present route instructions in a clear and accessible format. The Indoor Navigation System project is designed to fulfill this need by combining graph-based pathfinding with floor-map visualization in a web-based application. Instead of treating navigation as a static information display problem, the system treats it as a dynamic route computation problem. This approach allows users to select any valid source and destination points and receive a computed path that reflects actual connectivity between rooms, corridors, entrances, and floor-transition points such as stairs and lifts.

At the conceptual level, the project models the campus as a weighted graph. Each physical point of interest is represented as a waypoint node, and each feasible movement connection is represented as an edge with distance or travel cost. By using this representation, the application can calculate an optimal route through algorithmic search rather than manual approximation. The computed path is then transformed into a sequence of human-readable navigation steps, including floor-change instructions where required. This enables a user-centered experience in which technical route data is translated into practical guidance, reducing confusion and improving movement efficiency.

The project is also designed with operational realism in mind. Indoor navigation data can change over time due to infrastructure updates, room reallocations, and modified movement access. Therefore, the platform supports database-driven data management so that route models can be maintained without redesigning the frontend interface. Security is handled through role-based controls and policy-level restrictions, ensuring that general users can access navigation features while only authorized administrators can modify waypoints, edges, and map metadata. In addition, fallback logic is included so that the application can still function with predefined seed data in scenarios where cloud data is temporarily unavailable.

From an academic and engineering perspective, this project demonstrates the practical integration of algorithmic design, data modeling, secure backend architecture, and responsive web interface development. It bridges theoretical concepts from graph algorithms and database systems with real-world usability requirements in educational institutions. The resulting system is not only a functional tool for current indoor navigation but also a scalable foundation for future enhancements such as accessibility-aware routing, mobile-first guidance, QR-based source detection, and analytics-based route optimization. In this way, Indoor Navigation System contributes to both institutional efficiency and the broader objective of smart campus digital transformation.

### 1.1 Organization Profile
Kongu Institute of Computer Education (KICE Infosystems) is a professional IT training and services organization established in 2020, with operations in Coimbatore and Tirupur, Tamil Nadu. The organization focuses on industry-oriented technical education, software development support, and project-based learning for students, engineering graduates, and corporate professionals. KICE initially started with structured computer education and final-year project guidance, and later expanded into corporate skill development, consultancy, and recruitment support for IT and IT-enabled service sectors. The curriculum is designed and supervised by experienced IT professionals to align with real-world industry standards and emerging technology demands.

KICE provides training in a wide range of technologies, including .NET, Java, PHP, C, C++, Android, Python, React, Angular, software testing, R-Tool, and MATLAB. In addition to technical instruction, the institute emphasizes aptitude, communication, soft skills, professional attitude, and placement preparation. Through hands-on practical sessions, internship exposure, workshops, faculty development programs, certified courses, and research-oriented initiatives, KICE promotes strong academic-industry linkage and improves employability outcomes.

For this Indoor Navigation System project, KICE Infosystems provided a suitable development ecosystem that combines conceptual clarity with real-world implementation practice. The project reflects the organization's training philosophy by integrating software architecture, algorithmic logic, database design, and user-centered interface development into a practical application. Mentorship-driven guidance, laboratory infrastructure, and project-oriented execution support directly contributed to the successful design and completion of this work.

Vision:
To become a pioneer in IT advancement by producing skilled technologists and professionals who meet global standards and contribute the benefits of modern technological development to society.

Mission:
To create a supportive environment that encourages innovation, collaboration, and knowledge integration among students, engineers, researchers, and industry professionals, enabling the development of next-generation technologies for the overall benefit of society.

### 1.2 System Specification

#### 1.2.1 Hardware Specification
Minimum:
- Processor: Intel i3 or equivalent
- RAM: 4 GB
- Storage: 1 GB free disk
- Display: 1366 x 768
- Network: Stable internet for backend access

Recommended for development:
- Processor: Intel i3 or above
- RAM: 8 GB or above
- SSD storage for faster dependency installation/build

#### 1.2.2 Software Specification
- Operating System: Windows 10/11, Linux, or macOS
- Runtime: Node.js (LTS)
- Package Manager: npm
- Frontend: React + TypeScript
- Build Tool: Vite
- Styling: Tailwind CSS + component primitives
- Backend Platform: Supabase
- Database: PostgreSQL
- Editor/IDE: Visual Studio Code
- Testing: Vitest (unit), Playwright (E2E support)
- Browser: Latest Chrome/Edge/Firefox

## 2. System Study

### 2.1 Existing System
Conventional indoor navigation generally depends on:
- Printed maps at entry points
- Direction boards in corridors
- Manual help from staff/security
- Trial-and-error room search

In most organizations and educational institutions, existing indoor guidance practices are still largely traditional and non-intelligent. The present system can be further understood through the following points:
- Printed maps are commonly displayed only at major entry points and are not always available at decision points inside buildings.
- Static signboards provide only directional hints and do not provide complete end-to-end route flow from source to destination.
- Handbooks, notice boards, and departmental charts may contain room information, but they are not designed for live navigation.
- Verbal guidance from staff, faculty, security personnel, or colleagues is often used, creating dependency on human availability.
- Guidance quality varies from person to person, causing inconsistent instructions and route confusion.
- Existing methods generally do not consider user context such as current floor, nearest path, or accessible transitions.
- Most traditional methods are difficult to update quickly when rooms are shifted, renamed, or repurposed.
- There is usually no centralized digital repository for building-wise and floor-wise navigable location data.

Limitations of generic digital alternatives:
- GPS-based applications such as Google Maps are designed mainly for outdoor navigation and open-road routing.
- Satellite-based positioning is weak or inaccurate inside buildings due to signal constraints.
- Generic map apps do not capture indoor entities like corridors, internal junctions, stairs, lifts, and room-to-room walk paths.
- Building-specific layouts, block-level segmentation, and floor transitions are not represented with required precision.
- Downloadable PDFs or image-based floor plans are static, non-interactive, and cannot compute an optimal path.
- Static documents on mobile devices are difficult to zoom, interpret, and follow while walking in real time.
- Users cannot receive step-by-step dynamic instructions based on their selected source and destination.

#### 2.1.1 Drawbacks
The existing indoor navigation methods have several limitations:
1. No Real-Time Guidance: Printed maps, signboards, and verbal directions do not provide step-by-step or dynamic route guidance.
2. Limited Indoor Accuracy: Generic GPS-based apps are unreliable indoors and cannot navigate corridors, rooms, or multiple floors.
3. Outdated Information: Physical maps and signboards do not automatically reflect changes in building layouts or room assignments.
4. Poor Mobile Experience: PDF or image-based maps are static, non-interactive, and difficult to view on smartphones.
5. Time Wastage: Users spend excessive time searching for rooms, offices, or facilities.
6. Accessibility Limitations: Existing methods do not support visually or mobility-impaired users, lacking features like audio guidance or wheelchair-friendly paths.
7. No Organizational Customization: Generic solutions do not account for building-specific shortcuts, restricted areas, or organizational policies.

#### 2.1.2 Problem Definition
Based on the limitations identified in the existing system, the problem can be defined as the absence of a reliable, interactive, and institution-specific indoor navigation mechanism that supports accurate route guidance for all users.

A digital indoor navigation system is required that can:
- Maintain a centralized and updatable repository of indoor location data, including rooms, corridors, stairs, lifts, and entry points.
- Represent indoor building layouts in a structured model that supports route computation rather than static reference-only viewing.
- Compute optimal routes between any valid source and destination within the institution.
- Provide clear step-by-step navigation instructions instead of generic directional hints.
- Handle multi-floor movement by identifying and guiding users through valid vertical connectors such as stairs and lifts.
- Improve indoor navigation accuracy where GPS-based outdoor systems are ineffective.
- Offer an interactive and mobile-friendly user experience for day-to-day usability.
- Reduce user dependency on staff for repeated navigation queries.
- Minimize time wastage and confusion for new students, employees, parents, and visitors.
- Support accessibility-oriented navigation needs and future assistive extensions.
- Reflect infrastructure changes quickly through editable backend data rather than physical map replacement.
- Enforce secure, role-based data maintenance so that authorized administrators can manage navigation information without compromising data integrity.

### 2.2 Proposed System
The proposed solution is a centralized, intelligent, and interactive Indoor Navigation System that provides accurate route guidance inside institutional buildings. Instead of relying on static references, the system uses structured indoor location data and algorithm-driven path computation to generate dynamic directions for users.

The proposed system models indoor movement as a weighted graph:
- Node = waypoint (room/corridor/stairs/lift/entrance)
- Edge = valid traversable connection
- Weight = route cost/distance

Proposed solution details:
- A web-based interface allows users to select source and destination locations quickly.
- The system computes an optimal path using graph-based shortest-route logic.
- Route output is presented as step-by-step instructions for easy understanding.
- Floor transitions are explicitly handled, guiding users through stairs or lift connectors.
- The route is visually displayed on floor maps to improve practical usability.
- The system supports multi-floor navigation with floor-aware context switching.
- A centralized backend stores waypoints, edges, floor maps, and role metadata.
- Data can be updated by administrators without changing frontend code.
- Public users can consume navigation data, while write actions remain role-restricted.
- Fallback seed datasets keep the system usable even when backend data is temporarily unavailable.
- The architecture supports future enhancements such as accessibility routing, audio prompts, mobile optimization, and analytics integration.

By combining algorithmic routing, interactive map visualization, and secure data management, the proposed solution overcomes the limitations of traditional indoor guidance methods and provides a scalable framework for institution-wide deployment.

#### 2.2.1 Objective
The primary objectives of the proposed Indoor Navigation System are:
- Provide accurate and quick indoor route guidance across blocks, floors, and room categories.
- Deliver clear step-by-step directions that reduce user confusion during movement.
- Minimize average navigation time for students, staff, and first-time visitors.
- Improve user convenience through an interactive, map-based, mobile-friendly interface.
- Support accessibility-focused navigation improvements and future assistive extensions.
- Handle multi-floor navigation effectively through stairs/lift transition guidance.
- Maintain a centralized and structured indoor location dataset for long-term consistency.
- Enable easy data updates through admin-controlled operations without frontend redesign.
- Ensure high reliability through fallback data strategies during temporary backend unavailability.
- Enforce secure architecture with public-read and role-based write permissions.
- Reduce dependency on manual human assistance for repeated navigation queries.
- Provide a scalable technical foundation for future features such as analytics, voice guidance, and smart rerouting.

#### 2.2.2 Features
The proposed Indoor Navigation System includes the following major features:

1. Source and Destination Based Route Search
- Users can select valid start and end points from available indoor locations.
- The system validates input and initiates route computation only for valid node pairs.

2. Weighted Shortest-Path Navigation
- Indoor paths are computed using a weighted graph model.
- The routing engine selects the least-cost feasible path for practical movement.

3. Floor-Aware Guidance with Transition Support
- The system identifies whether navigation is on a single floor or across multiple floors.
- Transition instructions are generated for stairs/lift usage wherever required.

4. Step-by-Step Direction Generation
- Computed paths are translated into user-friendly navigation instructions.
- Users receive sequential movement steps instead of static map-only guidance.

5. Interactive Floor Map Visualization
- Route paths are overlaid on floor maps for clear visual guidance.
- Users can switch floor views and track navigation context during route progression.

6. Dynamic Floor Map Retrieval with Fallback
- Floor map URLs can be loaded dynamically from backend storage.
- If backend map data is unavailable, static fallback maps are used to ensure continuity.

7. Seed-Data Fallback for Reliability
- When backend records are empty or temporarily unavailable, predefined seed data is loaded.
- This keeps route functionality active during initial setup and transient outages.

8. Role-Based Data Security
- Navigation data is publicly readable for normal usage.
- Insert, update, and delete operations are restricted to authorized admin roles.

9. Admin-Friendly Data Maintainability
- Indoor points, edges, and map metadata can be updated without frontend code changes.
- This enables quick adaptation to infrastructure changes such as room shifts or new facilities.

10. Scalable and Extensible Design
- The architecture is designed for future enhancements like voice guidance, accessibility routing, and analytics.
- New blocks, floors, and waypoint categories can be integrated with minimal structural changes.

#### 2.2.3 Modules
1. Navigation Interface Module
2. Navigation Data Module
3. Routing Engine Module
4. Floor Map Rendering Module
5. Security and Access Control Module
6. Admin Data Management Module

The proposed Indoor Navigation System is organized into modular components so that each layer can be developed, tested, and maintained independently. This modular architecture improves scalability, reduces coupling, and allows future feature additions without major redesign.

### Module Description
1. Navigation Interface Module
- Collects source and destination inputs
- Triggers route computation
- Displays route instructions and movement steps
- Provides floor-switch controls for route context visualization
- Shows user feedback for invalid selections or missing route paths
- Supports easy interaction flow for first-time users

Purpose:
- Acts as the primary interaction layer between users and the indoor navigation logic.
- Ensures the route request workflow remains simple, intuitive, and error-tolerant.

2. Navigation Data Module
- Fetches waypoints, edges, and maps from Supabase
- Handles loading state and fallback behavior
- Builds in-memory graph for routing
- Normalizes backend records into application-ready structures
- Applies fallback seed datasets if backend data is unavailable
- Exposes reusable data access methods to other modules

Purpose:
- Serves as the data bridge between backend storage and runtime route computation.
- Maintains consistency between persisted data and in-memory navigation state.

3. Routing Engine Module
- Maintains adjacency model of nodes and edges
- Computes path and distance
- Generates user-friendly step instructions
- Handles weighted shortest-path calculation for practical indoor movement
- Applies floor-transition handling while generating step sequences
- Produces route metadata such as floors visited and direction flow

Purpose:
- Performs the core computational logic of the system.
- Converts graph structures into actionable route guidance.

4. Floor Map Rendering Module
- Loads map image for selected floor
- Draws route overlays and floor-specific highlights
- Supports floor switching during step navigation
- Renders selected source and destination markers for visual clarity
- Keeps route presentation synchronized with selected step/floor
- Provides map fallback behavior when dynamic maps are unavailable

Purpose:
- Translates computed route data into an interpretable visual format.
- Improves real-world usability through map-based orientation.

5. Security and Access Control Module
- Uses role checks and RLS policy enforcement
- Allows public reads and admin-only modifications
- Prevents unauthorized insertion, update, and deletion operations
- Enforces policy-based access at database level for data safety
- Ensures safe multi-user operation in shared institutional environments

Purpose:
- Protects navigation data integrity and administrative operations.
- Guarantees controlled access aligned with institutional policy.

6. Admin Data Management Module
- Supports CRUD operations for waypoints/edges/maps
- Ensures route topology remains valid after updates
- Allows managed updates for room changes and infrastructure expansion
- Supports correction workflows for inaccurate node/edge definitions
- Helps maintain long-term dataset quality and route reliability

Purpose:
- Enables maintainability and lifecycle management of navigation data.
- Keeps the system aligned with changing physical campus infrastructure.

#### 2.2.4 Functional Requirements
Functional:
- Accept and validate source/destination
- Retrieve graph and map data
- Compute route using current graph model
- Display path, floor sequence, and instructions
- Generate step-by-step movement guidance for user readability
- Support single-floor and multi-floor route scenarios
- Provide user-triggered route reset and recalculation behavior

Data:
- Support waypoint metadata (name, floor, coordinates, type, block)
- Support graph edge metadata (from_node, to_node, distance)
- Support floor map metadata (floor, image URL)
- Maintain uniqueness and consistency constraints for key entities
- Preserve data validity during insert/update/delete operations

Security:
- Non-admin users cannot alter core navigation data
- Admin users can add/edit/delete data
- Role validation must be enforced at policy level, not only UI level
- Public read access must not compromise protected operations

Performance:
- Route generation should be near real-time for campus graph size
- UI must remain responsive while loading data
- Data fetching should avoid blocking the full interaction flow
- Route rendering should remain smooth during floor switching

Usability:
- Interface should be understandable for first-time users without training
- Route steps should be presented in clear and unambiguous language
- Visual map output should align with computed path sequence

Reliability:
- The system should continue basic functionality using fallback seed data
- Temporary backend failures should not cause complete navigation outage
- Data loading failures should be handled gracefully with user feedback

Maintainability:
- Navigation datasets should be updatable without frontend architecture changes
- Module-level design should support isolated enhancement and testing
- Schema-driven design should simplify future expansion to new blocks/floors

## 3. System Design and Development

The System Design and Development phase of the Indoor Navigation System focuses on transforming functional requirements into a reliable, scalable, and maintainable implementation. The architecture follows a modular approach in which user interface components, data handling logic, routing algorithms, and backend integration are separated into dedicated layers. This design reduces dependency between modules, simplifies debugging, and supports long-term enhancement.

From a design perspective, the system is built around a graph-based indoor navigation model. Locations are represented as structured waypoints and connected through weighted edges to support optimal path computation. The frontend layer handles user interaction and route visualization, while the backend layer manages persistent data, security policies, and administrative updates. This separation ensures that route logic remains consistent even when infrastructure data changes.

The development approach emphasizes practical usability and operational reliability. User inputs are validated before route processing, map rendering is synchronized with computed steps, and fallback data strategies are used to handle temporary backend unavailability. Security is integrated through role-based access control and policy enforcement, enabling public navigation usage while protecting data modification operations. Overall, this phase establishes the technical foundation required for accurate indoor guidance, smooth user experience, and future extensibility.

### 3.1 File Design
The project follows modular file organization:
- src/pages: Main app pages and route-level screens
- src/components: Reusable UI and map/navigation components
- src/hooks: Data and state logic
- src/lib: Navigation engine, utilities, and type definitions
- src/integrations/supabase: Backend client integration
- supabase/migrations: Schema, policies, and seed scripts
- public/floor-maps: Static map assets

This separation improves maintainability, scalability, and testability.

### 3.2 Input Design
User-side input:
- Source location
- Destination location
- Floor context (implicitly handled by node metadata)

Admin-side input:
- Waypoint coordinates and metadata
- Edge connections and distances
- Floor map image references

Validation:
- Required input checks for route selection
- Type and floor enum constraints at schema level
- Uniqueness constraints to avoid duplicate records

### 3.3 Output Design
System output includes:
- Ordered route path
- Estimated cumulative distance
- Step-by-step movement instructions
- Floor transition indicators
- Route overlay on map image

Output is designed for readability and immediate guidance.

### 3.4 Database Design
Main schema entities:
- profiles
- user_roles
- rooms
- waypoints
- graph_edges
- floor_maps
- campus_waypoints

Data integrity mechanisms:
- Enum types for floor and waypoint types
- Unique constraints on key identifiers
- Foreign-key references for user-linked data

Security mechanisms:
- Row Level Security enabled on critical tables
- has_role function for admin authorization checks
- Public read policies for navigation tables
- Admin-only insert/update/delete policies

### 3.5 System Development
Development flow followed:
1. Requirement analysis and location mapping
2. Schema and enum design
3. Route-engine implementation
4. Data hook and backend integration
5. UI and map rendering integration
6. Security policies and role handling
7. Seed data and migration refinement
8. Build and test validation

### 3.6 Description of Modules (Detailed Explanation About the Project Work)

1. Navigation Interface Implementation
- The main page combines sidebar controls, floor selector, and map display.
- Users select source and destination, then trigger path computation.
- Step selection updates the visible floor and route context.

2. Navigation Data Pipeline
- Data fetching runs in parallel for waypoints, graph_edges, and floor_maps.
- If the database is empty, seed datasets are loaded as fallback.
- The hook converts records into runtime node/edge entries.

3. Routing Logic Implementation
- Graph is stored in-memory as adjacency maps.
- Pathfinding follows weighted shortest-path strategy.
- A floor-change penalty is applied to prefer same-floor movement when possible.
- Result is transformed into user-readable navigation steps.

4. Map and Floor Logic
- Floor map URL is resolved from database metadata.
- If unavailable, local static maps are used.
- Route and nodes are rendered relative to stored coordinates.

5. Security and Admin Logic
- Authorization uses role-aware policy checks.
- Public users can read route data for navigation.
- Admin users can update waypoints, edges, and floor maps.

### 3.7 Logic Used (Algorithm and Decision Logic)
1. Graph Modeling Logic
- All campus positions are represented as vertices.
- Valid walkable transitions are represented as weighted edges.

2. Shortest Path Logic
- Initialize source distance as 0 and others as infinity.
- Repeatedly choose the unvisited node with minimum distance.
- Relax neighbor distances using edge weight and floor penalty.
- Reconstruct path from destination using predecessor links.

3. Floor Transition Logic
- When consecutive nodes belong to different floors, a transition step is generated.
- Instruction text identifies movement via stairs or lift.

4. Fallback Logic
- If DB waypoints/edges/maps are unavailable, seed data is loaded.
- This keeps navigation functional in initial or disconnected scenarios.

5. Block Assignment Logic (seed import)
- Block is inferred from x-coordinate ranges during import.
- This simplifies initial classification of campus points.

### 3.8 Tech Stack Explanation
Frontend:
- React: component-driven UI architecture
- TypeScript: strict types for safer integration
- Vite: fast development and optimized production build
- Tailwind CSS and UI primitives: consistent and responsive interface

Backend and Data:
- Supabase: managed PostgreSQL + API + auth ecosystem
- PostgreSQL: reliable relational model, constraints, and policy features
- SQL migrations: versioned schema and repeatable deployment setup

Quality and Tooling:
- ESLint: code-quality and style checks
- Vitest: unit testing capability
- Playwright: end-to-end testing capability

## 4. Testing and Implementation

### 4.1 Testing
Testing approach:
- Build validation through production build pipeline
- Unit test scaffold available with Vitest
- Manual functional tests for route generation and floor transitions
- Policy verification for read/write role behaviors

Sample functional test scenarios:

| Test Case ID | Test Scenario | Input / Preconditions | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| TC-01 | Valid route on same floor | Source and destination selected on same floor with connected path | System generates shortest path, distance, and step-by-step instructions on same floor | As expected | Pass |
| TC-02 | Valid route across floors | Source and destination selected on different floors with stairs/lift connectivity | System generates route with floor transition steps and floor sequence | As expected | Pass |
| TC-03 | Source not selected | Destination selected, source empty | System prevents navigation request and prompts user to select source | As expected | Pass |
| TC-04 | Destination not selected | Source selected, destination empty | System prevents navigation request and prompts user to select destination | As expected | Pass |
| TC-05 | Source equals destination | Same node selected as source and destination | System handles gracefully by showing minimal/zero movement guidance | As expected | Pass |
| TC-06 | Unreachable destination | Source and destination belong to disconnected graph segments | System shows no-path-found message without crash | As expected | Pass |
| TC-07 | Empty backend waypoints/edges | Database returns empty datasets for navigation tables | System loads fallback seed data and continues route operations | As expected | Pass |
| TC-08 | Floor map missing in backend | No dynamic floor map record for selected floor | System loads static fallback floor map | As expected | Pass |
| TC-09 | Public user data write attempt | Non-admin user attempts insert/update/delete | Operation denied by RLS/role policy | As expected | Pass |
| TC-10 | Admin data update operation | Admin user updates waypoint/edge/map data | Update succeeds and reflects in subsequent route computations | As expected | Pass |
| TC-11 | Route rendering after floor switch | Navigate route and click steps across floors | Map updates to corresponding floor with aligned path display | As expected | Pass |
| TC-12 | Build and lint validation | Run production build and project checks | No blocking build errors for documented feature flow | As expected | Pass |

### 4.2 Implementation
Implementation procedure:
1. Environment Preparation
- Install Node.js (LTS) and npm for frontend build/runtime.
- Configure project workspace and install all package dependencies.
- Verify developer tooling such as TypeScript, Vite, and lint/test scripts.

2. Backend Configuration
- Configure Supabase project credentials and environment variables.
- Verify database connectivity from the application runtime.
- Confirm required schema objects exist before first run.

3. Database Initialization
- Apply migrations in sequence to create enums, tables, constraints, and policies.
- Execute seed scripts to load baseline waypoints and graph edges.
- Validate that floor maps and navigation metadata are available.

4. Application Bootstrapping
- Start frontend development server and load initial route page.
- Confirm data loading states and fallback behavior are functioning.
- Ensure runtime graph is constructed from database or seed data.

5. Functional Verification
- Perform same-floor and multi-floor navigation checks.
- Verify route instruction generation and map overlay alignment.
- Validate no-path handling, missing map fallback, and empty data fallback.

6. Security and Access Validation
- Confirm public users have read-only access to navigation data.
- Validate admin-only insert/update/delete privileges via role policies.
- Recheck Row Level Security (RLS) behavior for protected tables.

7. Build and Pre-Deployment Validation
- Run production build and resolve blocking warnings/errors.
- Re-verify core route flows in a near-production configuration.
- Confirm configuration values for deployment target environment.

Deployment notes:
- Ensure production Supabase URL and anon key are correctly configured.
- Keep migration order consistent across staging and production.
- Ensure floor map URLs are valid, accessible, and stable.
- Verify RLS policies before release to prevent unintended write access.
- Maintain backup/export strategy for navigation master data.
- Use controlled release with smoke testing after deployment.
- Monitor route generation, map loading, and API response behavior post-release.

## 5. Conclusion
Indoor Navigation System successfully addresses a real and recurring problem in large educational environments: accurate and time-efficient indoor wayfinding. By replacing static and manual guidance methods with a graph-driven digital approach, the system enables users to identify routes between source and destination points with clear step-by-step guidance and floor-aware transitions. The implemented workflow improves navigation clarity for students, staff, and visitors, especially in multi-block and multi-floor infrastructure.

From a technical perspective, the project demonstrates effective integration of frontend interaction, route computation logic, backend data management, and policy-based security. The use of a weighted graph model provides a reliable foundation for shortest-path navigation, while map overlays improve practical usability. Supabase-backed PostgreSQL storage, combined with role-controlled access policies, supports secure and maintainable data operations. Fallback mechanisms for seed data and floor maps further increase operational reliability during initialization and temporary backend inconsistencies.

The project also meets important software engineering goals, including modular architecture, maintainable code organization, and scalable design practices. Each major module such as navigation UI, data loading, route engine, and access control is separable and extensible, allowing future enhancement without major structural changes. This makes the system suitable not only as an academic implementation but also as a deployable institutional utility.

In terms of user impact, the solution reduces time wastage, dependency on manual assistance, and confusion in unfamiliar indoor spaces. It offers a practical base for additional smart-campus features such as accessibility-first routing, voice-assisted navigation, QR-based source detection, and movement analytics. As a whole, the Indoor Navigation System establishes a strong foundation for reliable indoor digital navigation and demonstrates how data modeling, algorithmic reasoning, and user-centered design can be combined to solve real-world institutional challenges.

## Bibliography
1. React Documentation - https://react.dev/
2. TypeScript Documentation - https://www.typescriptlang.org/
3. Vite Documentation - https://vite.dev/
4. Tailwind CSS Documentation - https://tailwindcss.com/docs
5. Supabase Documentation - https://supabase.com/docs
6. PostgreSQL Documentation - https://www.postgresql.org/docs/
7. Vitest Documentation - https://vitest.dev/
8. Playwright Documentation - https://playwright.dev/

## Appendices

### A. Data Flow Diagram
Context-level flow:
- User submits source/destination
- System reads navigation data from database
- Route engine computes path
- System returns route instructions and map output
- Admin submits data maintenance operations

Level-1 process decomposition:
1. Input and validation
2. Data retrieval
3. Route computation
4. Map rendering
5. Admin maintenance and policy checks

### B. Table Structure
1. profiles
- id (UUID, PK)
- user_id (UUID, unique, auth reference)
- display_name, avatar_url
- created_at, updated_at

2. user_roles
- id (UUID, PK)
- user_id (UUID)
- role (app_role enum: admin/user)

3. rooms
- id (UUID, PK)
- room_number, room_name
- floor (floor_type enum)
- block
- x, y, width, height
- created_at, updated_at

4. waypoints
- id (UUID, PK)
- name
- floor (floor_type enum)
- x, y
- type (waypoint_type enum)
- block
- created_at

5. graph_edges
- id (UUID, PK)
- from_node, to_node
- distance
- floor
- is_vertical
- created_at

6. floor_maps
- id (UUID, PK)
- floor (unique)
- image_url
- uploaded_at

### C. Sample Coding
Core route logic summary:
- Build graph from waypoint and edge datasets
- Execute weighted shortest-path traversal
- Add floor-change penalty to prefer same-floor paths
- Reconstruct path and generate instructions

### D. Sample Input
To be inserted by project team:
- Screenshot/form values for selected source and destination
- Example campus points used during demo

### E. Sample Output
To be inserted by project team:
- Route result screenshot (path, distance, step list)
- Floor map overlay screenshot for one complete route





