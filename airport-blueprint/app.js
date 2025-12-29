/**
 * AirFrame - Airport Blueprint Map
 * 
 * Architecture:
 * 1. OverpassAPI - Handles fetching airport data from OpenStreetMap
 * 2. AirportRenderer - Renders airport elements as SVG
 * 3. ExportManager - Handles SVG and PNG downloads
 * 4. App Controller - Coordinates UI interactions and data flow
 */

// ==================== Configuration ====================
const THEMES = {
    blueprint: {
        background: '#0a2463',
        stroke: '#ffffff',
        runwayWidth: 4,
        taxiwayWidth: 2,
        taxilaneWidth: 1.5,
        terminalWidth: 1.5,
        apronWidth: 1,
        buildingWidth: 0.8,
        parkingWidth: 0.5
    },
    dark: {
        background: '#1a1a1a',
        stroke: '#ffffff',
        runwayWidth: 4,
        taxiwayWidth: 2,
        taxilaneWidth: 1.5,
        terminalWidth: 1.5,
        apronWidth: 1,
        buildingWidth: 0.8,
        parkingWidth: 0.5
    },
    white: {
        background: '#ffffff',
        stroke: '#000000',
        runwayWidth: 4,
        taxiwayWidth: 2,
        taxilaneWidth: 1.5,
        terminalWidth: 1.5,
        apronWidth: 1,
        buildingWidth: 0.8,
        parkingWidth: 0.5
    }
};

const ASPECT_RATIOS = {
    '16:9': { width: 3840, height: 2160 },
    '9:16': { width: 2160, height: 3840 },
    '1:1': { width: 2160, height: 2160 }
};

// ==================== Overpass API Handler ====================
class OverpassAPI {
    constructor() {
        this.endpoint = 'https://overpass-api.de/api/interpreter';
    }

    /**
     * Build Overpass QL query to fetch airport geometry
     * Searches for airport by ICAO/IATA code and fetches all relevant infrastructure
     */
    buildQuery(airportCode) {
        const code = airportCode.toUpperCase().trim();
        
        // Query searches for aeroway elements and buildings within airports matching the code
        return `
            [out:json][timeout:25];
            (
              // Search by ICAO code
              way["aeroway"="aerodrome"]["icao"="${code}"];
              relation["aeroway"="aerodrome"]["icao"="${code}"];
              // Search by IATA code
              way["aeroway"="aerodrome"]["iata"="${code}"];
              relation["aeroway"="aerodrome"]["iata"="${code}"];
              // Search by ref tag
              way["aeroway"="aerodrome"]["ref"="${code}"];
              relation["aeroway"="aerodrome"]["ref"="${code}"];
            )->.airport;
            
            // Get all airport elements within the airport area
            (
              // Primary aeroway infrastructure
              way(area.airport)["aeroway"="runway"];
              way(area.airport)["aeroway"="taxiway"];
              way(area.airport)["aeroway"="taxilane"];
              way(area.airport)["aeroway"="apron"];
              way(area.airport)["aeroway"="terminal"];
              way(area.airport)["aeroway"="parking_position"];
              
              // Buildings at airport
              way(area.airport)["building"];
              way(area.airport)["building"="terminal"];
              way(area.airport)["building"="hangar"];
              way(area.airport)["building"="industrial"];
              way(area.airport)["amenity"="airport_terminal"];
              
              // Also search in a broader area around the airport nodes
              node(area.airport)->.nodes;
              way(bn.nodes)["aeroway"="runway"];
              way(bn.nodes)["aeroway"="taxiway"];
              way(bn.nodes)["aeroway"="taxilane"];
              way(bn.nodes)["aeroway"="apron"];
              way(bn.nodes)["aeroway"="terminal"];
              way(bn.nodes)["aeroway"="parking_position"];
              way(bn.nodes)["building"];
              way(bn.nodes)["building"="terminal"];
              way(bn.nodes)["building"="hangar"];
              way(bn.nodes)["building"="industrial"];
              way(bn.nodes)["amenity"="airport_terminal"];
            );
            
            out geom;
        `;
    }

