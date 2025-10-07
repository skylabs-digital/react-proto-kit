# UI Components Guide

React Proto Kit includes a suite of pre-built UI components with built-in state management via URL parameters. These components help you build dynamic interfaces quickly while maintaining clean, shareable URLs.

## 📋 Table of Contents

- [Snackbar Notifications](#snackbar-notifications)
- [Modals](#modals)
- [Drawers](#drawers)
- [Tabs](#tabs)
- [Stepper](#stepper)
- [Accordion](#accordion)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

---

## 🔔 Snackbar Notifications

Toast-style notifications with auto-dismiss, queue management, and full customization support.

### Quick Start

```tsx
import { SnackbarProvider, SnackbarContainer, useSnackbar } from '@skylabs-digital/react-proto-kit';

// 1. Wrap your app with SnackbarProvider
function App() {
  return (
    <SnackbarProvider defaultDuration={4000}>
      <SnackbarContainer position="top-right" maxVisible={3} />
      <YourApp />
    </SnackbarProvider>
  );
}

// 2. Use in any component
function TodoForm() {
  const { showSnackbar } = useSnackbar();
  const createMutation = todosApi.useCreate();
  
  const handleSubmit = async (data) => {
    try {
      await createMutation.mutateAsync(data);
      showSnackbar({
        message: 'Todo created successfully!',
        variant: 'success',
        duration: 3000
      });
    } catch (error) {
      showSnackbar({
        message: error.message,
        variant: 'error',
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => handleSubmit(data)
        }
      });
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Features

- ✅ **4 Variants**: `success`, `error`, `warning`, `info`
- ✅ **Auto-dismiss**: Configurable timeout or persistent (duration: null)
- ✅ **Queue System**: Max visible limit, automatic queue management
- ✅ **Action Buttons**: Undo, retry, or custom actions
- ✅ **Fully Customizable**: Override with your own component
- ✅ **Portal Rendering**: Correct z-index without manual configuration

### Integration with CRUD Operations

```tsx
const todosApi = createDomainApi('todos', todoSchema);
const { showSnackbar } = useSnackbar();

// Create
const createMutation = todosApi.useCreate({
  onSuccess: (todo) => {
    showSnackbar({
      message: `Created: ${todo.title}`,
      variant: 'success'
    });
  },
  onError: (e) => {
    showSnackbar({
      message: `Failed to create: ${e.message}`,
      variant: 'error'
    });
  }
});

// Delete with undo
const deleteMutation = todosApi.useDelete({
  onSuccess: (_, deletedId) => {
    const backup = todosCache.get(deletedId);
    
    showSnackbar({
      message: 'Todo deleted',
      variant: 'info',
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          createMutation.mutate(backup);
        }
      }
    });
  }
});

// Update
const updateMutation = todosApi.useUpdate({
  onSuccess: () => showSnackbar({ message: 'Saved!', variant: 'success', duration: 2000 })
});
```

### Custom Styling

```tsx
import { SnackbarItemProps } from '@skylabs-digital/react-proto-kit';

function MaterialSnackbar({ snackbar, onClose, animate }: SnackbarItemProps) {
  const variantStyles = {
    success: { background: '#4caf50', icon: '✓' },
    error: { background: '#f44336', icon: '✕' },
    warning: { background: '#ff9800', icon: '⚠' },
    info: { background: '#2196f3', icon: 'ℹ' },
  };
  
  const style = variantStyles[snackbar.variant];
  
  return (
    <div style={{
      background: style.background,
      color: 'white',
      padding: '12px 16px',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '300px',
      animation: animate ? 'slideIn 0.3s ease-out' : 'none'
    }}>
      <span style={{ fontSize: '20px' }}>{style.icon}</span>
      <span style={{ flex: 1 }}>{snackbar.message}</span>
      
      {snackbar.action && (
        <button
          onClick={() => {
            snackbar.action.onClick();
            onClose(snackbar.id);
          }}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {snackbar.action.label}
        </button>
      )}
      
      <button onClick={() => onClose(snackbar.id)} style={{ ... }}>×</button>
    </div>
  );
}

// Use custom component
<SnackbarContainer SnackbarComponent={MaterialSnackbar} />
```

---

## 🪟 Modals

URL-synchronized modals with automatic single-modal enforcement.

### Basic Usage

```tsx
import { useUrlModal } from '@skylabs-digital/react-proto-kit';

function UserProfile() {
  const [isEditOpen, setEditOpen] = useUrlModal('editUser');
  const [isDeleteOpen, setDeleteOpen] = useUrlModal('deleteUser');
  
  return (
    <div>
      <button onClick={() => setEditOpen(true)}>Edit</button>
      <button onClick={() => setDeleteOpen(true)}>Delete</button>
      
      {isEditOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit User</h2>
            <UserEditForm />
            <button onClick={() => setEditOpen(false)}>Close</button>
          </div>
        </div>
      )}
      
      {isDeleteOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Delete</h2>
            <p>Are you sure?</p>
            <button onClick={() => handleDelete()}>Delete</button>
            <button onClick={() => setDeleteOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### With Callbacks

```tsx
const [isOpen, setOpen] = useUrlModal('createTodo', {
  onOpen: () => {
    console.log('Modal opened');
    // Prefetch data, initialize form, etc.
  },
  onClose: () => {
    console.log('Modal closed');
    // Clean up, reset form, etc.
  }
});
```

### Modal with Form

```tsx
function CreateTodoModal() {
  const [isOpen, setOpen] = useUrlModal('createTodo');
  const createMutation = todosApi.useCreate();
  const { showSnackbar } = useSnackbar();
  
  const handleSubmit = async (data) => {
    try {
      await createMutation.mutateAsync(data);
      setOpen(false);  // Close modal on success
      showSnackbar({ message: 'Todo created!', variant: 'success' });
    } catch (error) {
      showSnackbar({ message: error.message, variant: 'error' });
    }
  };
  
  return (
    <>
      <button onClick={() => setOpen(true)}>Create Todo</button>
      
      {isOpen && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Todo</h2>
            <TodoForm onSubmit={handleSubmit} />
          </div>
        </div>
      )}
    </>
  );
}
```

---

## 🗄️ Drawers

Side panels for filters, navigation, or settings.

### Basic Usage

```tsx
import { useUrlDrawer } from '@skylabs-digital/react-proto-kit';

function FilterPanel() {
  const [isOpen, setOpen] = useUrlDrawer('filters', {
    position: 'right'
  });
  
  return (
    <>
      <button onClick={() => setOpen(true)}>
        <FilterIcon /> Filters
      </button>
      
      {isOpen && (
        <aside className="drawer drawer-right">
          <div className="drawer-header">
            <h3>Filters</h3>
            <button onClick={() => setOpen(false)}>×</button>
          </div>
          
          <div className="drawer-content">
            <FilterOptions />
          </div>
        </aside>
      )}
      
      {isOpen && <div className="drawer-overlay" onClick={() => setOpen(false)} />}
    </>
  );
}
```

### Mobile Navigation Drawer

```tsx
function MobileNav() {
  const [isOpen, setOpen] = useUrlDrawer('mobileNav', { position: 'left' });
  
  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setOpen(true)}>
        ☰ Menu
      </button>
      
      {isOpen && (
        <>
          <nav className="mobile-nav">
            <Link to="/" onClick={() => setOpen(false)}>Home</Link>
            <Link to="/about" onClick={() => setOpen(false)}>About</Link>
            <Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>
          </nav>
          <div className="overlay" onClick={() => setOpen(false)} />
        </>
      )}
    </>
  );
}
```

---

## 📑 Tabs

URL-synchronized tabs for settings, dashboards, or multi-view interfaces. Provides both a **hook** (`useUrlTabs`) and a **component** (`UrlTabs`) for maximum flexibility.

### Using the Hook

The `useUrlTabs` hook returns a tuple `[activeTab, setTab]`:

```tsx
import { useUrlTabs } from '@skylabs-digital/react-proto-kit';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'billing';

function SettingsPage() {
  // Returns [activeTab, setTab] tuple
  const [activeTab, setTab] = useUrlTabs<SettingsTab>(
    'tab',                                            // URL param name
    ['profile', 'security', 'notifications', 'billing'],  // Allowed values
    'profile'                                         // Default tab (optional)
  );
  
  return (
    <div>
      <nav className="tabs">
        <button 
          onClick={() => setTab('profile')} 
          className={activeTab === 'profile' ? 'active' : ''}
        >
          Profile
        </button>
        <button 
          onClick={() => setTab('security')} 
          className={activeTab === 'security' ? 'active' : ''}
        >
          Security
        </button>
        <button 
          onClick={() => setTab('notifications')} 
          className={activeTab === 'notifications' ? 'active' : ''}
        >
          Notifications
        </button>
        <button 
          onClick={() => setTab('billing')} 
          className={activeTab === 'billing' ? 'active' : ''}
        >
          Billing
        </button>
      </nav>
      
      <div className="tab-content">
        {activeTab === 'profile' && <ProfileSettings />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'billing' && <BillingSettings />}
      </div>
    </div>
  );
}
```

### Using the Component

The `UrlTabs` component provides declarative tab rendering:

#### Value-Based Rendering

```tsx
import { UrlTabs } from '@skylabs-digital/react-proto-kit';

function SettingsPage() {
  return (
    <div>
      {/* Tab Navigation - you control this */}
      <nav className="tabs">
        <button onClick={() => pushToStack('tab', 'profile')}>Profile</button>
        <button onClick={() => pushToStack('tab', 'security')}>Security</button>
        <button onClick={() => pushToStack('tab', 'notifications')}>Notifications</button>
      </nav>

      {/* Tab Content - UrlTabs manages visibility */}
      <UrlTabs param="tab" value="profile" defaultValue="profile">
        <ProfileSettings />
      </UrlTabs>
      
      <UrlTabs param="tab" value="security">
        <SecuritySettings />
      </UrlTabs>
      
      <UrlTabs param="tab" value="notifications">
        <NotificationSettings />
      </UrlTabs>
    </div>
  );
}
```

#### Render Function Pattern

```tsx
function Dashboard() {
  return (
    <UrlTabs 
      param="tab" 
      allowedValues={['overview', 'analytics', 'reports']}
      defaultValue="overview"
    >
      {(activeTab) => (
        <div>
          {activeTab === 'overview' && <OverviewContent />}
          {activeTab === 'analytics' && <AnalyticsContent />}
          {activeTab === 'reports' && <ReportsContent />}
        </div>
      )}
    </UrlTabs>
  );
}
```

#### With Unmount on Hide

Unmount inactive tabs to save resources:

```tsx
function ProductTabs() {
  return (
    <div>
      <UrlTabs 
        param="tab" 
        value="details" 
        defaultValue="details"
        unmountOnHide={true}  // Unmount when not active
      >
        <ProductDetails />
      </UrlTabs>
      
      <UrlTabs 
        param="tab" 
        value="reviews"
        unmountOnHide={true}
      >
        <ProductReviews />  {/* Only mounts when active */}
      </UrlTabs>
    </div>
  );
}
```

### Combined Hook + Component Pattern

```tsx
function AdvancedTabs() {
  type Tab = 'overview' | 'analytics' | 'reports';
  const [activeTab, setTab] = useUrlTabs<Tab>('tab', ['overview', 'analytics', 'reports']);
  
  return (
    <div>
      {/* Custom Navigation with Hook */}
      <nav className="tabs">
        <button 
          onClick={() => setTab('overview')}
          className={activeTab === 'overview' ? 'active' : ''}
        >
          Overview
        </button>
        <button 
          onClick={() => setTab('analytics')}
          className={activeTab === 'analytics' ? 'active' : ''}
        >
          Analytics
        </button>
        <button 
          onClick={() => setTab('reports')}
          className={activeTab === 'reports' ? 'active' : ''}
        >
          Reports
        </button>
      </nav>

      {/* Content with Component */}
      <UrlTabs param="tab" value="overview" defaultValue="overview">
        <OverviewContent />
      </UrlTabs>
      
      <UrlTabs param="tab" value="analytics">
        <AnalyticsContent />
      </UrlTabs>
      
      <UrlTabs param="tab" value="reports">
        <ReportsContent />
      </UrlTabs>
    </div>
  );
}
```

---

## 🪜 Stepper

Multi-step forms and onboarding flows with URL state.

### Onboarding Flow

```tsx
import { useUrlStepper } from '@skylabs-digital/react-proto-kit';

function OnboardingFlow() {
  const {
    currentStep,
    currentStepIndex,
    nextStep,
    prevStep,
    goToStep,
    canGoNext,
    canGoPrev,
    isComplete,
    isFirstStep,
    isLastStep
  } = useUrlStepper({
    steps: ['welcome', 'profile', 'preferences', 'complete'],
    defaultStep: 'welcome'
  });
  
  return (
    <div className="onboarding">
      {/* Progress indicator */}
      <div className="progress-bar">
        <div style={{ width: `${(currentStepIndex / 3) * 100}%` }} />
      </div>
      
      {/* Step content */}
      {currentStep === 'welcome' && <WelcomeStep />}
      {currentStep === 'profile' && <ProfileStep />}
      {currentStep === 'preferences' && <PreferencesStep />}
      {currentStep === 'complete' && <CompleteStep />}
      
      {/* Navigation */}
      <div className="stepper-nav">
        <button onClick={prevStep} disabled={isFirstStep}>
          Previous
        </button>
        
        {!isLastStep ? (
          <button onClick={nextStep}>Next</button>
        ) : (
          <button onClick={() => handleComplete()}>Finish</button>
        )}
      </div>
    </div>
  );
}
```

### With Validation

```tsx
function CheckoutFlow() {
  const [formErrors, setFormErrors] = useState({});
  const { currentStep, nextStep, prevStep } = useUrlStepper({
    steps: ['cart', 'shipping', 'payment', 'review']
  });
  
  const handleNext = async () => {
    // Validate current step before proceeding
    const errors = await validateStep(currentStep);
    
    if (Object.keys(errors).length === 0) {
      nextStep();
    } else {
      setFormErrors(errors);
    }
  };
  
  return (
    <div>
      {currentStep === 'cart' && <CartStep />}
      {currentStep === 'shipping' && <ShippingStep errors={formErrors} />}
      {currentStep === 'payment' && <PaymentStep errors={formErrors} />}
      {currentStep === 'review' && <ReviewStep />}
      
      <button onClick={prevStep}>Back</button>
      <button onClick={handleNext}>Continue</button>
    </div>
  );
}
```

---

## 🎵 Accordion

Collapsible sections with URL state. Supports single or multiple expansion modes.

### FAQ Accordion (Single Mode)

```tsx
import { useUrlAccordion } from '@skylabs-digital/react-proto-kit';

function FAQSection() {
  const { expanded, toggle, isExpanded } = useUrlAccordion({
    mode: 'single',
    paramName: 'faq'
  });
  
  const faqs = [
    { id: 'shipping', question: 'How long does shipping take?', answer: '2-3 business days' },
    { id: 'returns', question: 'What is your return policy?', answer: '30-day returns' },
    { id: 'warranty', question: 'Do you offer warranties?', answer: 'Yes, 1 year warranty' }
  ];
  
  return (
    <div className="faq-accordion">
      {faqs.map(faq => (
        <div key={faq.id} className="faq-item">
          <button 
            onClick={() => toggle(faq.id)}
            className="faq-question"
          >
            <span>{faq.question}</span>
            <span>{isExpanded(faq.id) ? '−' : '+'}</span>
          </button>
          
          {isExpanded(faq.id) && (
            <div className="faq-answer">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Filter Accordion (Multiple Mode)

```tsx
function FilterPanel() {
  const { expanded, toggle, isExpanded, expandAll, collapseAll } = useUrlAccordion({
    mode: 'multiple',
    paramName: 'filters'
  });
  
  return (
    <div className="filter-accordion">
      <div className="accordion-header">
        <h3>Filters</h3>
        <button onClick={() => expandAll(['category', 'price', 'brand'])}>
          Expand All
        </button>
        <button onClick={collapseAll}>
          Collapse All
        </button>
      </div>
      
      <div className="accordion-item">
        <button onClick={() => toggle('category')}>
          Category {isExpanded('category') ? '−' : '+'}
        </button>
        {isExpanded('category') && <CategoryFilters />}
      </div>
      
      <div className="accordion-item">
        <button onClick={() => toggle('price')}>
          Price Range {isExpanded('price') ? '−' : '+'}
        </button>
        {isExpanded('price') && <PriceRangeFilter />}
      </div>
      
      <div className="accordion-item">
        <button onClick={() => toggle('brand')}>
          Brand {isExpanded('brand') ? '−' : '+'}
        </button>
        {isExpanded('brand') && <BrandFilters />}
      </div>
    </div>
  );
}
```

---

## 🎯 Best Practices

### 1. Snackbar Placement

```tsx
// ✅ Good: Place SnackbarProvider at app root
function App() {
  return (
    <SnackbarProvider>
      <SnackbarContainer position="top-right" />
      <Router>
        <Routes />
      </Router>
    </SnackbarProvider>
  );
}

// ❌ Bad: Multiple providers or containers
function App() {
  return (
    <>
      <SnackbarProvider>
        <PageOne />
      </SnackbarProvider>
      <SnackbarProvider>
        <PageTwo />
      </SnackbarProvider>
    </>
  );
}
```

### 2. Modal IDs

```tsx
// ✅ Good: Descriptive, unique IDs
const [isEditOpen, setEditOpen] = useUrlModal('editUser');
const [isDeleteOpen, setDeleteOpen] = useUrlModal('deleteUser');
const [isCreateOpen, setCreateOpen] = useUrlModal('createPost');

// ❌ Bad: Generic or duplicate IDs
const [modal1, setModal1] = useUrlModal('modal');
const [modal2, setModal2] = useUrlModal('modal');  // Conflict!
```

### 3. Tab Configuration

```tsx
// ✅ Good: Stable tab IDs
const [activeTab, setTab] = useUrlTabs(
  'tab',
  ['profile', 'settings', 'billing'],  // Stable, URL-friendly
  'profile'
);

// ❌ Bad: Dynamic or changing tabs
const [activeTab, setTab] = useUrlTabs(
  'tab',
  user.permissions.map(p => p.name),  // Unstable - array reference changes
);
```

### 4. Snackbar Duration

```tsx
// ✅ Good: Appropriate durations
showSnackbar({ message: 'Saved!', duration: 2000 });  // Success: short
showSnackbar({ message: 'Error occurred', duration: 5000 });  // Error: longer
showSnackbar({ message: 'Warning', duration: 4000, action: {...} });  // With action: medium

// ❌ Bad: Too short or too long
showSnackbar({ message: 'Error details...', duration: 500 });  // Too fast to read
showSnackbar({ message: 'Success', duration: 30000 });  // Annoying
```

---

## 🔄 Common Patterns

### Pattern 1: Modal + Form + Snackbar

```tsx
function UserManagement() {
  const [isCreateOpen, setCreateOpen] = useUrlModal('createUser');
  const { showSnackbar } = useSnackbar();
  const createMutation = usersApi.useCreate();
  
  const handleCreate = async (data) => {
    try {
      await createMutation.mutateAsync(data);
      setCreateOpen(false);
      showSnackbar({ message: 'User created!', variant: 'success' });
    } catch (error) {
      showSnackbar({ message: error.message, variant: 'error' });
    }
  };
  
  return (
    <>
      <button onClick={() => setCreateOpen(true)}>Create User</button>
      {isCreateOpen && (
        <Modal onClose={() => setCreateOpen(false)}>
          <UserForm onSubmit={handleCreate} />
        </Modal>
      )}
    </>
  );
}
```

### Pattern 2: Drawer + Filters + URL State

```tsx
function ProductList() {
  const [isFiltersOpen, setFiltersOpen] = useUrlDrawer('filters');
  const [category, setCategory] = useUrlSelector('category', String);
  const [priceRange, setPriceRange] = useUrlSelector('price', String);
  
  const { data: products } = productsApi.useList({
    queryParams: { category, priceRange }
  });
  
  return (
    <>
      <button onClick={() => setFiltersOpen(true)}>Filters</button>
      
      {isFiltersOpen && (
        <Drawer onClose={() => setFiltersOpen(false)}>
          <FilterPanel
            category={category}
            onCategoryChange={setCategory}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
          />
        </Drawer>
      )}
      
      <ProductGrid products={products} />
    </>
  );
}
```

### Pattern 3: Stepper + Validation + Progress

```tsx
function MultiStepCheckout() {
  const { currentStep, nextStep, prevStep, currentStepIndex } = useUrlStepper({
    steps: ['cart', 'shipping', 'payment', 'review']
  });
  const { showSnackbar } = useSnackbar();
  
  const [formData, setFormData] = useState({});
  
  const handleNext = async () => {
    const validation = await validateStep(currentStep, formData);
    
    if (validation.success) {
      nextStep();
    } else {
      showSnackbar({
        message: validation.error,
        variant: 'error'
      });
    }
  };
  
  return (
    <div>
      <ProgressBar current={currentStepIndex} total={4} />
      <StepContent step={currentStep} data={formData} onChange={setFormData} />
      <StepNavigation onNext={handleNext} onPrev={prevStep} />
    </div>
  );
}
```

---

## 🎨 Styling Tips

All components are unstyled by default, giving you full control:

```css
/* Snackbar */
.snackbar-container {
  /* Already positioned via props */
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Drawer */
.drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 320px;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 999;
}

.drawer-right { right: 0; }
.drawer-left { left: 0; }

/* Tabs */
.tabs button.active {
  border-bottom: 2px solid #007bff;
  color: #007bff;
}

/* Accordion */
.accordion-item {
  border-bottom: 1px solid #e0e0e0;
}
```

---

## 📚 Additional Resources

- **[API Reference](./API_REFERENCE.md)** - Complete API documentation
- **[RFC Document](./RFC_URL_NAVIGATION.md)** - Design decisions and architecture
- **[Examples](../examples/url-navigation-demo)** - Interactive demo app

---

**Need help?** Check out the [examples folder](../examples/) or open an issue on GitHub.
