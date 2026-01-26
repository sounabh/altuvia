"use client";

import { createContext, useContext } from "react";

/**
 * CVDataContext - React context for sharing CV data across components
 * Provides cvData and updateCVData function to child components
 */
export const CVDataContext = createContext();

/**
 * useCVData - Custom hook to access CV data context
 * @returns {Object} CV data context containing cvData and updateCVData
 * @throws {Error} If used outside CVDataProvider
 */
export const useCVData = () => {
  const context = useContext(CVDataContext);
  if (!context) throw new Error("useCVData must be used within CVDataProvider");
  return context;
};

/**
 * Generates a unique CV number based on user ID
 * Format: cv-{userIdLast4}-{timestamp}-{random3Digits}
 * @param {string} userId - User's unique identifier
 * @returns {string} Unique CV number
 */
export const generateUniqueCVNumber = (userId) => {
  const userIdPart = userId.slice(-4);
  const timestamp = Date.now().toString();
  const randomPart = Math.floor(Math.random() * 999).toString().padStart(3, "0");
  return `cv-${userIdPart}-${timestamp}-${randomPart}`;
};

/**
 * Main CV data structure with default empty values
 * Organized by sections: personal, education, experience, projects, skills, achievements, volunteer
 */
export const DEFAULT_CV_DATA = {
  personal: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    summary: "",
  },
  education: [
    {
      id: "1",
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: "",
      description: "",
    },
  ],
  experience: [
    {
      id: "1",
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrentRole: false,
      description: "",
    },
  ],
  projects: [],
  skills: [
    {
      id: "1",
      name: "Programming Languages",
      skills: [],
    },
  ],
  achievements: [
    {
      id: "1",
      title: "",
      organization: "",
      date: "",
      type: "",
      description: "",
    },
  ],
  volunteer: [
    {
      id: "1",
      organization: "",
      role: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
      impact: "",
    },
  ],
};

/**
 * Creates fresh CV data with unique IDs for new CV creation
 * @returns {Object} New CV data structure with unique IDs
 */
export const createFreshCVData = () => ({
  personal: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    summary: "",
  },
  education: [
    {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: "",
      description: "",
    },
  ],
  experience: [
    {
      id: Date.now().toString(),
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrentRole: false,
      description: "",
    },
  ],
  projects: [],
  skills: [
    {
      id: Date.now().toString(),
      name: "Programming Languages",
      skills: [],
    },
  ],
  achievements: [
    {
      id: Date.now().toString(),
      title: "",
      organization: "",
      date: "",
      type: "",
      description: "",
    },
  ],
  volunteer: [
    {
      id: Date.now().toString(),
      organization: "",
      role: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
      impact: "",
    },
  ],
});

/**
 * Default theme color for CV
 */
export const DEFAULT_THEME_COLOR = "#1e40af";

/**
 * Default template for CV
 */
export const DEFAULT_TEMPLATE = "modern";