import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';

/**
 * Modal component for adding new universities to the dashboard
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {function} props.onClose - Callback to close modal
 * @param {function} props.onAdd - Callback to add new university (receives form data)
 * @returns {JSX.Element} Modal form with:
 * - Input fields for university details
 * - Form validation
 * - Animated transitions
 * - Gradient submit button
 */
export const AddUniversityModal = ({ isOpen, onClose, onAdd }) => {
  // Form state management
  const [formData, setFormData] = useState({
    name: '',               // University name
    location: '',           // University location
    deadline: '',           // Application deadline
    gmatAverage: '',        // Average GMAT score
    image: '/placeholder.svg' // Default image
  });

  /**
   * Handles form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare data with defaults and proper types
    const universityData = {
      ...formData,
      gmatAverage: parseInt(formData.gmatAverage) || 0,
      essayProgress: 0,
      tasks: 0,
      totalTasks: 10,
      status: 'not-started'
    };

    onAdd(universityData);
    resetForm();
  };

  /**
   * Resets form fields to initial state
   */
  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      deadline: '',
      gmatAverage: '',
      image: '/placeholder.svg'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* Modal Container */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Add University
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* University Name Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              University Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
              placeholder="e.g., Harvard Business School"
            />
          </div>

          {/* Location Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Location
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
              placeholder="e.g., Boston, MA"
            />
          </div>

          {/* Deadline Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Application Deadline
            </label>
            <input
              type="date"
              required
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            />
          </div>

          {/* GMAT Score Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Average GMAT Score
            </label>
            <input
              type="number"
              value={formData.gmatAverage}
              onChange={(e) => setFormData({ ...formData, gmatAverage: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
              placeholder="e.g., 720"
              min="200"
              max="800"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Add University
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * COMPONENT PURPOSE:
 * Provides a controlled modal form for adding new universities to the dashboard.
 * 
 * DATA FLOW:
 * 1. Parent manages modal state (isOpen)
 * 2. User submits form → data sent to parent via onAdd()
 * 3. Parent adds university to list with generated ID
 * 
 * KEY FEATURES:
 * - Form validation (required fields)
 * - Type conversion (GMAT score to number)
 * - Default values for new entries
 * - Accessibility (focus states, labels)
 * - Visual feedback (hover states, transitions)
 * 
 * USAGE EXAMPLE:
 * <AddUniversityModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onAdd={(uni) => setUniversities([...universities, {...uni, id: Date.now()}])}
 * />
 */