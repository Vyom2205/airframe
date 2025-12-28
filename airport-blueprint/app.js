/**
 * Airport Blueprint Map - Main Application
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
        terminalWidth: 1.5
    },
    dark: {
        background: '#1a1a1a',
        stroke: '#ffffff',
        runwayWidth: 4,
        taxiwayWidth: 2,
        terminalWidth: 1.5
    },
    white: {
        background: '#ffffff',
        stroke: '#000000',
        runwayWidth: 4,
        taxiwayWidth: 2,
        terminalWidth: 1.5
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
     * Searches for airport by ICAO/IATA code
     */
    buildQuery(airportCode) {
        const code = airportCode.toUpperCase().trim();
        
        // Query searches for aeroway elements within airports matching the code
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
              way(area.airport)["aeroway"="runway"];
              way(area.airport)["aeroway"="taxiway"];
              way(area.airport)["aeroway"="terminal"];
              // Also search in a broader area around the airport
              node(area.airport)->.nodes;
              way(bn.nodes)["aeroway"="runway"];
              way(bn.nodes)["aeroway"="taxiway"];
              way(bn.nodes)["aeroway"="terminal"];
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
        const terminals = [];

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

                if (element.tags?.aeroway === 'runway') {
                    runways.push(item);
                } else if (element.tags?.aeroway === 'taxiway') {
                    taxiways.push(item);
                } else if (element.tags?.aeroway === 'terminal') {
                    terminals.push(item);
                }
            }
        });

        return { runways, taxiways, terminals };
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
            ...airportData.terminals
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
        
        if (!airportData.runways.length && !airportData.taxiways.length && !airportData.terminals.length) {
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

        // Render terminals (bottom layer)
        airportData.terminals.forEach(terminal => {
            this.renderWay(terminal, bounds, width, height, this.theme.terminalWidth, true);
        });

        // Render taxiways (middle layer)
        airportData.taxiways.forEach(taxiway => {
            this.renderWay(taxiway, bounds, width, height, this.theme.taxiwayWidth);
        });

        // Render runways (top layer)
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
     * Download SVG file
     */
    static downloadSVG(svgElement, filename) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        this.triggerDownload(blob, filename);
    }

    /**
     * Download PNG file (4K resolution)
     */
    static downloadPNG(svgElement, filename) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Use SVG dimensions for 4K output
            const width = parseInt(svgElement.getAttribute('width'));
            const height = parseInt(svgElement.getAttribute('height'));
            
            canvas.width = width;
            canvas.height = height;

            const svgData = new XMLSerializer().serializeToString(svgElement);
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
            this.currentAirportData = data;
            this.currentAirportCode = code.toUpperCase();

            this.renderer.render(data);
            
            const stats = `Loaded: ${data.runways.length} runways, ${data.taxiways.length} taxiways, ${data.terminals.length} terminals`;
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
