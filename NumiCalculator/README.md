# Numi Calculator - macOS App

A Numi-inspired calculator application for macOS built with Swift and SwiftUI. This app provides a notepad-style interface where you can type mathematical expressions, text, and natural language calculations, with results displayed in a dedicated column.

## Features

### ✨ Core Features

- **Notepad-style Editor**: Type math and text together; math expressions are evaluated and shown in a results column beside each line
- **Basic Operations**: Support for `+`, `-`, `*`, `/`, parentheses, and percentages
- **Variables**: Define and reuse variables (e.g., `price = 100`, then `price * 0.8`)
- **Natural Language**: Simple patterns like "20% of 300"
- **Unit Conversion**: Convert between units for length, area, and weight
- **Currency Conversion**: Convert between major currencies (USD, EUR, GBP, JPY, etc.)
- **Time and Date Math**:
  - Add/subtract time (e.g., "now + 2 hours", "today + 1 week")
  - Calculate time differences (e.g., "2025-12-04 - 2025-12-01")
  - Convert time zones (e.g., "time in London", "now in New York")
- **Simple History**: Save and switch between calculation sheets

## Requirements

- macOS 13.0 or later
- Swift 5.9 or later
- Xcode 15.0 or later (for building)

## Building the App

### Using Swift Package Manager

```bash
cd NumiCalculator
swift build
```

### Using Xcode

1. Open `Package.swift` in Xcode
2. Select the "NumiCalculator" scheme
3. Build and run the project (⌘R)

## Running Tests

```bash
cd NumiCalculator
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
NumiCalculator/
├── Package.swift
├── Sources/
│   └── NumiCalculator/
│       ├── NumiCalculatorApp.swift      # Main app entry point
│       ├── AppState.swift               # App state management
│       ├── ContentView.swift            # Main UI components
│       ├── CalculatorEngine.swift       # Core calculation engine
│       ├── UnitConverter.swift          # Unit conversion logic
│       ├── CurrencyConverter.swift      # Currency conversion logic
│       └── DateCalculator.swift         # Date/time calculations
└── Tests/
    └── NumiCalculatorTests/
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

Inspired by [Numi](https://numi.app/), an excellent calculator app for macOS.
