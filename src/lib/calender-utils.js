// lib/calendar-utils.js - Simplified Calendar utilities and configuration
import moment from 'moment';

// ========================================
// CALENDAR CONFIGURATION
// ========================================

export const CALENDAR_CONFIG = {
  // Event types and their configurations
  EVENT_TYPES: {
    deadline: {
      label: 'Deadline',
      color: '#ef4444',
      icon: '⏰',
      defaultDuration: 0, // All day event
      defaultReminders: [
        { type: 'email', time: 10080 }, // 1 week
        { type: 'email', time: 2880 },  // 2 days
        { type: 'push', time: 1440 }    // 1 day
      ]
    },
    interview: {
      label: 'Interview',
      color: '#3b82f6',
      icon: '👥',
      defaultDuration: 60, // 1 hour
      defaultReminders: [
        { type: 'email', time: 2880 },  // 2 days
        { type: 'push', time: 60 }      // 1 hour
      ]
    },
    task: {
      label: 'Task',
      color: '#10b981',
      icon: '✅',
      defaultDuration: 30, // 30 minutes
      defaultReminders: [
        { type: 'push', time: 1440 }    // 1 day
      ]
    },
    workshop: {
      label: 'Workshop',
      color: '#f59e0b',
      icon: '🎓',
      defaultDuration: 120, // 2 hours
      defaultReminders: [
        { type: 'email', time: 1440 }   // 1 day
      ]
    },
    meeting: {
      label: 'Meeting',
      color: '#8b5cf6',
      icon: '📅',
      defaultDuration: 60, // 1 hour
      defaultReminders: [
        { type: 'push', time: 60 }      // 1 hour
      ]
    }
  },

  // Priority levels
  PRIORITIES: {
    low: {
      label: 'Low',
      color: '#10b981',
      weight: 1
    },
    medium: {
      label: 'Medium',
      color: '#f59e0b',
      weight: 2
    },
    high: {
      label: 'High',
      color: '#ef4444',
      weight: 3
    }
  },

  // Event statuses
  STATUSES: {
    pending: {
      label: 'Pending',
      color: '#6b7280'
    },
    scheduled: {
      label: 'Scheduled',
      color: '#3b82f6'
    },
    'in-progress': {
      label: 'In Progress',
      color: '#f59e0b'
    },
    completed: {
      label: 'Completed',
      color: '#10b981'
    },
    cancelled: {
      label: 'Cancelled',
      color: '#ef4444'
    },
    missed: {
      label: 'Missed',
      color: '#dc2626'
    }
  }
};

// ========================================
// CALENDAR HELPER FUNCTIONS
// ========================================