    /**
     * Fetch airport data from Overpass API
     */
    async fetchAirportData(airportCode) {
        const query = this.buildQuery(airportCode);
        
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                body: query,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (!response.ok) {
                throw new Error(`Overpass API error: ${response.status}`);
            }

            const data = await response.json();
            return this.processData(data);
        } catch (error) {
            throw new Error(`Failed to fetch airport data: ${error.message}`);
        }
    }

    /**
     * Process Overpass API response into structured airport data
     */
    processData(data) {
        const runways = [];
        const taxiways = [];
        const taxilanes = [];
        const terminals = [];
        const aprons = [];
        const buildings = [];
        const parkingPositions = [];

        if (!data.elements || data.elements.length === 0) {
            throw new Error('No airport data found for this code');
        }

        data.elements.forEach(element => {
            if (element.type === 'way' && element.geometry) {
                const coords = element.geometry.map(node => ({
                    lat: node.lat,
                    lon: node.lon
                }));

                const item = {
                    id: element.id,
                    coordinates: coords,
                    tags: element.tags || {}
                };

                // Categorize by aeroway type
                if (element.tags?.aeroway === 'runway') {
                    runways.push(item);
                } else if (element.tags?.aeroway === 'taxiway') {
                    taxiways.push(item);
                } else if (element.tags?.aeroway === 'taxilane') {
                    taxilanes.push(item);
                } else if (element.tags?.aeroway === 'terminal') {
                    terminals.push(item);
                } else if (element.tags?.aeroway === 'apron') {
                    aprons.push(item);
                } else if (element.tags?.aeroway === 'parking_position') {
                    parkingPositions.push(item);
                } 
                // Categorize buildings
                else if (element.tags?.building || element.tags?.amenity === 'airport_terminal') {
                    buildings.push(item);
                }
            }
        });

        return { runways, taxiways, taxilanes, terminals, aprons, buildings, parkingPositions };
    }
}

// ==================== Density Enhancer ====================
/**
 * Procedural density enhancement for sparse airport data
 * Generates additional visual elements while maintaining aesthetic consistency
 * 
 * Note: Enhanced elements are stylized, artistic, and non-navigational
 */
class DensityEnhancer {
    /**
     * Analyze and enhance airport data for visual density
     */
    static enhance(airportData) {
        const enhanced = JSON.parse(JSON.stringify(airportData)); // Deep copy
        
        // Check if data is sparse
        const totalElements = Object.values(airportData).reduce((sum, arr) => sum + arr.length, 0);
        const isSparse = totalElements < 15; // Threshold for enhancement
        
        if (isSparse) {
            // Generate procedural taxilanes connecting runways to terminals
            enhanced.taxilanes = [...(enhanced.taxilanes || []), ...this.generateTaxilanes(airportData)];
            
            // Generate procedural buildings near terminals
            enhanced.buildings = [...(enhanced.buildings || []), ...this.generateBuildings(airportData)];
            
            // Generate apron areas if missing
            if (!enhanced.aprons || enhanced.aprons.length === 0) {
                enhanced.aprons = this.generateAprons(airportData);
            }
            
            // Generate parking positions along aprons
            enhanced.parkingPositions = [...(enhanced.parkingPositions || []), ...this.generateParkingPositions(airportData, enhanced.aprons)];
        }
        
        return enhanced;
    }
    
    /**
     * Generate procedural taxilanes connecting infrastructure
     */
    static generateTaxilanes(data) {
        const taxilanes = [];
        const idOffset = 10000; // Avoid ID conflicts
        
        // Connect runways to taxiways
        if (data.runways.length > 0 && data.taxiways.length > 0) {
            data.runways.forEach((runway, idx) => {
                if (runway.coordinates.length >= 2) {
                    const runwayMid = this.getMidpoint(runway.coordinates[0], runway.coordinates[runway.coordinates.length - 1]);
                    
                    // Find nearest taxiway
                    const nearestTaxiway = this.findNearest(runwayMid, data.taxiways);
                    if (nearestTaxiway) {
                        const taxiwayMid = this.getMidpoint(nearestTaxiway.coordinates[0], nearestTaxiway.coordinates[nearestTaxiway.coordinates.length - 1]);
                        
                        // Create connecting taxilane with slight offset for visual interest
                        const offset = 0.0002 * (idx % 2 === 0 ? 1 : -1);
                        taxilanes.push({
                            id: idOffset + idx,
                            coordinates: [
                                { lat: runwayMid.lat + offset, lon: runwayMid.lon },
                                { lat: taxiwayMid.lat + offset, lon: taxiwayMid.lon }
                            ],
                            tags: { aeroway: 'taxilane', generated: true }
                        });
                    }
                }
            });
        }
        
        return taxilanes;
    }
    
