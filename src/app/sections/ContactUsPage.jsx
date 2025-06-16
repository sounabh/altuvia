"use client"
import React, { useState, useEffect, useRef } from "react";
import { Send, MapPin, Mail, MessageCircle } from 'lucide-react';

// ==========================================
// CUSTOM HOOKS
// ==========================================

/**
 * Custom hook for handling scroll-triggered animations using Intersection Observer
 
 */
const useScrollAnimation = (refs, options = {}) => {
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    // Default options for intersection observer
    const defaultOptions = {
      threshold: 0.3,
      rootMargin: '0px 0px -100px 0px',
      ...options
    };

    // Create intersection observer instance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Find which ref corresponds to this entry and mark as visible
            Object.keys(refs).forEach((key) => {
              if (entry.target === refs[key].current) {
                setIsVisible(prev => ({ ...prev, [key]: true }));
              }
            });
          }
        });
      },
      defaultOptions
    );

    // Start observing all provided refs
    Object.values(refs).forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    // Cleanup function to unobserve all refs
    return () => {
      Object.values(refs).forEach((ref) => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, [refs, options]);

  return isVisible;
};

// ==========================================
// FORM FIELD COMPONENT
// ==========================================

/**
 * Reusable form field component with icon and animation support
 */
const FormField = ({ 
  field, 
  value, 
  onChange, 
  onFocus, 
  onBlur, 
  focusedField, 
  isVisible, 
  animationDelay 
}) => {
  const IconComponent = field.icon;
  const isFocused = focusedField === field.name;
  const hasValue = value;

  // Base input styles that are common to all field types
  const baseInputStyles = `
    w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border 
    transition-all duration-300 font-sans text-sm sm:text-base text-gray-900 
    placeholder-[#6C7280] font-light focus:outline-none focus:ring-2 focus:ring-[#002147]/10
  `;

  // Dynamic styles based on focus state
  const focusStyles = isFocused 
    ? 'border-[#002147] shadow-lg shadow-gray-100/30 bg-white outline-none ring-2 ring-[#002147]/10' 
    : 'border-[#6C7280]/30 bg-gray-50/50 hover:bg-white hover:border-[#6C7280]/50';

  return (
    <div 
      className={`
        space-y-2 sm:space-y-3 transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}
      `}
      style={{ transitionDelay: isVisible ? `${animationDelay}ms` : '0ms' }}
    >
      {/* Field Label with Required Indicator */}
      <label className="block text-sm sm:text-base font-medium font-serif text-[#002147] tracking-wide">
        {field.label}
        {field.required && (
          <span className="text-red-400 ml-1" aria-label="required">*</span>
        )}
      </label>
      
      {/* Input Container with Icon */}
      <div className="relative">
        {/* Field Icon with Dynamic Color */}
        <div className={`
          absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 
          transition-colors duration-200
          ${isFocused || hasValue ? 'text-[#002147]' : 'text-[#6C7280]'}
        `}>
          <IconComponent 
            size={16} 
            className="sm:w-[18px] sm:h-[18px]" 
            strokeWidth={1.5} 
            aria-hidden="true"
          />
        </div>
        
        {/* Input Element */}
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
          aria-describedby={field.required ? `${field.name}-required` : undefined}
        />
      </div>
    </div>
  );
};

// ==========================================
// TEXTAREA FIELD COMPONENT
// ==========================================

/**
 * Specialized textarea component for message input
 */
