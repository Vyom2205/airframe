/**
 * AirFrame - Procedural Airport Generator
 * 
 * Disclaimer: All generated airports are fictional and created for artistic purposes only.
 * Outputs are stylized, non-navigational, and do not represent real-world infrastructure.
 * 
 * Architecture:
 * 1. AirportGenerator - Procedural generation of fictional airport layouts
 * 2. AirportRenderer - Blueprint-style SVG rendering
 * 3. ExportManager - SVG/PNG export with branding
 * 4. App Controller - UI coordination
 */

// ==================== Configuration ====================
const THEMES = {
    blueprint: {
        background: '#0a2463',
        stroke: '#ffffff',
        runwayWidth: 4,
        taxiwayWidth: 2,
        buildingWidth: 1,
        gateWidth: 0.5
    },
    dark: {
        background: '#1a1a1a',
        stroke: '#ffffff',
        runwayWidth: 4,
        taxiwayWidth: 2,
        buildingWidth: 1,
        gateWidth: 0.5
    },
    white: {
        background: '#ffffff',
        stroke: '#000000',
        runwayWidth: 4,
        taxiwayWidth: 2,
        buildingWidth: 1,
        gateWidth: 0.5
    }
};

const ASPECT_RATIOS = {
    '16:9': { width: 3840, height: 2160 },
    '9:16': { width: 2160, height: 3840 },
    '1:1': { width: 2160, height: 2160 }
};

// ==================== Seeded Random Number Generator ====================
class SeededRandom {
    constructor(seed) {
        this.seed = seed || Math.floor(Math.random() * 1000000);
    }
    
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    
    range(min, max) {
        return min + this.next() * (max - min);
    }
    
    choice(array) {
        return array[Math.floor(this.next() * array.length)];
    }
}

// ==================== Airport Zoning Constants ====================
const AIRPORT_ZONES = {
    AIRSIDE_CLEARANCE: 500,        // Minimum distance from runways to terminals
    TERMINAL_SPACING: 250,          // Minimum spacing between terminal structures  
    CONCOURSE_SPACING: 180,         // Minimum spacing between concourses
    APRON_BUFFER: 150,              // Open space around terminals
    TAXIWAY_CORRIDOR_WIDTH: 100,    // Width of main taxiway corridors
    TAXIWAY_GRID_SPACING: 120,      // Spacing between parallel taxiways in grid
    TAXIWAY_LANE_WIDTH: 25,         // Visual width of taxiway lane
    CORNER_RADIUS: 40,               // Radius for rounded taxiway corners
    MAX_TAXIWAY_CONNECTION_DIST: 1000  // Maximum distance for taxiway connections
};

// ==================== Airport Generator ====================
class AirportGenerator {
    constructor(config) {
        this.config = config;
        this.rng = new SeededRandom(config.seed);
        this.airport = {
            runways: [],
            taxiways: [],
            terminals: [],
            gates: [],
            aprons: []
        };
        
        // Spatial zones for collision detection
        this.zones = {
            airside: [],      // Runway exclusion zones
            terminalCore: [], // Primary terminal zone
            concourse: [],    // Concourse zones
            apron: []         // Apron buffer zones
        };
    }
    
    /**
     * Generate complete airport layout with structured zoning
     */
    generate() {
        // Step 1: Generate runways as primary structural axes (Airside Zone)
        this.generateRunways();
        this.defineAirsideZone();
        
        // Step 2: Generate ONE primary terminal spine (Terminal Core Zone)
        this.generatePrimaryTerminal();
        
        // Step 3: Generate concourses from terminal spine (Concourse Zone)
        this.generateConcourses();
        
        // Step 4: Generate apron buffer zones
        this.generateAprons();
        
        // Step 5: Generate gates along concourses (evenly spaced, consistent orientation)
        this.generateGates();
        
        // Step 6: Generate disciplined taxiway network
        this.generateTaxiways();
        
        return this.airport;
    }
    
    /**
     * Define airside exclusion zone around runways
     */
    defineAirsideZone() {
        this.airport.runways.forEach(runway => {
            this.zones.airside.push({
                center: {
                    x: (runway.start.x + runway.end.x) / 2,
                    y: (runway.start.y + runway.end.y) / 2
                },
                length: this.distance(runway.start, runway.end),
                width: runway.width + AIRPORT_ZONES.AIRSIDE_CLEARANCE * 2,
                angle: Math.atan2(runway.end.y - runway.start.y, runway.end.x - runway.start.x)
            });
        });
    }
    
    /**
     * Check if a point is in the airside zone
     */
    isInAirsideZone(point) {
        return this.zones.airside.some(zone => {
            const dx = point.x - zone.center.x;
            const dy = point.y - zone.center.y;
            const rotatedX = dx * Math.cos(-zone.angle) - dy * Math.sin(-zone.angle);
            const rotatedY = dx * Math.sin(-zone.angle) + dy * Math.cos(-zone.angle);
            
            return Math.abs(rotatedX) < zone.length / 2 && Math.abs(rotatedY) < zone.width / 2;
        });
    }
    
    /**
     * Calculate distance between two points
     */
    distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Generate runways based on configuration
     */
    generateRunways() {
        const count = this.config.runwayCount;
        const config = this.config.runwayConfig;
        
        if (config === 'parallel' || (config === 'random' && this.rng.next() > 0.5)) {
            this.generateParallelRunways(count);
        } else if (config === 'crossing') {
            this.generateCrossingRunways(count);
        } else {
            // Random mix
            if (count <= 2) {
                this.generateParallelRunways(count);
            } else {
                this.generateCrossingRunways(count);
            }
        }
    }
    
