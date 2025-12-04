import XCTest
@testable import CalculatorCore

final class DateCalculatorTests: XCTestCase {
    var calculator: DateCalculator!
    
    override func setUp() {
        super.setUp()
        calculator = DateCalculator()
    }
    
    func testNowPlusHours() {
        let result = calculator.evaluate("now + 2 hours")
        XCTAssertNotNil(result)
    }
    
    func testNowPlusDays() {
        let result = calculator.evaluate("now + 3 days")
        XCTAssertNotNil(result)
    }
    
    func testTodayPlusWeeks() {
        let result = calculator.evaluate("today + 1 week")
        XCTAssertNotNil(result)
    }
    
    func testTodayPlusDays() {
        let result = calculator.evaluate("today + 5 days")
        XCTAssertNotNil(result)
    }
    
    func testDateDifference() {
        let result = calculator.evaluate("2025-12-10 - 2025-12-04")
        XCTAssertNotNil(result)
        XCTAssertTrue(result?.contains("day") ?? false)
    }
    
    func testTimeInTimezone() {
        let result = calculator.evaluate("time in London")
        XCTAssertNotNil(result)
    }
    
    func testNowInTimezone() {
        let result = calculator.evaluate("now in New York")
        XCTAssertNotNil(result)
    }
    
    func testInvalidDateExpression() {
        let result = calculator.evaluate("invalid date expression")
        XCTAssertNil(result)
    }
}
