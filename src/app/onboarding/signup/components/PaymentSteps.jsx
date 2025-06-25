import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";



export const PaymentStep = ({ onNext, onBack }) => {
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    name: "",
    email: ""
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Here you would normally process the payment
    console.log("Processing payment...", formData);
    onNext();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800">
            Start Your 7-Day Free Trial
          </h1>
          <p className="text-xl text-gray-600">
            Enter card details - you won't be charged today
          </p>
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
            🔒 Secure & Encrypted
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-green-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-green-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
                Card Number
              </Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-green-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700">
                  Expiry Date
                </Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                  className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-green-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">
                  CVV
                </Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange("cvv", e.target.value)}
                  className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-green-400"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">What's included in your trial:</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>✓ Unlimited university recommendations</li>
                <li>✓ Detailed match analysis</li>
                <li>✓ Application guidance</li>
                <li>✓ Scholarship opportunities</li>
                <li>✓ 24/7 support access</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 font-semibold"
            >
              Start Free Trial - No Charge Today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};