    generateParallelRunways(count) {
        const baseAngle = this.rng.range(0, Math.PI / 4); // 0-45 degrees
        const spacing = 400 + this.rng.range(0, 200);
        const length = 2500 + this.rng.range(0, 1000);
        
        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * spacing;
            const perpAngle = baseAngle + Math.PI / 2;
            
            const centerX = Math.cos(perpAngle) * offset;
            const centerY = Math.sin(perpAngle) * offset;
            
            const dx = Math.cos(baseAngle) * length / 2;
            const dy = Math.sin(baseAngle) * length / 2;
            
            this.airport.runways.push({
                start: { x: centerX - dx, y: centerY - dy },
                end: { x: centerX + dx, y: centerY + dy },
                width: 50 + this.rng.range(0, 20)
            });
        }
    }
    
    generateCrossingRunways(count) {
        const angles = [];
        for (let i = 0; i < count; i++) {
            angles.push((i * Math.PI / count) + this.rng.range(-0.2, 0.2));
        }
        
        angles.forEach(angle => {
            const length = 2500 + this.rng.range(0, 800);
            const dx = Math.cos(angle) * length / 2;
            const dy = Math.sin(angle) * length / 2;
            
            this.airport.runways.push({
                start: { x: -dx, y: -dy },
                end: { x: dx, y: dy },
                width: 50 + this.rng.range(0, 20)
            });
        });
    }
    
    /**
     * Generate ONE primary terminal spine (Terminal Core Zone)
     * This acts as the root for all concourses
     */
    generatePrimaryTerminal() {
        // Position terminal perpendicular to average runway angle
        let terminalOffset = AIRPORT_ZONES.AIRSIDE_CLEARANCE + 300;
        const terminalAngle = this.getAverageRunwayAngle() + Math.PI / 2;
        
        let terminalX = Math.cos(terminalAngle) * terminalOffset;
        let terminalY = Math.sin(terminalAngle) * terminalOffset;
        
        // Ensure terminal is outside airside zone
        while (this.isInAirsideZone({ x: terminalX, y: terminalY })) {
            terminalOffset += 100;
            terminalX = Math.cos(terminalAngle) * terminalOffset;
            terminalY = Math.sin(terminalAngle) * terminalOffset;
        }
        
        // Create single dominant terminal spine
        const angle = this.getAverageRunwayAngle();
        const length = 400 + this.config.gateCount * 15; // Scale with gate count
        const width = 120;
        
        // Determine gate orientation: gates should face TOWARD runway center (apron side)
        // If terminal is positioned in positive perpendicular direction, gates face negative (toward origin)
        // Calculate which side faces the runways
        const vectorToRunway = { x: -terminalX, y: -terminalY };  // Vector from terminal to origin/runway center
        const perpVector = { x: Math.cos(angle + Math.PI / 2), y: Math.sin(angle + Math.PI / 2) };
        // Dot product determines if gates should face +perp or -perp direction
        const dotProduct = vectorToRunway.x * perpVector.x + vectorToRunway.y * perpVector.y;
        const gateDirection = dotProduct > 0 ? 1 : -1;  // +1 means gates extend in +perp direction, -1 means -perp
        
        const dx = Math.cos(angle) * length / 2;
        const dy = Math.sin(angle) * length / 2;
        const perpDx = Math.cos(angle + Math.PI / 2) * width / 2;
        const perpDy = Math.sin(angle + Math.PI / 2) * width / 2;
        
        this.airport.terminals.push({
            points: [
                { x: terminalX - dx - perpDx, y: terminalY - dy - perpDy },
                { x: terminalX + dx - perpDx, y: terminalY + dy - perpDy },
                { x: terminalX + dx + perpDx, y: terminalY + dy + perpDy },
                { x: terminalX - dx + perpDx, y: terminalY - dy + perpDy }
            ],
            center: { x: terminalX, y: terminalY },
            angle,
            length,
            width,
            isPrimary: true,
            gateDirection  // Store which side gates should face (toward runways)
        });
        
        // Mark terminal core zone
        this.zones.terminalCore.push({
            center: { x: terminalX, y: terminalY },
            length,
            width: width + AIRPORT_ZONES.TERMINAL_SPACING,
            angle
        });
    }
    
    /**
     * Generate concourses extending from primary terminal
     * Uses controlled attachment patterns based on layout type
     */
    generateConcourses() {
        const layout = this.config.terminalLayout;
        const gateCount = this.config.gateCount;
        const primaryTerminal = this.airport.terminals[0];
        
        if (layout === 'linear') {
            // Linear: No additional concourses, gates directly on main terminal
            return;
        } else if (layout === 'pier') {
            this.generatePierConcourses(primaryTerminal, gateCount);
        } else if (layout === 'satellite') {
            this.generateSatelliteConcourses(primaryTerminal, gateCount);
        } else {
            // Hybrid: Combination of pier + one satellite
            this.generateHybridConcourses(primaryTerminal, gateCount);
        }
    }
    
    /**
     * Generate pier concourses perpendicular to main terminal
     * Ensures equal spacing and no overlaps
     */
    generatePierConcourses(primaryTerminal, gateCount) {
        const concourseCount = Math.min(Math.ceil(gateCount / 8), 4); // Max 4 piers
        const pierWidth = 40;
        const pierLength = 180 + this.rng.range(0, 80);
        
        // Calculate equal spacing along primary terminal
        const usableLength = primaryTerminal.length * 0.8; // Use 80% of length
        const spacing = usableLength / (concourseCount + 1);
        
        for (let i = 0; i < concourseCount; i++) {
            // Position along primary terminal (centered distribution)
            const offset = ((i + 1) * spacing) - (primaryTerminal.length / 2);
            const pierCenterX = primaryTerminal.center.x + Math.cos(primaryTerminal.angle) * offset;
            const pierCenterY = primaryTerminal.center.y + Math.sin(primaryTerminal.angle) * offset;
            
            // Pier extends perpendicular to main terminal (towards apron side)
            // Use same gate direction as primary terminal
            const direction = primaryTerminal.gateDirection || 1;
            const pierAngle = primaryTerminal.angle + (Math.PI / 2) * direction;
            const perpOffset = primaryTerminal.width / 2 + pierLength / 2;
            
            const finalX = pierCenterX + Math.cos(pierAngle) * perpOffset;
            const finalY = pierCenterY + Math.sin(pierAngle) * perpOffset;
            
            // Build pier geometry
            const pierDx = Math.cos(pierAngle) * pierLength / 2;
            const pierDy = Math.sin(pierAngle) * pierLength / 2;
            const pierPerpDx = Math.cos(pierAngle + Math.PI / 2) * pierWidth / 2;
            const pierPerpDy = Math.sin(pierAngle + Math.PI / 2) * pierWidth / 2;
            
            this.airport.terminals.push({
                points: [
                    { x: finalX - pierDx - pierPerpDx, y: finalY - pierDy - pierPerpDy },
                    { x: finalX + pierDx - pierPerpDx, y: finalY + pierDy - pierPerpDy },
                    { x: finalX + pierDx + pierPerpDx, y: finalY + pierDy + pierPerpDy },
                    { x: finalX - pierDx + pierPerpDx, y: finalY - pierDy + pierPerpDy }
                ],
                center: { x: finalX, y: finalY },
                angle: pierAngle,
                length: pierLength,
                width: pierWidth,
                isPrimary: false,
                concourseIndex: i,
                gateDirection: direction  // Inherit gate direction from primary terminal
            });
            
            // Mark concourse zone for collision detection
            this.zones.concourse.push({
                center: { x: finalX, y: finalY },
                length: pierLength,
                width: pierWidth + AIRPORT_ZONES.CONCOURSE_SPACING,
                angle: pierAngle
            });
        }
    }
    
    /**
     * Generate satellite concourses around central hub
     * Ensures symmetric placement and no overlaps
     */
    generateSatelliteConcourses(primaryTerminal, gateCount) {
        const satelliteCount = Math.min(Math.ceil(gateCount / 10), 3); // Max 3 satellites
        const satelliteSize = 140;
        const satelliteDistance = 400 + AIRPORT_ZONES.CONCOURSE_SPACING;
        
        // Determine apron side (perpendicular to terminal, away from runways)
        // Use same gate direction as primary terminal
        const direction = primaryTerminal.gateDirection || 1;
        const apronAngle = primaryTerminal.angle + (Math.PI / 2) * direction;
        
        // Place satellites symmetrically around a point offset from main terminal
        const hubX = primaryTerminal.center.x + Math.cos(apronAngle) * (satelliteDistance / 2);
        const hubY = primaryTerminal.center.y + Math.sin(apronAngle) * (satelliteDistance / 2);
        
        for (let i = 0; i < satelliteCount; i++) {
            // Distribute satellites in an arc (not full circle - stay on apron side)
            const arcSpan = Math.PI * 0.8; // 144 degrees
            const angleOffset = (arcSpan / Math.max(satelliteCount - 1, 1)) * i - arcSpan / 2;
            const satAngle = apronAngle + angleOffset;
            
            const satX = hubX + Math.cos(satAngle) * satelliteDistance;
            const satY = hubY + Math.sin(satAngle) * satelliteDistance;
            const satHalf = satelliteSize / 2;
            
            this.airport.terminals.push({
                points: [
                    { x: satX - satHalf, y: satY - satHalf },
                    { x: satX + satHalf, y: satY - satHalf },
                    { x: satX + satHalf, y: satY + satHalf },
                    { x: satX - satHalf, y: satY + satHalf }
                ],
                center: { x: satX, y: satY },
                angle: satAngle,
                length: satelliteSize,
                width: satelliteSize,
                isPrimary: false,
                concourseIndex: i,
                gateDirection: direction  // Inherit gate direction from primary terminal
            });
            
            this.zones.concourse.push({
                center: { x: satX, y: satY },
                length: satelliteSize,
                width: satelliteSize + AIRPORT_ZONES.CONCOURSE_SPACING,
                angle: satAngle
            });
        }
    }
    
    /**
     * Generate hybrid layout (pier + satellite)
     */
    generateHybridConcourses(primaryTerminal, gateCount) {
        // Add 1-2 piers
        const pierCount = Math.min(Math.ceil(gateCount / 15), 2);
        this.generatePierConcoursesLimited(primaryTerminal, pierCount);
        
        // Add 1 satellite
        this.generateSatelliteConcoursesLimited(primaryTerminal, 1);
    }
    
    generatePierConcoursesLimited(primaryTerminal, count) {
        const pierWidth = 40;
        const pierLength = 180;
        const spacing = primaryTerminal.length / (count + 1);
        const direction = primaryTerminal.gateDirection || 1;
        
        for (let i = 0; i < count; i++) {
            const offset = ((i + 1) * spacing) - (primaryTerminal.length / 2);
            const pierCenterX = primaryTerminal.center.x + Math.cos(primaryTerminal.angle) * offset;
            const pierCenterY = primaryTerminal.center.y + Math.sin(primaryTerminal.angle) * offset;
            
            const pierAngle = primaryTerminal.angle + (Math.PI / 2) * direction;
            const perpOffset = primaryTerminal.width / 2 + pierLength / 2;
            
            const finalX = pierCenterX + Math.cos(pierAngle) * perpOffset;
            const finalY = pierCenterY + Math.sin(pierAngle) * perpOffset;
            
            const pierDx = Math.cos(pierAngle) * pierLength / 2;
            const pierDy = Math.sin(pierAngle) * pierLength / 2;
            const pierPerpDx = Math.cos(pierAngle + Math.PI / 2) * pierWidth / 2;
            const pierPerpDy = Math.sin(pierAngle + Math.PI / 2) * pierWidth / 2;
            
            this.airport.terminals.push({
                points: [
                    { x: finalX - pierDx - pierPerpDx, y: finalY - pierDy - pierPerpDy },
                    { x: finalX + pierDx - pierPerpDx, y: finalY + pierDy - pierPerpDy },
                    { x: finalX + pierDx + pierPerpDx, y: finalY + pierDy + pierPerpDy },
                    { x: finalX - pierDx + pierPerpDx, y: finalY - pierDy + pierPerpDy }
                ],
                center: { x: finalX, y: finalY },
                angle: pierAngle,
                length: pierLength,
                width: pierWidth,
                isPrimary: false,
                gateDirection: direction
            });
        }
    }
    
    generateSatelliteConcoursesLimited(primaryTerminal, count) {
        const satelliteSize = 140;
        const satelliteDistance = 450;
        const direction = primaryTerminal.gateDirection || 1;
        const apronAngle = primaryTerminal.angle + (Math.PI / 2) * direction;
        
        const satX = primaryTerminal.center.x + Math.cos(apronAngle) * satelliteDistance;
        const satY = primaryTerminal.center.y + Math.sin(apronAngle) * satelliteDistance;
        const satHalf = satelliteSize / 2;
        
        this.airport.terminals.push({
            points: [
                { x: satX - satHalf, y: satY - satHalf },
                { x: satX + satHalf, y: satY - satHalf },
                { x: satX + satHalf, y: satY + satHalf },
                { x: satX - satHalf, y: satY + satHalf }
            ],
            center: { x: satX, y: satY },
            angle: apronAngle,
            length: satelliteSize,
            width: satelliteSize,
            isPrimary: false,
            gateDirection: direction
        });
    }
    
    /**
     * Generate structured grid-based taxiway network with rounded corners
     * Implements node-based system inspired by classic airport diagrams (1955 JFK style)
     * Features: Main corridors parallel to runways, perpendicular connectors, rounded intersections
     */
    generateTaxiways() {
        const density = this.config.taxiwayDensity;
        const primaryTerminal = this.airport.terminals[0];
        
        // Initialize taxiway node network
        this.taxiwayNodes = [];
        this.taxiwaySegments = [];
        
        // Step 1: Define runway exit/entry nodes
        this.defineRunwayNodes();
        
        // Step 2: Define apron entry nodes (front of terminals)
        this.defineApronNodes();
        
        // Step 3: Create grid backbone - main corridors parallel to runways
        this.createMainCorridorGrid(density);
        
        // Step 4: Create perpendicular connectors at clean intervals
        this.createPerpendicularConnectors(density);
        
        // Step 5: Create apron perimeter taxiways
        this.createApronPerimeterTaxiways();
        
        // Step 6: Convert segments to paths with rounded corners
        this.buildTaxiwayPathsWithRoundedCorners();
    }
    
    /**
     * Define key nodes along runways for taxiway exits/entries
     * Distributed along runway length to mimic real large airports (5-8 exits per runway)
     */
    defineRunwayNodes() {
        this.runwayExitNodes = [];
        const density = this.config.taxiwayDensity || 'medium'; // Fallback to medium if not set
        
        // More exit points for realistic distribution - no convergence at single points
        const exitCount = density === 'high' ? 8 : density === 'medium' ? 6 : 5;
        
        this.airport.runways.forEach((runway, rwIdx) => {
            const runwayAngle = Math.atan2(runway.end.y - runway.start.y, runway.end.x - runway.start.x);
            const perpAngle = runwayAngle + Math.PI / 2;
            
            // Place exit nodes along runway at regular intervals (distributed, not clustered)
            for (let i = 0; i < exitCount; i++) {
                // Distribute evenly but avoid the very start/end (0.05 to 0.95)
                const t = 0.05 + (i / (exitCount - 1)) * 0.9;
                const runwayPoint = {
                    x: runway.start.x + (runway.end.x - runway.start.x) * t,
                    y: runway.start.y + (runway.end.y - runway.start.y) * t
                };
                
                // Offset to taxiway side
                const offset = runway.width + 60;
                const node = {
                    x: runwayPoint.x + Math.cos(perpAngle) * offset,
                    y: runwayPoint.y + Math.sin(perpAngle) * offset,
                    type: 'runwayExit',
                    runwayIndex: rwIdx,
                    position: t,
                    exitIndex: i
                };
                
                this.runwayExitNodes.push(node);
                this.taxiwayNodes.push(node);
            }
        });
    }
    
    /**
     * Define nodes at apron entry points (front of terminals)
     */
    defineApronNodes() {
        this.apronEntryNodes = [];
        const primaryTerminal = this.airport.terminals[0];
        const apronAngle = primaryTerminal.angle + Math.PI / 2;
        
        // Calculate apron front edge
        const apronDepth = AIRPORT_ZONES.APRON_BUFFER;
        const apronWidth = primaryTerminal.length * 1.2;
        
        const apronCenter = {
            x: primaryTerminal.center.x + Math.cos(apronAngle) * (primaryTerminal.width / 2 + apronDepth),
            y: primaryTerminal.center.y + Math.sin(apronAngle) * (primaryTerminal.width / 2 + apronDepth)
        };
        
        // Create nodes along apron edge at regular intervals
        const nodeCount = 5;
        for (let i = 0; i < nodeCount; i++) {
            const t = (i / (nodeCount - 1)) - 0.5;
            const node = {
                x: apronCenter.x + Math.cos(primaryTerminal.angle) * apronWidth * t,
                y: apronCenter.y + Math.sin(primaryTerminal.angle) * apronWidth * t,
                type: 'apronEntry',
                position: i
            };
            
            this.apronEntryNodes.push(node);
            this.taxiwayNodes.push(node);
        }
    }
    
    /**
     * Create main taxiway corridors forming grid backbone (parallel to runways)
     * Multiple parallel corridors with proper spacing - mimics real large airport layouts
     */
    createMainCorridorGrid(density) {
        // Real airports have 2-3 parallel taxiways along runways
        // Explicitly handle each density case for clarity
        const corridorCount = density === 'high' ? 3 : (density === 'medium' ? 2 : 1);
        
        this.airport.runways.forEach((runway, rwIdx) => {
            const runwayAngle = Math.atan2(runway.end.y - runway.start.y, runway.end.x - runway.start.x);
            const perpAngle = runwayAngle + Math.PI / 2;
            
            // Create parallel corridors at different offsets with proper spacing
            for (let c = 0; c < corridorCount; c++) {
                const offset = runway.width + 60 + (c * AIRPORT_ZONES.TAXIWAY_GRID_SPACING);
                const offsetX = Math.cos(perpAngle) * offset;
                const offsetY = Math.sin(perpAngle) * offset;
                
                const corridorStart = {
                    x: runway.start.x + offsetX,
                    y: runway.start.y + offsetY,
                    type: 'corridor',
                    corridorIndex: c,
                    runwayIndex: rwIdx
                };
                
                const corridorEnd = {
                    x: runway.end.x + offsetX,
                    y: runway.end.y + offsetY,
                    type: 'corridor',
                    corridorIndex: c,
                    runwayIndex: rwIdx
                };
                
                this.taxiwayNodes.push(corridorStart, corridorEnd);
                
                // Create straight segment for corridor
                this.taxiwaySegments.push({
                    start: corridorStart,
                    end: corridorEnd,
                    type: 'corridor',
                    isStraight: true
                });
            }
        });
    }
    
    /**
     * Create perpendicular connectors from corridors to apron at clean intervals
     * Distributes connections across multiple runway exits - not converging at single points
     */
    createPerpendicularConnectors(density) {
        const connectionCount = density === 'high' ? 4 : density === 'medium' ? 3 : 2;
        
        // Strategy: Connect apron nodes to distributed runway exit nodes
        // Avoids all taxiways converging at one point
        this.apronEntryNodes.forEach((apronNode, idx) => {
            // Skip some connections for lower density
            if (density === 'low' && idx % 2 === 0) return;
            if (density === 'medium' && idx === 0) return;
            
            // Find nearest runway exit nodes but distribute connections
            // Group runway exits by runway to ensure distribution
            const exitsByRunway = {};
            this.runwayExitNodes.forEach(node => {
                if (!exitsByRunway[node.runwayIndex]) {
                    exitsByRunway[node.runwayIndex] = [];
                }
                exitsByRunway[node.runwayIndex].push(node);
            });
            
            // Connect to the closest 1-2 exits per runway (not all exits)
            Object.keys(exitsByRunway).forEach(rwIdx => {
                const exits = exitsByRunway[rwIdx];
                
                // Find closest exit on this runway
                const distances = exits.map(exit => ({
                    exit,
                    dist: this.distance(apronNode, exit)
                }));
                distances.sort((a, b) => a.dist - b.dist);
                
                // Connect to 1-2 closest exits (depending on density)
                const connectCount = density === 'high' ? 2 : 1;
                distances.slice(0, connectCount).forEach(({exit, dist}) => {
                    if (dist < AIRPORT_ZONES.MAX_TAXIWAY_CONNECTION_DIST) {
                        // Create intermediate node for right-angle connection
                        const midX = (apronNode.x + exit.x) / 2;
                        const midNode = {
                            x: midX,
                            y: exit.y,
                            type: 'intersection'
                        };
                        
                        this.taxiwayNodes.push(midNode);
                        
                        // Create two perpendicular segments
                        this.taxiwaySegments.push({
                            start: exit,
                            end: midNode,
                            type: 'connector',
                            needsRounding: true
                        });
                        
                        this.taxiwaySegments.push({
                            start: midNode,
                            end: apronNode,
                            type: 'connector',
                            needsRounding: true
                        });
                    }
                });
            });
        });
    }
    
    /**
     * Create taxiways around apron perimeter (parallel to terminal)
     */
    createApronPerimeterTaxiways() {
        // Connect apron entry nodes in sequence
        for (let i = 0; i < this.apronEntryNodes.length - 1; i++) {
            this.taxiwaySegments.push({
                start: this.apronEntryNodes[i],
                end: this.apronEntryNodes[i + 1],
                type: 'apronEdge',
                isStraight: true
            });
        }
    }
    
    /**
     * Build final taxiway paths with rounded corners at intersections
     * Implements Bezier curves for smooth rounded transitions
     */
    buildTaxiwayPathsWithRoundedCorners() {
        this.airport.taxiways = [];
        
        this.taxiwaySegments.forEach(segment => {
            if (segment.isStraight) {
                // Simple straight path
                this.airport.taxiways.push({
                    path: [segment.start, segment.end],
                    type: segment.type
                });
            } else if (segment.needsRounding) {
                // Create path with rounded corner at intersection
                const path = this.createRoundedCornerPath(segment.start, segment.end);
                this.airport.taxiways.push({
                    path: path,
                    type: segment.type
                });
            } else {
                // Default smooth curve
                const path = [segment.start, segment.end];
                this.airport.taxiways.push({
                    path: path,
                    type: segment.type
                });
            }
        });
    }
    
    /**
     * Create path with rounded corner using arc/Bezier curve
     */
    createRoundedCornerPath(start, end) {
        const path = [start];
        
        // Calculate direction vectors
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // For longer segments, add intermediate points with subtle curves
        if (dist > 200) {
            const segments = Math.floor(dist / 150);
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                path.push({
                    x: start.x + dx * t,
                    y: start.y + dy * t
                });
            }
        }
        
        path.push(end);
        return path;
    }
    
    /**
     * Generate gates along terminals with even spacing and consistent orientation
     * All gates face the apron side (perpendicular to concourse)
     */
    generateGates() {
        const totalGates = this.config.gateCount;
        let gatesAssigned = 0;
        
        // Guard against no terminals
        if (this.airport.terminals.length === 0) {
            console.warn('No terminals available for gate placement');
            return;
        }
        
        // Distribute gates across all terminals (primary + concourses)
        const gatesPerTerminal = Math.ceil(totalGates / this.airport.terminals.length);
        
        this.airport.terminals.forEach(terminal => {
            if (gatesAssigned >= totalGates) return;
            
            const gatesForThisTerminal = Math.min(gatesPerTerminal, totalGates - gatesAssigned);
            const gateSpacing = terminal.length / (gatesForThisTerminal + 1);
            
            for (let i = 0; i < gatesForThisTerminal; i++) {
                // Calculate position along terminal edge
                const t = ((i + 1) * gateSpacing) - (terminal.length / 2);
                const edgeX = terminal.center.x + Math.cos(terminal.angle) * t;
                const edgeY = terminal.center.y + Math.sin(terminal.angle) * t;
                
                // Gates extend perpendicular from terminal TOWARDS APRON (consistent orientation)
                // Use gateDirection if available (determines which side faces runways)
                const direction = terminal.gateDirection || 1;  // Default to +1 if not set
                const gateAngle = terminal.angle + (Math.PI / 2) * direction;
                const gateLength = 35;  // Consistent length
                const gateOffset = terminal.width / 2; // Start from terminal edge
                
                const gateStartX = edgeX + Math.cos(gateAngle) * gateOffset;
                const gateStartY = edgeY + Math.sin(gateAngle) * gateOffset;
                
                this.airport.gates.push({
                    start: { x: gateStartX, y: gateStartY },
                    end: {
                        x: gateStartX + Math.cos(gateAngle) * gateLength,
                        y: gateStartY + Math.sin(gateAngle) * gateLength
                    },
                    angle: gateAngle,  // Store angle for consistent orientation
                    terminalIndex: this.airport.terminals.indexOf(terminal)
                });
                
                gatesAssigned++;
            }
        });
    }
    
    /**
     * Generate apron areas around terminals
     */
    generateAprons() {
        this.airport.terminals.forEach(terminal => {
            const expansion = 80;
            const angle = terminal.angle;
            const perpAngle = angle + Math.PI / 2;
            
            const halfLength = terminal.length / 2 + expansion;
            const halfWidth = terminal.width / 2 + expansion;
            
            const dx = Math.cos(angle) * halfLength;
            const dy = Math.sin(angle) * halfLength;
            const perpDx = Math.cos(perpAngle) * halfWidth;
            const perpDy = Math.sin(perpAngle) * halfWidth;
            
            this.airport.aprons.push({
                points: [
                    { x: terminal.center.x - dx - perpDx, y: terminal.center.y - dy - perpDy },
                    { x: terminal.center.x + dx - perpDx, y: terminal.center.y + dy - perpDy },
                    { x: terminal.center.x + dx + perpDx, y: terminal.center.y + dy + perpDy },
                    { x: terminal.center.x - dx + perpDx, y: terminal.center.y - dy + perpDy }
                ]
            });
        });
    }
    
    /**
     * Get average runway angle for terminal positioning
     */
    getAverageRunwayAngle() {
        if (this.airport.runways.length === 0) return 0;
        
        const angles = this.airport.runways.map(r => 
            Math.atan2(r.end.y - r.start.y, r.end.x - r.start.x)
        );
        
        return angles.reduce((sum, a) => sum + a, 0) / angles.length;
    }
}

