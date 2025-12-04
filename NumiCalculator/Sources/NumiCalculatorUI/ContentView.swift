import SwiftUI
import CalculatorCore

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = ContentViewModel()
    
    var body: some View {
        HSplitView {
            // Sidebar for sheets
            SheetSidebarView()
                .frame(minWidth: 150, maxWidth: 250)
            
            // Main editor view
            EditorView(viewModel: viewModel)
                .frame(minWidth: 400)
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
            Text("Sheets")
                .font(.headline)
                .padding()
            
            List(appState.sheets.indices, id: \.self, selection: Binding(
                get: { appState.currentSheetIndex },
                set: { appState.currentSheetIndex = $0 }
            )) { index in
                Text(appState.sheets[index].name)
                    .padding(.vertical, 4)
            }
            
            Spacer()
            
            Button(action: {
                appState.createNewSheet()
            }) {
                HStack {
                    Image(systemName: "plus")
                    Text("New Sheet")
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .padding()
        }
        .background(Color(nsColor: .controlBackgroundColor))
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
                // Editor column
                ScrollView {
                    TextEditor(text: Binding(
                        get: { viewModel.content },
                        set: { newValue in
                            viewModel.content = newValue
                            viewModel.evaluateContent()
                        }
                    ))
                    .font(.system(.body, design: .monospaced))
                    .frame(minHeight: geometry.size.height)
                    .padding()
                }
                .frame(width: geometry.size.width * 0.6)
                
                Divider()
                
                // Results column
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(viewModel.evaluatedLines) { line in
                            ResultLineView(line: line)
                        }
                    }
                    .frame(maxWidth: .infinity, minHeight: geometry.size.height, alignment: .topLeading)
                }
                .frame(width: geometry.size.width * 0.4)
                .background(Color(nsColor: .controlBackgroundColor).opacity(0.3))
            }
        }
    }
}

struct ResultLineView: View {
    let line: EvaluatedLine
    
    var body: some View {
        HStack {
            if let result = line.result {
                Text(result)
                    .font(.system(.body, design: .monospaced))
                    .foregroundColor(.primary)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 12)
            } else if let error = line.error {
                Text(error)
                    .font(.system(.caption, design: .monospaced))
                    .foregroundColor(.red)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 12)
            } else {
                Text("")
                    .frame(height: 24)
            }
            Spacer()
        }
        .frame(minHeight: 24)
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
        .frame(width: 800, height: 600)
}
