
import { OnboardingFlow } from "./components/OnboardingFlow";


const Index = () => {
  return (
    // Full-screen flex container that centers the onboarding flow both vertically and horizontally
    <div className="h-screen flex items-center justify-center p-4">
      
      {/* Render the onboarding flow component */}
      <OnboardingFlow />
    </div>
  );
};


export default Index;
