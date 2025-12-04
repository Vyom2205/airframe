import XCTest
@testable import CalculatorCore

final class CurrencyConverterTests: XCTestCase {
    var converter: CurrencyConverter!
    
    override func setUp() {
        super.setUp()
        converter = CurrencyConverter()
    }
    
    func testUSDToEUR() {
        let result = converter.evaluate("100 usd to eur", variables: [:])
        XCTAssertNotNil(result)
        XCTAssertTrue(result?.contains("EUR") ?? false)
    }
    
    func testEURToUSD() {
        let result = converter.evaluate("100 eur to usd", variables: [:])
        XCTAssertNotNil(result)
        XCTAssertTrue(result?.contains("USD") ?? false)
    }
    
    func testGBPToJPY() {
        let result = converter.evaluate("50 gbp to jpy", variables: [:])
        XCTAssertNotNil(result)
        XCTAssertTrue(result?.contains("JPY") ?? false)
    }
    
    func testInvalidCurrency() {
        let result = converter.evaluate("100 xyz to abc", variables: [:])
        XCTAssertNil(result)
    }
    
    func testNotCurrencyConversion() {
        let result = converter.evaluate("simple text", variables: [:])
        XCTAssertNil(result)
    }
}
