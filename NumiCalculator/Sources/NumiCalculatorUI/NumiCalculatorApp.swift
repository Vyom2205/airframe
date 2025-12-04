import SwiftUI
import CalculatorCore

@main
struct NumiCalculatorApp: App {
    @StateObject private var appState = AppState()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .frame(minWidth: 600, minHeight: 400)
        }
        .commands {
            CommandGroup(replacing: .newItem) {
                Button("New Sheet") {
                    appState.createNewSheet()
                }
                .keyboardShortcut("n", modifiers: .command)
            }
        }
    }
}
