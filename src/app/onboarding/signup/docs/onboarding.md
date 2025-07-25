# OnboardingFlow Component Documentation

## 📋 Overview

The `OnboardingFlow` component is the main controller for a multi-step user registration process. Think of it as a "wizard" that guides new users through signing up, selecting preferences, and completing their profile setup.

## 🎯 Purpose

This component manages the entire onboarding journey from start to finish:
- User authentication (login/signup)
- Welcome message
- Country selection
- Course preferences
- Study level information
- Academic background
- Payment processing (optional)
- Final loading screen

## 🏗️ Component Structure

### Flow Sequence
```
AuthModal → Welcome → Country → Course → Study Level → Academic Snapshot → Payment → Loading
```

Each step is a separate component that gets rendered based on the current step number.

## 🧠 State Management

### Core State Variables

#### `currentStep`
```javascript
const [currentStep, setCurrentStep] = useState(-1);
```
- **Purpose**: Tracks which step the user is currently on
- **Why -1**: Starts at -1 so the authentication modal shows first
- **Range**: -1 (auth) to 6 (loading)

#### `showAuthModal`
```javascript
const [showAuthModal, setShowAuthModal] = useState(true);
```
- **Purpose**: Controls whether the login/signup modal is visible
- **Why needed**: We need to show auth first, then hide it after successful login

#### `user`
```javascript
const [user, setUser] = useState(null);
```
- **Purpose**: Stores user information after successful authentication
- **Contains**: Email, name, and other user details from the auth system

#### `renderKey`
```javascript
const [renderKey, setRenderKey] = useState(0);
```
- **Purpose**: Forces React to re-render components when needed
- **Why needed**: Sometimes React doesn't detect state changes properly, so we increment this number to force updates
- **How it works**: The key changes, React thinks it's a new component, so it re-renders

#### `data`
```javascript
const [data, setData] = useState({
  countries: [],
  courses: [],
  studyLevel: "",
  academicInfo: {}
});
```
- **Purpose**: Central storage for all user selections across steps
- **Why centralized**: Each step needs to save data that other steps might need
- **Structure**:
  - `countries`: Array of selected countries
  - `courses`: Array of selected courses
  - `studyLevel`: String (e.g., "undergraduate", "graduate")
  - `academicInfo`: Object with academic details

## 📚 Step Definitions

```javascript
const steps = [
  "Welcome",
  "Countries", 
  "Courses",
  "Study Level",
  "Academic Info",
  "Payment",
  "Loading"
];
```

This array serves multiple purposes:
- **Progress indicator**: Shows user how many steps remain
- **Debugging**: Logs which step user is on
- **Validation**: Prevents going beyond the last step

## 🔧 Key Functions

### `handleAuthSuccess`
```javascript
const handleAuthSuccess = useCallback((sessionData) => {
  setShowAuthModal(false);
  setUser(sessionData?.user || null);
  setCurrentStep(0);
  setRenderKey(prev => prev + 1);
}, []);
```

**What it does**: Called when user successfully logs in or signs up
**Steps**:
1. Hides the auth modal
2. Saves user data
3. Moves to step 0 (Welcome)
4. Forces re-render

**Why useCallback**: Prevents function from being recreated on every render, improving performance

### `handleNext`
```javascript
const handleNext = useCallback(() => {
  setCurrentStep(prevStep => {
    const nextStep = prevStep + 1;
    if (nextStep < steps.length) {
      setRenderKey(prev => prev + 1);
      return nextStep;
    }
    return prevStep;
  });
}, [steps.length]);
```

**What it does**: Moves user to the next step
**Safety check**: Won't go beyond the last step
**Why functional update**: `prevStep => prevStep + 1` ensures we get the latest value

### `handleBack`
```javascript
const handleBack = useCallback(() => {
  setCurrentStep(prevStep => {
    if (prevStep > 0) {
      const backStep = prevStep - 1;
      setRenderKey(prev => prev + 1);
      return backStep;
    }
    return prevStep;
  });
}, []);
```

**What it does**: Moves user to the previous step
**Safety check**: Won't go back from step 0 (Welcome)

### `updateData`
```javascript
const updateData = useCallback((newData) => {
  setData(prev => ({ ...prev, ...newData }));
}, []);
```

**What it does**: Updates the central data store
**How it works**: Merges new data with existing data using spread operator
**Example**: If step sends `{countries: ["USA", "Canada"]}`, it updates only the countries field

### `setStepDirectly`
```javascript
const setStepDirectly = useCallback((stepIndex) => {
  setCurrentStep(stepIndex);
  setRenderKey(prev => prev + 1);
}, []);
```

**What it does**: Emergency function to jump to any step
**When used**: Debugging or error recovery
**Not for normal flow**: Regular users shouldn't use this