    /**
     * Generate procedural buildings near terminals
     */
    static generateBuildings(data) {
        const buildings = [];
        const idOffset = 20000;
        
        if (data.terminals.length > 0) {
            data.terminals.forEach((terminal, idx) => {
                const center = this.getCenter(terminal.coordinates);
                
                // Generate 2-3 small support buildings near each terminal
                const buildingCount = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < buildingCount; i++) {
                    const angle = (i / buildingCount) * Math.PI * 2;
                    const distance = 0.0008 + Math.random() * 0.0004;
                    const offsetLat = Math.cos(angle) * distance;
                    const offsetLon = Math.sin(angle) * distance;
                    
                    const buildingSize = 0.0001 + Math.random() * 0.0001;
                    buildings.push({
                        id: idOffset + idx * 10 + i,
                        coordinates: [
                            { lat: center.lat + offsetLat, lon: center.lon + offsetLon },
                            { lat: center.lat + offsetLat + buildingSize, lon: center.lon + offsetLon },
                            { lat: center.lat + offsetLat + buildingSize, lon: center.lon + offsetLon + buildingSize },
                            { lat: center.lat + offsetLat, lon: center.lon + offsetLon + buildingSize },
                            { lat: center.lat + offsetLat, lon: center.lon + offsetLon }
                        ],
                        tags: { building: 'yes', generated: true }
                    });
                }
            });
        }
        
        return buildings;
    }
    
    /**
     * Generate procedural apron areas
     */
    static generateAprons(data) {
        const aprons = [];
        const idOffset = 30000;
        
        if (data.terminals.length > 0) {
            data.terminals.forEach((terminal, idx) => {
                const center = this.getCenter(terminal.coordinates);
                const apronSize = 0.0015;
                
                // Create apron in front of terminal
                aprons.push({
                    id: idOffset + idx,
                    coordinates: [
                        { lat: center.lat - apronSize, lon: center.lon - apronSize * 1.5 },
                        { lat: center.lat - apronSize, lon: center.lon + apronSize * 1.5 },
                        { lat: center.lat + apronSize * 0.5, lon: center.lon + apronSize * 1.5 },
                        { lat: center.lat + apronSize * 0.5, lon: center.lon - apronSize * 1.5 },
                        { lat: center.lat - apronSize, lon: center.lon - apronSize * 1.5 }
                    ],
                    tags: { aeroway: 'apron', generated: true }
                });
            });
        }
        
        return aprons;
    }
    
    /**
     * Generate procedural parking positions
     */
    static generateParkingPositions(data, aprons) {
        const positions = [];
        const idOffset = 40000;
        
        aprons.forEach((apron, apronIdx) => {
            if (apron.coordinates.length >= 4) {
                // Place 3-5 parking positions along apron edge
                const count = 3 + Math.floor(Math.random() * 3);
                for (let i = 0; i < count; i++) {
                    const t = (i + 0.5) / count;
                    const start = apron.coordinates[0];
                    const end = apron.coordinates[1];
                    
                    const parkingLat = start.lat + (end.lat - start.lat) * t;
                    const parkingLon = start.lon + (end.lon - start.lon) * t;
                    const offset = 0.0001;
                    
                    positions.push({
                        id: idOffset + apronIdx * 10 + i,
                        coordinates: [
                            { lat: parkingLat, lon: parkingLon },
                            { lat: parkingLat + offset, lon: parkingLon + offset }
                        ],
                        tags: { aeroway: 'parking_position', generated: true }
                    });
                }
            }
        });
        
        return positions;
    }
    
    /**
     * Helper: Get midpoint between two coordinates
     */
    static getMidpoint(coord1, coord2) {
        return {
            lat: (coord1.lat + coord2.lat) / 2,
            lon: (coord1.lon + coord2.lon) / 2
        };
    }
    
    /**
     * Helper: Get center of coordinate array
     */
    static getCenter(coordinates) {
        const sum = coordinates.reduce((acc, coord) => ({
            lat: acc.lat + coord.lat,
            lon: acc.lon + coord.lon
        }), { lat: 0, lon: 0 });
        
        return {
            lat: sum.lat / coordinates.length,
            lon: sum.lon / coordinates.length
        };
    }
    
    /**
     * Helper: Find nearest element to a coordinate
     */
    static findNearest(coord, elements) {
        let nearest = null;
        let minDist = Infinity;
        
        elements.forEach(element => {
            if (element.coordinates.length > 0) {
                const center = this.getCenter(element.coordinates);
                const dist = Math.sqrt(
                    Math.pow(coord.lat - center.lat, 2) + 
                    Math.pow(coord.lon - center.lon, 2)
                );
                
                if (dist < minDist) {
                    minDist = dist;
                    nearest = element;
                }
            }
        });
        
        return nearest;
    }
}

