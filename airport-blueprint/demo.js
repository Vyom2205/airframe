/**
 * Airport Blueprint Map - Demo Version
 * Uses sample data to demonstrate functionality without external API calls
 */

// Sample airport data (KSEA - Seattle-Tacoma International Airport)
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
    ]
};

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

        // Render terminals
        airportData.terminals.forEach(terminal => {
            this.renderWay(terminal, bounds, width, height, this.theme.terminalWidth, true);
        });

        // Render taxiways
        airportData.taxiways.forEach(taxiway => {
            this.renderWay(taxiway, bounds, width, height, this.theme.taxiwayWidth);
        });

        // Render runways
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

// ==================== Export Manager ====================
class ExportManager {
    static downloadSVG(svgElement, filename) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        this.triggerDownload(blob, filename);
    }

    static downloadPNG(svgElement, filename) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
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
            this.currentAirportData = SAMPLE_AIRPORT_DATA;
            this.renderer.render(SAMPLE_AIRPORT_DATA);
            
            const stats = `Loaded: ${SAMPLE_AIRPORT_DATA.runways.length} runways, ${SAMPLE_AIRPORT_DATA.taxiways.length} taxiways, ${SAMPLE_AIRPORT_DATA.terminals.length} terminals`;
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
