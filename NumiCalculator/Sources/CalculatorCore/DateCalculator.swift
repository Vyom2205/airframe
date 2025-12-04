import Foundation

class DateCalculator {
    private let calendar = Calendar.current
    
    func evaluate(_ input: String) -> String? {
        let lowercased = input.lowercased().trimmingCharacters(in: .whitespaces)
        
        // Handle "now + X hours/days/weeks"
        if let result = handleNowAddition(lowercased) {
            return result
        }
        
        // Handle "today + X days/weeks"
        if let result = handleTodayAddition(lowercased) {
            return result
        }
        
        // Handle date difference: "YYYY-MM-DD - YYYY-MM-DD"
        if let result = handleDateDifference(lowercased) {
            return result
        }
        
        // Handle "time in [city/timezone]"
        if let result = handleTimeInTimezone(lowercased) {
            return result
        }
        
        return nil
    }
    
    private func handleNowAddition(_ input: String) -> String? {
        let pattern = try? NSRegularExpression(
            pattern: "now\\s*\\+\\s*(\\d+)\\s*(hour|hours|minute|minutes|day|days|week|weeks)",
            options: .caseInsensitive
        )
        
        guard let regex = pattern,
              let match = regex.firstMatch(in: input, range: NSRange(input.startIndex..., in: input)),
              let amountRange = Range(match.range(at: 1), in: input),
              let unitRange = Range(match.range(at: 2), in: input),
              let amount = Int(input[amountRange]) else {
            return nil
        }
        
        let unit = String(input[unitRange])
        let now = Date()
        var resultDate: Date?
        
        switch unit {
        case "hour", "hours":
            resultDate = calendar.date(byAdding: .hour, value: amount, to: now)
        case "minute", "minutes":
            resultDate = calendar.date(byAdding: .minute, value: amount, to: now)
        case "day", "days":
            resultDate = calendar.date(byAdding: .day, value: amount, to: now)
        case "week", "weeks":
            resultDate = calendar.date(byAdding: .weekOfYear, value: amount, to: now)
        default:
            return nil
        }
        
        if let date = resultDate {
            let formatter = DateFormatter()
            formatter.dateStyle = .medium
            formatter.timeStyle = .short
            return formatter.string(from: date)
        }
        
        return nil
    }
    
    private func handleTodayAddition(_ input: String) -> String? {
        let pattern = try? NSRegularExpression(
            pattern: "today\\s*\\+\\s*(\\d+)\\s*(day|days|week|weeks|month|months|year|years)",
            options: .caseInsensitive
        )
        
        guard let regex = pattern,
              let match = regex.firstMatch(in: input, range: NSRange(input.startIndex..., in: input)),
              let amountRange = Range(match.range(at: 1), in: input),
              let unitRange = Range(match.range(at: 2), in: input),
              let amount = Int(input[amountRange]) else {
            return nil
        }
        
        let unit = String(input[unitRange])
        let today = calendar.startOfDay(for: Date())
        var resultDate: Date?
        
        switch unit {
        case "day", "days":
            resultDate = calendar.date(byAdding: .day, value: amount, to: today)
        case "week", "weeks":
            resultDate = calendar.date(byAdding: .weekOfYear, value: amount, to: today)
        case "month", "months":
            resultDate = calendar.date(byAdding: .month, value: amount, to: today)
        case "year", "years":
            resultDate = calendar.date(byAdding: .year, value: amount, to: today)
        default:
            return nil
        }
        
        if let date = resultDate {
            let formatter = DateFormatter()
            formatter.dateStyle = .long
            formatter.timeStyle = .none
            return formatter.string(from: date)
        }
        
        return nil
    }
    
    private func handleDateDifference(_ input: String) -> String? {
        let pattern = try? NSRegularExpression(
            pattern: "(\\d{4})-(\\d{2})-(\\d{2})\\s*-\\s*(\\d{4})-(\\d{2})-(\\d{2})",
            options: []
        )
        
        guard let regex = pattern,
              let match = regex.firstMatch(in: input, range: NSRange(input.startIndex..., in: input)) else {
            return nil
        }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        guard let date1Range = Range(match.range(at: 0), in: input) else { return nil }
        let dateString1 = String(input[date1Range].prefix(10))
        let dateString2 = String(input[date1Range].suffix(10))
        
        guard let date1 = dateFormatter.date(from: dateString1),
              let date2 = dateFormatter.date(from: dateString2) else {
            return nil
        }
        
        let components = calendar.dateComponents([.day], from: date2, to: date1)
        if let days = components.day {
            return "\(abs(days)) day\(abs(days) == 1 ? "" : "s")"
        }
        
        return nil
    }
    
    private func handleTimeInTimezone(_ input: String) -> String? {
        // Simplified timezone handling
        let timezones: [String: String] = [
            "london": "Europe/London",
            "new york": "America/New_York",
            "newyork": "America/New_York",
            "los angeles": "America/Los_Angeles",
            "losangeles": "America/Los_Angeles",
            "tokyo": "Asia/Tokyo",
            "sydney": "Australia/Sydney",
            "paris": "Europe/Paris",
            "berlin": "Europe/Berlin",
            "moscow": "Europe/Moscow",
            "dubai": "Asia/Dubai",
            "singapore": "Asia/Singapore",
            "hong kong": "Asia/Hong_Kong",
            "hongkong": "Asia/Hong_Kong"
        ]
        
        // Look for "time in [city]" or "now in [city]"
        for (city, timezoneId) in timezones {
            if input.contains("time in \(city)") || input.contains("now in \(city)") {
                if let timezone = TimeZone(identifier: timezoneId) {
                    let formatter = DateFormatter()
                    formatter.timeZone = timezone
                    formatter.dateStyle = .none
                    formatter.timeStyle = .short
                    return formatter.string(from: Date())
                }
            }
        }
        
        return nil
    }
}
