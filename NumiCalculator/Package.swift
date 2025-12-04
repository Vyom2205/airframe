// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "NumiCalculator",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "CalculatorCore",
            targets: ["CalculatorCore"]
        )
    ],
    dependencies: [],
    targets: [
        .target(
            name: "CalculatorCore",
            dependencies: [],
            path: "Sources/CalculatorCore"
        ),
        .testTarget(
            name: "NumiCalculatorTests",
            dependencies: ["CalculatorCore"],
            path: "Tests"
        )
    ]
)
