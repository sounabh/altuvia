import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';


// Modal component to add a new university
export const AddUniversityModal = ({ isOpen, onClose, onAdd }) => {

  // Local state to handle form inputs
  const [formData, setFormData] = useState({
    name: '',               // University name
    location: '',           // University location
    deadline: '',           // Application deadline
    gmatAverage: '',        // Average GMAT score
    image: '/placeholder.svg' // Default image
  });


  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form reload

    // Call the onAdd prop with form data + default fields
    onAdd({
      ...formData,
      gmatAverage: parseInt(formData.gmatAverage) || 0, // Ensure GMAT is a number
      essayProgress: 0,       // New university starts with 0% essay progress
      tasks: 0,               // No tasks added yet
      totalTasks: 10,         // Assume default 10 tasks
      status: 'not-started'   // Status for newly added university
    });

    // Reset the form fields after submission
    setFormData({
      name: '',
      location: '',
      deadline: '',
      gmatAverage: '',
      image: '/placeholder.svg'
    });
  };


  // If modal is not open, return nothing (don’t render modal)
  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Add University
          </h2>

          {/* Close button (X icon) */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>


        {/* Form Begins */}
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

            {/* Cancel Button - closes the modal */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors duration-200"
            >
              Cancel
            </button>


            {/* Submit Button - adds university */}
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
 * 🧠 COMPONENT: <AddUniversityModal />
 * 
 * This modal is used to collect form input when a user wants to add a new university.
 * It receives 3 props from the parent:
 * 
 * 1. isOpen         → Boolean → controls whether modal is visible or not
 * 2. onClose        → Function → closes the modal (used on Cancel or X button)
 * 3. onAdd          → Function → triggered when user submits the form
 * 
 * -------------------------------------------------------------------
 * 🧩 HOW IT WORKS (Step-by-step):
 * 
 * 1. Parent component has state: `isModalOpen`
 *    - When user clicks "Add University" button → setIsModalOpen(true)
 * 
 * 2. Modal opens because: `isOpen={isModalOpen}`
 * 
 * 3. User fills out the form and clicks "Add University"
 * 
 * 4. Inside the modal, onSubmit:
 *    - Calls `onAdd(newUniversityData)`
 *    - This passes the new university object to the parent
 * 
 * 5. In the parent:
 *    - We use: 
 *        setUniversities([
 *          ...universities, 
 *          { ...newUniversity, id: Date.now() }
 *        ])
 *    - This adds the new university to the list and includes a unique `id` using `Date.now()`
 * 
 * 6. Why ID is needed?
 *    - Every university in the list must have a unique ID
 *    - This is important for operations like `.map()` (rendering), `.filter()` (deleting), etc.
 * 
 * 7. After adding, modal is closed using: `setIsModalOpen(false)`
 * 
 * -------------------------------------------------------------------
 * 🧺 REAL LIFE ANALOGY:
 * 
 * Think of a Grocery List app:
 * - You have a list of items (universities)
 * - You click "Add Item" → a popup form opens
 * - You enter "Milk", quantity, price
 * - On Submit → item is added to the list and popup closes
 * - Each item gets a unique ID so you can edit/remove them individually
 * 
 * That’s exactly what’s happening here.
 */