export const CalendarHelpers = {
  // Transform API events for react-big-calendar
  transformEventsForCalendar: (events) => {
    if (!Array.isArray(events)) return [];
    
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: event.isAllDay || false,
      
      // Event metadata
      type: event.type || event.eventType,
      eventType: event.eventType || event.type,
      school: event.school,
      priority: event.priority,
      status: event.status || event.eventStatus,
      eventStatus: event.eventStatus || event.status,
      description: event.description,
      location: event.location,
      
      // Additional metadata
      universityId: event.universityId,
      programId: event.programId,
      applicationId: event.applicationId,
      isSystemGenerated: event.isSystemGenerated || false,
      color: event.color || CALENDAR_CONFIG.EVENT_TYPES[event.eventType || event.type]?.color,
      reminders: event.reminders || [],
      
      // Computed properties
      isOverdue: new Date(event.end) < new Date() && 
                 (event.completionStatus !== 'completed' && event.status !== 'completed'),
      daysUntil: Math.ceil((new Date(event.start) - new Date()) / (1000 * 60 * 60 * 24)),
      
      // Completion status
      completionStatus: event.completionStatus,
      
      // Original event data
      originalEvent: event
    }));
  },

  // Transform calendar event for API submission
  transformEventForAPI: (event, userId) => {
    return {
      userId,
      title: event.title,
      description: event.description,
      location: event.location,
      start: event.start instanceof Date ? event.start.toISOString() : event.start,
      end: event.end instanceof Date ? event.end.toISOString() : event.end,
      timezone: event.timezone || 'UTC',
      isAllDay: event.allDay || false,
      eventType: event.eventType || event.type,
      eventStatus: event.eventStatus || event.status || 'pending',
      priority: event.priority || 'medium',
      color: event.color,
      universityId: event.universityId || null,
      programId: event.programId || null,
      applicationId: event.applicationId || null,
      reminders: event.reminders || [],
      completionStatus: event.completionStatus || 'pending'
    };
  },

  // Get events for a specific date
  getEventsForDate: (events, date) => {
    const targetDate = moment(date);
    return events.filter(event => {
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      return targetDate.isBetween(eventStart, eventEnd, 'day', '[]') || 
             eventStart.isSame(targetDate, 'day');
    });
  },

  // Get upcoming events
  getUpcomingEvents: (events, daysAhead = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return events.filter(event => 
      event.start >= now &&
      event.start <= futureDate &&
      event.status !== 'completed' &&
      event.completionStatus !== 'completed'
    ).sort((a, b) => new Date(a.start) - new Date(b.start));
  },

  // Get overdue events
  getOverdueEvents: (events) => {
    const now = new Date();
    return events.filter(event => 
      event.end < now && 
      event.status !== 'completed' &&
      event.completionStatus !== 'completed' &&
      event.status !== 'cancelled' &&
      ['deadline', 'interview', 'task'].includes(event.type || event.eventType)
    );
  },

  // Group events by university
  groupEventsByUniversity: (events) => {
    return events.reduce((groups, event) => {
      const university = event.school || 'General';
      if (!groups[university]) {
        groups[university] = [];
      }
      groups[university].push(event);
      return groups;
    }, {});
  },

  // Filter events by status
  filterEventsByStatus: (events, status) => {
    return events.filter(event => 
      event.status === status || 
      event.eventStatus === status ||
      event.completionStatus === status
    );
  },

  // Calculate completion percentage for events
  calculateCompletionRate: (events) => {
    if (events.length === 0) return 0;
    const completed = events.filter(event => 
      event.status === 'completed' || 
      event.eventStatus === 'completed' ||
      event.completionStatus === 'completed'
    ).length;
    return Math.round((completed / events.length) * 100);
  },

  // Get event statistics
  getEventStatistics: (events) => {
    const total = events.length;
    const completed = events.filter(e => 
      e.completionStatus === 'completed' || e.status === 'completed'
    ).length;
    const pending = events.filter(e => 
      e.status === 'pending' || e.eventStatus === 'pending'
    ).length;
    const overdue = CalendarHelpers.getOverdueEvents(events).length;
    const systemGenerated = events.filter(e => e.isSystemGenerated).length;
    const userCreated = total - systemGenerated;

    return {
      total,
      completed,
      pending,
      overdue,
      systemGenerated,
      userCreated,
      completionRate: CalendarHelpers.calculateCompletionRate(events)
    };
  },

  // Validate event data
  validateEventData: (eventData) => {
    const errors = [];

    // Required fields validation
    if (!eventData.title?.trim()) {
      errors.push('Title is required');
    }

    if (!eventData.start) {
      errors.push('Start date is required');
    }

    if (!eventData.end) {
      errors.push('End date is required');
    }

    if (!eventData.eventType && !eventData.type) {
      errors.push('Event type is required');
    }

    // Date validation
    if (eventData.start && eventData.end) {
      const startDate = new Date(eventData.start);
      const endDate = new Date(eventData.end);
      
      if (startDate >= endDate) {
        errors.push('End date must be after start date');
      }

      // Check if dates are valid
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid start date');
      }
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid end date');
      }
    }

    return errors;
  },

  // Generate event color based on type and priority
  getEventColor: (eventType, priority = 'medium', isSystemGenerated = false) => {
    const baseColor = CALENDAR_CONFIG.EVENT_TYPES[eventType]?.color || '#6b7280';
    
    // Adjust opacity for system generated events
    if (isSystemGenerated) {
      return baseColor + '80'; // 50% opacity
    }

    // Adjust brightness based on priority
    if (priority === 'high') {
      return baseColor; // Full intensity
    } else if (priority === 'low') {
      return baseColor + 'CC'; // 80% opacity
    }

    return baseColor + 'E6'; // 90% opacity for medium
  },

  // Sort events by priority and date
  sortEventsByPriorityAndDate: (events) => {
    return events.sort((a, b) => {
      const priorityA = CALENDAR_CONFIG.PRIORITIES[a.priority]?.weight || 2;
      const priorityB = CALENDAR_CONFIG.PRIORITIES[b.priority]?.weight || 2;
      
      // First sort by priority (higher weight first)
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      
      // Then sort by date (earlier first)
      return new Date(a.start) - new Date(b.start);
    });
  }
};

