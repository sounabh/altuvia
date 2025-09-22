import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// =============================================================================
// PaymentStep Component
// =============================================================================
/**
 * PaymentStep - Form step for collecting payment information during onboarding
 * 
 * Features:
 * - Collects credit card details (card number, expiry, CVV)
 * - Collects name and email for payment processing
 * - Includes a 7-day trial benefits display
 * - Handles form validation and submission
 * 
 * Security Note: 
 *   This is a frontend-only implementation. In production:
 *   - Never handle raw credit card numbers on frontend
 *   - Use PCI-compliant payment processors (Stripe, Braintree)
 *   - Implement tokenization to avoid handling sensitive data
 * 
 * @param {Object} props - Component properties
 * @param {Object} [props.paymentInfo={}] - Initial payment information
 * @param {Function} [props.onNext=() => {}] - Callback when proceeding to next step
 * @param {Function} [props.onBack=() => {}] - Callback when returning to previous step
 * @param {Function} [props.onUpdate=() => {}] - Callback when updating payment info
 * @param {number} props.step - Current step number
 * @param {Object} props.user - User data object
 * @returns {JSX.Element} Payment information form interface
 */
export const PaymentStep = ({
  paymentInfo = {},
  onNext = () => {},
  onBack = () => {},
  onUpdate = () => {},
  step,
  user
}) => {
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  /**
   * Form data state with initial values from props
   * @type {[Object, Function]} Tuple containing form data and setter
   */
  const [formData, setFormData] = useState({
    cardNumber: paymentInfo.cardNumber || "",      // Fallback: empty string
    expiryDate: paymentInfo.expiryDate || "",      // Fallback: empty string
    cvv: paymentInfo.cvv || "",                    // Fallback: empty string
    name: paymentInfo.name || "",                  // Fallback: empty string
    email: paymentInfo.email || "",                // Fallback: empty string
  });

  /**
   * Submission state
   * @type {[boolean, Function]} Tuple indicating if form is submitting
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================
  /**
   * Handles input field changes:
   * 1. Updates local form state
   * 2. Propagates changes to parent component
   * 
   * @param {string} field - Field name to update
   * @param {string} value - New value for the field
   */
  const handleInputChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  /**
   * Validates required form fields
   * 
   * @returns {boolean} True if all required fields are filled
   */
  const isFormValid = () => {
    return (
      formData.cardNumber.trim() !== "" &&
      formData.expiryDate.trim() !== "" &&
      formData.cvv.trim() !== "" &&
      formData.name.trim() !== "" &&
      formData.email.trim() !== ""
    );
  };

  /**
   * Handles form submission:
   * 1. Validates form
   * 2. Updates parent with payment info
   * 3. Proceeds to next step after delay
   * 
   * Error Handling:
   * - Shows alert for validation errors
   * - Catches processing errors and shows alert
   */
  const handleSubmit = async () => {
    // Validate required fields
    if (!isFormValid()) {
      alert("Please fill in all required fields");
      return;
    }

    console.log("Processing payment...", formData);
    setIsSubmitting(true);
    
    try {
      // Propagate updated payment info to parent
      onUpdate(formData);
      
      // Small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Proceed to next step
      console.log("Payment processed, moving to next step");
      onNext();
    } catch (error) {
      console.error("Payment processing error:", error);
      alert("Payment processing failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================
  /**
   * Generates user initials for avatar fallback
   * 
   * Fallback hierarchy:
   * 1. First letters of first and last name
   * 2. First letter of email
   * 3. Default 'U' if no user data
   * 
   * @returns {string} User initials in uppercase
   */
  const getUserInitials = () => {
    // Handle full name if available
    if (user?.user.name) {
      const names = user?.user.name.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    
    // Fallback to email if name not available
    if (user?.user.email) {
      return user?.user.name[0].toUpperCase();
    }
    
    // Ultimate fallback
    return 'U';
  };

  // ===========================================================================
  // RENDER COMPONENT
  // ===========================================================================
  return (
    <div className="min-h-screen w-fit max-w-none">
      <div className="relative z-100 flex flex-col justify-center items-center px-8 py-4 -my-20">
        {/* HEADER SECTION: Logo and user avatar */}
        <header className="bg-[#002147] w-[95%] px-12 py-3 rounded-2xl mb-6 shadow-lg flex items-center justify-between">
         <span className="font-roboto font-semibold tracking-[0.7px] leading-[28.8px] text-[22px] text-white">
              Altu<span className="text-[#3598FE]">Via</span>
            </span>
          
          {/* USER AVATAR: With fallback to initials */}
          <div className="relative">
            {user?.user.image ? (
              <img
                src={user?.user.image}
                alt={`${user?.user.name || 'User'} avatar`}
                className="w-10 h-10 rounded-full border-3 border-blue-400 shadow-md object-cover"
                onError={(e) => {
                  // Fallback mechanism: Hide broken image and show initials
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            {/* FALLBACK AVATAR: Shows user initials */}
            <div 
              className={`w-10 h-10 bg-blue-100 border-3 border-blue-400 rounded-full shadow-md flex items-center justify-center text-blue-800 font-semibold text-sm ${user?.user.image ? 'hidden' : 'flex'}`}
            >
              {getUserInitials()}
            </div>
          </div>
        </header>

        {/* DECORATIVE BACKGROUND ELEMENTS */}
        <div className="absolute top-[30%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#e1f0ff] opacity-80 blur-[100px] z-0"></div>
        <div className="absolute top-[18%] left-0 w-[600px] h-[600px] rounded-full bg-[#e1f0ff] opacity-80 blur-[100px] z-0"></div>

        {/* WELCOME MESSAGE SECTION */}
        <div className="text-center flex flex-col gap-5 items-center justify-center space-y-4 mb-6 mt-6 w-[80%] mx-auto">
          <h1 className="text-[2.2rem] tracking-normal font-normal leading-12 font-roboto text-black z-10">
            <span className="text-[#8a99aa]"> Welcome </span> {user?.user.name} ! We are
            thrilled to have you here. Discover the world's leading universities
            to shape your academic journey.
          </h1>
          <p className="text-lg font-normal tracking-normal leading-6 text-black z-10">
            Start Your 7 day Free trial.
          </p>
        </div>

        {/* STEP INDICATOR */}
        <div className="text-center mb-4 mt-6">
          <div className="inline-flex items-center bg-blue-100 text-black px-3 py-1.5 rounded-lg font-semibold text-sm mb-2">
            Step {`0${step}`} 
          </div>
          <p className="text-sm text-black font-medium z-10 mt-4 mb-8">
            Enter card details - you wont be charged today
          </p>
        </div>

        {/* PAYMENT FORM CARD */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl py-10 px-16 border-2 border-gray-200 shadow-xl mb-6 w-full max-w-[1000px] z-10">
          {/* SECURITY BADGE AND TRIAL NOTE */}
          <div className="flex items-center justify-between mb-8">
            <div className="inline-flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full font-medium text-sm border border-green-200">
              🔒 Secure Payment
            </div>
            <p className="text-xs text-gray-500">
              Trial starts immediately. Cancel before day 7 to avoid charges.
            </p>
          </div>

          <div className="w-full">
            {/* FORM FIELDS */}
            <div className="space-y-6 w-full">
              {/* NAME AND EMAIL - Responsive grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[13px] font-normal font-roboto text-black">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="p-3 h-10 w-full rounded-md border border-gray-400 focus:border-[#002147] focus:ring-1 focus:ring-[#e1f0ff]"
                    disabled={isSubmitting}
                  />
                </div>
                
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[13px] font-normal font-roboto text-black">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="p-3 h-10 w-full rounded-md border border-gray-400 focus:border-[#002147] focus:ring-1 focus:ring-[#e1f0ff]"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Card Number Field */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber" className="text-[13px] font-normal font-roboto text-black">
                  Card Number
                </Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                  className="p-3 h-10 w-full rounded-md border border-gray-400 focus:border-[#002147] focus:ring-1 focus:ring-[#e1f0ff]"
                  disabled={isSubmitting}
                />
              </div>

              {/* Expiry and CVV - Responsive grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expiry Date Field */}
                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="text-[13px] font-normal font-roboto text-black">
                    Expiry Date
                  </Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                    className="p-3 h-10 w-full rounded-md border border-gray-400 focus:border-[#002147] focus:ring-1 focus:ring-[#e1f0ff]"
                    disabled={isSubmitting}
                  />
                </div>
                
                {/* CVV Field */}
                <div className="space-y-2">
                  <Label htmlFor="cvv" className="text-[13px] font-normal font-roboto text-black">
                    CVV
                  </Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={formData.cvv}
                    onChange={(e) => handleInputChange("cvv", e.target.value)}
                    className="p-3 h-10 w-full rounded-md border border-gray-400 focus:border-[#002147] focus:ring-1 focus:ring-[#e1f0ff]"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* BENEFITS DISPLAY */}
            <div className="bg-[#e1f0ff]/40 p-6 rounded-xl border border-[#e1f0ff]/60 mt-8 w-full">
              <h3 className="font-medium text-[#002147] text-base mb-4">
                Your 7-day trial includes:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {[
                  "Unlimited recommendations",
                  "Detailed match analysis",
                  "Application guidance",
                  "24/7 support access",
                  "Cancel anytime",
                  "Personalized university matching"
                ].map((benefit) => (
                  <div className="flex items-center space-x-2" key={benefit}>
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-[#002147]">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION BUTTONS */}
        <div className="flex justify-between items-center w-full max-w-6xl px-4 mt-8 z-10 pb-20">
          {/* BACK BUTTON */}
          <Button
            onClick={onBack}
            disabled={isSubmitting}
            className="bg-[#002147] hover:bg-[#003366] text-white px-11 py-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-normal font-roboto shadow-lg ml-14"
          >
            Back
            <span className="ml-2">←</span>
          </Button>
          
          {/* SUBMIT BUTTON */}
          <div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid()}
              className="bg-[#002147] hover:bg-[#003366] text-white px-11 py-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-normal font-roboto shadow-lg mr-14"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  Start Free Trial
                  <span className="ml-2">→</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