const TextareaField = ({ 
  value, 
  onChange, 
  onFocus, 
  onBlur, 
  focusedField, 
  isVisible, 
  animationDelay 
}) => {
  const isFocused = focusedField === 'message';
  const hasValue = value;

  // Base textarea styles
  const baseTextareaStyles = `
    w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border 
    transition-all duration-300 font-sans text-sm sm:text-base text-gray-900 
    placeholder-[#6C7280] font-light resize-none focus:outline-none focus:ring-2 focus:ring-[#002147]/10
  `;

  // Dynamic styles based on focus state
  const focusStyles = isFocused
    ? 'border-[#002147] shadow-lg shadow-gray-100/30 bg-white outline-none ring-2 ring-[#002147]/10' 
    : 'border-[#6C7280]/30 bg-gray-50/50 hover:bg-white hover:border-[#6C7280]/50';

  return (
    <div 
      className={`
        space-y-2 sm:space-y-3 transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}
      `}
      style={{ transitionDelay: isVisible ? `${animationDelay}ms` : '0ms' }}
    >
      {/* Message Label */}
      <label className="block text-sm sm:text-base font-medium font-serif text-[#002147] tracking-wide">
        Message <span className="text-red-400 ml-1" aria-label="required">*</span>
      </label>

      {/* Textarea Container with Icon */}
      <div className="relative">
        {/* Message Icon positioned at top */}
        <div className={`
          absolute left-3 sm:left-4 top-3 sm:top-4 transition-colors duration-200
          ${isFocused || hasValue ? 'text-[#002147]' : 'text-[#6C7280]'}
        `}>
          <MessageCircle 
            size={16} 
            className="sm:w-[18px] sm:h-[18px]" 
            strokeWidth={1.5} 
            aria-hidden="true"
          />
        </div>
        
        {/* Textarea Element */}
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
          aria-describedby="message-required"
        />
      </div>
    </div>
  );
};

// ==========================================
// SUBMIT BUTTON COMPONENT
// ==========================================

/**
 * Animated submit button with icon
 */
