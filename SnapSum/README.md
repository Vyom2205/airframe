# SnapSum - The Elegant Calculator for macOS

SnapSum is a modern calculator application for macOS featuring a beautiful, minimalist interface with liquid glass effects. Type mathematical expressions naturally and see results instantly in a dedicated column.

## ✨ Features

### Core Capabilities

- **Intuitive Notepad-Style Editor**: Type math and text together; expressions are evaluated in real-time with results shown in an elegant results column
- **Smart Operations**: Full support for `+`, `-`, `*`, `/`, parentheses, and percentages
- **Variables**: Define and reuse values (e.g., `price = 100`, then `price * 0.8`)
- **Natural Language**: Expressions like "20% of 300" work seamlessly
- **Unit Conversions**: Convert between units for length, area, weight, and temperature
- **Currency Conversions**: Support for 10 major world currencies (USD, EUR, GBP, JPY, and more)
- **Date & Time Math**:
  - Add/subtract time: `now + 2 hours`, `today + 1 week`
  - Calculate differences: `2025-12-25 - 2025-12-04`
  - Timezone conversions: `time in London`, `now in Tokyo`
- **Multiple Sheets**: Organize different calculations in separate sheets

### 🎨 Modern Design

- **Liquid Glass Effects**: Beautiful translucent backgrounds with blur effects
- **Minimalist UI**: Clean, distraction-free interface following Apple's design guidelines
- **Smooth Animations**: Spring-based animations for delightful interactions
- **Dark Mode Support**: Seamlessly adapts to system appearance

## 📦 Installation

### Download (Recommended)

1. Download the latest `SnapSum.dmg` from the [Releases](../../releases) page
2. Open the DMG file
3. Drag SnapSum to your Applications folder
4. Launch SnapSum from Applications

### Build from Source

#### Requirements

- macOS 13.0 or later
- Xcode 15.0 or later
- Swift 5.9 or later

#### Steps

1. Clone the repository:
```bash
git clone https://github.com/Vyom2205/personal-projects.git
cd personal-projects/SnapSum
```

2. Restore the UI source files:
```bash
mv Sources/SnapSumUI Sources/SnapSum
```

3. Open in Xcode:
```bash
open Package.swift
```

4. Build and run (⌘R)

## 🚀 Creating a DMG

To create a distributable DMG file:

1. Build the app in Xcode with Release configuration
2. Run the provided script:

```bash
./create-dmg.sh
```

This will create `SnapSum.dmg` in the project directory.

For manual DMG creation, see [DMG_CREATION.md](DMG_CREATION.md).

## 🧪 Testing

```bash
cd SnapSum
swift test
```

Or use Xcode's test navigator (⌘U).

## Usage Examples

### Basic Calculations
```
5 + 3
10 * 2.5
(100 + 50) / 2
```

### Variables
```
price = 100
tax = price * 0.08
total = price + tax
```

### Percentages
```
20% of 300
150 * 15%
50%
```

### Unit Conversions
```
10 km to miles
5 feet to meters
100 kg to pounds
32 f to c
```

### Currency Conversions
```
100 usd to eur
50 gbp to jpy
1000 inr to usd
```

### Date and Time
```
now + 2 hours
today + 1 week
2025-12-10 - 2025-12-04
time in London
now in New York
```

## Project Structure

```
SnapSum/
├── Package.swift
├── Sources/
│   └── SnapSum/
│       ├── SnapSumApp.swift      # Main app entry point
│       ├── AppState.swift               # App state management
│       ├── ContentView.swift            # Main UI components
│       ├── CalculatorEngine.swift       # Core calculation engine
│       ├── UnitConverter.swift          # Unit conversion logic
│       ├── CurrencyConverter.swift      # Currency conversion logic
│       └── DateCalculator.swift         # Date/time calculations
└── Tests/
    └── SnapSumTests/
        ├── CalculatorEngineTests.swift
        ├── UnitConverterTests.swift
        ├── CurrencyConverterTests.swift
        └── DateCalculatorTests.swift
```

## Architecture

### Calculator Engine
The `CalculatorEngine` class is the core of the application. It:
- Parses mathematical expressions
- Manages variables
- Delegates to specialized converters (Unit, Currency, Date)
- Uses a recursive descent parser for expression evaluation

### UI Components
- **ContentView**: Main split view with sidebar and editor
- **SheetSidebarView**: List of calculation sheets
- **EditorView**: Split editor with input and results columns
- **ResultLineView**: Individual result display for each line

### Converters
- **UnitConverter**: Handles length, weight, area, and temperature conversions
- **CurrencyConverter**: Handles currency conversions with simplified exchange rates
- **DateCalculator**: Handles date/time arithmetic and timezone conversions

## Supported Units

### Length
- meters (m), kilometers (km), centimeters (cm), millimeters (mm)
- miles (mi), feet (ft), inches (in), yards (yd)

### Weight
- kilograms (kg), grams (g), milligrams (mg)
- pounds (lb), ounces (oz), tons

### Area
- square meters (sqm, m2), square kilometers (sqkm, km2)
- square feet (sqft, ft2), square miles (sqmi, mi2)
- acres, hectares

### Temperature
- Celsius (c), Fahrenheit (f), Kelvin (k)

## Supported Currencies

USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, MXN

*Note: Exchange rates are simplified and fixed for the MVP. For production use, integrate a real-time currency API.*

## Known Limitations

- Exchange rates are fixed (not real-time)
- Limited natural language support (only basic patterns)
- No persistence (sheets are not saved between sessions)
- No advanced date parsing (specific formats required)
- Limited timezone support (major cities only)

## Future Enhancements

- Real-time currency exchange rates via API
- Save/load calculation sheets to disk
- More natural language patterns
- Extended timezone support
- Export calculations to various formats
- Custom themes and syntax highlighting
- Function definitions
- More mathematical functions (sin, cos, log, etc.)

## License

This is a personal project for educational purposes.

## Acknowledgments

Inspired by [Numi](https://numi.app/) by Nikolai Krill, an excellent calculator app for macOS.
