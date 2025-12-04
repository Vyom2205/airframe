# Building and Running on macOS

This calculator application is designed to run on macOS using SwiftUI. To build and run the full application on a Mac:

## Prerequisites

- macOS 13.0 or later
- Xcode 15.0 or later
- Swift 5.9 or later

## Setup Instructions

### 1. Restore the UI Source Files

The UI source files are stored in `Sources/SnapSumUI/` to allow testing on non-macOS platforms. To build the full application, rename this directory:

```bash
cd SnapSum
mv Sources/SnapSumUI Sources/SnapSum
```

### 2. Update Package.swift (if needed)

Ensure the Package.swift includes the executable target. It should have:

```swift
products: [
    .executable(
        name: "SnapSum",
        targets: ["SnapSum"]
    ),
    .library(
        name: "CalculatorCore",
        targets: ["CalculatorCore"]
    )
],
targets: [
    .target(
        name: "CalculatorCore",
        dependencies: [],
        path: "Sources/CalculatorCore"
    ),
    .executableTarget(
        name: "SnapSum",
        dependencies: ["CalculatorCore"],
        path: "Sources/SnapSum"
    ),
    // ... tests ...
]
```

### 3. Build and Run

#### Option A: Using Xcode

1. Open the project in Xcode:
   ```bash
   open Package.swift
   ```

2. Select the "SnapSum" scheme from the scheme selector

3. Build and run the project with ⌘R

#### Option B: Using Swift Package Manager

```bash
swift build
swift run SnapSum
```

### 4. Running Tests

```bash
swift test
```

## Project Structure

Once the UI directory is renamed, the structure should be:

```
SnapSum/
├── Package.swift
├── Sources/
│   ├── CalculatorCore/       # Core calculation logic (platform-independent)
│   │   ├── CalculatorEngine.swift
│   │   ├── UnitConverter.swift
│   │   ├── CurrencyConverter.swift
│   │   └── DateCalculator.swift
│   └── SnapSum/       # SwiftUI app (macOS only)
│       ├── SnapSumApp.swift
│       ├── AppState.swift
│       └── ContentView.swift
└── Tests/
    └── SnapSumTests/
        ├── CalculatorEngineTests.swift
        ├── UnitConverterTests.swift
        ├── CurrencyConverterTests.swift
        └── DateCalculatorTests.swift
```

## Troubleshooting

### "No such module 'SwiftUI'" error

This error occurs when trying to build on a non-macOS platform (like Linux). The SwiftUI framework is only available on Apple platforms. Make sure you're building on macOS.

### Missing SnapSum directory

If the `Sources/SnapSum` directory doesn't exist, it may have been renamed to `SnapSumUI` for CI compatibility. Rename it back using the command in step 1 above.

## Features

Once running, you can:
- Type mathematical expressions and see instant results
- Define and use variables
- Convert between units (length, weight, temperature, area)
- Convert between currencies
- Perform date and time calculations
- Manage multiple calculation sheets

See the main README.md for detailed usage examples.
