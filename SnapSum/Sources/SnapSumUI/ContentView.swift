import SwiftUI
import CalculatorCore

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = ContentViewModel()
    
    var body: some View {
        ZStack {
            // Background gradient for depth
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(nsColor: .windowBackgroundColor),
                    Color(nsColor: .windowBackgroundColor).opacity(0.95)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            HSplitView {
                // Sidebar for sheets with glass morphism
                SheetSidebarView()
                    .frame(minWidth: 180, maxWidth: 250)
                
                // Main editor view with enhanced styling
                EditorView(viewModel: viewModel)
                    .frame(minWidth: 450)
            }
        }
        .onAppear {
            if let sheet = appState.currentSheet {
                viewModel.updateContent(sheet.content)
            }
        }
        .onChange(of: appState.currentSheetIndex) { _ in
            if let sheet = appState.currentSheet {
                viewModel.updateContent(sheet.content)
            }
        }
    }
}

struct SheetSidebarView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header with SF Symbols
            HStack {
                Image(systemName: "square.grid.2x2")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(.secondary)
                Text("Sheets")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.primary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            
            Divider()
                .opacity(0.5)
            
            // Sheet list with modern styling
            ScrollView {
                VStack(spacing: 4) {
                    ForEach(appState.sheets.indices, id: \.self) { index in
                        SheetItemView(
                            sheet: appState.sheets[index],
                            isSelected: index == appState.currentSheetIndex
                        )
                        .onTapGesture {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                appState.currentSheetIndex = index
                            }
                        }
                    }
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 8)
            }
            
            Spacer()
            
            Divider()
                .opacity(0.5)
            
            // New sheet button with modern design
            Button(action: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    appState.createNewSheet()
                }
            }) {
                HStack(spacing: 8) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 16, weight: .medium))
                    Text("New Sheet")
                        .font(.system(size: 14, weight: .medium))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.accentColor.opacity(0.1))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .strokeBorder(Color.accentColor.opacity(0.3), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 12)
            .padding(.vertical, 12)
        }
        .background(
            VisualEffectBlur(material: .sidebar, blendingMode: .behindWindow)
        )
    }
}

struct SheetItemView: View {
    let sheet: CalculationSheet
    let isSelected: Bool
    
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "doc.text")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(isSelected ? .white : .secondary)
            
            Text(sheet.name)
                .font(.system(size: 13, weight: isSelected ? .medium : .regular))
                .foregroundStyle(isSelected ? .white : .primary)
            
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(isSelected ? Color.accentColor : Color.clear)
        )
        .contentShape(Rectangle())
    }
}

class ContentViewModel: ObservableObject {
    @Published var content: String = ""
    @Published var evaluatedLines: [EvaluatedLine] = []
    
    private let calculator = CalculatorEngine()
    
    func updateContent(_ newContent: String) {
        content = newContent
        evaluateContent()
    }
    
    func evaluateContent() {
        let lines = content.components(separatedBy: .newlines)
        evaluatedLines = lines.enumerated().map { index, line in
            let result = calculator.evaluate(line)
            switch result {
            case .success(let value):
                return EvaluatedLine(lineNumber: index, input: line, result: value, error: nil)
            case .error(let error):
                return EvaluatedLine(lineNumber: index, input: line, result: nil, error: error)
            case .empty:
                return EvaluatedLine(lineNumber: index, input: line, result: nil, error: nil)
            }
        }
    }
}

struct EditorView: View {
    @ObservedObject var viewModel: ContentViewModel
    @State private var scrollPosition: CGPoint = .zero
    
    var body: some View {
        GeometryReader { geometry in
            HStack(alignment: .top, spacing: 0) {
                // Editor column with clean design
                ZStack(alignment: .topLeading) {
                    // Placeholder text
                    if viewModel.content.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Start calculating...")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(.tertiary)
                            Text("Try: 5 + 3  or  price = 100")
                                .font(.system(size: 12))
                                .foregroundStyle(.quaternary)
                        }
                        .padding(.horizontal, 24)
                        .padding(.top, 20)
                    }
                    
                    ScrollView {
                        TextEditor(text: Binding(
                            get: { viewModel.content },
                            set: { newValue in
                                viewModel.content = newValue
                                viewModel.evaluateContent()
                            }
                        ))
                        .font(.system(size: 15, design: .monospaced))
                        .scrollContentBackground(.hidden)
                        .background(Color.clear)
                        .frame(minHeight: geometry.size.height)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                    }
                }
                .frame(width: geometry.size.width * 0.58)
                .background(Color(nsColor: .textBackgroundColor).opacity(0.5))
                
                // Elegant divider with gradient
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.primary.opacity(0.08),
                                Color.primary.opacity(0.12),
                                Color.primary.opacity(0.08)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: 1)
                
                // Results column with glass effect
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(viewModel.evaluatedLines) { line in
                            ResultLineView(line: line)
                        }
                    }
                    .frame(maxWidth: .infinity, minHeight: geometry.size.height, alignment: .topLeading)
                }
                .frame(width: geometry.size.width * 0.42)
                .background(
                    ZStack {
                        VisualEffectBlur(material: .hudWindow, blendingMode: .withinWindow)
                            .opacity(0.6)
                        Color.accentColor.opacity(0.03)
                    }
                )
            }
        }
    }
}

struct ResultLineView: View {
    let line: EvaluatedLine
    
    var body: some View {
        HStack(spacing: 12) {
            if let result = line.result {
                // Success result with modern badge style
                HStack(spacing: 6) {
                    Image(systemName: "equal.circle.fill")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.green.opacity(0.8))
                    
                    Text(result)
                        .font(.system(size: 14, weight: .medium, design: .rounded))
                        .foregroundStyle(.primary)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    Capsule()
                        .fill(Color.green.opacity(0.08))
                        .overlay(
                            Capsule()
                                .strokeBorder(Color.green.opacity(0.2), lineWidth: 0.5)
                        )
                )
            } else if let error = line.error {
                // Error with modern badge style
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.red.opacity(0.8))
                    
                    Text(error)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.red)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(Color.red.opacity(0.08))
                        .overlay(
                            Capsule()
                                .strokeBorder(Color.red.opacity(0.2), lineWidth: 0.5)
                        )
                )
            } else {
                Text("")
                    .frame(height: 32)
            }
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 4)
        .frame(minHeight: 32)
    }
}

// Visual Effect Blur for glass morphism effect
struct VisualEffectBlur: NSViewRepresentable {
    var material: NSVisualEffectView.Material
    var blendingMode: NSVisualEffectView.BlendingMode
    
    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = material
        view.blendingMode = blendingMode
        view.state = .active
        return view
    }
    
    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = material
        nsView.blendingMode = blendingMode
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
        .frame(width: 900, height: 600)
}
