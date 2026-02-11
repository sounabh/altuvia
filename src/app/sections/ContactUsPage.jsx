"use client";

import React, { useState } from "react";
import { Send, MapPin, Mail, MessageCircle } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

// ==========================================
// FORM FIELD COMPONENT
// ==========================================
const FormField = ({
  field,
  value,
  onChange,
  onFocus,
  onBlur,
  focusedField,
}) => {
  const IconComponent = field.icon;
  const isFocused = focusedField === field.name;
  const hasValue = value;

  const baseInputStyles = `
    w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border 
    transition-all duration-300 font-sans text-sm sm:text-base text-gray-900 
    placeholder-[#6C7280] font-light focus:outline-none focus:ring-2 focus:ring-[#002147]/10
  `;

  const focusStyles = isFocused
    ? "border-[#002147] shadow-lg shadow-gray-100/30 bg-white outline-none ring-2 ring-[#002147]/10"
    : "border-[#6C7280]/30 bg-gray-50/50 hover:bg-white hover:border-[#6C7280]/50";

  return (
    <div className="space-y-2 sm:space-y-3">
      <label className="block text-sm sm:text-base font-medium font-serif text-[#002147] tracking-wide">
        {field.label}
        {field.required && (
          <span className="text-red-400 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <div
          className={`
            absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 
            transition-colors duration-200
            ${isFocused || hasValue ? "text-[#002147]" : "text-[#6C7280]"}
          `}
        >
          <IconComponent
            size={16}
            className="sm:w-[18px] sm:h-[18px]"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        <input
          type={field.type}
          name={field.name}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          required={field.required}
          className={`${baseInputStyles} ${focusStyles}`}
          placeholder={field.placeholder}
        />
      </div>
    </div>
  );
};

// ==========================================
// TEXTAREA FIELD COMPONENT
// ==========================================
const TextareaField = ({
  value,
  onChange,
  onFocus,
  onBlur,
  focusedField,
}) => {
  const isFocused = focusedField === "message";
  const hasValue = value;

  const baseTextareaStyles = `
    w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border 
    transition-all duration-300 font-sans text-sm sm:text-base text-gray-900 
    placeholder-[#6C7280] font-light resize-none focus:outline-none focus:ring-2 focus:ring-[#002147]/10
  `;

  const focusStyles = isFocused
    ? "border-[#002147] shadow-lg shadow-gray-100/30 bg-white outline-none ring-2 ring-[#002147]/10"
    : "border-[#6C7280]/30 bg-gray-50/50 hover:bg-white hover:border-[#6C7280]/50";

  return (
    <div className="space-y-2 sm:space-y-3">
      <label className="block text-sm sm:text-base font-medium font-serif text-[#002147] tracking-wide">
        Message{" "}
        <span className="text-red-400 ml-1" aria-label="required">
          *
        </span>
      </label>

      <div className="relative">
        <div
          className={`
            absolute left-3 sm:left-4 top-3 sm:top-4 transition-colors duration-200
            ${isFocused || hasValue ? "text-[#002147]" : "text-[#6C7280]"}
          `}
        >
          <MessageCircle
            size={16}
            className="sm:w-[18px] sm:h-[18px]"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        <textarea
          name="message"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          required
          rows="4"
          className={`${baseTextareaStyles} ${focusStyles}`}
          placeholder="Tell us how we can help you with your applications..."
        />
      </div>
    </div>
  );
};

// ==========================================
// FORM FIELDS CONFIG
// ==========================================
const formFields = [
  {
    name: "name",
    label: "Full Name",
    type: "text",
    placeholder: "Enter your full name",
    icon: MessageCircle,
    required: true,
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "your@email.com",
    icon: Mail,
    required: true,
  },
  {
    name: "location",
    label: "Location",
    type: "text",
    placeholder: "City, Country",
    icon: MapPin,
    required: false,
  },
];

// ==========================================
// MAIN CONTACT PAGE COMPONENT
// ==========================================
const PremiumContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    message: "",
  });
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const requiredFields = ["name", "email", "message"];
    const missingFields = requiredFields.filter(
      (field) => !formData[field].trim()
    );

    if (missingFields.length > 0) {
      alert(
        `Please fill in the following required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    console.log("Form submitted:", formData);
    alert("Thank you for your message! We'll get back to you within 24 hours.");
    setFormData({ name: "", email: "", location: "", message: "" });
    setFocusedField(null);
  };

  return (
    <div className="min-h-screen py-28 md:py-32 lg:pt-64 lg:pb-56 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-start">
          {/* Left Side — Content */}
          <div className="space-y-8 sm:space-y-12">
            <div className="text-center lg:text-left mb-12 sm:mb-16 lg:mb-20">
              <ScrollReveal direction="up" delay={0} duration={0.8}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-roboto font-regular text-[#002147] leading-tight tracking-[0px]">
                  Get in Touch
                </h1>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.15} duration={0.8}>
                <p className="text-lg sm:text-xl md:text-2xl text-[#6C7280] font-roboto font-regular leading-relaxed tracking-[0.1px] w-full max-w-xl sm:max-w-2xl mx-auto lg:mx-0 mt-4 lg:mt-8 px-2 lg:px-0">
                  <span className="block">
                    We&apos;re here to help you navigate your application
                    journey. Our team of experts is ready to provide
                    personalized guidance and support.
                  </span>
                </p>
              </ScrollReveal>
            </div>
          </div>

          {/* Right Side — Form */}
          <ScrollReveal direction="right" delay={0.25} duration={0.9}>
            <div className="rounded-2xl sm:rounded-3xl border border-[#002147]/80 shadow-xl shadow-gray-100/20 p-6 sm:p-8 md:p-10 lg:p-12">
              <div className="space-y-6 sm:space-y-8">
                {/* Form Fields */}
                {formFields.map((field, index) => (
                  <ScrollReveal
                    key={field.name}
                    direction="up"
                    delay={0.3 + index * 0.1}
                    duration={0.6}
                  >
                    <FormField
                      field={field}
                      value={formData[field.name]}
                      onChange={handleChange}
                      onFocus={() => setFocusedField(field.name)}
                      onBlur={() => setFocusedField(null)}
                      focusedField={focusedField}
                    />
                  </ScrollReveal>
                ))}

                {/* Textarea */}
                <ScrollReveal direction="up" delay={0.6} duration={0.6}>
                  <TextareaField
                    value={formData.message}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("message")}
                    onBlur={() => setFocusedField(null)}
                    focusedField={focusedField}
                  />
                </ScrollReveal>

                {/* Submit Button */}
                <ScrollReveal direction="up" delay={0.7} duration={0.6}>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full bg-[#002147] text-white py-3 sm:py-4 rounded-lg sm:rounded-xl 
                      font-medium font-serif tracking-wide text-base sm:text-lg
                      transition-all duration-300 hover:bg-[#002147]/90 hover:shadow-xl hover:shadow-[#002147]/20
                      focus:outline-none focus:ring-4 focus:ring-[#002147]/20 active:scale-[0.98]
                      group flex items-center justify-center space-x-2 sm:space-x-3"
                  >
                    <span>Send Message</span>
                    <Send
                      size={16}
                      className="sm:w-[18px] sm:h-[18px] transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </button>
                </ScrollReveal>

                {/* Privacy */}
                <ScrollReveal direction="up" delay={0.8} duration={0.5}>
                  <p className="text-xs sm:text-sm text-[#6C7280] text-center font-light font-serif leading-relaxed">
                    We respect your privacy. Your information will never be
                    shared with third parties.
                  </p>
                </ScrollReveal>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default PremiumContactPage;