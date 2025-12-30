import Foundation

class CalculatorEngine {
    private var variables: [String: Double] = [:]
    private let unitConverter = UnitConversionEngine()
    private let currencyConverter = CurrencyConverter()
    private let dateCalculator = DateCalculator()
    
    // Static regex for better performance
    private static let percentOfPattern = try? NSRegularExpression(
        pattern: "(\\d+(?:\\.\\d+)?)\\s*%\\s*of\\s*(\\d+(?:\\.\\d+)?)",
        options: .caseInsensitive
    )
    
    func evaluate(_ line: String) -> EvaluationResult {
        let trimmedLine = line.trimmingCharacters(in: .whitespaces)
        
        // Skip empty lines
        if trimmedLine.isEmpty {
            return .empty
        }
        
        // Check for variable assignment
        if let assignment = parseVariableAssignment(trimmedLine) {
            variables[assignment.name] = assignment.value
            return .success(formatNumber(assignment.value))
        }
        
        // Check for date/time operations
        if let dateResult = dateCalculator.evaluate(trimmedLine) {
            return .success(dateResult)
        }
        
        // Check for unit conversion
        if let conversionResult = unitConverter.evaluate(trimmedLine, variables: variables) {
            return .success(conversionResult)
        }
        
        // Check for currency conversion
        if let currencyResult = currencyConverter.evaluate(trimmedLine, variables: variables) {
            return .success(currencyResult)
        }
        
        // Try to evaluate as mathematical expression
        do {
            let result = try evaluateExpression(trimmedLine)
            return .success(formatNumber(result))
        } catch {
            return .error(error.localizedDescription)
        }
    }
    
    private func parseVariableAssignment(_ line: String) -> (name: String, value: Double)? {
        let components = line.split(separator: "=", maxSplits: 1).map { $0.trimmingCharacters(in: .whitespaces) }
        guard components.count == 2 else { return nil }
        
        let varName = components[0]
        guard varName.allSatisfy({ $0.isLetter || $0.isNumber || $0 == "_" }) else { return nil }
        
        do {
            let value = try evaluateExpression(components[1])
            return (varName, value)
        } catch {
            return nil
        }
    }
    
    private func evaluateExpression(_ expression: String) throws -> Double {
        var expr = expression
        
        // Replace variables with their values
        for (name, value) in variables {
            expr = expr.replacingOccurrences(of: name, with: String(value))
        }
        
        // Handle natural language patterns
        expr = handleNaturalLanguage(expr)
        
        // Parse and evaluate the mathematical expression
        let parser = ExpressionParser(expr)
        return try parser.parse()
    }
    
    private func handleNaturalLanguage(_ expression: String) -> String {
        var expr = expression
        
        // Handle "X% of Y" pattern using static regex
        if let regex = CalculatorEngine.percentOfPattern {
            let range = NSRange(expr.startIndex..., in: expr)
            if let match = regex.firstMatch(in: expr, range: range) {
                if let percentRange = Range(match.range(at: 1), in: expr),
                   let valueRange = Range(match.range(at: 2), in: expr) {
                    let percent = Double(expr[percentRange]) ?? 0
                    let value = Double(expr[valueRange]) ?? 0
                    let result = (percent / 100) * value
                    expr = expr.replacingCharacters(in: Range(match.range, in: expr)!, with: String(result))
                }
            }
        }
        
        return expr
    }
    
    private func formatNumber(_ value: Double) -> String {
        if value.truncatingRemainder(dividingBy: 1) == 0 {
            return String(format: "%.0f", value)
        } else {
            return String(format: "%.6g", value)
        }
    }
}

enum EvaluationResult {
    case success(String)
    case error(String)
    case empty
}

// Expression Parser for mathematical expressions
class ExpressionParser {
    private var tokens: [Token]
    private var position: Int = 0
    
    init(_ expression: String) {
        self.tokens = ExpressionParser.tokenize(expression)
    }
    
    func parse() throws -> Double {
        let result = try parseExpression()
        if position < tokens.count {
            throw CalculatorError.invalidExpression
        }
        return result
    }
    
    private func parseExpression() throws -> Double {
        var result = try parseTerm()
        
        while position < tokens.count {
            switch tokens[position] {
            case .plus:
                position += 1
                result += try parseTerm()
            case .minus:
                position += 1
                result -= try parseTerm()
            default:
                return result
            }
        }
        
        return result
    }
    
    private func parseTerm() throws -> Double {
        var result = try parseFactor()
        
        while position < tokens.count {
            switch tokens[position] {
            case .multiply:
                position += 1
                result *= try parseFactor()
            case .divide:
                position += 1
                let divisor = try parseFactor()
                guard divisor != 0 else { throw CalculatorError.divisionByZero }
                result /= divisor
            case .percent:
                position += 1
                result = result / 100
            default:
                return result
            }
        }
        
        return result
    }
    
    private func parseFactor() throws -> Double {
        guard position < tokens.count else {
            throw CalculatorError.unexpectedEndOfExpression
        }
        
        switch tokens[position] {
        case .number(let value):
            position += 1
            return value
        case .leftParen:
            position += 1
            let result = try parseExpression()
            guard position < tokens.count, case .rightParen = tokens[position] else {
                throw CalculatorError.mismatchedParentheses
            }
            position += 1
            return result
        case .minus:
            position += 1
            let factor = try parseFactor()
            return -factor
        case .plus:
            position += 1
            return try parseFactor()
        default:
            throw CalculatorError.invalidExpression
        }
    }
    
    private static func tokenize(_ expression: String) -> [Token] {
        var tokens: [Token] = []
        var currentNumber = ""
        
        let chars = Array(expression.replacingOccurrences(of: " ", with: ""))
        var i = 0
        
        while i < chars.count {
            let char = chars[i]
            
            if char.isNumber || char == "." {
                currentNumber.append(char)
            } else {
                if !currentNumber.isEmpty {
                    if let value = Double(currentNumber) {
                        tokens.append(.number(value))
                    }
                    currentNumber = ""
                }
                
                switch char {
                case "+": tokens.append(.plus)
                case "-": tokens.append(.minus)
                case "*": tokens.append(.multiply)
                case "/": tokens.append(.divide)
                case "%": tokens.append(.percent)
                case "(": tokens.append(.leftParen)
                case ")": tokens.append(.rightParen)
                default: break
                }
            }
            i += 1
        }
        
        if !currentNumber.isEmpty {
            if let value = Double(currentNumber) {
                tokens.append(.number(value))
            }
        }
        
        return tokens
    }
}

enum Token {
    case number(Double)
    case plus
    case minus
    case multiply
    case divide
    case percent
    case leftParen
    case rightParen
}

enum CalculatorError: Error, LocalizedError {
    case invalidExpression
    case divisionByZero
    case unexpectedEndOfExpression
    case mismatchedParentheses
    
    var errorDescription: String? {
        switch self {
        case .invalidExpression:
            return "Invalid expression"
        case .divisionByZero:
            return "Division by zero"
        case .unexpectedEndOfExpression:
            return "Unexpected end of expression"
        case .mismatchedParentheses:
            return "Mismatched parentheses"
        }
    }
}