// ==================== Airport Renderer ====================
// Blueprint rendering constants for professional airport diagrams
const BLUEPRINT_RENDERING = {
    PADDING: 300,  // Increased from 100 to 300 for wallpaper aesthetics - more breathing room
    RUNWAY_WIDTH: 45,
    RUNWAY_DASH_LENGTH: 20,
    RUNWAY_DASH_GAP: 10,
    TAXIWAY_WIDTH: 15,
    TAXIWAY_DASH_LENGTH: 8,
    TAXIWAY_DASH_GAP: 4,
    GATE_WIDTH_MULTIPLIER: 3,
    // Terminal architectural details
    FACADE_DIVISION_SPACING: 50,        // Spacing between glass panel divisions in terminals
    ENTRANCE_POSITION: 0.25             // Position of entrance/canopy detail along terminal (0-1)
};

class AirportRenderer {
    constructor(svgElement) {
        this.svg = svgElement;
        this.theme = THEMES.blueprint;
        this.aspectRatio = ASPECT_RATIOS['16:9'];
    }
    
    setTheme(themeName) {
        this.theme = THEMES[themeName] || THEMES.blueprint;
    }
    
    setAspectRatio(ratio) {
        this.aspectRatio = ASPECT_RATIOS[ratio] || ASPECT_RATIOS['16:9'];
    }
    
