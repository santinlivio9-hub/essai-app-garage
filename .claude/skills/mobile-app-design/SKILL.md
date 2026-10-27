---
name: "mobile-app-design"
description: "Concevoir ou relire des écrans d'app mobile selon les conventions iOS (HIG), Android (Material) et les normes d'accessibilité."
---

# Mobile App Design Standards

Source : awesome-skills/mobile-app-design (GitHub), avec la référence iOS intégrée.

Comprehensive guidance for designing mobile applications that follow platform conventions, accessibility standards, and modern UX best practices.

## When to Use This Skill

- Designing new mobile app screens or features
- Reviewing existing UI/UX implementations
- Planning interaction flows and navigation
- Establishing design systems or style guides
- Making platform-specific design decisions
- Optimizing for accessibility or performance

## Core Design Principles

### Platform-Native Conventions

**iOS (Human Interface Guidelines):**
- Navigation: Back button in top-left, primary action in top-right
- Tab bar at bottom with 3-5 items
- Large titles for hierarchy
- System font: San Francisco
- Haptic feedback for confirmations
- Swipe gestures for navigation

**Android (Material Design):**
- Navigation: Back in top-left, overflow menu in top-right
- Bottom navigation or navigation drawer
- Floating Action Button (FAB) for primary actions
- System font: Roboto
- Ripple effects for touch feedback

**React Native Cross-Platform:**
- Use platform-specific components where behavior differs
- Respect platform conventions for navigation patterns
- Test on both iOS and Android devices
- Use React Navigation and the Platform API for conditional rendering

### Touch Targets and Spacing

- iOS: 44 × 44 pt minimum for all interactive elements
- Android: 48 × 48 dp minimum
- Spacing between targets: minimum 8 dp/pt
- Larger targets for primary actions (56 dp FAB on Android)
- Consider thumb zones on large screens

### Typography Standards

- Body text: 16 sp/pt minimum (14 absolute minimum)
- Labels: 11-12 pt minimum
- Consistent scale (e.g. 12/14/16/20/24/32)
- Use system fonts unless brand requires custom
- Support Dynamic Type (iOS) and font scaling (Android)

### Color and Contrast (WCAG)

- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI component boundaries: 3:1 minimum
- Never rely on color alone; add icons, labels or patterns
- Support dark mode; test color blindness scenarios

## Component Architecture

**Container/Presentational:** presentational components render UI from props, no logic; containers fetch data, manage state and pass it down.

**Atomic Design:** Atoms (buttons, inputs, icons) → Molecules (form field, search bar) → Organisms (header, card, form) → Templates (layouts) → Pages (real screens).

## Accessibility

- Every interactive element has an accessible label (`accessibilityLabel` / `contentDescription`)
- Hints for complex interactions; announce dynamic content and screen changes
- Logical focus order, clear heading hierarchy
- Clear, jargon-free labels; consistent patterns; progressive disclosure
- Error messages explain how to recover

## Performance

- Skeleton screens for loading content; progress indicator for operations > 1 s
- Optimistic UI updates; avoid layout shift
- Touch feedback within 100 ms; animations at 60 fps; debounce rapid inputs
- React Native: `React.memo`, `useMemo`, lazy loading, virtualized lists (FlatList), optimized images, Hermes

## Design System Checklist

Visual: unified palette, type scale, 4/8 pt spacing grid, documented component library, consistent icon set.
Behavioral: unified navigation, predictable buttons, consistent form validation, standard error handling, uniform loading states.

Document each component with: purpose, props, variants/states, accessibility requirements, platform specifics, usage example.

## Workflow

**Design:** requirements → research patterns → wireframes → prototypes → validation (user tests + accessibility).

**Review (screen audit):**
1. Platform conventions (iOS vs Android)
2. Touch target sizes (44 pt / 48 dp)
3. Contrast ratios (WCAG AA)
4. Accessibility labels
5. Consistency with the design system
6. Performance considerations

Report each issue with its location, the rule broken, severity, and the fix.