## 🎨 Rendering Logic

### Authentication Modal
```javascript
{showAuthModal && (
  <AuthModal 
    isOpen={showAuthModal}
    onClose={() => setShowAuthModal(false)}
    onSuccess={handleAuthSuccess}
  />
)}
```
- Shows first when component loads
- Handles login/signup
- Disappears after successful authentication

### Progress Indicator
```javascript
{currentStep >= 0 && currentStep < steps.length - 1 && (
  <ProgressIndicator 
    currentStep={currentStep} 
    totalSteps={steps.length - 1}
    stepNames={steps.slice(0, -1)}
  />
)}
```
- **When shown**: After auth, before final loading step
- **Why exclude loading**: Loading step doesn't need progress bar
- **Visual feedback**: Shows user how much is left

### Step Components
Each step is conditionally rendered:

```javascript
{currentStep === 0 && (
  <WelcomeStep onNext={handleNext} user={user} />
)}
```

**Pattern**: 
- Check if current step matches
- Render appropriate component
- Pass necessary props (navigation functions, data, update functions)

## 🔄 Data Flow

### Step to Step Communication
1. User interacts with a step component
2. Step component calls `onUpdate` with new data
3. `updateData` merges new data into central state
4. User clicks "Next"
5. `handleNext` advances to next step
6. Next step receives updated data as props

### Example Flow
```
CountrySelection → updateData({countries: ["USA"]}) → 
handleNext() → CourseSelection receives data.countries
```

## 🐛 Debugging Features

### Console Logging
```javascript
useEffect(() => {
  console.log('🔄 Step changed to:', currentStep, 'Step name:', steps[currentStep] || 'Auth');
}, [currentStep, steps]);
```
- Logs every step change
- Helps track user progress
- Shows step names for clarity

### Error Recovery
```javascript
{currentStep < 0 && !showAuthModal && (
  <div>
    <div>⚠️ UNEXPECTED STATE</div>
    <button onClick={() => setStepDirectly(0)}>Go to Welcome Step</button>
  </div>
)}
```
- Handles impossible states
- Provides recovery button
- Prevents user from getting stuck

## 📦 Dependencies

### React Hooks Used
- `useState`: Managing component state
- `useEffect`: Side effects (logging)
- `useCallback`: Performance optimization

### Child Components
- `AuthModal`: Login/signup interface
- `WelcomeStep`: Greeting and introduction
- `CountrySelectionStep`: Choose study destinations
- `CourseSelectionStep`: Pick academic programs
- `StudyLevelStep`: Select education level
- `AcademicSnapshotStep`: Academic background info
- `PaymentStep`: Payment processing (optional)
- `LoadingStep`: Final processing screen
- `ProgressIndicator`: Progress bar display

## 🎛️ Props Interface

### Child Component Props Pattern
Each step component receives:
- `onNext`: Function to advance
- `onBack`: Function to go back (except Welcome)
- `onUpdate`: Function to save data
- Specific data props for their functionality

### Example
```javascript
<CountrySelectionStep 
  selectedCountries={data.countries}  // Current data
  onNext={handleNext}                 // Advance function
  onBack={handleBack}                 // Back function
  onUpdate={(countries) => updateData({ countries })} // Save function
/>
```

## 🔒 Error Handling

### State Validation
- Prevents advancing beyond last step
- Prevents going back from first step
- Handles invalid currentStep values

### Fallback UI
- Shows error message for impossible states
- Provides recovery mechanism
- Maintains user experience

## 🚀 Performance Considerations

### useCallback Usage
All handler functions use `useCallback` to prevent unnecessary re-renders of child components.

### Render Key Strategy
The `renderKey` forces re-renders when React's automatic detection fails, ensuring UI stays in sync with state.

### Conditional Rendering
Only one step component renders at a time, keeping DOM lightweight.

## 🔧 Customization

### Adding New Steps
1. Add step name to `steps` array
2. Add conditional render block
3. Create step component
4. Update progress indicator logic if needed

### Modifying Flow
- Change step order by reordering render conditions
- Skip steps by modifying `handleNext` logic
- Add validation by checking data before advancing

## 📱 Usage Example

```javascript
import { OnboardingFlow } from './OnboardingFlow';

function App() {
  return (
    <div className="app">
      <OnboardingFlow />
    </div>
  );
}
```

The component is self-contained and manages its own state, so it only needs to be imported and rendered.

## 🎯 Best Practices

### State Management
- Keep data centralized in the main component
- Use functional updates for state changes
- Leverage useCallback for performance

### User Experience
- Always provide back navigation (except first step)
- Show progress to set expectations
- Handle errors gracefully

### Code Organization
- Separate each step into its own component
- Use consistent prop patterns
- Include debugging utilities