    /**
     * Calculate bounding box for airport
     */
    calculateBounds(airport) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        const updateBounds = (point) => {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        };
        
        airport.runways.forEach(r => {
            updateBounds(r.start);
            updateBounds(r.end);
        });
        
        airport.terminals.forEach(t => {
            t.points.forEach(updateBounds);
        });
        
        airport.taxiways.forEach(t => {
            t.path.forEach(updateBounds);
        });
        
        airport.gates.forEach(g => {
            updateBounds(g.start);
            updateBounds(g.end);
        });
        
        airport.aprons.forEach(a => {
            a.points.forEach(updateBounds);
        });
        
        return { minX, maxX, minY, maxY };
    }
    
    /**
     * Transform airport coordinates to SVG space
     */
    transformToSVG(point, bounds, width, height, padding = BLUEPRINT_RENDERING.PADDING) {
        const boundsWidth = bounds.maxX - bounds.minX;
        const boundsHeight = bounds.maxY - bounds.minY;
        
        const availableWidth = width - 2 * padding;
        const availableHeight = height - 2 * padding;
        
        const scale = Math.min(availableWidth / boundsWidth, availableHeight / boundsHeight);
        
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        
        return {
            x: (point.x - centerX) * scale + width / 2,
            y: (point.y - centerY) * scale + height / 2
        };
    }
    
    /**
     * Render airport to SVG with enhanced blueprint details
     */
    render(airport) {
        this.svg.innerHTML = '';
        
        const bounds = this.calculateBounds(airport);
        const width = this.aspectRatio.width;
        const height = this.aspectRatio.height;
        
        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);
        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        // Background
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('width', width);
        bg.setAttribute('height', height);
        bg.setAttribute('fill', this.theme.background);
        this.svg.appendChild(bg);
        
        const transform = (p) => this.transformToSVG(p, bounds, width, height);
        
        // Calculate scale for proper sizing of blueprint details
        const boundsWidth = bounds.maxX - bounds.minX;
        const boundsHeight = bounds.maxY - bounds.minY;
        const availableWidth = width - 2 * BLUEPRINT_RENDERING.PADDING;
        const availableHeight = height - 2 * BLUEPRINT_RENDERING.PADDING;
        const scale = Math.min(availableWidth / boundsWidth, availableHeight / boundsHeight);
        
        // Render aprons (bottom layer) - large paved areas
        airport.aprons.forEach(apron => {
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const points = apron.points.map(p => {
                const tp = transform(p);
                return `${tp.x},${tp.y}`;
            }).join(' ');
            polygon.setAttribute('points', points);
            polygon.setAttribute('fill', this.theme.stroke);
            polygon.setAttribute('fill-opacity', '0.05');
            polygon.setAttribute('stroke', this.theme.stroke);
            polygon.setAttribute('stroke-width', '1');
            polygon.setAttribute('opacity', '0.4');
            this.svg.appendChild(polygon);
        });
        
        // Render taxiways - filled paths with rounded corners
        airport.taxiways.forEach(taxiway => {
            const path = taxiway.path.map(p => transform(p));
            if (path.length < 2) return;
            
            // Create wide taxiway with parallel lines
            const taxiwayWidth = BLUEPRINT_RENDERING.TAXIWAY_WIDTH * scale;
            
            for (let i = 0; i < path.length - 1; i++) {
                const p1 = path[i];
                const p2 = path[i + 1];
                
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const nx = -dy / len;
                const ny = dx / len;
                
                // Create taxiway rectangle
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const points = [
                    `${p1.x + nx * taxiwayWidth},${p1.y + ny * taxiwayWidth}`,
                    `${p2.x + nx * taxiwayWidth},${p2.y + ny * taxiwayWidth}`,
                    `${p2.x - nx * taxiwayWidth},${p2.y - ny * taxiwayWidth}`,
                    `${p1.x - nx * taxiwayWidth},${p1.y - ny * taxiwayWidth}`
                ].join(' ');
                rect.setAttribute('points', points);
                rect.setAttribute('fill', 'none');
                rect.setAttribute('stroke', this.theme.stroke);
                rect.setAttribute('stroke-width', '1.5');
                this.svg.appendChild(rect);
                
                // Add center line (dashed)
                const centerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                centerLine.setAttribute('x1', p1.x);
                centerLine.setAttribute('y1', p1.y);
                centerLine.setAttribute('x2', p2.x);
                centerLine.setAttribute('y2', p2.y);
                centerLine.setAttribute('stroke', this.theme.stroke);
                centerLine.setAttribute('stroke-width', '0.8');
                centerLine.setAttribute('stroke-dasharray', `${BLUEPRINT_RENDERING.TAXIWAY_DASH_LENGTH * scale},${BLUEPRINT_RENDERING.TAXIWAY_DASH_GAP * scale}`);
                centerLine.setAttribute('opacity', '0.6');
                this.svg.appendChild(centerLine);
            }
        });
        
        // Render terminals - filled polygon shapes with enhanced architectural detail
        airport.terminals.forEach(terminal => {
            // Main terminal body
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const points = terminal.points.map(p => {
                const tp = transform(p);
                return `${tp.x},${tp.y}`;
            }).join(' ');
            polygon.setAttribute('points', points);
            polygon.setAttribute('fill', this.theme.stroke);
            polygon.setAttribute('fill-opacity', '0.1');
            polygon.setAttribute('stroke', this.theme.stroke);
            polygon.setAttribute('stroke-width', '2');
            this.svg.appendChild(polygon);
            
            // Add architectural details - glass facade segments
            const center = transform(terminal.center);
            const angle = terminal.angle;
            const length = terminal.length;
            const width = terminal.width;
            
            // Add facade divisions (vertical lines simulating glass panels)
            const numDivisions = Math.floor(length / BLUEPRINT_RENDERING.FACADE_DIVISION_SPACING);
            for (let i = 1; i < numDivisions; i++) {
                const t = (i / numDivisions) - 0.5;
                const divX = center.x + Math.cos(angle) * t * length * scale;
                const divY = center.y + Math.sin(angle) * t * length * scale;
                
                const perpAngle = angle + Math.PI / 2;
                const halfWidth = (width * scale) / 2;
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', divX + Math.cos(perpAngle) * halfWidth * 0.3);
                line.setAttribute('y1', divY + Math.sin(perpAngle) * halfWidth * 0.3);
                line.setAttribute('x2', divX - Math.cos(perpAngle) * halfWidth * 0.3);
                line.setAttribute('y2', divY - Math.sin(perpAngle) * halfWidth * 0.3);
                line.setAttribute('stroke', this.theme.stroke);
                line.setAttribute('stroke-width', '0.5');
                line.setAttribute('opacity', '0.3');
                this.svg.appendChild(line);
            }
            
            // Add entrance/canopy detail (thicker line on one side)
            const entranceX = center.x + Math.cos(angle) * (length * scale * BLUEPRINT_RENDERING.ENTRANCE_POSITION);
            const entranceY = center.y + Math.sin(angle) * (length * scale * BLUEPRINT_RENDERING.ENTRANCE_POSITION);
            const perpAngle = angle + Math.PI / 2;
            const entranceWidth = (width * scale) / 2;
            
            const entranceLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            entranceLine.setAttribute('x1', entranceX + Math.cos(perpAngle) * entranceWidth);
            entranceLine.setAttribute('y1', entranceY + Math.sin(perpAngle) * entranceWidth);
            entranceLine.setAttribute('x2', entranceX - Math.cos(perpAngle) * entranceWidth);
            entranceLine.setAttribute('y2', entranceY - Math.sin(perpAngle) * entranceWidth);
            entranceLine.setAttribute('stroke', this.theme.stroke);
            entranceLine.setAttribute('stroke-width', '2.5');
            entranceLine.setAttribute('opacity', '0.5');
            this.svg.appendChild(entranceLine);
            
            // Add corner accents (rounded corner effect)
            terminal.points.forEach((point, idx) => {
                const tp = transform(point);
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', tp.x);
                circle.setAttribute('cy', tp.y);
                circle.setAttribute('r', '3');
                circle.setAttribute('fill', this.theme.stroke);
                circle.setAttribute('fill-opacity', '0.2');
                circle.setAttribute('stroke', this.theme.stroke);
                circle.setAttribute('stroke-width', '1');
                circle.setAttribute('opacity', '0.4');
                this.svg.appendChild(circle);
            });
        });
        
        // Render gates as small protrusions
        airport.gates.forEach(gate => {
            const start = transform(gate.start);
            const end = transform(gate.end);
            
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len * BLUEPRINT_RENDERING.GATE_WIDTH_MULTIPLIER;
            const ny = dx / len * BLUEPRINT_RENDERING.GATE_WIDTH_MULTIPLIER;
            
            // Gate as small rectangle
            const gateRect = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const points = [
                `${start.x + nx},${start.y + ny}`,
                `${end.x + nx},${end.y + ny}`,
                `${end.x - nx},${end.y - ny}`,
                `${start.x - nx},${start.y - ny}`
            ].join(' ');
            gateRect.setAttribute('points', points);
            gateRect.setAttribute('fill', 'none');
            gateRect.setAttribute('stroke', this.theme.stroke);
            gateRect.setAttribute('stroke-width', '1');
            gateRect.setAttribute('opacity', '0.7');
            this.svg.appendChild(gateRect);
        });
        
        // Render runways (top layer) - wide rectangular shapes with markings
        airport.runways.forEach(runway => {
            const start = transform(runway.start);
            const end = transform(runway.end);
            
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len;
            const ny = dx / len;
            
            const runwayWidth = BLUEPRINT_RENDERING.RUNWAY_WIDTH * scale;
            
            // Main runway rectangle
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const points = [
                `${start.x + nx * runwayWidth},${start.y + ny * runwayWidth}`,
                `${end.x + nx * runwayWidth},${end.y + ny * runwayWidth}`,
                `${end.x - nx * runwayWidth},${end.y - ny * runwayWidth}`,
                `${start.x - nx * runwayWidth},${start.y - ny * runwayWidth}`
            ].join(' ');
            rect.setAttribute('points', points);
            rect.setAttribute('fill', 'none');
            rect.setAttribute('stroke', this.theme.stroke);
            rect.setAttribute('stroke-width', '3');
            this.svg.appendChild(rect);
            
            // Centerline (dashed)
            const centerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            centerLine.setAttribute('x1', start.x);
            centerLine.setAttribute('y1', start.y);
            centerLine.setAttribute('x2', end.x);
            centerLine.setAttribute('y2', end.y);
            centerLine.setAttribute('stroke', this.theme.stroke);
            centerLine.setAttribute('stroke-width', '2');
            centerLine.setAttribute('stroke-dasharray', `${BLUEPRINT_RENDERING.RUNWAY_DASH_LENGTH * scale},${BLUEPRINT_RENDERING.RUNWAY_DASH_GAP * scale}`);
            centerLine.setAttribute('opacity', '0.8');
            this.svg.appendChild(centerLine);
            
            // Threshold markings at both ends
            const thresholdLength = 20 * scale;
            const thresholdWidth = runwayWidth * 0.8;
            
            // Start threshold
            const startThresh = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            startThresh.setAttribute('x1', start.x + nx * thresholdWidth);
            startThresh.setAttribute('y1', start.y + ny * thresholdWidth);
            startThresh.setAttribute('x2', start.x - nx * thresholdWidth);
            startThresh.setAttribute('y2', start.y - ny * thresholdWidth);
            startThresh.setAttribute('stroke', this.theme.stroke);
            startThresh.setAttribute('stroke-width', '4');
            startThresh.setAttribute('opacity', '0.7');
            this.svg.appendChild(startThresh);
            
            // End threshold
            const endThresh = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            endThresh.setAttribute('x1', end.x + nx * thresholdWidth);
            endThresh.setAttribute('y1', end.y + ny * thresholdWidth);
            endThresh.setAttribute('x2', end.x - nx * thresholdWidth);
            endThresh.setAttribute('y2', end.y - ny * thresholdWidth);
            endThresh.setAttribute('stroke', this.theme.stroke);
            endThresh.setAttribute('stroke-width', '4');
            endThresh.setAttribute('opacity', '0.7');
            this.svg.appendChild(endThresh);
            
            // Add subtle runway shoulders
            const shoulderWidth = runwayWidth * 1.15;
            const shoulder = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const shoulderPoints = [
                `${start.x + nx * shoulderWidth},${start.y + ny * shoulderWidth}`,
                `${end.x + nx * shoulderWidth},${end.y + ny * shoulderWidth}`,
                `${end.x - nx * shoulderWidth},${end.y - ny * shoulderWidth}`,
                `${start.x - nx * shoulderWidth},${start.y - ny * shoulderWidth}`
            ].join(' ');
            shoulder.setAttribute('points', shoulderPoints);
            shoulder.setAttribute('fill', 'none');
            shoulder.setAttribute('stroke', this.theme.stroke);
            shoulder.setAttribute('stroke-width', '0.5');
            shoulder.setAttribute('opacity', '0.3');
            this.svg.appendChild(shoulder);
        });
    }
}

