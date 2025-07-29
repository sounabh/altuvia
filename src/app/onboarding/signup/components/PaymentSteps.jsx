import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const PaymentStep = ({
  paymentInfo = {},
  onNext = () => {},
  onBack = () => {},
  onUpdate = () => {},
  step,
  user
}) => {
  const [formData, setFormData] = useState({
    cardNumber: paymentInfo.cardNumber || "",
    expiryDate: paymentInfo.expiryDate || "",
    cvv: paymentInfo.cvv || "",
    name: paymentInfo.name || "",
    email: paymentInfo.email || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const isFormValid = () => {
    return (
      formData.cardNumber.trim() !== "" &&
      formData.expiryDate.trim() !== "" &&
      formData.cvv.trim() !== "" &&
      formData.name.trim() !== "" &&
      formData.email.trim() !== ""
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      alert("Please fill in all required fields");
      return;
    }

    console.log("Processing payment...", formData);
    setIsSubmitting(true);
    
    try {
      // Update the payment info first
      onUpdate(formData);
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then proceed to next step
      console.log("Payment processed, moving to next step");
      onNext();
    } catch (error) {
      console.error("Payment processing error:", error);
      alert("Payment processing failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

   // Get user initials for fallback avatar
  const getUserInitials = () => {
    if (user?.name) {
      const names = user.name.split(' ');
      return names.length > 1 
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen w-fit max-w-none">
      <div className="relative z-100 flex flex-col justify-center items-center px-8 py-4 -my-20">
        {/* Header - logo and avatar */}
         <header className="bg-[#002147] w-[95%] px-12 py-3 rounded-2xl mb-6 shadow-lg flex items-center justify-between">
          <div className="text-white text-xl font-semibold">Logo</div>
          
          {/* User Avatar with blue border */}
          <div className="relative">
            {user?.image ? (
              <img
                src={user.image}
                alt={`${user.name || 'User'} avatar`}
                className="w-10 h-10 rounded-full border-3 border-blue-400 shadow-md object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            {/* Fallback avatar with user initials */}
            <div 
              className={`w-10 h-10 bg-blue-100 border-3 border-blue-400 rounded-full shadow-md flex items-center justify-center text-blue-800 font-semibold text-sm ${user?.image ? 'hidden' : 'flex'}`}
            >
              {getUserInitials()}
            </div>
          </div>
        </header>

        {/* Decorative background blobs */}
        <div className="absolute top-[30%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#e1f0ff] opacity-80 blur-[100px] z-0"></div>
        <div className="absolute top-[18%] left-0 w-[600px] h-[600px] rounded-full bg-[#e1f0ff] opacity-80 blur-[100px] z-0"></div>

        {/* Welcome text section */}
        <div className="text-center flex flex-col gap-5 items-center justify-center space-y-4 mb-6 mt-6 w-[80%] mx-auto">
          <h1 className="text-[2.2rem] tracking-normal font-normal leading-12 font-roboto text-black z-10">
            <span className="text-[#8a99aa]"> Welcome </span> {user?.name || 'Martin'}! We are
            thrilled to have you here. Discover the world's leading universities
            to shape your academic journey.
          </h1>
          <p className="text-lg font-normal tracking-normal leading-6 text-black z-10">
            Start Your 7 day Free trial.
          </p>
        </div>

        {/* Step Label */}
        <div className="text-center mb-4 mt-6">
          <div className="inline-flex items-center bg-blue-100 text-black px-3 py-1.5 rounded-lg font-semibold text-sm mb-2">
            Step {`0${step}`} 
          </div>
          <p className="text-sm text-black font-medium z-10 mt-4 mb-8">
         Enter card details - you wont be charged today
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl py-10 px-16 border-2 border-gray-200 shadow-xl mb-6 w-full max-w-[1000px] z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="inline-flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-full font-medium text-sm border border-green-200">
              🔒 Secure Payment
            </div>
            <p className="text-xs text-gray-500">
              Trial starts immediately. Cancel before day 7 to avoid charges.
            </p>
          </div>

          <div className="w-full">
            {/* Form Fields */}
            <div className="space-y-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Benefits Box - Now below form fields with full width */}
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

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center w-full max-w-6xl px-4 mt-8 z-10 pb-20">
          <Button
            onClick={onBack}
            disabled={isSubmitting}
            className="bg-[#002147] hover:bg-[#003366] text-white px-11 py-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-normal font-roboto shadow-lg ml-14"
          >
            Back
            <span className="ml-2">←</span>
          </Button>
          
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

export default function PaymentStepDemo() {
  const [paymentInfo, setPaymentInfo] = useState({});
  const [currentStep, setCurrentStep] = useState(5);

  const mockUser = {
    name: "Martin Johnson",
    email: "martin@example.com",
    image: null
  };

  const handleNext = () => {
    console.log("Moving to loading step...");
    setCurrentStep(6);
  };

  if (currentStep === 6) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Processing Your Information</h2>
          <p className="text-gray-600">Please wait while we set up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <PaymentStep
      paymentInfo={paymentInfo}
      onUpdate={setPaymentInfo}
      onNext={handleNext}
      onBack={() => console.log("Back clicked")}
      step={5}
      user={mockUser}
    />
  );
}