// ==================== Airport Renderer ====================
class AirportRenderer {
    constructor(svgElement) {
        this.svg = svgElement;
        this.theme = THEMES.blueprint;
        this.aspectRatio = ASPECT_RATIOS['16:9'];
    }

    /**
     * Set rendering theme
     */
    setTheme(themeName) {
        this.theme = THEMES[themeName] || THEMES.blueprint;
    }

    /**
     * Set aspect ratio
     */
    setAspectRatio(ratio) {
        this.aspectRatio = ASPECT_RATIOS[ratio] || ASPECT_RATIOS['16:9'];
    }

    /**
     * Calculate bounding box for all coordinates
     */
    calculateBounds(airportData) {
        let minLat = Infinity, maxLat = -Infinity;
        let minLon = Infinity, maxLon = -Infinity;

        const allElements = [
            ...airportData.runways,
            ...airportData.taxiways,
            ...(airportData.taxilanes || []),
            ...airportData.terminals,
            ...(airportData.aprons || []),
            ...(airportData.buildings || []),
            ...(airportData.parkingPositions || [])
        ];

        allElements.forEach(element => {
            element.coordinates.forEach(coord => {
                minLat = Math.min(minLat, coord.lat);
                maxLat = Math.max(maxLat, coord.lat);
                minLon = Math.min(minLon, coord.lon);
                maxLon = Math.max(maxLon, coord.lon);
            });
        });

        return { minLat, maxLat, minLon, maxLon };
    }

    /**
     * Convert lat/lon to SVG coordinates with proper scaling
     */
    latLonToSVG(lat, lon, bounds, width, height, padding = 50) {
        const latRange = bounds.maxLat - bounds.minLat;
        const lonRange = bounds.maxLon - bounds.minLon;

        // Calculate scale to fit within canvas with padding
        const availableWidth = width - (2 * padding);
        const availableHeight = height - (2 * padding);
        
        const scale = Math.min(
            availableWidth / lonRange,
            availableHeight / latRange
        );

        // Center the airport
        const centerLon = (bounds.minLon + bounds.maxLon) / 2;
        const centerLat = (bounds.minLat + bounds.maxLat) / 2;

        const x = (lon - centerLon) * scale + width / 2;
        const y = -(lat - centerLat) * scale + height / 2;

        return { x, y };
    }

    /**
     * Render airport to SVG
     */
    render(airportData) {
        // Clear existing content
        this.svg.innerHTML = '';
        
        const hasAnyData = airportData.runways.length || airportData.taxiways.length || 
                          airportData.terminals.length || (airportData.buildings && airportData.buildings.length) ||
                          (airportData.aprons && airportData.aprons.length);
        
        if (!hasAnyData) {
            throw new Error('No airport elements to render');
        }

        const bounds = this.calculateBounds(airportData);
        const width = this.aspectRatio.width;
        const height = this.aspectRatio.height;

        // Set SVG attributes
        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);
        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        this.svg.classList.remove('theme-blueprint', 'theme-dark', 'theme-white');
        this.svg.classList.add(`theme-${Object.keys(THEMES).find(key => THEMES[key] === this.theme)}`);

        // Add background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', width);
        background.setAttribute('height', height);
        background.setAttribute('fill', this.theme.background);
        this.svg.appendChild(background);

        // Render in layers from bottom to top for proper visual hierarchy
        
        // Layer 1: Aprons (bottom - large paved areas)
        if (airportData.aprons) {
            airportData.aprons.forEach(apron => {
                this.renderWay(apron, bounds, width, height, this.theme.apronWidth, true);
            });
        }

        // Layer 2: Parking positions
        if (airportData.parkingPositions) {
            airportData.parkingPositions.forEach(parking => {
                this.renderWay(parking, bounds, width, height, this.theme.parkingWidth, false);
            });
        }

