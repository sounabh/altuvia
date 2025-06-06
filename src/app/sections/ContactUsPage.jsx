"use client"
import React, { useState } from "react";
import { Send, MapPin, Mail, MessageCircle } from 'lucide-react';



const PremiumContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    message: ''
  });

  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We\'ll get back to you within 24 hours.');
    setFormData({ name: '', email: '', location: '', message: '' });
  };


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
    <div className="min-h-screen bg-white py-44 lg:36 px-6">
      <div className="max-w-5xl mx-auto">
        
    
       



        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          

          {/* Left Side - Info */}
          <div className="space-y-12">
            <div className="text-center mb-20">
        


<h1 className="font-serif font-normal text-[#002147] w-full
        text-[36px] sm:text-[48px] md:text-[56px] lg:text-[65px]
        leading-[45px] sm:leading-[55px] md:leading-[65px] lg:leading-[80px]
        tracking-[-1.5px] sm:tracking-[-2px] md:tracking-[-2.5px] lg:tracking-[-0.6px]">
        <span className="block">  Get in Touch</span>
       
      </h1>



      {/* Subheading/paragraph: responsive size and spacing */}
      <p className="font-inter font-normal text-[#6C7280] text-base sm:text-lg
        leading-[24px] sm:leading-[28px] md:leading-[30px] lg:leading-[32px]
        w-full max-w-xl sm:max-w-2xl mx-auto mt-2 lg:mt-1 sm:mt-3 md:mt-4 px-2 sm:px-4">
        <span className="block"> We're here to help you navigate your application journey. Our team of experts is ready to provide personalized guidance and support.</span>
       
      </p>



        </div>
          </div>



          {/* Right Side - Form */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/20 p-12">
            <div className="space-y-8">
              


              {/* Form Fields */}
              {formFields.map((field) => {
                const IconComponent = field.icon;
                const isFocused = focusedField === field.name;
                const hasValue = formData[field.name];
                

                return (
                  <div key={field.name} className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 tracking-wide">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    

                    <div className="relative">
                      <div className={`
                        absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200
                        ${isFocused || hasValue ? 'text-gray-900' : 'text-gray-400'}
                      `}>
                        <IconComponent size={18} strokeWidth={1.5} />
                      </div>
                      

                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        onFocus={() => setFocusedField(field.name)}
                        onBlur={() => setFocusedField(null)}
                        required={field.required}
                        className={`
                          w-full pl-12 pr-4 py-4 rounded-2xl border transition-all duration-300
                          text-gray-900 placeholder-gray-400 font-light
                          ${isFocused 
                            ? 'border-gray-900 shadow-lg shadow-gray-100/30 bg-white' 
                            : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
                          }
                          focus:outline-none focus:ring-0
                        `}
                        placeholder={field.placeholder}
                      />
                    </div>
                  </div>
                );
              })}


              {/* Message Field */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 tracking-wide">
                  Message <span className="text-red-400 ml-1">*</span>
                </label>

                
                <div className="relative">
                  <div className={`
                    absolute left-4 top-4 transition-colors duration-200
                    ${focusedField === 'message' || formData.message ? 'text-gray-900' : 'text-gray-400'}
                  `}>
                    <MessageCircle size={18} strokeWidth={1.5} />
                  </div>
                  

                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('message')}
                    onBlur={() => setFocusedField(null)}
                    required
                    rows="4"
                    className={`
                      w-full pl-12 pr-4 py-4 rounded-2xl border transition-all duration-300
                      text-gray-900 placeholder-gray-400 font-light resize-none
                      ${focusedField === 'message'
                        ? 'border-gray-900 shadow-lg shadow-gray-100/30 bg-white' 
                        : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
                      }
                      focus:outline-none focus:ring-0
                    `}
                    placeholder="Tell us how we can help you with your applications..."
                  />
                </div>
              </div>



              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                className="
                  w-full bg-[#002147] text-white py-4 rounded-lg 
                  font-medium tracking-wide text-lg
                  transition-all duration-300 
                  hover:bg-[#262b44] hover:rounded-xl hover:shadow-xl
                  focus:outline-none focus:ring-4 focus:ring[-#002147]/20
                  active:scale-[0.98]
                  group flex items-center justify-center space-x-3
                "
              >
                <span>Send Message</span>
                <Send size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              

              
              {/* Privacy Note */}
              <p className="text-xs text-gray-500 text-center font-light leading-relaxed">
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