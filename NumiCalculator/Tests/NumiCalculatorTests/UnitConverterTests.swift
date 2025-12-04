import XCTest
@testable import CalculatorCore

final class UnitConverterTests: XCTestCase {
    var converter: NumiUnitConverter!
    
    override func setUp() {
        super.setUp()
        converter = NumiUnitConverter()
    }
    
    // MARK: - Length Conversion Tests
    
    func testMetersToKilometers() {
        let result = converter.evaluate("1000 m to km", variables: [:])
        XCTAssertEqual(result, "1 km")
    }
    
    func testMilesToKilometers() {
        let result = converter.evaluate("1 mile to km", variables: [:])
        XCTAssertNotNil(result)
        XCTAssertTrue(result?.contains("km") ?? false)
    }
    
    func testFeetToMeters() {
        let result = converter.evaluate("10 feet to meters", variables: [:])
        XCTAssertNotNil(result)
        XCTAssertTrue(result?.contains("meters") ?? false)
    }
    
    // MARK: - Weight Conversion Tests
    
    func testKilogramsToPounds() {
        let result = converter.evaluate("1 kg to lb", variables: [:])
        XCTAssertNotNil(result)
        XCTAssertTrue(result?.contains("lb") ?? false)
    }
    
    func testGramsToKilograms() {
        let result = converter.evaluate("1000 g to kg", variables: [:])
        XCTAssertEqual(result, "1 kg")
    }
    
    // MARK: - Temperature Conversion Tests
    
    func testCelsiusToFahrenheit() {
        let result = converter.evaluate("0 c to f", variables: [:])
        XCTAssertEqual(result, "32 f")
    }
    
    func testFahrenheitToCelsius() {
        let result = converter.evaluate("32 f to c", variables: [:])
        XCTAssertEqual(result, "0 c")
    }
    
    // MARK: - Invalid Conversion Tests
    
    func testInvalidConversion() {
        let result = converter.evaluate("simple text", variables: [:])
        XCTAssertNil(result)
    }
    
    func testInvalidUnits() {
        let result = converter.evaluate("10 xyz to abc", variables: [:])
        XCTAssertNil(result)
    }
}