// ========================================
// DATE AND TIME UTILITIES
// ========================================

export const DateTimeUtils = {
  // Format date for display
  formatDate: (date, format = 'MMM DD, YYYY') => {
    return moment(date).format(format);
  },

  // Format time for display
  formatTime: (date, format = 'h:mm A') => {
    return moment(date).format(format);
  },

  // Format date and time for display
  formatDateTime: (date, format = 'MMM DD, YYYY h:mm A') => {
    return moment(date).format(format);
  },

  // Get relative time (e.g., "in 2 days", "3 hours ago")
  getRelativeTime: (date) => {
    return moment(date).fromNow();
  },

  // Check if date is today
  isToday: (date) => {
    return moment(date).isSame(moment(), 'day');
  },

  // Check if date is this week
  isThisWeek: (date) => {
    return moment(date).isSame(moment(), 'week');
  },

  // Get start and end of week for a date
  getWeekBounds: (date) => {
    const start = moment(date).startOf('week');
    const end = moment(date).endOf('week');
    return { start: start.toDate(), end: end.toDate() };
  },

  // Get start and end of month for a date
  getMonthBounds: (date) => {
    const start = moment(date).startOf('month');
    const end = moment(date).endOf('month');
    return { start: start.toDate(), end: end.toDate() };
  }
};

// ========================================
// API UTILITIES
// ========================================

export const CalendarAPI = {
  // Fetch events from API
  fetchEvents: async (params = {}) => {
    const searchParams = new URLSearchParams();
    
    // Add parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, params[key]);
      }
    });
    
    const url = `/api/calendar?${searchParams.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Create new event
  createEvent: async (eventData) => {
    const response = await fetch('/api/calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create event');
    }
    
    const data = await response.json();
    return data;
  },

  // Update existing event
  updateEvent: async (eventData) => {
    const response = await fetch('/api/calendar', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update event');
    }
    
    const data = await response.json();
    return data;
  },

  // Delete event
  deleteEvent: async (eventId) => {
    const response = await fetch(`/api/calendar?id=${eventId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete event');
    }
    
    const data = await response.json();
    return data;
  }
};

// ========================================
// STORAGE UTILITIES (in-memory for artifacts)
// ========================================

export const StorageUtils = {
  // In-memory storage for artifacts environment
  storage: {},

  // Get item from storage
  getItem: (key) => {
    try {
      const item = StorageUtils.storage[key];
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },

  // Set item in storage
  setItem: (key, value) => {
    try {
      StorageUtils.storage[key] = JSON.stringify(value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },

  // Remove item from storage
  removeItem: (key) => {
    delete StorageUtils.storage[key];
  },

  // Clear all storage
  clear: () => {
    StorageUtils.storage = {};
  },

  // Save calendar settings
  saveCalendarSettings: (settings) => {
    StorageUtils.setItem('calendar-settings', settings);
  },

  // Load calendar settings
  loadCalendarSettings: () => {
    return StorageUtils.getItem('calendar-settings') || {
      defaultView: 'month',
      defaultReminders: true,
      showSystemEvents: true,
      timeFormat: '12h'
    };
  },

  // Save filter preferences
  saveFilterPreferences: (filters) => {
    StorageUtils.setItem('calendar-filters', filters);
  },

  // Load filter preferences
  loadFilterPreferences: () => {
    return StorageUtils.getItem('calendar-filters') || {
      school: 'all',
      type: 'all',
      status: 'all',
      systemOnly: false
    };
  }
};

// Default export with all utilities
export default {
  CALENDAR_CONFIG,
  CalendarHelpers,
  DateTimeUtils,
  CalendarAPI,
  StorageUtils
};