"use client"
import React, { useState, useEffect, useRef } from "react";
import { Send, MapPin, Mail, MessageCircle } from 'lucide-react';

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

  // Track which field is currently focused for styling
  const [focusedField, setFocusedField] = useState(null);
  
  // Animation states for scroll-triggered animations
  const [isVisible, setIsVisible] = useState({
    heading: false,
    paragraph: false,
    form: false
  });

  // ==========================================
  // REFS FOR SCROLL ANIMATION
  // ==========================================
  
  // References to DOM elements for intersection observer
  const headingRef = useRef(null);
  const paragraphRef = useRef(null);
  const formRef = useRef(null);

  // ==========================================
  // SCROLL ANIMATION EFFECT
  // ==========================================
  
  useEffect(() => {
    // Create intersection observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Determine which element is visible and trigger animation
            if (entry.target === headingRef.current) {
              setIsVisible(prev => ({ ...prev, heading: true }));
            }
            if (entry.target === paragraphRef.current) {
              setIsVisible(prev => ({ ...prev, paragraph: true }));
            }
            if (entry.target === formRef.current) {
              setIsVisible(prev => ({ ...prev, form: true }));
            }
          }
        });
      },
      {
        // Trigger when 30% of the element is visible
        threshold: 0.3,
        // Start observing 100px before element enters viewport
        rootMargin: '0px 0px -100px 0px'
      }
    );

    // Start observing elements when they're available
    const currentHeadingRef = headingRef.current;
    const currentParagraphRef = paragraphRef.current;
    const currentFormRef = formRef.current;

    if (currentHeadingRef) observer.observe(currentHeadingRef);
    if (currentParagraphRef) observer.observe(currentParagraphRef);
    if (currentFormRef) observer.observe(currentFormRef);

    // Cleanup observer on component unmount
    return () => {
      if (currentHeadingRef) observer.unobserve(currentHeadingRef);
      if (currentParagraphRef) observer.unobserve(currentParagraphRef);
      if (currentFormRef) observer.unobserve(currentFormRef);
    };
  }, []);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  
  // Handle input field changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submission
  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We\'ll get back to you within 24 hours.');
    
    // Reset form after submission
    setFormData({ 
      name: '', 
      email: '', 
      location: '', 
      message: '' 
    });
  };

  // ==========================================
  // FORM FIELD CONFIGURATION
  // ==========================================
  
  // Configuration array for form fields
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

  // ==========================================
  // RENDER COMPONENT
  // ==========================================
  
  return (
    <div className="min-h-screen bg-white py-28 md:py-32 lg:pt-64 lg:pb-56  px-4  lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ==========================================
            MAIN CONTENT GRID
            ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8  lg:gap-20 items-start">
          
          {/* ==========================================
              LEFT SIDE - CONTENT SECTION
              ========================================== */}
          <div className="space-y-8 sm:space-y-12">
            
            {/* Text Content Container */}
            <div className="text-center lg:text-left mb-12 sm:mb-16 lg:mb-20">
              
              {/* ==========================================
                  MAIN HEADING WITH ANIMATION
                  ========================================== */}
              <h1 
                ref={headingRef}
                className={`
               
                  transition-all duration-1000 ease-out
                  ${isVisible.heading 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-8'
                  }
                `}
              >
                <span className="block">Get in Touch</span>
              </h1>

              {/* ==========================================
                  DESCRIPTION PARAGRAPH WITH ANIMATION
                  ========================================== */}
              <p 
                ref={paragraphRef}
                className={`
                  
                  w-full max-w-xl sm:max-w-2xl mx-auto lg:mx-0 mt-4  lg:mt-8 
                  px-2  lg:px-0 
                  transition-all duration-1000 ease-out delay-300
                  ${isVisible.paragraph 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-8'
                  }
                `}
              >
                <span className="block">
                  We're here to help you navigate your application journey. 
                  Our team of experts is ready to provide personalized guidance and support.
                </span>
              </p>

            </div>
          </div>

          {/* ==========================================
              RIGHT SIDE - CONTACT FORM
              ========================================== */}
          <div 
            ref={formRef}
            className={`
              bg-white rounded-2xl sm:rounded-3xl border border-[#6C7280]/20 shadow-xl shadow-gray-100/20 
              p-6 sm:p-8 md:p-10 lg:p-12
              transition-all duration-1000 ease-out delay-500
              ${isVisible.form 
                ? 'opacity-100 transform translate-x-0' 
                : 'opacity-0 transform translate-x-4 sm:translate-x-8 lg:translate-x-16'
              }
            `}
          >
            
            {/* Form Container */}
            <div className="space-y-6 sm:space-y-8">
              
              {/* ==========================================
                  DYNAMIC FORM FIELDS
                  ========================================== */}
              {formFields.map((field, index) => {
                const IconComponent = field.icon;
                const isFocused = focusedField === field.name;
                const hasValue = formData[field.name];
                
                return (
                  <div 
                    key={field.name} 
                    className={`
                      space-y-2 sm:space-y-3 transition-all duration-500 ease-out
                      ${isVisible.form 
                        ? 'opacity-100 transform translate-y-0' 
                        : 'opacity-0 transform translate-y-4'
                      }
                    `}
                    style={{ 
                      transitionDelay: isVisible.form ? `${800 + (index * 100)}ms` : '0ms' 
                    }}
                  >
                    
                    {/* Field Label */}
                    <label className="block text-sm sm:text-base font-medium font-serif text-[#002147] tracking-wide">
                      {field.label}
                      {field.required && (
                        <span className="text-red-400 ml-1">*</span>
                      )}
                    </label>
                    
                    {/* Input Field Container */}
                    <div className="relative">
                      
                      {/* Field Icon */}
                      <div className={`
                        absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 
                        transition-colors duration-200
                        ${isFocused || hasValue ? 'text-[#002147]' : 'text-[#6C7280]'}
                      `}>
                        <IconComponent size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={1.5} />
                      </div>
                      
                      {/* Input Element */}
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        onFocus={() => setFocusedField(field.name)}
                        onBlur={() => setFocusedField(null)}
                        required={field.required}
                        className={`
                          w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border 
                          transition-all duration-300 font-sans
                          text-sm sm:text-base text-gray-900 placeholder-[#6C7280] font-light
                          ${isFocused 
                            ? 'border-[#002147] shadow-lg shadow-gray-100/30 bg-white outline-none ring-2 ring-[#002147]/10' 
                            : 'border-[#6C7280]/30 bg-gray-50/50 hover:bg-white hover:border-[#6C7280]/50'
                          }
                          focus:outline-none focus:ring-2 focus:ring-[#002147]/10
                        `}
                        placeholder={field.placeholder}
                      />
                    </div>
                  </div>
                );
              })}

              {/* ==========================================
                  MESSAGE TEXTAREA FIELD
                  ========================================== */}
              <div 
                className={`
                  space-y-2 sm:space-y-3 transition-all duration-500 ease-out
                  ${isVisible.form 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-4'
                  }
                `}
                style={{ 
                  transitionDelay: isVisible.form ? '1100ms' : '0ms' 
                }}
              >
                
                {/* Message Label */}
                <label className="block text-sm sm:text-base font-medium font-serif text-[#002147] tracking-wide">
                  Message <span className="text-red-400 ml-1">*</span>
                </label>

                {/* Message Input Container */}
                <div className="relative">
                  
                  {/* Message Icon */}
                  <div className={`
                    absolute left-3 sm:left-4 top-3 sm:top-4 transition-colors duration-200
                    ${focusedField === 'message' || formData.message 
                      ? 'text-[#002147]' 
                      : 'text-[#6C7280]'
                    }
                  `}>
                    <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={1.5} />
                  </div>
                  
                  {/* Textarea Element */}
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('message')}
                    onBlur={() => setFocusedField(null)}
                    required
                    rows="4"
                    className={`
                      w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border 
                      transition-all duration-300 font-sans
                      text-sm sm:text-base text-gray-900 placeholder-[#6C7280] font-light resize-none
                      ${focusedField === 'message'
                        ? 'border-[#002147] shadow-lg shadow-gray-100/30 bg-white outline-none ring-2 ring-[#002147]/10' 
                        : 'border-[#6C7280]/30 bg-gray-50/50 hover:bg-white hover:border-[#6C7280]/50'
                      }
                      focus:outline-none focus:ring-2 focus:ring-[#002147]/10
                    `}
                    placeholder="Tell us how we can help you with your applications..."
                  />
                </div>
              </div>

              {/* ==========================================
                  SUBMIT BUTTON
                  ========================================== */}
              <button
                type="button"
                onClick={handleSubmit}
                className={`
                  w-full bg-[#002147] text-white py-3 sm:py-4 rounded-lg sm:rounded-xl 
                  font-medium font-serif tracking-wide text-base sm:text-lg
                  transition-all duration-300 
                  hover:bg-[#002147]/90 hover:shadow-xl hover:shadow-[#002147]/20
                  focus:outline-none focus:ring-4 focus:ring-[#002147]/20
                  active:scale-[0.98]
                  group flex items-center justify-center space-x-2 sm:space-x-3
                  ${isVisible.form 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-4'
                  }
                `}
                style={{ 
                  transitionDelay: isVisible.form ? '1300ms' : '0ms' 
                }}
              >
                <span>Send Message</span>
                <Send 
                  size={16} 
                  className="sm:w-[18px] sm:h-[18px] transition-transform duration-300 group-hover:translate-x-1" 
                />
              </button>
              
              {/* ==========================================
                  PRIVACY NOTICE
                  ========================================== */}
              <p 
                className={`
                  text-xs sm:text-sm text-[#6C7280] text-center font-light font-serif leading-relaxed
                  transition-all duration-500 ease-out
                  ${isVisible.form 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-4'
                  }
                `}
                style={{ 
                  transitionDelay: isVisible.form ? '1500ms' : '0ms' 
                }}
              >
                We respect your privacy. Your information will never be shared with third parties.
              </p>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumContactPage;