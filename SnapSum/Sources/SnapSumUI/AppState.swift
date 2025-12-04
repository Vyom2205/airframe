import Foundation

#if canImport(Combine)
import Combine
#endif

class AppState: ObservableObject {
    @Published var sheets: [CalculationSheet] = []
    @Published var currentSheetIndex: Int = 0
    
    init() {
        createNewSheet()
    }
    
    func createNewSheet() {
        let newSheet = CalculationSheet(name: "Sheet \(sheets.count + 1)")
        sheets.append(newSheet)
        currentSheetIndex = sheets.count - 1
    }
    
    var currentSheet: CalculationSheet? {
        guard currentSheetIndex < sheets.count else { return nil }
        return sheets[currentSheetIndex]
    }
}

struct CalculationSheet: Identifiable {
    let id = UUID()
    var name: String
    var content: String = ""
    var evaluatedLines: [EvaluatedLine] = []
}

struct EvaluatedLine: Identifiable {
    let id = UUID()
    let lineNumber: Int
    let input: String
    let result: String?
    let error: String?
}
