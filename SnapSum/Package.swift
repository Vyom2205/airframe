// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SnapSum",
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
            name: "SnapSumTests",
            dependencies: ["CalculatorCore"],
            path: "Tests"
        )
    ]
)
