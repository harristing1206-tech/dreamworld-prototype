// swift-tools-version: 5.8
import PackageDescription

let package = Package(
    name: "DreamworldCore",
    platforms: [.macOS(.v13)],
    products: [
        .library(name: "DreamworldCore", targets: ["DreamworldCore"])
    ],
    targets: [
        .target(
            name: "DreamworldCore",
            path: "Sources/Core"
        ),
        .testTarget(
            name: "DreamworldCoreTests",
            dependencies: ["DreamworldCore"],
            path: "Tests/CoreTests"
        )
    ]
)
