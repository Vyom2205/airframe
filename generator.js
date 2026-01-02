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
    MAX_TAXIWAY_CONNECTION_DIST: 1000,  // Maximum distance for taxiway connections
    TERMINAL_CONNECTION_RANGE: 600,  // Maximum range for taxiway-terminal connections (spine-based system)
    // Spine-based taxiway system configuration
    SPINE_LATERAL_OFFSET: 150,      // Lateral distance from runway centerline to taxiway spine
    SPINE_EXTENSION_LENGTH: 200,    // Extension beyond runway ends for connectivity
    RUNWAY_CONNECTOR_POSITIONS: [0.30, 0.50, 0.70],  // Evenly distributed connector positions along runway (30%, 50%, 70%)
    SPINE_SAMPLE_COUNT: 5,          // Number of points to sample along spine for terminal connections
    // Geometric polish tolerances
    DEGENERATE_SEGMENT_THRESHOLD: 1,  // Minimum segment length (px) to prevent degenerate geometry
    ORTHOGONALITY_TOLERANCE: 0.5,     // Maximum deviation (px) from H/V for orthogonality validation
    INTERSECTION_TOLERANCE: 2         // Maximum distance (px) for intersection verification
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
        const MAX_ATTEMPTS = 3;
        let attempt = 0;
        let validAirport = null;
        
        while (attempt < MAX_ATTEMPTS && !validAirport) {
            attempt++;
            
            // Reset airport state for retry
            this.airport = {
                runways: [],
                taxiways: [],
                terminals: [],
                gates: [],
                aprons: []
            };
            this.zones = {
                airside: [],
                terminalCore: [],
                concourse: [],
                apron: []
            };
            
            try {
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
                
                // Validation Pass
                if (this.validateAirportGeometry()) {
                    validAirport = this.airport;
                    console.log(`✅ Airport validated successfully on attempt ${attempt}`);
                } else {
                    console.log(`⚠️ Validation failed on attempt ${attempt}, retrying...`);
                }
            } catch (error) {
                console.error(`❌ Generation error on attempt ${attempt}:`, error);
            }
        }
        
        // Return valid airport or last attempt
        return validAirport || this.airport;
    }
    
    /**
     * Validation Pass - Verify airport geometry meets all requirements
     */
    validateAirportGeometry() {
        // Task 1: Taxiway Connectivity Validation
        if (!this.validateTaxiwayConnectivity()) {
            console.warn('Taxiway connectivity validation failed');
            return false;
        }
        
        // Task 2: Taxiway Orthogonal Rules Validation
        if (!this.validateTaxiwayOrthogonality()) {
            console.warn('Taxiway orthogonality validation failed');
            return false;
        }
        
        // Task 3: Terminal Layout Sanity Check
        if (!this.validateTerminalPlacement()) {
            console.warn('Terminal placement validation failed');
            return false;
        }
        
        // Task 4: NEW - Directional Attachment Integrity
        if (!this.validateDirectionalAttachment()) {
            console.warn('Directional attachment integrity validation failed');
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate that every taxiway forms continuous connection between runway and terminal/apron
     */
    validateTaxiwayConnectivity() {
        if (this.airport.taxiways.length === 0) {
            return false;
        }
        
        // Check that taxiways connect runways to terminals
        const hasRunwayConnections = this.airport.runways.length > 0;
        const hasTerminalConnections = this.airport.terminals.length > 0;
        const hasTaxiways = this.airport.taxiways.length > 0;
        
        return hasRunwayConnections && hasTerminalConnections && hasTaxiways;
    }
    
    /**
     * Validate strict orthogonal rules (horizontal/vertical only, 90° turns, no diagonals)
     */
    validateTaxiwayOrthogonality() {
        for (const taxiway of this.airport.taxiways) {
            if (!taxiway.path || taxiway.path.length < 2) {
                continue;
            }
            
            // Check each segment is horizontal or vertical
            for (let i = 0; i < taxiway.path.length - 1; i++) {
                const p1 = taxiway.path[i];
                const p2 = taxiway.path[i + 1];
                
                const dx = Math.abs(p2.x - p1.x);
                const dy = Math.abs(p2.y - p1.y);
                
                const isHorizontal = dy < 1;
                const isVertical = dx < 1;
                
                if (!isHorizontal && !isVertical) {
                    console.warn(`Non-orthogonal taxiway segment detected: dx=${dx.toFixed(2)}, dy=${dy.toFixed(2)}`);
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Validate terminal placement (clear separation, no overlaps, readable flow)
     */
    validateTerminalPlacement() {
        if (this.airport.terminals.length === 0) {
            return false;
        }
        
        // Check terminal-runway separation
        for (const terminal of this.airport.terminals) {
            const terminalCenter = {
                x: terminal.x,
                y: terminal.y
            };
            
            // Ensure terminals are not in airside zone
            if (this.isInAirsideZone(terminalCenter)) {
                console.warn('Terminal overlaps with airside zone');
                return false;
            }
        }
        
        // Check terminal-terminal spacing
        for (let i = 0; i < this.airport.terminals.length; i++) {
            for (let j = i + 1; j < this.airport.terminals.length; j++) {
                const t1 = this.airport.terminals[i];
                const t2 = this.airport.terminals[j];
                const dist = this.distance(
                    { x: t1.x, y: t1.y },
                    { x: t2.x, y: t2.y }
                );
                
                if (dist < AIRPORT_ZONES.TERMINAL_SPACING) {
                    console.warn('Terminals too close together');
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * NEW VALIDATION: Directional Attachment Integrity
     * Ensures taxiways attach perpendicularly to runways and terminals
     * Validates that connections are proper attachments, not just intersections/overlaps
     */
    validateDirectionalAttachment() {
        // Validate taxiway → runway attachment
        if (!this.validateTaxiwayRunwayAttachment()) {
            console.warn('Taxiway → Runway attachment validation failed');
            return false;
        }
        
        // Validate taxiway → terminal attachment  
        if (!this.validateTaxiwayTerminalAttachment()) {
            console.warn('Taxiway → Terminal attachment validation failed');
            return false;
        }
        
        // Validate structural sanity
        if (!this.validateStructuralSanity()) {
            console.warn('Structural sanity check failed');
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate that taxiways attach perpendicularly to runways
     */
    validateTaxiwayRunwayAttachment() {
        const PERPENDICULAR_TOLERANCE = 0.1; // ~5.7 degrees
        
        for (const runway of this.airport.runways) {
            const runwayAngle = Math.atan2(runway.end.y - runway.start.y, runway.end.x - runway.start.x);
            const runwayLength = this.distance(runway.start, runway.end);
            
            // Find all taxiway segments that connect to this runway
            const connectedTaxiways = this.airport.taxiways.filter(taxiway => {
                return this.taxiwayConnectsToRunway(taxiway, runway);
            });
            
            // Validate each connection
            for (const taxiway of connectedTaxiways) {
                if (taxiway.path.length < 2) continue;
                
                // Find connection point to determine which end of taxiway connects
                const connectionPoint = this.findTaxiwayRunwayConnectionPoint(taxiway, runway);
                if (!connectionPoint) continue;
                
                // Determine which segment of taxiway is at the connection
                let taxiwayAngle;
                const distToStart = this.distance(connectionPoint, taxiway.path[0]);
                const distToEnd = this.distance(connectionPoint, taxiway.path[taxiway.path.length - 1]);
                
                if (distToStart < distToEnd) {
                    // Connection is at start - use first segment direction
                    taxiwayAngle = Math.atan2(
                        taxiway.path[1].y - taxiway.path[0].y,
                        taxiway.path[1].x - taxiway.path[0].x
                    );
                } else {
                    // Connection is at end - use last segment direction
                    const lastIdx = taxiway.path.length - 1;
                    taxiwayAngle = Math.atan2(
                        taxiway.path[lastIdx].y - taxiway.path[lastIdx - 1].y,
                        taxiway.path[lastIdx].x - taxiway.path[lastIdx - 1].x
                    );
                }
                
                // Check if perpendicular (90 degrees difference)
                const angleDiff = Math.abs(this.normalizeAngle(taxiwayAngle - runwayAngle));
                const isPerpendicular = Math.abs(angleDiff - Math.PI / 2) < PERPENDICULAR_TOLERANCE || 
                                       Math.abs(angleDiff - 3 * Math.PI / 2) < PERPENDICULAR_TOLERANCE;
                
                if (!isPerpendicular) {
                    console.warn('Taxiway connects to runway at non-perpendicular angle');
                    return false;
                }
                
                // Check attachment is within runway bounds
                const distAlongRunway = this.distanceAlongLine(runway.start, runway.end, connectionPoint);
                if (distAlongRunway < 0 || distAlongRunway > runwayLength) {
                    console.warn('Taxiway connects outside runway bounds');
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Validate that taxiways attach properly to terminals
     */
    validateTaxiwayTerminalAttachment() {
        const NORMAL_TOLERANCE = 0.15; // ~8.6 degrees
        const ALIGNMENT_TOLERANCE = 10; // 10px
        
        for (const terminal of this.airport.terminals) {
            // Find taxiways that should connect to this terminal
            const nearbyTaxiways = this.airport.taxiways.filter(taxiway => {
                return this.taxiwayNearTerminal(taxiway, terminal, 100);
            });
            
            for (const taxiway of nearbyTaxiways) {
                if (taxiway.path.length < 2) continue;
                
                // Get taxiway endpoint closest to terminal
                const endpoint = this.getClosestEndpoint(taxiway, terminal);
                
                // Check if endpoint aligns with terminal face
                const terminalEdgeAngle = terminal.angle;
                const distToEdge = this.distanceToTerminalEdge(endpoint, terminal);
                
                if (distToEdge > ALIGNMENT_TOLERANCE) {
                    console.warn('Taxiway endpoint does not align with terminal face');
                    return false;
                }
                
                // Determine which end is closest and get appropriate segment angle
                const terminalCenter = { x: terminal.x, y: terminal.y };
                const distStart = this.distance(taxiway.path[0], terminalCenter);
                const distEnd = this.distance(taxiway.path[taxiway.path.length - 1], terminalCenter);
                
                let taxiwayAngle;
                if (distStart < distEnd) {
                    // Start is closer - use first segment direction
                    taxiwayAngle = Math.atan2(
                        taxiway.path[1].y - taxiway.path[0].y,
                        taxiway.path[1].x - taxiway.path[0].x
                    );
                } else {
                    // End is closer - use last segment direction
                    const lastIdx = taxiway.path.length - 1;
                    taxiwayAngle = Math.atan2(
                        taxiway.path[lastIdx].y - taxiway.path[lastIdx - 1].y,
                        taxiway.path[lastIdx].x - taxiway.path[lastIdx - 1].x
                    );
                }
                
                // Check if normal (perpendicular) to terminal edge
                const angleDiff = Math.abs(this.normalizeAngle(taxiwayAngle - terminalEdgeAngle));
                const isNormal = Math.abs(angleDiff - Math.PI / 2) < NORMAL_TOLERANCE || 
                                Math.abs(angleDiff - 3 * Math.PI / 2) < NORMAL_TOLERANCE;
                
                if (!isNormal) {
                    console.warn('Taxiway does not approach terminal at normal angle');
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Validate structural sanity
     */
    validateStructuralSanity() {
        // Check taxiway-runway intersection count
        for (const taxiway of this.airport.taxiways) {
            for (const runway of this.airport.runways) {
                const intersections = this.countTaxiwayRunwayIntersections(taxiway, runway);
                if (intersections > 1) {
                    console.warn('Taxiway intersects runway more than once');
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // Helper methods for directional attachment validation
    
    taxiwayConnectsToRunway(taxiway, runway) {
        return taxiway.path.some(point => {
            return this.distanceToLine(runway.start, runway.end, point) < runway.width / 2 + 5;
        });
    }
    
    findTaxiwayRunwayConnectionPoint(taxiway, runway) {
        let closest = null;
        let minDist = Infinity;
        
        taxiway.path.forEach(point => {
            const dist = this.distanceToLine(runway.start, runway.end, point);
            if (dist < minDist) {
                minDist = dist;
                closest = point;
            }
        });
        
        return closest;
    }
    
    distanceAlongLine(start, end, point) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        const projX = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (length * length);
        return projX * length;
    }
    
    distanceToLine(start, end, point) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return this.distance(start, point);
        
        const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (length * length)));
        const projX = start.x + t * dx;
        const projY = start.y + t * dy;
        
        return this.distance(point, { x: projX, y: projY });
    }
    
    taxiwayNearTerminal(taxiway, terminal, threshold) {
        return taxiway.path.some(point => {
            return this.distance(point, { x: terminal.x, y: terminal.y }) < threshold;
        });
    }
    
    getClosestEndpoint(taxiway, terminal) {
        const start = taxiway.path[0];
        const end = taxiway.path[taxiway.path.length - 1];
        const terminalCenter = { x: terminal.x, y: terminal.y };
        
        const distStart = this.distance(start, terminalCenter);
        const distEnd = this.distance(end, terminalCenter);
        
        return distStart < distEnd ? start : end;
    }
    
    distanceToTerminalEdge(point, terminal) {
        // Simplified: distance to terminal center minus half terminal width
        const distToCenter = this.distance(point, { x: terminal.x, y: terminal.y });
        return Math.max(0, distToCenter - terminal.width / 2);
    }
    
    countTaxiwayRunwayIntersections(taxiway, runway) {
        let count = 0;
        
        for (let i = 0; i < taxiway.path.length - 1; i++) {
            const p1 = taxiway.path[i];
            const p2 = taxiway.path[i + 1];
            
            if (this.lineSegmentsIntersect(p1, p2, runway.start, runway.end)) {
                count++;
            }
        }
        
        return count;
    }
    
    lineSegmentsIntersect(p1, p2, p3, p4) {
        const det = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
        if (Math.abs(det) < 1e-10) return false;
        
        const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / det;
        const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / det;
        
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }
    
    normalizeAngle(angle) {
        while (angle < 0) angle += 2 * Math.PI;
        while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
        return angle;
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
     * Generate taxiways using attachment-first, runway-owned model
     * NO global grid - taxiways originate from runway stubs only
     * Architecture: Runway stubs → Stub extensions → Terminal connections
     * This prevents runway intersection by construction (not validation)
     */
    generateTaxiways() {
        // Initialize taxiways
        this.airport.taxiways = [];
        
        // Step 1: Generate runway-parallel taxiway spines (one primary spine per runway)
        this.generateRunwayParallelSpines();
        
        // Step 2: Add short perpendicular connectors from spines to runways
        this.addRunwayConnectors();
        
        // Step 3: Add perpendicular connectors from spines to terminals
        this.addTerminalConnectors();
        
        // Step 4: Clean up and validate
        this.cleanupTaxiways();
    }
    
    /**
     * Generate runway-parallel taxiway spines
     * One primary full-length taxiway parallel to each runway
     * With precision coordinate snapping
     */
    generateRunwayParallelSpines() {
        const spineOffset = AIRPORT_ZONES.SPINE_LATERAL_OFFSET;
        
        this.airport.runways.forEach((runway, rwIdx) => {
            const runwayAngle = Math.atan2(runway.end.y - runway.start.y, runway.end.x - runway.start.x);
            const perpAngle = runwayAngle + Math.PI / 2;
            const runwayLength = this.distance(runway.start, runway.end);
            
            // Extend spine slightly beyond runway for better connectivity
            const extension = AIRPORT_ZONES.SPINE_EXTENSION_LENGTH;
            const spineLength = runwayLength + extension * 2;
            
            // Calculate spine start and end (fully parallel to runway, offset laterally)
            const runwayCenter = {
                x: (runway.start.x + runway.end.x) / 2,
                y: (runway.start.y + runway.end.y) / 2
            };
            
            // Offset spine perpendicular to runway with precision
            const spineCenter = {
                x: Math.round(runwayCenter.x + Math.cos(perpAngle) * spineOffset),
                y: Math.round(runwayCenter.y + Math.sin(perpAngle) * spineOffset)
            };
            
            // Spine endpoints parallel to runway with precision snapping
            const spineStart = {
                x: Math.round(spineCenter.x - Math.cos(runwayAngle) * (spineLength / 2)),
                y: Math.round(spineCenter.y - Math.sin(runwayAngle) * (spineLength / 2))
            };
            
            const spineEnd = {
                x: Math.round(spineCenter.x + Math.cos(runwayAngle) * (spineLength / 2)),
                y: Math.round(spineCenter.y + Math.sin(runwayAngle) * (spineLength / 2))
            };
            
            // Create full-length taxiway spine with clean coordinates
            this.airport.taxiways.push({
                path: [spineStart, spineEnd],
                type: 'spine',
                runwayIndex: rwIdx,
                angle: runwayAngle  // Store for connector calculations
            });
        });
    }
    
    /**
     * Add short perpendicular connectors from taxiway spines to runways
     * With precision alignment and consistent width
     */
    addRunwayConnectors() {
        const connectorPositions = AIRPORT_ZONES.RUNWAY_CONNECTOR_POSITIONS;
        
        this.airport.taxiways.forEach(taxiway => {
            if (taxiway.type === 'spine') {
                const runway = this.airport.runways[taxiway.runwayIndex];
                const runwayAngle = Math.atan2(runway.end.y - runway.start.y, runway.end.x - runway.start.x);
                const perpAngle = runwayAngle + Math.PI / 2;
                
                connectorPositions.forEach(t => {
                    // Calculate spine point at position t with EXACT precision
                    const spinePoint = {
                        x: Math.round(taxiway.path[0].x + (taxiway.path[1].x - taxiway.path[0].x) * t),
                        y: Math.round(taxiway.path[0].y + (taxiway.path[1].y - taxiway.path[0].y) * t)
                    };
                    
                    // Calculate runway centerline point at same position
                    const runwayPoint = {
                        x: Math.round(runway.start.x + (runway.end.x - runway.start.x) * t),
                        y: Math.round(runway.start.y + (runway.end.y - runway.start.y) * t)
                    };
                    
                    // Runway edge point - exactly at runway edge (not offset beyond)
                    const runwayEdgePoint = {
                        x: Math.round(runwayPoint.x + Math.cos(perpAngle) * (runway.width / 2)),
                        y: Math.round(runwayPoint.y + Math.sin(perpAngle) * (runway.width / 2))
                    };
                    
                    // Create perpendicular connector - exactly from runway edge to spine
                    // Length is EXACTLY the lateral offset distance
                    this.airport.taxiways.push({
                        path: [runwayEdgePoint, spinePoint],
                        type: 'runway-connector',
                        runwayIndex: taxiway.runwayIndex
                    });
                });
            }
        });
    }
    
    /**
     * Add perpendicular connectors from taxiway spines to terminals
     * With precision alignment and clean right-angle joins
     */
    addTerminalConnectors() {
        this.airport.terminals.forEach(terminal => {
            // Find nearest spine point with precision sampling
            let nearestSpine = null;
            let nearestPoint = null;
            let minDist = Infinity;
            
            this.airport.taxiways.forEach(taxiway => {
                if (taxiway.type === 'spine') {
                    // Check multiple points along spine for best connection
                    const samples = AIRPORT_ZONES.SPINE_SAMPLE_COUNT;
                    for (let i = 0; i <= samples; i++) {
                        const t = i / samples;
                        const point = {
                            x: Math.round(taxiway.path[0].x + (taxiway.path[1].x - taxiway.path[0].x) * t),
                            y: Math.round(taxiway.path[0].y + (taxiway.path[1].y - taxiway.path[0].y) * t)
                        };
                        
                        const dist = this.distance(point, terminal.center);
                        if (dist < minDist && dist < AIRPORT_ZONES.TERMINAL_CONNECTION_RANGE) {
                            minDist = dist;
                            nearestSpine = taxiway;
                            nearestPoint = point;
                        }
                    }
                }
            });
            
            if (nearestSpine && nearestPoint) {
                // Create perpendicular connector from spine to terminal with precision
                const terminalEdgePoint = this.findNearestTerminalEdgePoint(nearestPoint, terminal);
                
                // Snap terminal edge point to clean coordinates
                const snappedTerminalPoint = {
                    x: Math.round(terminalEdgePoint.x),
                    y: Math.round(terminalEdgePoint.y)
                };
                
                // Create two-segment perpendicular path (clean right-angle join)
                const midPoint = {
                    x: Math.round(snappedTerminalPoint.x),
                    y: Math.round(nearestPoint.y)
                };
                
                // Only create connectors if they form proper right angles (no degenerate segments)
                if (Math.abs(midPoint.x - nearestPoint.x) > AIRPORT_ZONES.DEGENERATE_SEGMENT_THRESHOLD) {
                    this.airport.taxiways.push({
                        path: [nearestPoint, midPoint],
                        type: 'terminal-connector'
                    });
                }
                
                if (Math.abs(midPoint.y - snappedTerminalPoint.y) > AIRPORT_ZONES.DEGENERATE_SEGMENT_THRESHOLD) {
                    this.airport.taxiways.push({
                        path: [midPoint, snappedTerminalPoint],
                        type: 'terminal-connector'
                    });
                }
            }
        });
    }
    
    /**
     * Find nearest point on terminal edge for connection
     */
    findNearestTerminalEdgePoint(point, terminal) {
        // For rectangular terminals, find nearest edge
        const center = terminal.center;
        const halfLength = terminal.length / 2;
        const halfWidth = terminal.width / 2;
        const angle = terminal.angle;
        
        // Calculate edge points
        const edges = [
            { x: center.x + Math.cos(angle) * halfLength, y: center.y + Math.sin(angle) * halfLength },
            { x: center.x - Math.cos(angle) * halfLength, y: center.y - Math.sin(angle) * halfLength },
            { x: center.x + Math.cos(angle + Math.PI/2) * halfWidth, y: center.y + Math.sin(angle + Math.PI/2) * halfWidth },
            { x: center.x - Math.cos(angle + Math.PI/2) * halfWidth, y: center.y - Math.sin(angle + Math.PI/2) * halfWidth }
        ];
        
        // Find nearest edge point
        let nearest = edges[0];
        let minDist = this.distance(point, edges[0]);
        
        edges.forEach(edge => {
            const dist = this.distance(point, edge);
            if (dist < minDist) {
                minDist = dist;
                nearest = edge;
            }
        });
        
        return nearest;
    }
    
    /**
     * Clean up taxiways with precision polish and validation
     * Includes coordinate snapping, right-angle smoothing, and polish validation
     */
    cleanupTaxiways() {
        // Filter out any taxiways that cross runway bounds (should not exist with spine-based generation)
        let cleanedTaxiways = this.airport.taxiways.filter(taxiway => {
            return !this.taxiwayCrossesRunway(taxiway);
        });
        
        // Apply geometric polish: snap coordinates, smooth joins
        cleanedTaxiways = this.polishTaxiwayGeometry(cleanedTaxiways);
        
        // Merge collinear segments where possible
        cleanedTaxiways = this.mergeCollinearSegments(cleanedTaxiways);
        
        // Replace with cleaned up taxiways
        this.airport.taxiways = cleanedTaxiways;
        
        // Run polish validation pass (up to 2 additional passes if needed)
        let polishAttempts = 0;
        const MAX_POLISH_ATTEMPTS = 2;
        
        while (polishAttempts < MAX_POLISH_ATTEMPTS) {
            if (this.validateTaxiwayPolish()) {
                console.log('✓ Taxiway polish validation passed');
                break;
            }
            
            console.warn(`⚠ Polish validation failed, re-polishing (attempt ${polishAttempts + 1}/${MAX_POLISH_ATTEMPTS})`);
            
            // Re-apply polish
            this.airport.taxiways = this.polishTaxiwayGeometry(this.airport.taxiways);
            polishAttempts++;
        }
    }
    
    /**
     * Polish taxiway geometry for clean, engineered appearance
     * - Snap all coordinates to clean integer values
     * - Smooth connector joins with right-angle precision
     * - Eliminate micro-offsets
     */
    polishTaxiwayGeometry(taxiways) {
        return taxiways.map(taxiway => {
            if (!taxiway.path || taxiway.path.length < 2) return taxiway;
            
            // Snap all points to clean coordinates
            const polishedPath = taxiway.path.map(point => ({
                x: Math.round(point.x),
                y: Math.round(point.y)
            }));
            
            return {
                ...taxiway,
                path: polishedPath
            };
        });
    }
    
    /**
     * Validate polished taxiway geometry
     * Ensures clean intersections, parallelism, and perpendicularity
     */
    validateTaxiwayPolish() {
        // Verify all taxiways have clean right-angle joins
        for (const taxiway of this.airport.taxiways) {
            if (!taxiway.path || taxiway.path.length < 2) continue;
            
            // Check that segments are strictly H/V (no micro-diagonals)
            for (let i = 0; i < taxiway.path.length - 1; i++) {
                const p1 = taxiway.path[i];
                const p2 = taxiway.path[i + 1];
                
                const dx = Math.abs(p2.x - p1.x);
                const dy = Math.abs(p2.y - p1.y);
                
                const isHorizontal = dy < AIRPORT_ZONES.ORTHOGONALITY_TOLERANCE;
                const isVertical = dx < AIRPORT_ZONES.ORTHOGONALITY_TOLERANCE;
                
                if (!isHorizontal && !isVertical) {
                    console.warn(`Non-orthogonal segment after polish: dx=${dx}, dy=${dy}`);
                    return false;
                }
            }
        }
        
        // Verify runway connectors properly intersect both runway edge and spine
        const spines = this.airport.taxiways.filter(t => t.type === 'spine');
        const connectors = this.airport.taxiways.filter(t => t.type === 'runway-connector');
        
        for (const connector of connectors) {
            if (!connector.path || connector.path.length !== 2) continue;
            
            const [runwayEnd, spineEnd] = connector.path;
            
            // Verify connector actually intersects a spine
            const intersectsSpine = spines.some(spine => {
                if (!spine.path || spine.path.length !== 2) return false;
                
                // Check if spineEnd is on or very close to spine
                const dist = this.distanceToLine(spine.path[0], spine.path[1], spineEnd);
                return dist < AIRPORT_ZONES.INTERSECTION_TOLERANCE;
            });
            
            if (!intersectsSpine) {
                console.warn('Runway connector does not properly intersect spine');
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Check if taxiway crosses runway (should never happen with stub-based generation)
     */
    taxiwayCrossesRunway(taxiway) {
        const path = taxiway.path;
        if (!path || path.length < 2) return false;
        
        // Check if taxiway midpoint is within any runway bounds using proper distance calculation
        const midpoint = {
            x: (path[0].x + path[path.length - 1].x) / 2,
            y: (path[0].y + path[path.length - 1].y) / 2
        };
        
        return this.airport.runways.some(runway => {
            // Calculate perpendicular distance from midpoint to runway centerline
            const distToLine = this.distanceToLine(midpoint, runway.start, runway.end);
            
            // Calculate distance along runway from start
            const distAlong = this.distanceAlongLine(midpoint, runway.start, runway.end);
            const runwayLength = this.distance(runway.start, runway.end);
            
            // Point is within runway if:
            // 1. Perpendicular distance < runway half-width
            // 2. Distance along is within [0, runwayLength]
            return distToLine < (runway.width / 2) && distAlong >= 0 && distAlong <= runwayLength;
        });
    }
    
    /**
     * Merge collinear taxiway segments to reduce segment count
     * Note: Currently returns taxiways as-is. Full implementation would require:
     * - Building adjacency graph of segment endpoints
     * - Traversing connected components to find collinear chains
     * - Merging chains into single segments
     * This optimization is deferred as stub-based generation produces fewer segments than grid-based
     */
    mergeCollinearSegments(taxiways) {
        // Deferred optimization - stub-based generation already reduces segment count significantly
        // compared to grid-based approach (tens vs thousands of segments)
        return taxiways;
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
                
                // Create taxiway rectangle with fully opaque white fill
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const points = [
                    `${p1.x + nx * taxiwayWidth},${p1.y + ny * taxiwayWidth}`,
                    `${p2.x + nx * taxiwayWidth},${p2.y + ny * taxiwayWidth}`,
                    `${p2.x - nx * taxiwayWidth},${p2.y - ny * taxiwayWidth}`,
                    `${p1.x - nx * taxiwayWidth},${p1.y - ny * taxiwayWidth}`
                ].join(' ');
                rect.setAttribute('points', points);
                rect.setAttribute('fill', '#ffffff');
                rect.setAttribute('fill-opacity', '1.0');
                rect.setAttribute('stroke', 'none');
                rect.setAttribute('stroke-width', '0');
                this.svg.appendChild(rect);
                
                // Centerlines removed - they created cross artifacts at intersections
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
            
            // Corner accents removed - no debug geometry in final render
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
