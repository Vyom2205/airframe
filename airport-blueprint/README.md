# AirFrame

A minimalist web application for visualizing airport layouts using OpenStreetMap data. Similar to [city-roads](https://anvaka.github.io/city-roads/) but specifically designed for airports.

## Features

- **Airport Search**: Input any ICAO or IATA airport code (e.g., EGLL, JFK, VABB)
- **Vector Rendering**: Pure SVG rendering with no external map tiles
- **Blueprint Style**: Clean, minimalist visualization with:
  - Runways (thick lines)
  - Taxiways (medium lines)
  - Taxilanes (thinner lines)
  - Aprons (large paved areas)
  - Terminals (outlined polygons)
  - Buildings & Hangars (very thin outlines)
  - Parking positions (small markers)
- **Theme Options**: Blueprint (dark blue), Dark, and White themes
- **Aspect Ratios**: 16:9, 9:16, and 1:1 for different display needs
- **High-Quality Export**: Download as SVG or PNG (4K resolution, wallpaper-ready)

## Live Demo

Simply open `index.html` in a modern web browser. No build process or server required!

## Usage

1. Open `airport-blueprint/index.html` in your browser
2. Enter an airport code (ICAO or IATA):
   - EGLL (London Heathrow)
   - JFK (New York JFK)
   - VABB (Mumbai)
   - KSEA (Seattle)
   - EDDF (Frankfurt)
3. Click "Load Airport" or press Enter
4. Customize theme and aspect ratio as desired
5. Download your blueprint as SVG or PNG

## Architecture

The application consists of three main components:

### 1. OverpassAPI Class
- Queries OpenStreetMap via Overpass API
- Searches for airports by ICAO/IATA codes
- Fetches comprehensive airport infrastructure:
  - Runways, taxiways, taxilanes
  - Aprons and parking positions
  - Terminals and buildings
- Processes OSM data into structured format

### 2. AirportRenderer Class
- Converts geographic coordinates to SVG space
- Auto-scales and centers airport layouts
- Applies theme styling (colors, line widths)
- Renders layered elements with proper visual hierarchy:
  - Aprons (bottom) → Buildings → Terminals → Taxilanes → Taxiways → Runways (top)

### 3. ExportManager Class
- Handles SVG file downloads
- Converts SVG to high-resolution PNG (4K)
- Manages browser download triggers

### 4. AirportApp Controller
- Coordinates UI interactions
- Manages application state
- Handles error states and user feedback

## Technical Details

- **Frontend**: Vanilla JavaScript (ES6+)
- **Rendering**: SVG (Scalable Vector Graphics)
- **Data Source**: OpenStreetMap via Overpass API
- **No Dependencies**: Pure HTML/CSS/JS implementation
- **Responsive**: Works on desktop and mobile browsers

## OpenStreetMap Query

The app queries OSM for:
- `aeroway=runway` - Airport runways
- `aeroway=taxiway` - Main taxiing paths
- `aeroway=taxilane` - Gate-to-taxiway connectors
- `aeroway=apron` - Paved aircraft parking areas
- `aeroway=terminal` - Terminal buildings
- `aeroway=parking_position` - Aircraft parking spots
- `building=*` - All airport buildings
- `building=hangar` - Aircraft hangars
- `building=terminal` - Terminal buildings
- `building=industrial` - Support facilities

## Browser Compatibility

Works in all modern browsers that support:
- ES6+ JavaScript
- SVG rendering
- Fetch API
- Canvas API (for PNG export)

## Sample Airports to Try

- **EGLL** - London Heathrow (complex multi-runway layout)
- **JFK** - New York JFK (iconic terminal layout)
- **VABB** - Mumbai (single-runway with crossing taxiways)
- **KSEA** - Seattle-Tacoma (parallel runways)
- **EDDF** - Frankfurt (large hub airport)
- **LSZH** - Zurich (mountain airport)
- **YSSY** - Sydney (waterfront airport)

## Customization

### Adding New Themes

Edit the `THEMES` object in `app.js`:

```javascript
const THEMES = {
    yourtheme: {
        background: '#custom-color',
        stroke: '#stroke-color',
        runwayWidth: 4,
        taxiwayWidth: 2,
        taxilaneWidth: 1.5,
        apronWidth: 1,
        buildingWidth: 0.8,
        parkingWidth: 0.5
    }
};
```

### Changing Export Resolution

Modify the `ASPECT_RATIOS` object in `app.js`:

```javascript
const ASPECT_RATIOS = {
    '16:9': { width: 3840, height: 2160 }, // 4K
    // Add custom resolutions
};
```

## Known Limitations

- Depends on OpenStreetMap data quality
- Some smaller airports may have incomplete data
- Overpass API has rate limits (25 seconds timeout)
- Very large airports may take longer to load

## Credits

- Data: [OpenStreetMap](https://www.openstreetmap.org/) contributors
- API: [Overpass API](https://overpass-api.de/)
- Inspired by: [City Roads by Andrei Kashcha](https://anvaka.github.io/city-roads/)

## License

This project is open source and available for personal and educational use.