        // Layer 3: Buildings (including terminals if they are buildings)
        if (airportData.buildings) {
            airportData.buildings.forEach(building => {
                this.renderWay(building, bounds, width, height, this.theme.buildingWidth, true);
            });
        }

        // Layer 4: Terminals (aeroway=terminal polygons)
        airportData.terminals.forEach(terminal => {
            this.renderWay(terminal, bounds, width, height, this.theme.terminalWidth, true);
        });

        // Layer 5: Taxilanes (connecting taxiways)
        if (airportData.taxilanes) {
            airportData.taxilanes.forEach(taxilane => {
                this.renderWay(taxilane, bounds, width, height, this.theme.taxilaneWidth);
            });
        }

        // Layer 6: Taxiways (major taxi routes)
        airportData.taxiways.forEach(taxiway => {
            this.renderWay(taxiway, bounds, width, height, this.theme.taxiwayWidth);
        });

        // Layer 7: Runways (top - most prominent)
        airportData.runways.forEach(runway => {
            this.renderWay(runway, bounds, width, height, this.theme.runwayWidth);
        });
    }

    /**
     * Render a single way (runway, taxiway, or terminal)
     */
    renderWay(way, bounds, width, height, strokeWidth, isClosed = false) {
        if (way.coordinates.length < 2) return;

        const points = way.coordinates.map(coord => 
            this.latLonToSVG(coord.lat, coord.lon, bounds, width, height)
        );

        if (isClosed && points.length > 2) {
            // Render as polygon for terminals
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
            polygon.setAttribute('points', pointsStr);
            polygon.setAttribute('fill', 'none');
            polygon.setAttribute('stroke', this.theme.stroke);
            polygon.setAttribute('stroke-width', strokeWidth);
            polygon.setAttribute('stroke-linejoin', 'round');
            polygon.setAttribute('stroke-linecap', 'round');
            this.svg.appendChild(polygon);
        } else {
            // Render as polyline for runways and taxiways
            const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
            polyline.setAttribute('points', pointsStr);
            polyline.setAttribute('fill', 'none');
            polyline.setAttribute('stroke', this.theme.stroke);
            polyline.setAttribute('stroke-width', strokeWidth);
            polyline.setAttribute('stroke-linejoin', 'round');
            polyline.setAttribute('stroke-linecap', 'round');
            this.svg.appendChild(polyline);
        }
    }
}

// ==================== Export Manager ====================
class ExportManager {
    /**
     * Add branding to SVG element
     * Note: Outputs are stylized, artistic, and non-navigational
     */
    static addBranding(svgElement) {
        const width = parseInt(svgElement.getAttribute('width'));
        const height = parseInt(svgElement.getAttribute('height'));
        
        // Get current theme (check background color)
        const background = svgElement.querySelector('rect');
        const bgColor = background ? background.getAttribute('fill') : '#0a2463';
        const textColor = (bgColor === '#ffffff') ? '#000000' : '#ffffff';
        
        // Calculate font size based on resolution
        const fontSize = Math.max(width / 120, 16);
        const padding = fontSize * 1.5;
        
        // Create text element
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', width - padding);
        text.setAttribute('y', height - padding);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('font-family', 'Arial, sans-serif');
        text.setAttribute('font-size', fontSize);
        text.setAttribute('fill', textColor);
        text.setAttribute('opacity', '0.3'); // Subtle, non-distracting
        text.textContent = 'Designed by AirFrame';
        
        // Add disclaimer comment
        const comment = document.createComment(' Stylized artistic output - Non-navigational ');
        svgElement.appendChild(comment);
        svgElement.appendChild(text);
    }
    
    /**
     * Download SVG file with branding
     */
    static downloadSVG(svgElement, filename) {
        // Clone SVG to avoid modifying the displayed version
        const clone = svgElement.cloneNode(true);
        this.addBranding(clone);
        
        const svgData = new XMLSerializer().serializeToString(clone);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        this.triggerDownload(blob, filename);
    }