const SubmitButton = ({ onClick, isVisible, animationDelay }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full bg-[#002147] text-white py-3 sm:py-4 rounded-lg sm:rounded-xl 
        font-medium font-serif tracking-wide text-base sm:text-lg
        transition-all duration-300 hover:bg-[#002147]/90 hover:shadow-xl hover:shadow-[#002147]/20
        focus:outline-none focus:ring-4 focus:ring-[#002147]/20 active:scale-[0.98]
        group flex items-center justify-center space-x-2 sm:space-x-3
        ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}
      `}
      style={{ transitionDelay: isVisible ? `${animationDelay}ms` : '0ms' }}
      aria-describedby="privacy-notice"
    >
      <span>Send Message</span>
      <Send 
        size={16} 
        className="sm:w-[18px] sm:h-[18px] transition-transform duration-300 group-hover:translate-x-1" 
        aria-hidden="true"
      />
    </button>
  );
};

// ==========================================
// ANIMATED HEADING COMPONENT
// ==========================================

/**
 * Animated heading with scroll trigger
 */
const AnimatedHeading = ({ headingRef, isVisible }) => {
  return (
    <h1 
      ref={headingRef}
      className={`
        text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-roboto font-regular text-[#002147] 
        leading-tight sm:leading-tight md:leading-tight lg:leading-tight tracking-[0px]
        transition-all duration-1000 ease-out
        ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}
      `}
    >
      Get in Touch
    </h1>
  );
};

// ==========================================
// ANIMATED DESCRIPTION COMPONENT
// ==========================================

/**
 * Animated description paragraph with scroll trigger
 */
const AnimatedDescription = ({ paragraphRef, isVisible }) => {
  return (
    <p 
      ref={paragraphRef}
      className={`
        text-lg sm:text-xl md:text-2xl text-[#6C7280]  font-roboto font-regular 
        leading-relaxed sm:leading-relaxed tracking-[0.1px]
        w-full max-w-xl sm:max-w-2xl mx-auto lg:mx-0 mt-4 lg:mt-8 
        px-2 lg:px-0 
        transition-all duration-1000 ease-out delay-300
        ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}
      `}
    >
      <span className="block">
        We're here to help you navigate your application journey. 
        Our team of experts is ready to provide personalized guidance and support.
      </span>
    </p>
  );
};

// ==========================================
// CONTACT FORM COMPONENT
// ==========================================

/**
 * Main contact form component with all form fields
 */
const ContactForm = ({ formRef, isVisible, formData, handleChange, focusedField, setFocusedField, handleSubmit }) => {
  // Configuration for form fields
  const formFields = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter your full name',
      icon: MessageCircle,
      required: true
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'your@email.com',
      icon: Mail,
      required: true
    },
    {
      name: 'location',
      label: 'Location',
      type: 'text',
      placeholder: 'City, Country',
      icon: MapPin,
      required: false
    }
  ];

  return (
    <div 
      ref={formRef}
      className={`
        bg-white rounded-2xl sm:rounded-3xl border border-[#6C7280]/20 shadow-xl shadow-gray-100/20 
        p-6 sm:p-8 md:p-10 lg:p-12
        transition-all duration-1000 ease-out delay-500
        ${isVisible ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-4 sm:translate-x-8 lg:translate-x-16'}
      `}
    >
      {/* Form Container */}
      <div className="space-y-6 sm:space-y-8">
        
        {/* Dynamic Form Fields */}
        {formFields.map((field, index) => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={handleChange}
            onFocus={() => setFocusedField(field.name)}
            onBlur={() => setFocusedField(null)}
            focusedField={focusedField}
            isVisible={isVisible}
            animationDelay={800 + (index * 100)}
          />
        ))}

        {/* Message Textarea Field */}
        <TextareaField
          value={formData.message}
          onChange={handleChange}
          onFocus={() => setFocusedField('message')}
          onBlur={() => setFocusedField(null)}
          focusedField={focusedField}
          isVisible={isVisible}
          animationDelay={1100}
        />

        {/* Submit Button */}
        <SubmitButton
          onClick={handleSubmit}
          isVisible={isVisible}
          animationDelay={1300}
        />
        
        {/* Privacy Notice */}
        <p 
          className={`
            text-xs sm:text-sm text-[#6C7280] text-center font-light font-serif leading-relaxed
            transition-all duration-500 ease-out
            ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}
          `}
          style={{ transitionDelay: isVisible ? '1500ms' : '0ms' }}
          id="privacy-notice"
        >
          We respect your privacy. Your information will never be shared with third parties.
        </p>
        
      </div>
    </div>
  );
};

// ==========================================
// MAIN PREMIUM CONTACT PAGE COMPONENT
// ==========================================

/**
 * Main contact page component that orchestrates all sub-components
 * Features:
 * - Responsive design with mobile-first approach
 * - Scroll-triggered animations using Intersection Observer
 * - Form validation and submission handling
 * - Accessible form elements with proper ARIA labels
 * - Modular component architecture for maintainability
 */
const PremiumContactPage = () => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  // Form data state - stores all form field values
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    message: ''
  });

  // Track which field is currently focused for styling and UX
  const [focusedField, setFocusedField] = useState(null);

  // ==========================================
  // REFS FOR SCROLL ANIMATION
  // ==========================================
  
  // References to DOM elements for intersection observer
  const headingRef = useRef(null);
  const paragraphRef = useRef(null);
  const formRef = useRef(null);

  // Create refs object for the custom hook
  const refs = {
    heading: headingRef,
    paragraph: paragraphRef,
    form: formRef
  };

  // Use custom hook for scroll animations
  const isVisible = useScrollAnimation(refs, {
    threshold: 0.3,
    rootMargin: '0px 0px -100px 0px'
  });

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  
  /**
   * Handle input field changes and update form data state
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  /**
   * Handle form submission with validation and user feedback
   * In a real application, this would send data to a server
   */
  const handleSubmit = () => {
    // Basic validation check
    const requiredFields = ['name', 'email', 'message'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Log form data (in production, this would be sent to a server)
    console.log('Form submitted:', formData);
    
    // Show success message to user
    alert('Thank you for your message! We\'ll get back to you within 24 hours.');
    
    // Reset form after successful submission
    setFormData({ 
      name: '', 
      email: '', 
      location: '', 
      message: '' 
    });

    // Clear any focused field state
    setFocusedField(null);
  };

  // ==========================================
  // RENDER MAIN COMPONENT
  // ==========================================
  
  return (
    <div className="min-h-screen bg-white py-28 md:py-32 lg:pt-64 lg:pb-56 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Content Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-start">
          
          {/* Left Side - Content Section */}
          <div className="space-y-8 sm:space-y-12">
            <div className="text-center lg:text-left mb-12 sm:mb-16 lg:mb-20">
              
              {/* Animated Main Heading */}
              <AnimatedHeading 
                headingRef={headingRef} 
                isVisible={isVisible.heading} 
              />

              {/* Animated Description Paragraph */}
              <AnimatedDescription 
                paragraphRef={paragraphRef} 
                isVisible={isVisible.paragraph} 
              />

            </div>
          </div>

          {/* Right Side - Contact Form */}
          <ContactForm
            formRef={formRef}
            isVisible={isVisible.form}
            formData={formData}
            handleChange={handleChange}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            handleSubmit={handleSubmit}
          />

        </div>
      </div>
    </div>
  );
};

export default PremiumContactPage;