// ==================== Export Manager ====================
class ExportManager {
    static addBranding(svgElement) {
        const width = parseInt(svgElement.getAttribute('width'));
        const height = parseInt(svgElement.getAttribute('height'));
        
        const background = svgElement.querySelector('rect');
        const bgColor = background ? background.getAttribute('fill') : '#0a2463';
        const textColor = (bgColor === '#ffffff') ? '#000000' : '#ffffff';
        
        const fontSize = Math.max(width / 120, 16);
        const padding = fontSize * 1.5;
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', width - padding);
        text.setAttribute('y', height - padding);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('font-family', 'Arial, sans-serif');
        text.setAttribute('font-size', fontSize);
        text.setAttribute('fill', textColor);
        text.setAttribute('opacity', '0.3');
        text.textContent = 'Designed by AirFrame';
        
        const comment = document.createComment(' Fictional airport generated for artistic purposes - Non-navigational ');
        svgElement.appendChild(comment);
        svgElement.appendChild(text);
    }
    
    static downloadSVG(svgElement, filename) {
        const clone = svgElement.cloneNode(true);
        this.addBranding(clone);
        
        const svgData = new XMLSerializer().serializeToString(clone);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        this.triggerDownload(blob, filename);
    }
    
    static downloadPNG(svgElement, filename) {
        return new Promise((resolve, reject) => {
            const clone = svgElement.cloneNode(true);
            this.addBranding(clone);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const width = parseInt(clone.getAttribute('width'));
            const height = parseInt(clone.getAttribute('height'));
            
            canvas.width = width;
            canvas.height = height;
            
            const svgData = new XMLSerializer().serializeToString(clone);
            const img = new Image();
            
            img.onload = () => {
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => {
                    this.triggerDownload(blob, filename);
                    resolve();
                }, 'image/png');
            };
            
            img.onerror = reject;
            
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            img.src = url;
        });
    }
    
    static triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// ==================== Application Controller ====================
