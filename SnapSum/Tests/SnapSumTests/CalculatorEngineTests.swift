import XCTest
@testable import CalculatorCore

final class CalculatorEngineTests: XCTestCase {
    var calculator: CalculatorEngine!
    
    override func setUp() {
        super.setUp()
        calculator = CalculatorEngine()
    }
    
    // MARK: - Basic Operations Tests
    
    func testBasicAddition() {
        let result = calculator.evaluate("5 + 3")
        if case .success(let value) = result {
            XCTAssertEqual(value, "8")
        } else {
            XCTFail("Expected success")
        }
    }
    
    func testBasicSubtraction() {
        let result = calculator.evaluate("10 - 4")
        if case .success(let value) = result {
            XCTAssertEqual(value, "6")
        } else {
            XCTFail("Expected success")
        }
    }
    
    func testBasicMultiplication() {
        let result = calculator.evaluate("6 * 7")
        if case .success(let value) = result {
            XCTAssertEqual(value, "42")
        } else {
            XCTFail("Expected success")
        }
    }
    
    func testBasicDivision() {
        let result = calculator.evaluate("20 / 4")
        if case .success(let value) = result {
            XCTAssertEqual(value, "5")
        } else {
            XCTFail("Expected success")
        }
    }
    
    func testDivisionByZero() {
        let result = calculator.evaluate("10 / 0")
        if case .error = result {
            XCTAssert(true)
        } else {
            XCTFail("Expected error for division by zero")
        }
    }
    
    // MARK: - Parentheses Tests
    
    func testParentheses() {
        let result = calculator.evaluate("(5 + 3) * 2")
        if case .success(let value) = result {
            XCTAssertEqual(value, "16")
        } else {
            XCTFail("Expected success")
        }
    }
    
    func testNestedParentheses() {
        let result = calculator.evaluate("((2 + 3) * (4 + 1))")
        if case .success(let value) = result {
            XCTAssertEqual(value, "25")
        } else {
            XCTFail("Expected success")
        }
    }
    
    // MARK: - Percentage Tests
    
    func testPercentage() {
        let result = calculator.evaluate("50%")
        if case .success(let value) = result {
            XCTAssertEqual(value, "0.5")
        } else {
            XCTFail("Expected success")
        }
    }
    
    func testPercentageOf() {
        let result = calculator.evaluate("20% of 300")
        if case .success(let value) = result {
            XCTAssertEqual(value, "60")
        } else {
            XCTFail("Expected success")
        }
    }
    
    // MARK: - Variable Tests
    
    func testVariableAssignment() {
        let result = calculator.evaluate("price = 100")
        if case .success(let value) = result {
            XCTAssertEqual(value, "100")
        } else {
            XCTFail("Expected success")
        }
    }
    
    func testVariableUsage() {
        _ = calculator.evaluate("x = 10")
        let result = calculator.evaluate("x * 5")
        if case .success(let value) = result {
            XCTAssertEqual(value, "50")
        } else {
            XCTFail("Expected success")
        }
    }
    
    func testVariableInExpression() {
        _ = calculator.evaluate("base = 20")
        let result = calculator.evaluate("base + 30")
        if case .success(let value) = result {
            XCTAssertEqual(value, "50")
        } else {
            XCTFail("Expected success")
        }
    }
    
    // MARK: - Empty Line Test
    
    func testEmptyLine() {
        let result = calculator.evaluate("")
        if case .empty = result {
            XCTAssert(true)
        } else {
            XCTFail("Expected empty result")
        }
    }
    
    func testWhitespaceLine() {
        let result = calculator.evaluate("   ")
        if case .empty = result {
            XCTAssert(true)
        } else {
            XCTFail("Expected empty result")
        }
    }
}
