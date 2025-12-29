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
    }
    
    /**
     * Generate complete airport layout
     */
    generate() {
        // Step 1: Generate runways as primary structural axes
        this.generateRunways();
        
        // Step 2: Generate terminal area
        this.generateTerminals();
        
        // Step 3: Generate taxiways connecting infrastructure
        this.generateTaxiways();
        
        // Step 4: Generate gates along terminals
        this.generateGates();
        
        // Step 5: Generate apron areas
        this.generateAprons();
        
        return this.airport;
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
     * Generate terminal buildings
     */
    generateTerminals() {
        const layout = this.config.terminalLayout;
        const gateCount = this.config.gateCount;
        
        // Position terminal relative to runways
        const terminalOffset = 800 + this.rng.range(0, 400);
        const terminalAngle = this.getAverageRunwayAngle() + Math.PI / 2;
        
        const terminalX = Math.cos(terminalAngle) * terminalOffset;
        const terminalY = Math.sin(terminalAngle) * terminalOffset;
        
        if (layout === 'linear') {
            this.generateLinearTerminal(terminalX, terminalY, gateCount);
        } else if (layout === 'pier') {
            this.generatePierTerminal(terminalX, terminalY, gateCount);
        } else if (layout === 'satellite') {
            this.generateSatelliteTerminal(terminalX, terminalY, gateCount);
        } else {
            // Hybrid
            this.generateHybridTerminal(terminalX, terminalY, gateCount);
        }
    }
    
    generateLinearTerminal(x, y, gateCount) {
        const angle = this.getAverageRunwayAngle();
        const length = gateCount * 40 + 200;
        const width = 100;
        
        const dx = Math.cos(angle) * length / 2;
        const dy = Math.sin(angle) * length / 2;
        const perpDx = Math.cos(angle + Math.PI / 2) * width / 2;
        const perpDy = Math.sin(angle + Math.PI / 2) * width / 2;
        
        this.airport.terminals.push({
            points: [
                { x: x - dx - perpDx, y: y - dy - perpDy },
                { x: x + dx - perpDx, y: y + dy - perpDy },
                { x: x + dx + perpDx, y: y + dy + perpDy },
                { x: x - dx + perpDx, y: y - dy + perpDy }
            ],
            center: { x, y },
            angle,
            length,
            width
        });
    }
    
    generatePierTerminal(x, y, gateCount) {
        const angle = this.getAverageRunwayAngle();
        const mainWidth = 120;
        const mainLength = 300;
        const pierCount = Math.ceil(gateCount / 6);
        
        // Main terminal building
        const dx = Math.cos(angle) * mainLength / 2;
        const dy = Math.sin(angle) * mainLength / 2;
        const perpDx = Math.cos(angle + Math.PI / 2) * mainWidth / 2;
        const perpDy = Math.sin(angle + Math.PI / 2) * mainWidth / 2;
        
        this.airport.terminals.push({
            points: [
                { x: x - dx - perpDx, y: y - dy - perpDy },
                { x: x + dx - perpDx, y: y + dy - perpDy },
                { x: x + dx + perpDx, y: y + dy + perpDy },
                { x: x - dx + perpDx, y: y - dy + perpDy }
            ],
            center: { x, y },
            angle,
            length: mainLength,
            width: mainWidth
        });
        
        // Add piers
        const pierWidth = 40;
        const pierLength = 200 + this.rng.range(0, 150);
        const pierSpacing = mainLength / (pierCount + 1);
        
        for (let i = 0; i < pierCount; i++) {
            const pierT = (i + 1) * pierSpacing - mainLength / 2;
            const pierCenterX = x + Math.cos(angle) * pierT;
            const pierCenterY = y + Math.sin(angle) * pierT;
            
            // Pier extends perpendicular to main terminal
            const pierAngle = angle + Math.PI / 2;
            const pierDx = Math.cos(pierAngle) * pierLength / 2;
            const pierDy = Math.sin(pierAngle) * pierLength / 2;
            const pierPerpDx = Math.cos(pierAngle + Math.PI / 2) * pierWidth / 2;
            const pierPerpDy = Math.sin(pierAngle + Math.PI / 2) * pierWidth / 2;
            
            this.airport.terminals.push({
                points: [
                    { x: pierCenterX + perpDx - pierDx - pierPerpDx, y: pierCenterY + perpDy - pierDy - pierPerpDy },
                    { x: pierCenterX + perpDx + pierDx - pierPerpDx, y: pierCenterY + perpDy + pierDy - pierPerpDy },
                    { x: pierCenterX + perpDx + pierDx + pierPerpDx, y: pierCenterY + perpDy + pierDy + pierPerpDy },
                    { x: pierCenterX + perpDx - pierDx + pierPerpDx, y: pierCenterY + perpDy - pierDy + pierPerpDy }
                ],
                center: { x: pierCenterX, y: pierCenterY },
                angle: pierAngle,
                length: pierLength,
                width: pierWidth
            });
        }
    }
    
    generateSatelliteTerminal(x, y, gateCount) {
        const angle = this.getAverageRunwayAngle();
        
        // Main terminal
        const mainSize = 150;
        const halfSize = mainSize / 2;
        
        this.airport.terminals.push({
            points: [
                { x: x - halfSize, y: y - halfSize },
                { x: x + halfSize, y: y - halfSize },
                { x: x + halfSize, y: y + halfSize },
                { x: x - halfSize, y: y + halfSize }
            ],
            center: { x, y },
            angle,
            length: mainSize,
            width: mainSize
        });
        
        // Satellite terminals
        const satelliteCount = Math.ceil(gateCount / 8);
        const satelliteSize = 120;
        const satelliteDistance = 400;
        
        for (let i = 0; i < satelliteCount; i++) {
            const satAngle = (i / satelliteCount) * Math.PI * 2;
            const satX = x + Math.cos(satAngle) * satelliteDistance;
            const satY = y + Math.sin(satAngle) * satelliteDistance;
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
                width: satelliteSize
            });
        }
    }
    
    generateHybridTerminal(x, y, gateCount) {
        // Combination of linear and pier
        const halfGates = Math.floor(gateCount / 2);
        this.generateLinearTerminal(x, y, halfGates);
        
        // Add a pier section
        const angle = this.getAverageRunwayAngle();
        const pierOffset = 300;
        const pierX = x + Math.cos(angle) * pierOffset;
        const pierY = y + Math.sin(angle) * pierOffset;
        
        const pierWidth = 40;
        const pierLength = 250;
        const pierAngle = angle + Math.PI / 2;
        const pierDx = Math.cos(pierAngle) * pierLength / 2;
        const pierDy = Math.sin(pierAngle) * pierLength / 2;
        const pierPerpDx = Math.cos(pierAngle + Math.PI / 2) * pierWidth / 2;
        const pierPerpDy = Math.sin(pierAngle + Math.PI / 2) * pierWidth / 2;
        
        this.airport.terminals.push({
            points: [
                { x: pierX - pierDx - pierPerpDx, y: pierY - pierDy - pierPerpDy },
                { x: pierX + pierDx - pierPerpDx, y: pierY + pierDy - pierPerpDy },
                { x: pierX + pierDx + pierPerpDx, y: pierY + pierDy + pierPerpDy },
                { x: pierX - pierDx + pierPerpDx, y: pierY - pierDy + pierPerpDy }
            ],
            center: { x: pierX, y: pierY },
            angle: pierAngle,
            length: pierLength,
            width: pierWidth
        });
    }
    
    /**
     * Generate taxiways connecting runways and terminals
     */
    generateTaxiways() {
        const density = this.config.taxiwayDensity;
        const connectionCount = density === 'high' ? 8 : density === 'medium' ? 5 : 3;
        
        // Connect runways to terminal area
        this.airport.runways.forEach((runway, idx) => {
            const runwayMid = {
                x: (runway.start.x + runway.end.x) / 2,
                y: (runway.start.y + runway.end.y) / 2
            };
            
            this.airport.terminals.forEach(terminal => {
                // Create connecting taxiway
                const connections = Math.floor(connectionCount / this.airport.runways.length) + 1;
                
                for (let i = 0; i < connections; i++) {
                    const t = (i + 0.5) / connections;
                    const runwayPoint = {
                        x: runway.start.x + (runway.end.x - runway.start.x) * t,
                        y: runway.start.y + (runway.end.y - runway.start.y) * t
                    };
                    
                    // Offset slightly from runway
                    const perpAngle = Math.atan2(runway.end.y - runway.start.y, runway.end.x - runway.start.x) + Math.PI / 2;
                    const offset = runway.width + 30;
                    
                    const startPoint = {
                        x: runwayPoint.x + Math.cos(perpAngle) * offset,
                        y: runwayPoint.y + Math.sin(perpAngle) * offset
                    };
                    
                    this.airport.taxiways.push({
                        path: [startPoint, terminal.center]
                    });
                }
            });
        });
        
        // Add parallel taxiways along runways
        this.airport.runways.forEach(runway => {
            const perpAngle = Math.atan2(runway.end.y - runway.start.y, runway.end.x - runway.start.x) + Math.PI / 2;
            const offset = runway.width + 50 + this.rng.range(0, 30);
            
            const startOffset = {
                x: Math.cos(perpAngle) * offset,
                y: Math.sin(perpAngle) * offset
            };
            
            this.airport.taxiways.push({
                path: [
                    { x: runway.start.x + startOffset.x, y: runway.start.y + startOffset.y },
                    { x: runway.end.x + startOffset.x, y: runway.end.y + startOffset.y }
                ]
            });
        });
    }
    
    /**
     * Generate gates along terminals
     */
    generateGates() {
        const gatesPerTerminal = Math.ceil(this.config.gateCount / this.airport.terminals.length);
        
        this.airport.terminals.forEach(terminal => {
            const gateSpacing = terminal.length / (gatesPerTerminal + 1);
            
            for (let i = 0; i < gatesPerTerminal && this.airport.gates.length < this.config.gateCount; i++) {
                const t = (i + 1) * gateSpacing - terminal.length / 2;
                const gateX = terminal.center.x + Math.cos(terminal.angle) * t;
                const gateY = terminal.center.y + Math.sin(terminal.angle) * t;
                
                // Gates extend perpendicular from terminal
                const perpAngle = terminal.angle + Math.PI / 2;
                const gateLength = 30 + this.rng.range(0, 20);
                
                this.airport.gates.push({
                    start: { x: gateX, y: gateY },
                    end: {
                        x: gateX + Math.cos(perpAngle) * gateLength,
                        y: gateY + Math.sin(perpAngle) * gateLength
                    }
                });
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
    transformToSVG(point, bounds, width, height, padding = 100) {
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
     * Render airport to SVG
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
        
        // Render aprons (bottom layer)
        airport.aprons.forEach(apron => {
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const points = apron.points.map(p => {
                const tp = transform(p);
                return `${tp.x},${tp.y}`;
            }).join(' ');
            polygon.setAttribute('points', points);
            polygon.setAttribute('fill', 'none');
            polygon.setAttribute('stroke', this.theme.stroke);
            polygon.setAttribute('stroke-width', '0.5');
            polygon.setAttribute('opacity', '0.3');
            this.svg.appendChild(polygon);
        });
        
        // Render taxiways
        airport.taxiways.forEach(taxiway => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            const points = taxiway.path.map(p => {
                const tp = transform(p);
                return `${tp.x},${tp.y}`;
            }).join(' ');
            line.setAttribute('points', points);
            line.setAttribute('fill', 'none');
            line.setAttribute('stroke', this.theme.stroke);
            line.setAttribute('stroke-width', this.theme.taxiwayWidth);
            line.setAttribute('stroke-linecap', 'round');
            this.svg.appendChild(line);
        });
        
        // Render terminals
        airport.terminals.forEach(terminal => {
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const points = terminal.points.map(p => {
                const tp = transform(p);
                return `${tp.x},${tp.y}`;
            }).join(' ');
            polygon.setAttribute('points', points);
            polygon.setAttribute('fill', 'none');
            polygon.setAttribute('stroke', this.theme.stroke);
            polygon.setAttribute('stroke-width', this.theme.buildingWidth);
            this.svg.appendChild(polygon);
        });
        
        // Render gates
        airport.gates.forEach(gate => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const start = transform(gate.start);
            const end = transform(gate.end);
            line.setAttribute('x1', start.x);
            line.setAttribute('y1', start.y);
            line.setAttribute('x2', end.x);
            line.setAttribute('y2', end.y);
            line.setAttribute('stroke', this.theme.stroke);
            line.setAttribute('stroke-width', this.theme.gateWidth);
            this.svg.appendChild(line);
        });
        
        // Render runways (top layer)
        airport.runways.forEach(runway => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const start = transform(runway.start);
            const end = transform(runway.end);
            line.setAttribute('x1', start.x);
            line.setAttribute('y1', start.y);
            line.setAttribute('x2', end.x);
            line.setAttribute('y2', end.y);
            line.setAttribute('stroke', this.theme.stroke);
            line.setAttribute('stroke-width', this.theme.runwayWidth);
            line.setAttribute('stroke-linecap', 'round');
            this.svg.appendChild(line);
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
