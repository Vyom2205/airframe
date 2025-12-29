/**
 * AirFrame - Airport Blueprint Map (Demo Version)
 * Uses sample data to demonstrate functionality without external API calls
 */

// Sample airport data (KSEA - Seattle-Tacoma International Airport)
// Enhanced with buildings, aprons, taxilanes, and parking positions
const SAMPLE_AIRPORT_DATA = {
    runways: [
        {
            id: 1,
            coordinates: [
                { lat: 47.4622, lon: -122.3187 },
                { lat: 47.4515, lon: -122.2945 }
            ],
            tags: { aeroway: 'runway', ref: '16L/34R' }
        },
        {
            id: 2,
            coordinates: [
                { lat: 47.4577, lon: -122.3210 },
                { lat: 47.4470, lon: -122.2968 }
            ],
            tags: { aeroway: 'runway', ref: '16C/34C' }
        },
        {
            id: 3,
            coordinates: [
                { lat: 47.4532, lon: -122.3233 },
                { lat: 47.4425, lon: -122.2991 }
            ],
            tags: { aeroway: 'runway', ref: '16R/34L' }
        }
    ],
    taxiways: [
        // Connecting taxiways between runways
        {
            id: 10,
            coordinates: [
                { lat: 47.4577, lon: -122.3100 },
                { lat: 47.4532, lon: -122.3120 }
            ],
            tags: { aeroway: 'taxiway' }
        },
        {
            id: 11,
            coordinates: [
                { lat: 47.4550, lon: -122.3050 },
                { lat: 47.4505, lon: -122.3070 }
            ],
            tags: { aeroway: 'taxiway' }
        },
        {
            id: 12,
            coordinates: [
                { lat: 47.4523, lon: -122.3000 },
                { lat: 47.4478, lon: -122.3020 }
            ],
            tags: { aeroway: 'taxiway' }
        },
        // Terminal access taxiways
        {
            id: 13,
            coordinates: [
                { lat: 47.4550, lon: -122.3150 },
                { lat: 47.4550, lon: -122.3050 }
            ],
            tags: { aeroway: 'taxiway' }
        },
        {
            id: 14,
            coordinates: [
                { lat: 47.4523, lon: -122.3100 },
                { lat: 47.4523, lon: -122.3000 }
            ],
            tags: { aeroway: 'taxiway' }
        }
    ],
    taxilanes: [
        // Taxilanes connecting gates to taxiways
        {
            id: 30,
            coordinates: [
                { lat: 47.4557, lon: -122.3155 },
                { lat: 47.4555, lon: -122.3145 }
            ],
            tags: { aeroway: 'taxilane' }
        },
        {
            id: 31,
            coordinates: [
                { lat: 47.4545, lon: -122.3155 },
                { lat: 47.4543, lon: -122.3145 }
            ],
            tags: { aeroway: 'taxilane' }
        },
        {
            id: 32,
            coordinates: [
                { lat: 47.4532, lon: -122.3105 },
                { lat: 47.4530, lon: -122.3095 }
            ],
            tags: { aeroway: 'taxilane' }
        },
        {
            id: 33,
            coordinates: [
                { lat: 47.4520, lon: -122.3105 },
                { lat: 47.4518, lon: -122.3095 }
            ],
            tags: { aeroway: 'taxilane' }
        }
    ],
    aprons: [
        // Large apron area near terminals
        {
            id: 40,
            coordinates: [
                { lat: 47.4565, lon: -122.3165 },
                { lat: 47.4565, lon: -122.3140 },
                { lat: 47.4535, lon: -122.3140 },
                { lat: 47.4535, lon: -122.3165 },
                { lat: 47.4565, lon: -122.3165 }
            ],
            tags: { aeroway: 'apron' }
        },
        {
            id: 41,
            coordinates: [
                { lat: 47.4540, lon: -122.3115 },
                { lat: 47.4540, lon: -122.3090 },
                { lat: 47.4510, lon: -122.3090 },
                { lat: 47.4510, lon: -122.3115 },
                { lat: 47.4540, lon: -122.3115 }
            ],
            tags: { aeroway: 'apron' }
        }
    ],
    terminals: [
        {
            id: 20,
            coordinates: [
                { lat: 47.4560, lon: -122.3170 },
                { lat: 47.4560, lon: -122.3130 },
                { lat: 47.4540, lon: -122.3130 },
                { lat: 47.4540, lon: -122.3170 },
                { lat: 47.4560, lon: -122.3170 }
            ],
            tags: { aeroway: 'terminal', name: 'Central Terminal' }
        },
        {
            id: 21,
            coordinates: [
                { lat: 47.4535, lon: -122.3120 },
                { lat: 47.4535, lon: -122.3080 },
                { lat: 47.4515, lon: -122.3080 },
                { lat: 47.4515, lon: -122.3120 },
                { lat: 47.4535, lon: -122.3120 }
            ],
            tags: { aeroway: 'terminal', name: 'North Terminal' }
        }
    ],
    buildings: [
        // Hangars
        {
            id: 50,
            coordinates: [
                { lat: 47.4510, lon: -122.3175 },
                { lat: 47.4510, lon: -122.3155 },
                { lat: 47.4495, lon: -122.3155 },
                { lat: 47.4495, lon: -122.3175 },
                { lat: 47.4510, lon: -122.3175 }
            ],
            tags: { building: 'hangar' }
        },
        {
            id: 51,
            coordinates: [
                { lat: 47.4493, lon: -122.3175 },
                { lat: 47.4493, lon: -122.3155 },
                { lat: 47.4478, lon: -122.3155 },
                { lat: 47.4478, lon: -122.3175 },
                { lat: 47.4493, lon: -122.3175 }
            ],
            tags: { building: 'hangar' }
        },
        {
            id: 52,
            coordinates: [
                { lat: 47.4476, lon: -122.3175 },
                { lat: 47.4476, lon: -122.3155 },
                { lat: 47.4461, lon: -122.3155 },
                { lat: 47.4461, lon: -122.3175 },
                { lat: 47.4476, lon: -122.3175 }
            ],
            tags: { building: 'hangar' }
        },
        // Smaller support buildings
        {
            id: 53,
            coordinates: [
                { lat: 47.4575, lon: -122.3180 },
                { lat: 47.4575, lon: -122.3170 },
                { lat: 47.4565, lon: -122.3170 },
                { lat: 47.4565, lon: -122.3180 },
                { lat: 47.4575, lon: -122.3180 }
            ],
            tags: { building: 'yes' }
        },
        {
            id: 54,
            coordinates: [
                { lat: 47.4455, lon: -122.3040 },
                { lat: 47.4455, lon: -122.3025 },
                { lat: 47.4445, lon: -122.3025 },
                { lat: 47.4445, lon: -122.3040 },
                { lat: 47.4455, lon: -122.3040 }
            ],
            tags: { building: 'industrial' }
        },
        {
            id: 55,
            coordinates: [
                { lat: 47.4590, lon: -122.3145 },
                { lat: 47.4590, lon: -122.3135 },
                { lat: 47.4582, lon: -122.3135 },
                { lat: 47.4582, lon: -122.3145 },
                { lat: 47.4590, lon: -122.3145 }
            ],
            tags: { building: 'yes' }
        }
    ],
    parkingPositions: [
        // Gate parking positions
        {
            id: 60,
            coordinates: [
                { lat: 47.4558, lon: -122.3148 },
                { lat: 47.4556, lon: -122.3150 }
            ],
            tags: { aeroway: 'parking_position' }
        },
        {
            id: 61,
            coordinates: [
                { lat: 47.4546, lon: -122.3148 },
                { lat: 47.4544, lon: -122.3150 }
            ],
            tags: { aeroway: 'parking_position' }
        },
        {
            id: 62,
            coordinates: [
                { lat: 47.4531, lon: -122.3098 },
                { lat: 47.4529, lon: -122.3100 }
            ],
            tags: { aeroway: 'parking_position' }
        },
        {
            id: 63,
            coordinates: [
                { lat: 47.4519, lon: -122.3098 },
                { lat: 47.4517, lon: -122.3100 }
            ],
            tags: { aeroway: 'parking_position' }
        }
    ]
};

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

    latLonToSVG(lat, lon, bounds, width, height, padding = 50) {
        const latRange = bounds.maxLat - bounds.minLat;
        const lonRange = bounds.maxLon - bounds.minLon;

        const availableWidth = width - (2 * padding);
        const availableHeight = height - (2 * padding);
        
        const scale = Math.min(
            availableWidth / lonRange,
            availableHeight / latRange
        );

        const centerLon = (bounds.minLon + bounds.maxLon) / 2;
        const centerLat = (bounds.minLat + bounds.maxLat) / 2;

        const x = (lon - centerLon) * scale + width / 2;
        const y = -(lat - centerLat) * scale + height / 2;

        return { x, y };
    }

    render(airportData) {
        this.svg.innerHTML = '';
        
        const bounds = this.calculateBounds(airportData);
        const width = this.aspectRatio.width;
        const height = this.aspectRatio.height;

        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);
        this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        this.svg.classList.remove('theme-blueprint', 'theme-dark', 'theme-white');
        this.svg.classList.add(`theme-${Object.keys(THEMES).find(key => THEMES[key] === this.theme)}`);

        // Background
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

        // Layer 3: Buildings (including hangars)
        if (airportData.buildings) {
            airportData.buildings.forEach(building => {
                this.renderWay(building, bounds, width, height, this.theme.buildingWidth, true);
            });
        }

        // Layer 4: Terminals (aeroway=terminal polygons)
        airportData.terminals.forEach(terminal => {
            this.renderWay(terminal, bounds, width, height, this.theme.terminalWidth, true);
        });

        // Layer 5: Taxilanes (connecting taxiways to gates)
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

    renderWay(way, bounds, width, height, strokeWidth, isClosed = false) {
        if (way.coordinates.length < 2) return;

        const points = way.coordinates.map(coord => 
            this.latLonToSVG(coord.lat, coord.lon, bounds, width, height)
        );

        if (isClosed && points.length > 2) {
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
    
    static downloadSVG(svgElement, filename) {
        // Clone SVG to avoid modifying the displayed version
        const clone = svgElement.cloneNode(true);
        this.addBranding(clone);
        
        const svgData = new XMLSerializer().serializeToString(clone);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        this.triggerDownload(blob, filename);
    }

    static downloadPNG(svgElement, filename) {
        return new Promise((resolve, reject) => {
            // Clone and add branding
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

// ==================== Demo Application ====================
class DemoApp {
    constructor() {
        this.renderer = new AirportRenderer(document.getElementById('airportSVG'));
        this.currentAirportData = null;
        this.initializeUI();
    }

    initializeUI() {
        // Load demo button
        document.getElementById('loadDemo').addEventListener('click', () => {
            this.loadDemoAirport();
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
                ExportManager.downloadSVG(document.getElementById('airportSVG'), 'KSEA_blueprint.svg');
                this.setStatus('SVG downloaded successfully!', 'success');
            }
        });

        document.getElementById('downloadPNG').addEventListener('click', async () => {
            if (this.currentAirportData) {
                this.setStatus('Generating PNG...', 'loading');
                try {
                    await ExportManager.downloadPNG(document.getElementById('airportSVG'), 'KSEA_blueprint.png');
                    this.setStatus('PNG downloaded successfully!', 'success');
                } catch (error) {
                    this.setStatus(`PNG export failed: ${error.message}`, 'error');
                }
            }
        });

        this.setDownloadButtonsState(false);
    }

    loadDemoAirport() {
        this.setStatus('Loading demo airport (KSEA)...', 'loading');
        
        // Simulate loading delay
        setTimeout(() => {
            // Apply procedural density enhancement
            const enhancedData = DensityEnhancer.enhance(SAMPLE_AIRPORT_DATA);
            
            this.currentAirportData = enhancedData;
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
        }, 500);
    }

    setStatus(message, type = '') {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = 'status';
        if (type) {
            statusEl.classList.add(type);
        }
    }

    setDownloadButtonsState(enabled) {
        document.getElementById('downloadSVG').disabled = !enabled;
        document.getElementById('downloadPNG').disabled = !enabled;
    }
}

// Initialize demo on page load
document.addEventListener('DOMContentLoaded', () => {
    const app = new DemoApp();
    // Auto-load demo
    app.loadDemoAirport();
});
