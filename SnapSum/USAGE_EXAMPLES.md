# SnapSum Usage Examples

This document provides practical examples of using the SnapSum app.

## Getting Started

When you launch the app, you'll see a split-pane interface:
- **Left side**: Editor where you type your calculations
- **Right side**: Results column showing evaluated results

Type your expressions and see results appear instantly!

## Basic Calculations

### Simple Arithmetic
```
5 + 3                    → 8
10 - 4                   → 6
6 * 7                    → 42
20 / 4                   → 5
```

### Using Parentheses
```
(5 + 3) * 2             → 16
((2 + 3) * (4 + 1))     → 25
100 / (5 + 5)           → 10
```

### Decimal Numbers
```
3.14 * 2                → 6.28
10.5 + 2.3              → 12.8
15.75 / 3               → 5.25
```

## Working with Percentages

### Simple Percentages
```
50%                      → 0.5
25%                      → 0.25
150 * 15%               → 22.5
```

### Percentage Of Pattern
```
20% of 300              → 60
15% of 80               → 12
50% of 1000             → 500
```

### Calculating Tips
```
bill = 85.50
tip = 20% of bill       → 17.1
total = bill + tip      → 102.6
```

## Variables

### Defining Variables
```
price = 100             → 100
tax = 8.5               → 8.5
discount = 15           → 15
```

### Using Variables in Calculations
```
subtotal = 100
tax = subtotal * 0.08   → 8
total = subtotal + tax  → 108
```

### Real-World Example: Shopping Cart
```
item1 = 29.99
item2 = 45.50
item3 = 12.75

subtotal = item1 + item2 + item3    → 88.24
tax = subtotal * 0.0825             → 7.28
shipping = 5.99                     → 5.99
total = subtotal + tax + shipping   → 101.51
```

## Unit Conversions

### Length
```
10 km to miles          → 6.21371 miles
5 feet to meters        → 1.524 meters
100 cm to inches        → 39.3701 inches
1 mile to km            → 1.60934 km
```

### Weight
```
100 kg to pounds        → 220.462 pounds
5 pounds to kg          → 2.26796 kg
1000 g to kg            → 1 kg
16 oz to pounds         → 1 pounds
```

### Temperature
```
0 c to f                → 32 f
32 f to c               → 0 c
100 c to f              → 212 f
273 k to c              → 0 c
```

### Area
```
1 acre to sqm           → 4046.86 sqm
100 sqft to sqm         → 9.2903 sqm
1 hectare to acres      → 2.47105 acres
```

## Currency Conversions

### Basic Conversions
```
100 usd to eur          → 92.00 EUR
50 gbp to usd           → 63.29 USD
1000 jpy to usd         → 6.69 USD
```

### Travel Budget Example
```
budget = 1000
euros = budget usd to eur    → 920.00 EUR
pounds = budget usd to gbp   → 790.00 GBP
yen = budget usd to jpy      → 149500.00 JPY
```

## Date and Time Math

### Adding Time to Now
```
now + 2 hours           → Dec 4, 2025 at 2:00 PM
now + 30 minutes        → Dec 4, 2025 at 12:30 PM
now + 3 days            → Dec 7, 2025 at 12:00 PM
now + 1 week            → Dec 11, 2025 at 12:00 PM
```

### Adding Time to Today
```
today + 1 day           → December 5, 2025
today + 2 weeks         → December 18, 2025
today + 1 month         → January 4, 2026
today + 1 year          → December 4, 2026
```

### Calculating Date Differences
```
2025-12-25 - 2025-12-04    → 21 days
2026-01-01 - 2025-12-04    → 28 days
2025-12-10 - 2025-12-01    → 9 days
```

### Time in Different Timezones
```
time in London          → 12:00 PM
now in New York         → 7:00 AM
time in Tokyo           → 9:00 PM
now in Sydney           → 11:00 PM
```

## Practical Real-World Scenarios

### Scenario 1: Event Planning
```
guests = 50
costPerPerson = 25
totalFood = guests * costPerPerson       → 1250

venue = 500
decorations = 200
totalCost = totalFood + venue + decorations  → 1950

perPersonCost = totalCost / guests       → 39
```

### Scenario 2: Fitness Tracking
```
# Week 1
monday = 5 km to miles                   → 3.10686 miles
wednesday = 3.5 km to miles              → 2.17479 miles
friday = 4.2 km to miles                 → 2.61 miles

weekTotal = 5 + 3.5 + 4.2               → 12.7
```

### Scenario 3: Home Renovation
```
roomLength = 15 feet to meters           → 4.572 meters
roomWidth = 12 feet to meters            → 3.6576 meters
roomArea = roomLength * roomWidth        → 16.723 (sqm)

tileCost = 25
totalCost = roomArea * tileCost          → 418.07
```

### Scenario 4: International Purchase
```
priceInEuros = 250
priceInDollars = priceInEuros eur to usd → 271.74 USD

shippingPercent = 15% of priceInDollars  → 40.76
totalCost = priceInDollars + shippingPercent → 312.5
```

### Scenario 5: Trip Planning
```
departure = today + 30 days              → January 3, 2026
return = departure + 7 days              → January 10, 2026

dailyBudget = 150
tripDays = 7
totalBudget = dailyBudget * tripDays    → 1050
```

## Tips and Tricks

### Multiple Lines
You can type multiple expressions, one per line:
```
revenue = 10000
expenses = 6500
profit = revenue - expenses              → 3500
margin = (profit / revenue) * 100       → 35
```

### Comments with Text
The calculator ignores text that isn't an expression:
```
# Monthly Budget
income = 5000
rent = 1500
groceries = 400
total_expenses = rent + groceries        → 1900
leftover = income - total_expenses       → 3100
```

### Chaining Conversions
```
distance = 10 km to miles                → 6.21371 miles
# Now use this in another calculation
time = 2
speed = distance / time                  → 3.10686
```

## Managing Sheets

- **Create New Sheet**: Click the "+ New Sheet" button or press ⌘N
- **Switch Sheets**: Click on a sheet name in the sidebar
- **Multiple Calculations**: Keep different calculations in separate sheets

Example uses:
- Sheet 1: Personal Budget
- Sheet 2: Work Project Calculations
- Sheet 3: Travel Planning
- Sheet 4: Home Renovation

## Keyboard Shortcuts

- **⌘N**: Create new sheet
- **⌘Q**: Quit application
- Type naturally and see results update in real-time!

## Error Handling

The calculator will show errors for:
- Division by zero: `10 / 0` → "Division by zero"
- Invalid expressions: `5 ++ 3` → "Invalid expression"
- Mismatched parentheses: `(5 + 3` → "Mismatched parentheses"
- Unknown conversions: `10 xyz to abc` → (no result shown)

## Best Practices

1. **Use descriptive variable names**: `monthlyRent` instead of `x`
2. **One calculation per line**: Makes results easier to read
3. **Add comments**: Use text to label sections of your calculations
4. **Use sheets**: Organize different types of calculations separately
5. **Check your units**: Always include units in conversions

## Need More Help?

See the main [README.md](README.md) for:
- Complete feature list
- Supported units and currencies
- Building and installation instructions
- Technical documentation