    /**
     * Download PNG file (4K resolution) with branding
     */
    static downloadPNG(svgElement, filename) {
        return new Promise((resolve, reject) => {
            // Clone and add branding
            const clone = svgElement.cloneNode(true);
            this.addBranding(clone);
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Use SVG dimensions for 4K output
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

    /**
     * Trigger browser download
     */
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
class AirportApp {
    constructor() {
        this.api = new OverpassAPI();
        this.renderer = new AirportRenderer(document.getElementById('airportSVG'));
        this.currentAirportData = null;
        this.currentAirportCode = null;
        
        this.initializeUI();
    }

    /**
     * Initialize UI event listeners
     */
    initializeUI() {
        // Load button
        document.getElementById('loadBtn').addEventListener('click', () => {
            const code = document.getElementById('airportCode').value.trim();
            if (code) {
                this.loadAirport(code);
            }
        });

        // Enter key on input
        document.getElementById('airportCode').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const code = document.getElementById('airportCode').value.trim();
                if (code) {
                    this.loadAirport(code);
                }
            }
        });

        // Theme selector
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            if (this.currentAirportData) {
                this.renderer.setTheme(e.target.value);
                this.renderer.render(this.currentAirportData);
            }
        });

        // Aspect ratio selector
        document.getElementById('aspectRatio').addEventListener('change', (e) => {
            if (this.currentAirportData) {
                this.renderer.setAspectRatio(e.target.value);
                this.renderer.render(this.currentAirportData);
            }
        });

        // Download buttons
        document.getElementById('downloadSVG').addEventListener('click', () => {
            if (this.currentAirportData) {
                const filename = `${this.currentAirportCode}_blueprint.svg`;
                ExportManager.downloadSVG(document.getElementById('airportSVG'), filename);
                this.setStatus('SVG downloaded successfully!', 'success');
            }
        });

        document.getElementById('downloadPNG').addEventListener('click', async () => {
            if (this.currentAirportData) {
                this.setStatus('Generating PNG...', 'loading');
                try {
                    const filename = `${this.currentAirportCode}_blueprint.png`;
                    await ExportManager.downloadPNG(document.getElementById('airportSVG'), filename);
                    this.setStatus('PNG downloaded successfully!', 'success');
                } catch (error) {
                    this.setStatus(`PNG export failed: ${error.message}`, 'error');
                }
            }
        });

        // Disable download buttons initially
        this.setDownloadButtonsState(false);
    }

    /**
     * Load and render airport
     */
    async loadAirport(code) {
        this.setStatus('Fetching airport data...', 'loading');
        this.setDownloadButtonsState(false);

        try {
            const data = await this.api.fetchAirportData(code);
            
            // Apply procedural density enhancement
            const enhancedData = DensityEnhancer.enhance(data);
            
            this.currentAirportData = enhancedData;
            this.currentAirportCode = code.toUpperCase();

            this.renderer.render(enhancedData);
            
            // Build status message with all available elements
            const statsParts = [];
            if (enhancedData.runways.length) statsParts.push(`${enhancedData.runways.length} runways`);
            if (enhancedData.taxiways.length) statsParts.push(`${enhancedData.taxiways.length} taxiways`);
            if (enhancedData.taxilanes && enhancedData.taxilanes.length) statsParts.push(`${enhancedData.taxilanes.length} taxilanes`);
            if (enhancedData.aprons && enhancedData.aprons.length) statsParts.push(`${enhancedData.aprons.length} aprons`);
            if (enhancedData.terminals.length) statsParts.push(`${enhancedData.terminals.length} terminals`);
            if (enhancedData.buildings && enhancedData.buildings.length) statsParts.push(`${enhancedData.buildings.length} buildings`);
            if (enhancedData.parkingPositions && enhancedData.parkingPositions.length) statsParts.push(`${enhancedData.parkingPositions.length} parking positions`);
            
            const stats = `Loaded: ${statsParts.join(', ')}`;
            this.setStatus(stats, 'success');
            this.setDownloadButtonsState(true);
        } catch (error) {
            this.setStatus(error.message, 'error');
            this.currentAirportData = null;
            this.currentAirportCode = null;
        }
    }

    /**
     * Update status message
     */
    setStatus(message, type = '') {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = 'status';
        if (type) {
            statusEl.classList.add(type);
        }
    }

    /**
     * Enable/disable download buttons
     */
    setDownloadButtonsState(enabled) {
        document.getElementById('downloadSVG').disabled = !enabled;
        document.getElementById('downloadPNG').disabled = !enabled;
    }
}

// ==================== Initialize Application ====================
document.addEventListener('DOMContentLoaded', () => {
    new AirportApp();
});