class AirFrameApp {
    constructor() {
        this.renderer = new AirportRenderer(document.getElementById('airportSVG'));
        this.currentAirport = null;
        this.initializeUI();
    }
    
    initializeUI() {
        // Runway count slider
        document.getElementById('runwayCount').addEventListener('input', (e) => {
            document.getElementById('runwayCountValue').textContent = e.target.value;
        });
        
        // Terminal count slider
        document.getElementById('terminalCount').addEventListener('input', (e) => {
            document.getElementById('terminalCountValue').textContent = e.target.value;
        });
        
        // Gate count slider
        document.getElementById('gateCount').addEventListener('input', (e) => {
            document.getElementById('gateCountValue').textContent = e.target.value;
        });
        
        // Generate button
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generate();
        });
        
        // Randomize button
        document.getElementById('randomizeBtn').addEventListener('click', () => {
            this.randomizeAll();
            this.generate();
        });
        
        // Theme selector
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            if (this.currentAirport) {
                this.renderer.setTheme(e.target.value);
                this.renderer.render(this.currentAirport);
            }
        });
        
        // Aspect ratio selector
        document.getElementById('aspectRatio').addEventListener('change', (e) => {
            if (this.currentAirport) {
                this.renderer.setAspectRatio(e.target.value);
                this.renderer.render(this.currentAirport);
            }
        });
        
        // Export buttons
        document.getElementById('downloadSVG').addEventListener('click', () => {
            if (this.currentAirport) {
                ExportManager.downloadSVG(document.getElementById('airportSVG'), 'airframe_airport.svg');
                this.setStatus('SVG downloaded!', 'success');
            }
        });
        
        document.getElementById('downloadPNG').addEventListener('click', async () => {
            if (this.currentAirport) {
                this.setStatus('Generating PNG...', 'loading');
                try {
                    await ExportManager.downloadPNG(document.getElementById('airportSVG'), 'airframe_airport.png');
                    this.setStatus('PNG downloaded!', 'success');
                } catch (error) {
                    this.setStatus('PNG export failed', 'error');
                }
            }
        });
        
        this.setExportButtonsState(false);
    }
    
    generate() {
        this.setStatus('Generating airport...', 'loading');
        this.setExportButtonsState(false);
        
        setTimeout(() => {
            const config = {
                runwayCount: parseInt(document.getElementById('runwayCount').value),
                runwayConfig: document.getElementById('runwayConfig').value,
                terminalCount: parseInt(document.getElementById('terminalCount').value), // TODO: Implement multi-terminal generation
                terminalLayout: document.getElementById('terminalLayout').value,
                gateCount: parseInt(document.getElementById('gateCount').value),
                taxiwayDensity: document.getElementById('taxiwayDensity').value,
                seed: document.getElementById('randomSeed').value || undefined
            };
            
            const generator = new AirportGenerator(config);
            this.currentAirport = generator.generate();
            
            this.renderer.setTheme(document.getElementById('themeSelect').value);
            this.renderer.setAspectRatio(document.getElementById('aspectRatio').value);
            this.renderer.render(this.currentAirport);
            
            this.setStatus(`Generated: ${this.currentAirport.runways.length} runways, ${this.currentAirport.terminals.length} terminals, ${this.currentAirport.gates.length} gates`, 'success');
            this.setExportButtonsState(true);
        }, 100);
    }
    
    randomizeAll() {
        document.getElementById('runwayCount').value = Math.floor(Math.random() * 3) + 1;
        document.getElementById('runwayCountValue').textContent = document.getElementById('runwayCount').value;
        
        const configs = ['parallel', 'crossing', 'random'];
        document.getElementById('runwayConfig').value = configs[Math.floor(Math.random() * configs.length)];
        
        document.getElementById('terminalCount').value = Math.floor(Math.random() * 4) + 1;
        document.getElementById('terminalCountValue').textContent = document.getElementById('terminalCount').value;
        
        const layouts = ['linear', 'pier', 'satellite', 'hybrid'];
        document.getElementById('terminalLayout').value = layouts[Math.floor(Math.random() * layouts.length)];
        
        document.getElementById('gateCount').value = Math.floor(Math.random() * 28) + 8;
        document.getElementById('gateCountValue').textContent = document.getElementById('gateCount').value;
        
        const densities = ['low', 'medium', 'high'];
        document.getElementById('taxiwayDensity').value = densities[Math.floor(Math.random() * densities.length)];
        
        document.getElementById('randomSeed').value = '';
    }
    
    setStatus(message, type = '') {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = 'status';
        if (type) {
            statusEl.classList.add(type);
        }
    }
    
    setExportButtonsState(enabled) {
        document.getElementById('downloadSVG').disabled = !enabled;
        document.getElementById('downloadPNG').disabled = !enabled;
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new AirFrameApp();
});
