import Foundation

class UnitConversionEngine {
    // Static regex for better performance
    private static let conversionPattern = try? NSRegularExpression(
        pattern: "(\\d+(?:\\.\\d+)?)\\s*([a-z]+)\\s+(?:in|to)\\s+([a-z]+)",
        options: .caseInsensitive
    )
    
    func evaluate(_ input: String, variables: [String: Double]) -> String? {
        var expr = input.lowercased()
        
        // Replace variables
        for (name, value) in variables {
            expr = expr.replacingOccurrences(of: name.lowercased(), with: String(value))
        }
        
        // Parse conversion pattern using static regex
        guard let regex = UnitConversionEngine.conversionPattern,
              let match = regex.firstMatch(in: expr, range: NSRange(expr.startIndex..., in: expr)) else {
            return nil
        }
        
        guard let valueRange = Range(match.range(at: 1), in: expr),
              let fromUnitRange = Range(match.range(at: 2), in: expr),
              let toUnitRange = Range(match.range(at: 3), in: expr) else {
            return nil
        }
        
        guard let value = Double(expr[valueRange]) else { return nil }
        let fromUnit = String(expr[fromUnitRange])
        let toUnit = String(expr[toUnitRange])
        
        if let result = convert(value: value, from: fromUnit, to: toUnit) {
            return "\(formatNumber(result)) \(toUnit)"
        }
        
        return nil
    }
    
    private func convert(value: Double, from fromUnit: String, to toUnit: String) -> Double? {
        // Length conversions
        let lengthUnits: [String: Double] = [
            "m": 1.0, "meter": 1.0, "meters": 1.0,
            "km": 1000.0, "kilometer": 1000.0, "kilometers": 1000.0,
            "cm": 0.01, "centimeter": 0.01, "centimeters": 0.01,
            "mm": 0.001, "millimeter": 0.001, "millimeters": 0.001,
            "mi": 1609.34, "mile": 1609.34, "miles": 1609.34,
            "ft": 0.3048, "foot": 0.3048, "feet": 0.3048,
            "in": 0.0254, "inch": 0.0254, "inches": 0.0254,
            "yd": 0.9144, "yard": 0.9144, "yards": 0.9144
        ]
        
        // Weight/Mass conversions
        let weightUnits: [String: Double] = [
            "kg": 1.0, "kilogram": 1.0, "kilograms": 1.0,
            "g": 0.001, "gram": 0.001, "grams": 0.001,
            "mg": 0.000001, "milligram": 0.000001, "milligrams": 0.000001,
            "lb": 0.453592, "pound": 0.453592, "pounds": 0.453592,
            "oz": 0.0283495, "ounce": 0.0283495, "ounces": 0.0283495,
            "ton": 1000.0, "tons": 1000.0
        ]
        
        // Area conversions
        let areaUnits: [String: Double] = [
            "sqm": 1.0, "m2": 1.0,
            "sqkm": 1000000.0, "km2": 1000000.0,
            "sqft": 0.092903, "ft2": 0.092903,
            "sqmi": 2589988.11, "mi2": 2589988.11,
            "acre": 4046.86, "acres": 4046.86,
            "hectare": 10000.0, "hectares": 10000.0
        ]
        
        // Temperature conversions (special case)
        if (fromUnit == "c" || fromUnit == "celsius") && (toUnit == "f" || toUnit == "fahrenheit") {
            return value * 9/5 + 32
        }
        if (fromUnit == "f" || fromUnit == "fahrenheit") && (toUnit == "c" || toUnit == "celsius") {
            return (value - 32) * 5/9
        }
        if (fromUnit == "c" || fromUnit == "celsius") && (toUnit == "k" || toUnit == "kelvin") {
            return value + 273.15
        }
        if (fromUnit == "k" || fromUnit == "kelvin") && (toUnit == "c" || toUnit == "celsius") {
            return value - 273.15
        }
        if (fromUnit == "f" || fromUnit == "fahrenheit") && (toUnit == "k" || toUnit == "kelvin") {
            return (value - 32) * 5/9 + 273.15
        }
        if (fromUnit == "k" || fromUnit == "kelvin") && (toUnit == "f" || toUnit == "fahrenheit") {
            return (value - 273.15) * 9/5 + 32
        }
        
        // Try length conversion
        if let fromFactor = lengthUnits[fromUnit], let toFactor = lengthUnits[toUnit] {
            return value * fromFactor / toFactor
        }
        
        // Try weight conversion
        if let fromFactor = weightUnits[fromUnit], let toFactor = weightUnits[toUnit] {
            return value * fromFactor / toFactor
        }
        
        // Try area conversion
        if let fromFactor = areaUnits[fromUnit], let toFactor = areaUnits[toUnit] {
            return value * fromFactor / toFactor
        }
        
        return nil
    }
    
    private func formatNumber(_ value: Double) -> String {
        if value.truncatingRemainder(dividingBy: 1) == 0 {
            return String(format: "%.0f", value)
        } else {
            return String(format: "%.6g", value)
        }
    }
}
