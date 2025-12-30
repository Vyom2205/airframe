# SnapSum UI Design Features

## Modern Apple-Style Design

SnapSum features a beautiful, minimalist interface inspired by Apple's design language with modern touches.

### Key Design Elements

#### 1. Liquid Glass Effects (Glassmorphism)
- **Sidebar**: Uses `NSVisualEffectView` with `.sidebar` material for a translucent, frosted glass appearance
- **Results Column**: Features `.hudWindow` material with subtle accent color overlay
- **Blending Modes**: `.behindWindow` and `.withinWindow` for proper depth perception

#### 2. Minimalist Typography
- **SF Pro Rounded** for result badges (warmer, more friendly)
- **SF Mono** for code/mathematical expressions (better readability)
- **Carefully chosen weights**: Medium for emphasis, Regular for body text

#### 3. Modern Color Palette
- Uses system colors for automatic dark mode support
- Subtle opacity layers for depth without overwhelming
- Accent color integration for call-to-action elements

#### 4. Smooth Animations
- **Spring animations** (response: 0.3, damping: 0.7) for sheet selection
- Natural, physics-based motion that feels alive
- No jarring transitions

#### 5. Icon System
- **SF Symbols** throughout for consistency
- Contextual icons (equal sign for results, warning for errors)
- Proper icon weights matching text

#### 6. Elegant Spacing
- **16pt standard padding** for comfortable touch targets
- Consistent 8pt spacing grid throughout
- Breathing room between elements

### UI Components

#### Sidebar
```
┌──────────────────┐
│ 🔲 Sheets        │  ← Header with icon
├──────────────────┤
│ 📄 Sheet 1    ✓  │  ← Selected with accent color
│ 📄 Sheet 2       │  ← Unselected, subtle
│ 📄 Sheet 3       │
├──────────────────┤
│ ➕ New Sheet     │  ← Prominent action button
└──────────────────┘
```

Features:
- Translucent sidebar material
- Selected items highlighted with system accent color
- Hover states for better interaction
- Modern SF Symbols for document icons

#### Editor Pane
```
┌─────────────────────────────────┐
│ Start calculating...            │  ← Placeholder text
│ Try: 5 + 3  or  price = 100    │
│                                 │
│ [User types here]               │
│                                 │
└─────────────────────────────────┘
```

Features:
- Clean, distraction-free text area
- Subtle placeholder that disappears on input
- Monospaced font for alignment
- Semi-transparent background

#### Results Column
```
┌────────────────────────┐
│ ○ = 8                  │  ← Success badge
│ ○ = 100                │
│ ⚠ Division by zero     │  ← Error badge
│                        │
└────────────────────────┘
```

Features:
- Capsule-shaped result badges
- Color-coded (green for success, red for errors)
- Icons indicating status
- Glassmorphic background with HUD material

### Visual Hierarchy

1. **Primary**: User input area (largest, clearest)
2. **Secondary**: Results column (prominent but supporting)
3. **Tertiary**: Sidebar (accessible but not dominant)

### Responsive Design

- **Minimum window size**: 700×500 (comfortable for all content)
- **Adaptive layouts**: Split view adjusts to window size
- **Proportional columns**: 58% editor, 42% results

### Accessibility

- **System colors**: Automatic dark/light mode support
- **Semantic colors**: .primary, .secondary, .tertiary for proper contrast
- **Clear hierarchy**: Font weights and sizes guide the eye
- **Touch-friendly**: All interactive elements meet minimum size requirements

### Comparison: Before vs After

#### Before (Original Numi-inspired Design)
- Basic system colors
- Standard SwiftUI components
- Minimal styling
- Functional but plain

#### After (SnapSum Apple-Style)
- ✨ Liquid glass effects throughout
- 🎨 Modern color palette with depth
- 🔄 Smooth spring animations
- 📊 Badge-style results with icons
- 🎯 Clear visual hierarchy
- 💫 Polished, professional appearance

### Technical Implementation

#### Visual Effect Blur
```swift
struct VisualEffectBlur: NSViewRepresentable {
    var material: NSVisualEffectView.Material
    var blendingMode: NSVisualEffectView.BlendingMode
    
    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = material
        view.blendingMode = blendingMode
        view.state = .active
        return view
    }
}
```

#### Modern Sheet Item
```swift
struct SheetItemView: View {
    var body: some View {
        HStack {
            Image(systemName: "doc.text")
            Text(sheet.name)
        }
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(isSelected ? Color.accentColor : Color.clear)
        )
    }
}
```

#### Result Badge
```swift
HStack {
    Image(systemName: "equal.circle.fill")
        .foregroundStyle(.green.opacity(0.8))
    Text(result)
        .font(.system(size: 14, weight: .medium, design: .rounded))
}
.background(
    Capsule()
        .fill(Color.green.opacity(0.08))
)
```

### Design Inspiration

- **macOS Big Sur+**: Modern translucent materials
- **Apple Calculator**: Simple, elegant number display
- **Apple Notes**: Clean text editing experience
- **Apple Music**: Glassmorphic sidebar

### Future Enhancements

- [ ] Custom themes (light/dark/auto)
- [ ] Adjustable sidebar width with drag handle
- [ ] Syntax highlighting for expressions
- [ ] Animated result transitions
- [ ] Custom accent color picker
- [ ] Compact mode for small windows

---

**Design Philosophy**: "Simplicity is the ultimate sophistication" - SnapSum focuses on doing one thing exceptionally well, with a beautiful interface that doesn't get in the way.
