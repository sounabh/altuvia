"use client"

import React, { useState } from "react"

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Icons
import { CalendarIcon, GraduationCap, DollarSign, Star } from "lucide-react"
import { format } from "date-fns"

// Color palette for school selection
const schoolColors = [
  { name: "Harvard Red", value: "#A41E22" },
  { name: "Stanford Cardinal", value: "#8C1515" },
  { name: "Wharton Blue", value: "#011F5B" },
  { name: "MIT Red", value: "#A31F34" },
  { name: "Columbia Blue", value: "#B9D9EB" },
  { name: "NYU Purple", value: "#57068C" },
  { name: "Chicago Maroon", value: "#800000" },
  { name: "Northwestern Purple", value: "#4E2A84" },
  { name: "Duke Blue", value: "#003087" },
  { name: "Custom Blue", value: "#3598FE" },
]

export function AddSchoolModal({ isOpen, onClose, onAdd }) {
  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    color: "#3598FE",
    description: "",
    deadline: "",
    applicationFee: "",
  })

  // Deadline state
  const [deadlineDate, setDeadlineDate] = useState()

  // Loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Prepare final data
    const schoolData = {
      ...formData,
      deadline: deadlineDate ? format(deadlineDate, "MMMM d, yyyy") : formData.deadline,
    }

    // Trigger callback
    onAdd(schoolData)

    // Reset form
    setFormData({
      name: "",
      shortName: "",
      color: "#3598FE",
      description: "",
      deadline: "",
      applicationFee: "",
    })

    setDeadlineDate(undefined)
    setIsSubmitting(false)
  }

  // Update form field value
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-[#3598FE] to-[#2563EB] rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span>Add New School</span>
          </DialogTitle>
        </DialogHeader>

        {/* Form starts */}
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">

          {/* School Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-[#002147]">
              School Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g., Harvard Business School"
              required
              className="border-gray-300 focus:border-[#3598FE] focus:ring-[#3598FE]"
            />
          </div>

          {/* Short Name */}
          <div className="space-y-2">
            <Label htmlFor="shortName" className="text-sm font-medium text-[#002147]">
              Short Name *
            </Label>
            <Input
              id="shortName"
              value={formData.shortName}
              onChange={(e) => updateField("shortName", e.target.value)}
              placeholder="e.g., HBS"
              required
              className="border-gray-300 focus:border-[#3598FE] focus:ring-[#3598FE]"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-[#002147]">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Brief description of the school's focus and strengths..."
              rows={3}
              className="border-gray-300 focus:border-[#3598FE] focus:ring-[#3598FE] resize-none"
            />
          </div>

          {/* School Color Picker */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[#002147]">School Color</Label>
            <div className="grid grid-cols-5 gap-3">
              {schoolColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => updateField("color", color.value)}
                  className={`relative w-full h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                    formData.color === color.value
                      ? "border-[#3598FE] shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {formData.color === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Star className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline and Application Fee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deadline Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#002147]">Application Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-gray-300 hover:border-[#3598FE]"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadlineDate ? format(deadlineDate, "PPP") : "Select deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadlineDate}
                    onSelect={setDeadlineDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Application Fee */}
            <div className="space-y-2">
              <Label htmlFor="applicationFee" className="text-sm font-medium text-[#002147]">
                Application Fee
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="applicationFee"
                  value={formData.applicationFee}
                  onChange={(e) => updateField("applicationFee", e.target.value)}
                  placeholder="250"
                  className="pl-10 border-gray-300 focus:border-[#3598FE] focus:ring-[#3598FE]"
                />
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {formData.name && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
              <p className="text-sm font-medium text-[#002147] mb-2">Preview:</p>
              <div className="flex items-start space-x-3">
                <div
                  className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: formData.color }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[#002147] text-sm">{formData.name}</h4>
                  <p className="text-xs text-[#6C7280] mt-1">{formData.shortName}</p>
                  {formData.description && (
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">{formData.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-[#6C7280]">
                    {deadlineDate && <span>Due: {format(deadlineDate, "MMM d, yyyy")}</span>}
                    {formData.applicationFee && <span>Fee: ${formData.applicationFee}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={!formData.name || !formData.shortName || isSubmitting}
              className="bg-gradient-to-r from-[#3598FE] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white border-0"
            >
              {isSubmitting ? "Adding..." : "Add School"}
            </Button>
          </div>
        </form>
        {/* Form ends */}
      </DialogContent>
    </Dialog>
  )
}
