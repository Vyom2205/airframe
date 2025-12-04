# NumiCalculator - Project Overview

## Quick Facts

- **Project Type**: macOS Desktop Application
- **Language**: Swift 5.9+
- **Framework**: SwiftUI
- **Platform**: macOS 13.0+
- **Architecture**: Modular with separated core logic and UI
- **Lines of Code**: ~1,211 lines of Swift
- **Test Coverage**: 36 tests, all passing ✅
- **Status**: Feature-complete MVP

## What is NumiCalculator?

NumiCalculator is a calculator application inspired by [Numi](https://numi.app/), designed for macOS. Unlike traditional calculators with buttons, NumiCalculator provides a notepad-like interface where you can:

- Type mathematical expressions naturally
- Mix text and calculations
- See results instantly in a side column
- Define and reuse variables
- Convert between units and currencies
- Perform date and time calculations
- Manage multiple calculation sheets

## Key Features

### 🧮 Smart Calculator
- Standard arithmetic: `+`, `-`, `*`, `/`
- Parentheses for complex expressions: `(5 + 3) * 2`
- Percentages: `20% of 300`
- Variables: `price = 100`, then use `price * 0.8`

### 📏 Unit Conversions
Supports conversions across multiple categories:
- **Length**: km, meters, miles, feet, inches
- **Weight**: kg, pounds, ounces, grams
- **Temperature**: Celsius, Fahrenheit, Kelvin
- **Area**: square meters, acres, hectares

Example: `10 km to miles` → `6.21371 miles`

### 💱 Currency Conversions
Convert between 10 major world currencies:
- USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, MXN

Example: `100 usd to eur` → `92.00 EUR`

### 📅 Date & Time Math
- Add time: `now + 2 hours`, `today + 1 week`
- Calculate differences: `2025-12-25 - 2025-12-04` → `21 days`
- Timezone conversions: `time in London`, `now in Tokyo`

### 📝 Multiple Sheets
- Create unlimited calculation sheets
- Switch between sheets easily
- Organize different calculations separately

## User Interface

```
┌─────────────────────────────────────────────┐
│  NumiCalculator                    ⭘ ⭗ ✕    │
├────────────┬────────────────────────────────┤
│  Sheets    │  Editor              Results   │
│            │                               │
│  Sheet 1   │  5 + 3              │    8    │
│  Sheet 2   │  price = 100        │   100   │
│  Sheet 3   │  price * 0.8        │    80   │
│            │  10 km to miles     │ 6.21... │
│            │  now + 2 hours      │ 2:00 PM │
│  ┌────────┐│                     │         │
│  │+ New   ││                     │         │
│  │ Sheet  ││                     │         │
│  └────────┘│                     │         │
└────────────┴────────────────────────────────┘
```

## Project Structure

```
NumiCalculator/
├── Package.swift                    # Swift Package Manager configuration
├── README.md                        # Main documentation
├── BUILD_ON_MACOS.md               # Build instructions for macOS
├── USAGE_EXAMPLES.md               # Comprehensive usage examples
├── IMPLEMENTATION_SUMMARY.md        # Technical implementation details
├── PROJECT_OVERVIEW.md             # This file
│
├── Sources/
│   ├── CalculatorCore/             # Platform-independent core logic
│   │   ├── CalculatorEngine.swift  # Main calculation engine
│   │   ├── UnitConverter.swift     # Physical unit conversions
│   │   ├── CurrencyConverter.swift # Currency conversions
│   │   └── DateCalculator.swift    # Date/time operations
│   │
│   └── NumiCalculatorUI/           # macOS-specific UI (SwiftUI)
│       ├── NumiCalculatorApp.swift # App entry point
│       ├── AppState.swift          # State management
│       └── ContentView.swift       # Main UI components
│
└── Tests/
    └── NumiCalculatorTests/
        ├── CalculatorEngineTests.swift
        ├── UnitConverterTests.swift
        ├── CurrencyConverterTests.swift
        └── DateCalculatorTests.swift
```

## Technical Highlights

### Recursive Descent Parser
The calculator uses a proper recursive descent parser that correctly handles:
- Operator precedence (PEMDAS)
- Nested parentheses
- Unary operators
- Error recovery

### Performance Optimizations
- Static regex compilation for frequently used patterns
- Efficient token parsing
- Minimal recomputations

### Clean Architecture
- **Separation of Concerns**: Core logic independent of UI
- **Testability**: 100% of core logic is unit tested
- **Extensibility**: Easy to add new features
- **Type Safety**: Leverages Swift's type system

### Error Handling
Robust error handling for:
- Division by zero
- Invalid expressions
- Mismatched parentheses
- Unknown variables
- Invalid conversions

## Development

### Prerequisites
- macOS 13.0+
- Xcode 15.0+
- Swift 5.9+

### Building
```bash
cd NumiCalculator
# Restore UI files (see BUILD_ON_MACOS.md)
mv Sources/NumiCalculatorUI Sources/NumiCalculator
swift build
```

### Testing
```bash
swift test
```

All 36 tests pass:
- ✅ 14 calculator engine tests
- ✅ 9 unit converter tests
- ✅ 5 currency converter tests
- ✅ 8 date calculator tests

### Running
```bash
swift run NumiCalculator
```

Or open in Xcode and press ⌘R.

## Use Cases

### 1. Daily Calculations
Quick math without leaving your keyboard:
```
subtotal = 125.50
tax = 8.5% of subtotal
total = subtotal + tax
```

### 2. Unit Conversions
Convert measurements on the fly:
```
my_height = 175 cm to feet
my_weight = 70 kg to pounds
```

### 3. Budget Planning
Track expenses with variables:
```
income = 5000
rent = 1500
groceries = 400
savings = income - rent - groceries
```

### 4. International Shopping
Calculate prices in your currency:
```
price = 250 eur to usd
shipping = 15% of price
total = price + shipping
```

### 5. Travel Planning
Calculate dates and conversions:
```
departure = today + 30 days
distance = 500 miles to km
time_difference = time in Tokyo
```

## Comparison with Numi

| Feature | NumiCalculator | Numi |
|---------|----------------|------|
| Basic math | ✅ | ✅ |
| Variables | ✅ | ✅ |
| Unit conversions | ✅ | ✅ |
| Currency conversion | ✅ (10 currencies) | ✅ (150+ currencies) |
| Date/time math | ✅ | ✅ |
| Multiple sheets | ✅ | ✅ |
| Natural language | ✅ (basic) | ✅ (advanced) |
| Themes | ❌ | ✅ |
| Cloud sync | ❌ | ✅ |
| Functions (sin, cos) | ❌ | ✅ |
| Timezone database | ✅ (14 cities) | ✅ (all timezones) |
| Real-time rates | ❌ | ✅ |

NumiCalculator provides the core MVP features while Numi offers more advanced capabilities.

## Future Roadmap

### Phase 2 Enhancements
- [ ] Real-time currency API integration
- [ ] Persistent storage (save/load sheets)
- [ ] More mathematical functions (sin, cos, sqrt, log)
- [ ] Advanced date parsing
- [ ] Custom unit definitions

### Phase 3 Enhancements
- [ ] Light/dark themes
- [ ] Export to various formats (PDF, CSV)
- [ ] Calculation history search
- [ ] Custom templates
- [ ] Syntax highlighting

### Phase 4 Enhancements
- [ ] Cloud sync
- [ ] iOS companion app
- [ ] Plugin system
- [ ] Scripting support

## Documentation

- **[README.md](README.md)**: Main documentation and feature overview
- **[USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)**: Comprehensive usage examples and scenarios
- **[BUILD_ON_MACOS.md](BUILD_ON_MACOS.md)**: Building and running instructions
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)**: Technical implementation details
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)**: This document

## Credits

- **Inspiration**: [Numi](https://numi.app/) by Nikolai Krill
- **Framework**: SwiftUI by Apple
- **Language**: Swift by Apple

## License

This is a personal project for educational purposes.

## Contact

For questions, issues, or contributions, please refer to the main repository.

---

**Built with ❤️ using Swift and SwiftUI**
