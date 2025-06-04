"use client"
import React, { useState } from "react";


const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
    alert('Thank you for your message! We\'ll get back to you within 24 hours.');
    setFormData({ name: '', email: '', location: '', message: '' });
  };

  return (
    <div className="w-full min-h-screen  px-4 sm:px-6 lg:px-8 py-8  lg:pt-44 mt-44 md:mt-0 pb-14">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h1 className="font-inter tracking-[-1.5px] md:tracking-[-2.5px] lg:tracking-[-1.9px] leading-[45px] sm:leading-[55px] md:leading-[65px] lg:leading-[75px] text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] font-semibold w-full text-[#1A1A1A] mb-6">
            Contact Us
          </h1>
          
          <p className="font-inter leading-[24px] sm:leading-[28px] md:leading-[30px] lg:leading-[32px] text-[#404245] font-normal text-base sm:text-lg max-w-2xl mx-auto">
            <span className="block">
              Whether you're a student, parent or advisor - we'd love to hear from you.  Drop us a message and we'll get back within 24 hours.
            </span>
            <span className="block mt-2">
            
            </span>
          </p>
        </div>

        {/* Form Section */}
        <div className="flex justify-center">
          <div className="w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[480px] h-auto bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 sm:border-2 lg:border-4 border-black shadow-[4px_4px_12px_0px_rgba(0,0,0,0.2)] sm:shadow-[6px_6px_15px_0px_rgba(0,0,0,0.25)] lg:shadow-[8px_8px_20px_0px_rgba(0,0,0,0.3)]  hover:shadow-[6px_6px_20px_0px_rgba(0,0,0,0.3)] sm:hover:shadow-[8px_8px_25px_0px_rgba(0,0,0,0.35)] lg:hover:shadow-[12px_12px_30px_0px_rgba(0,0,0,0.4)] group relative overflow-hidden">
            
            <div className="p-6 sm:p-8 lg:p-10 space-y-4 sm:space-y-5 lg:space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-inter text-sm sm:text-base placeholder-gray-400"
                  placeholder="Your full name"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-inter text-sm sm:text-base placeholder-gray-400"
                  placeholder="your@email.com"
                />
              </div>

              {/* Location Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-inter text-sm sm:text-base placeholder-gray-400"
                  placeholder="City, Country"
                />
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-inter">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-inter text-sm sm:text-base placeholder-gray-400 resize-none"
                  placeholder="Tell us how we can help..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-black text-white py-3 sm:py-3.5 rounded-lg font-inter font-medium text-sm sm:text-base hover:bg-gray-800 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg mt-6 sm:mt-8"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom Spacing */}
        <div className="h-12 sm:h-16 lg:h-20"></div>
      </div>
    </div>
  );
};

export default ContactUsPage;