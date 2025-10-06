# URL Navigation Demo

Interactive demonstration of all URL-based navigation components from React Proto Kit.

## Features Demonstrated

### 🪟 Modals
- URL-based modal state management
- Portal rendering with auto-detection
- Browser back button closes modals
- Callback support (onOpen, onClose)
- State persistence on refresh

### 📂 Drawers  
- Slide-in panels from any direction
- Smooth animations
- Backdrop click to close
- Browser back button support

### 📑 Tabs
- Type-safe tab navigation
- URL param sync
- Browser back/forward between tabs
- Validation of allowed values
- Default tab support

### 🚶 Stepper/Wizard
- Multi-step flows
- Next/Previous navigation
- Direct step access
- Helper methods (isFirst, isLast, reset, etc.)
- Form state preservation

### 📋 Accordion
- Single or multiple expansion mode
- Does NOT add to navigation stack
- Expand/collapse/toggle helpers
- Custom render functions
- URL state persistence

## Running the Demo

```bash
# Install dependencies
yarn install

# Start dev server
yarn dev

# Build for production
yarn build
```

## Key Learnings

1. **URL Persistence**: All component state is reflected in the URL, making it shareable and persistent
2. **Browser Navigation**: Back/forward buttons work naturally with modal, drawer, tabs, and stepper
3. **Accordion Exception**: Accordions use `replaceState` instead of `pushState` to avoid polluting browser history
4. **Portal Auto-Detection**: Modals automatically detect if `<UrlModalsContainer />` is available
5. **Type Safety**: Full TypeScript support with generic types for tab/step values

## Try These Things

- Open a modal and press the browser back button
- Refresh the page with a modal open
- Navigate between tabs and use back/forward
- Complete the checkout stepper and try the reset button
- Expand multiple accordion sections and refresh
- Share the URL with someone (all state preserved!)

## Code Structure

```
src/
  demos/
    ModalDemo.tsx      - Modal examples
    DrawerDemo.tsx     - Drawer examples
    TabsDemo.tsx       - Tabs examples
    StepperDemo.tsx    - Wizard/stepper examples
    AccordionDemo.tsx  - Accordion examples
  App.tsx              - Main app with router
  DemoPage.tsx         - Demo page layout
  main.tsx             - Entry point
  styles.css           - Global styles
```

## Related Documentation

See the main [RFC_URL_NAVIGATION.md](../../docs/RFC_URL_NAVIGATION.md) for complete API documentation and design decisions.