**Implementation:** presentational/container pattern, atomic components bottom-up, accessibility from the start, test on real devices, document usage.

## iOS HIG — Detailed Reference

### Navigation

**Tab bar:** bottom, 3-5 tabs, icon + text label, obvious selected state, never for sequential tasks. SF Symbols, 25×25 pt icon area.

**Navigation bar:** back button top-left, title centered or large title, 1-2 actions top-right. Large titles on top-level screens, collapsing on scroll.

**Modals:** for focused tasks or critical info. Sheet (default since iOS 13), full screen, page/form sheet on iPad. Always a clear dismiss (Cancel/Done), allow pull-to-dismiss on sheets, avoid nested modals.

### Typography (SF text styles)

Large Title 34 · Title 1 28 · Title 2 22 · Title 3 20 · Headline 17 semibold · Body 17 · Callout 16 · Subheadline 15 · Footnote 13 · Caption 1 12 · Caption 2 11 (pt).

Use text styles, not fixed sizes, so Dynamic Type works; test up to accessibility sizes AX1-AX5; layout must adapt without truncating essential text.

```swift
label.font = UIFont.preferredFont(forTextStyle: .body)
label.adjustsFontForContentSizeCategory = true
```

### Color and Dark Mode

- Use semantic system colors (label, background, fill, separator) for automatic dark mode and accessibility
- One accent color for interactive elements, tab/nav tints and selected states
- Dark mode: don't just invert; soften pure white; keep contrast; use elevated backgrounds for layers

### Controls

**Buttons:** Filled (primary), Tinted (secondary), Gray (tertiary), Plain (inline). 44×44 pt hit area. Verb labels, specific ("Delete Photo" not "Delete"), Title Case.

**Text fields:** matching keyboard type (email, number pad, phone, URL); real-time validation; clear errors; keep user input on error.

**Switches:** binary, immediate effect, no save button needed.

### Gestures

Tap (activate), swipe (navigate, reveal row actions, dismiss), pinch (zoom), pan (drag/scroll), long press (context menu). Never override the left-edge back swipe or bottom system gestures; always offer a button alternative.

### Layout

- Respect safe areas: status bar, home indicator, rounded corners, Dynamic Island
- Margins 16 pt (iPhone), 20 pt (iPad); between sections 35-44 pt; between elements 8-12 pt; within groups 4-8 pt
- 8 pt grid, baseline alignment for text

### Haptics

Impact (light/medium/heavy), Notification (success/warning/error), Selection (pickers, sliders). Use for confirmations, completions, errors; never on every interaction or continuously.

### VoiceOver and Motion

```swift
button.accessibilityLabel = "Add to cart"
button.accessibilityHint = "Adds item to your shopping cart"
button.accessibilityTraits = .button
```

Label says what it is, hint says what it does, never put "button"/"image" in the label. Respect Reduce Motion (fade instead of scale).

### Performance

Launch screen matches the first screen, no splash ads, aim for < 400 ms launch, defer non-critical work. Scrolling at 60 fps: light cells, async images, prefetching, profile with Instruments.

### Platform Features

- SF Symbols: configurable weights, align with text
- Context menus (long press): 3-5 actions, destructive style for dangerous ones, preview when useful
- Widgets: small/medium/large, glanceable, deep link into the app

## Android Quick Notes (Material 3)

Top app bar with back + overflow, bottom navigation (3-5 destinations) or navigation drawer, FAB bottom-right for the main action, 48 dp targets, Roboto, ripple feedback, TalkBack labels via `contentDescription`.

## Quick Reference

- Touch targets: iOS 44×44 pt, Android 48×48 dp
- Body text 16 pt min, labels 11 pt min
- Contrast: text 4.5:1, large text 3:1, components 3:1
- iOS: back top-left, action top-right, tabs bottom
- Android: back top-left, menu top-right, FAB bottom-right
- Touch feedback < 100 ms, animations 60 fps, loader for > 1 s

Official reference: https://developer.apple.com/design/human-interface-guidelines/