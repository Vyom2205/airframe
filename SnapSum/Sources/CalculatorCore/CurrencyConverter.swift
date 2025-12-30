import Foundation

class CurrencyConverter {
    // Exchange rates relative to USD (simplified for MVP)
    private let exchangeRates: [String: Double] = [
        "usd": 1.0,
        "eur": 0.92,
        "gbp": 0.79,
        "jpy": 149.50,
        "cad": 1.36,
        "aud": 1.52,
        "chf": 0.88,
        "cny": 7.24,
        "inr": 83.12,
        "mxn": 17.15
    ]
    
    // Static regex for better performance
    private static let conversionPattern = try? NSRegularExpression(
        pattern: "(\\d+(?:\\.\\d+)?)\\s*([a-z]{3})\\s+(?:in|to)\\s+([a-z]{3})",
        options: .caseInsensitive
    )
    
    func evaluate(_ input: String, variables: [String: Double]) -> String? {
        var expr = input.lowercased()
        
        // Replace variables
        for (name, value) in variables {
            expr = expr.replacingOccurrences(of: name.lowercased(), with: String(value))
        }
        
        // Parse currency conversion pattern using static regex
        guard let regex = CurrencyConverter.conversionPattern,
              let match = regex.firstMatch(in: expr, range: NSRange(expr.startIndex..., in: expr)) else {
            return nil
        }
        
        guard let valueRange = Range(match.range(at: 1), in: expr),
              let fromCurrencyRange = Range(match.range(at: 2), in: expr),
              let toCurrencyRange = Range(match.range(at: 3), in: expr) else {
            return nil
        }
        
        guard let value = Double(expr[valueRange]) else { return nil }
        let fromCurrency = String(expr[fromCurrencyRange])
        let toCurrency = String(expr[toCurrencyRange])
        
        if let result = convert(value: value, from: fromCurrency, to: toCurrency) {
            return "\(formatNumber(result)) \(toCurrency.uppercased())"
        }
        
        return nil
    }
    
    private func convert(value: Double, from fromCurrency: String, to toCurrency: String) -> Double? {
        guard let fromRate = exchangeRates[fromCurrency],
              let toRate = exchangeRates[toCurrency] else {
            return nil
        }
        
        // Convert to USD first, then to target currency
        let inUSD = value / fromRate
        return inUSD * toRate
    }
    
    private func formatNumber(_ value: Double) -> String {
        return String(format: "%.2f", value)
    }
}
