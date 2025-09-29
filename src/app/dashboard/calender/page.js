"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { 
  Plus, Filter, Bell, Clock, MapPin, Edit2, Trash2, X, Users, 
  BookOpen, AlertCircle, CheckCircle, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, Eye, EyeOff, Loader2, Sparkles, Star
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Initialize the localizer for the calendar component
const localizer = momentLocalizer(moment);

// Loading Skeleton Components
const CalendarSkeleton = () => (
  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
    <div className="p-6 border-b border-gray-200 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="w-40 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="w-16 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
    <div className="p-6">
      <div className="h-[600px] bg-gray-100 rounded-xl animate-pulse"></div>
    </div>
  </div>
);

const EventCardSkeleton = () => (
  <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded-lg w-1/2 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded-lg w-1/3"></div>
      </div>
      <div className="ml-3 flex flex-col items-end gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

const SidebarSkeleton = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="h-7 bg-gray-200 rounded-lg w-1/2 mb-5 animate-pulse"></div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

const SmartCalendar = () => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const [userEmail, setUserEmail] = useState('');
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filterSchool, setFilterSchool] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [savedUniversities, setSavedUniversities] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Loading states for operations
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [operatingEventId, setOperatingEventId] = useState(null);

  const [newEvent, setNewEvent] = useState({
    title: '',
    start: new Date(),
    end: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
    eventType: 'task',
    universityId: '',
    priority: 'medium',
    description: '',
    eventStatus: 'pending',
    location: ''
  });

  // ========================================
  // CALENDAR CONFIGURATION
  // ========================================


useEffect(() => {
  try {
    const authData = JSON.parse(localStorage.getItem("authData") || "{}");
    const email = authData.email || '';
    setUserEmail(email);
  } catch (error) {
    console.error("Error parsing auth data:", error);
    setUserEmail('');
  }
}, []);



  const eventTypes = [
    { value: 'deadline', label: 'Deadline', color: '#dc2626', icon: '⏰' },
    { value: 'interview', label: 'Interview', color: '#2563eb', icon: '👥' },
    { value: 'task', label: 'Task', color: '#059669', icon: '✅' },
    { value: 'workshop', label: 'Workshop', color: '#d97706', icon: '🎓' },
    { value: 'meeting', label: 'Meeting', color: '#7c3aed', icon: '📅' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#059669' },
    { value: 'medium', label: 'Medium', color: '#d97706' },
    { value: 'high', label: 'High', color: '#dc2626' }
  ];

  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // ========================================
  // API FUNCTIONS
  // ========================================

  const fetchSavedUniversities = useCallback(async () => {
    try {
      const response = await fetch('/api/universities');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.data) {
        return;
      }

      // Filter universities that are saved by the current user
      const savedUnis = result.data.filter(university => {
        if (Array.isArray(university.savedByUsers)) {
          return university.savedByUsers.length > 0;
        } else if (typeof university.isAdded === 'boolean') {
          return university.isAdded;
        }
        return false;
      });

      // Transform to match the format expected by the calendar
      const transformedSavedUnis = savedUnis.map(uni => ({
        id: uni.id,
        universityName: uni.name
      }));

      setSavedUniversities(transformedSavedUnis);
    } catch (err) {
      console.error('Error fetching saved universities:', err);
    }
  }, []);

 const buildApiUrl = useCallback((params = {}) => {
  const searchParams = new URLSearchParams();
  
  // Add userEmail if available
  if (userEmail) {
    searchParams.append('userEmail', userEmail);
  }
  
  // Add other parameters
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== 'all') {
      searchParams.append(key, params[key]);
    }
  });
  
  const queryString = searchParams.toString();
  return `/api/calendar${queryString ? `?${queryString}` : ''}`;
}, [userEmail]); // Add userEmail as dependency

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build URL with current filter parameters
      const params = {
        ...(filterSchool !== 'all' && filterSchool !== 'general' && { universityId: filterSchool }),
        ...(filterType !== 'all' && { eventType: filterType }),
        includeSystemEvents: true
      };

      const url = buildApiUrl(params);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch events');
      }

      // Transform API data for calendar
      const transformedEvents = result.data.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start),
        end: new Date(event.end),
        type: event.type || event.eventType,
        eventType: event.eventType || event.type,
        priority: event.priority,
        status: event.status || event.eventStatus,
        eventStatus: event.eventStatus || event.status,
        completionStatus: event.completionStatus,
        school: event.school,
        universityId: event.universityId,
        programId: event.programId,
        description: event.description,
        location: event.location,
        color: event.color,
        isSystemGenerated: event.isSystemGenerated,
        hasReminders: event.hasReminders,
        reminders: event.reminders || [],
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      }));

      setEvents(transformedEvents);
      
      // Extract unique universities from events
      const uniqueUniversities = [];
      const universityMap = new Map();
      
      transformedEvents.forEach(event => {
        if (event.universityId && event.school && !universityMap.has(event.universityId)) {
          universityMap.set(event.universityId, {
            id: event.universityId,
            universityName: event.school
          });
          uniqueUniversities.push({
            id: event.universityId,
            universityName: event.school
          });
        }
      });
      
      setUniversities(uniqueUniversities);
    } catch (err) {
      setError(`Failed to fetch events: ${err.message}`);
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [buildApiUrl, filterSchool, filterType,userEmail]);

  const saveEvent = async (eventData) => {
    try {
      const apiData = {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString(),
        eventType: eventData.eventType,
        eventStatus: eventData.eventStatus,
        priority: eventData.priority,
        universityId: eventData.universityId || null,
        timezone: 'UTC',
        isAllDay: false,
        color: eventTypes.find(t => t.value === eventData.eventType)?.color
      };

      if (editingEvent) {
        // Update existing event
        const response = await fetch('/api/calendar', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: editingEvent.id, ...apiData }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update event');
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to update event');
        }
      } else {
        // Create new event
        const response = await fetch('/api/calendar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create event');
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to create event');
        }
      }

      return { success: true };
    } catch (err) {
      throw new Error(err.message || 'Failed to save event');
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      const response = await fetch(`/api/calendar?id=${eventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete event');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete event');
      }

      return { success: true };
    } catch (err) {
      throw new Error(err.message || 'Failed to delete event');
    }
  };

  const completeEvent = async (eventId) => {
    try {
      const eventToUpdate = events.find(e => e.id === eventId);
      if (!eventToUpdate) return;

      const response = await fetch('/api/calendar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: eventId,
          completionStatus: 'completed',
          eventStatus: 'completed'
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete event');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to complete event');
      }

      return { success: true };
    } catch (err) {
      throw new Error(err.message || 'Failed to complete event');
    }
  };

  // Fetch saved universities when component mounts
  useEffect(() => {
    fetchSavedUniversities();
  }, [fetchSavedUniversities]);

  // Fetch events when component mounts or filters change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ========================================
  // EVENT HANDLERS
  // ========================================

  const handleSelectEvent = useCallback((event) => {
    if (!isDeleting && !isCompleting && !isUpdating) {
      setSelectedEvent(event);
    }
  }, [isDeleting, isCompleting, isUpdating]);

  const handleSelectSlot = useCallback(({ start, end }) => {
    if (isCreating || isUpdating) return;
    
    const endTime = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
    setNewEvent(prev => ({
      ...prev,
      start,
      end: endTime
    }));
    setShowEventModal(true);
  }, [isCreating, isUpdating]);

  const handleSaveEvent = async () => {
    setSaveError(null);
    
    if (!newEvent.title.trim()) {
      setSaveError('Title is required');
      return;
    }
    
    if (newEvent.start >= newEvent.end) {
      setSaveError('End time must be after start time');
      return;
    }

    if (editingEvent) {
      setIsUpdating(true);
      setOperatingEventId(editingEvent.id);
    } else {
      setIsCreating(true);
    }

    try {
      const eventData = {
        title: newEvent.title.trim(),
        start: newEvent.start,
        end: newEvent.end,
        eventType: newEvent.eventType,
        eventStatus: newEvent.eventStatus,
        priority: newEvent.priority,
        description: newEvent.description.trim(),
        location: newEvent.location.trim(),
        universityId: newEvent.universityId || null
      };

      await saveEvent(eventData);
      resetForm();
      
      // Refresh events after successful save
      await fetchEvents();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsCreating(false);
      setIsUpdating(false);
      setOperatingEventId(null);
    }
  };

  const handleEditEvent = (event) => {
    if (isDeleting || isCompleting || isUpdating) return;
    
    setNewEvent({
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      eventType: event.eventType || event.type,
      universityId: event.universityId || '',
      description: event.description || '',
      eventStatus: event.eventStatus || event.status,
      priority: event.priority,
      location: event.location || ''
    });
    setEditingEvent(event);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (isDeleting || isCompleting) return;
    
    if (window.confirm('Are you sure you want to delete this event?')) {
      setIsDeleting(true);
      setOperatingEventId(eventId);
      
      try {
        await deleteEvent(eventId);
        setSelectedEvent(null);
        
        // Refresh events after successful delete
        await fetchEvents();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsDeleting(false);
        setOperatingEventId(null);
      }
    }
  };

  const handleCompleteEvent = async (eventId) => {
    if (isDeleting || isCompleting) return;
    
    setIsCompleting(true);
    setOperatingEventId(eventId);
    
    try {
      await completeEvent(eventId);
      setSelectedEvent(null);
      
      // Refresh events after successful completion
      await fetchEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCompleting(false);
      setOperatingEventId(null);
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      start: new Date(),
      end: new Date(new Date().getTime() + 60 * 60 * 1000),
      eventType: 'task',
      universityId: '',
      priority: 'medium',
      description: '',
      eventStatus: 'pending',
      location: ''
    });
    setShowEventModal(false);
    setEditingEvent(null);
    setSaveError(null);
  };

  // ========================================
  // UI HELPERS AND COMPUTED DATA
  // ========================================

  const getEventStyle = useCallback((event) => {
    const eventTypeConfig = eventTypes.find(t => t.value === (event.eventType || event.type));
    const baseColor = event.color || eventTypeConfig?.color || '#6b7280';
    
    let opacity = 1;
    if (event.completionStatus === 'completed' || event.status === 'completed') {
      opacity = 0.7;
    }
    if (event.isSystemGenerated) {
      opacity = 0.85;
    }

    return {
      style: {
        backgroundColor: baseColor,
        borderColor: baseColor,
        color: 'white',
        borderRadius: '6px',
        border: 'none',
        fontSize: '12px',
        fontWeight: '500',
        padding: '2px 6px',
        opacity,
        textDecoration: (event.completionStatus === 'completed' || event.status === 'completed') ? 'line-through' : 'none',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }
    };
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSchool = filterSchool === 'all' || event.universityId === filterSchool || 
                            (filterSchool === 'general' && (!event.universityId || event.universityId === ''));
      const matchesType = filterType === 'all' || event.eventType === filterType || event.type === filterType;
      const matchesStatus = filterStatus === 'all' || event.eventStatus === filterStatus || 
                           event.status === filterStatus || event.completionStatus === filterStatus;
      return matchesSchool && matchesType && matchesStatus;
    });
  }, [events, filterSchool, filterType, filterStatus]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter(event => new Date(event.start) >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 5);
  }, [filteredEvents]);

  const overdueEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter(event => 
        new Date(event.start) < now && 
        event.completionStatus !== 'completed' && 
        event.status !== 'completed' &&
        ['deadline', 'task'].includes(event.eventType || event.type)
      );
  }, [filteredEvents]);

  const eventStats = useMemo(() => {
    const total = events.length;
    const completed = events.filter(e => 
      e.completionStatus === 'completed' || e.status === 'completed'
    ).length;
    const pending = events.filter(e => 
      e.status === 'pending' || e.eventStatus === 'pending'
    ).length;
    const overdue = overdueEvents.length;

    return { total, completed, pending, overdue };
  }, [events, overdueEvents]);

  // Calendar navigation
  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const goToToday = () => {
    setDate(new Date());
  };

  const goToPrevious = () => {
    let newDate = new Date(date);
    if (view === 'month') {
      newDate.setMonth(date.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(date.getDate() - 7);
    } else if (view === 'day') {
      newDate.setDate(date.getDate() - 1);
    }
    setDate(newDate);
  };

  const goToNext = () => {
    let newDate = new Date(date);
    if (view === 'month') {
      newDate.setMonth(date.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(date.getDate() + 7);
    } else if (view === 'day') {
      newDate.setDate(date.getDate() + 1);
    }
    setDate(newDate);
  };

  const formatDateTitle = () => {
    if (view === 'month') {
      return moment(date).format('MMMM YYYY');
    } else if (view === 'week') {
      const start = moment(date).startOf('week');
      const end = moment(date).endOf('week');
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
    } else {
      return moment(date).format('MMMM D, YYYY');
    }
  };

  // ========================================
  // RENDER
  // ========================================

  const isAnyOperationInProgress = isCreating || isUpdating || isDeleting || isCompleting;

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 pb-8 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#002147] rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-semibold text-[#002147]">
                  Application Calendar
                </h1>
              </div>
              <p className="text-gray-600 ml-1 mb-4">
                Track deadlines, interviews, and tasks across all your applications
              </p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-gray-100 px-3 py-1.5 rounded-lg">
                  <span className="font-medium text-gray-900">{eventStats.total}</span>
                  <span className="text-gray-600 ml-1.5">Total</span>
                </div>
                <div className="bg-green-100 px-3 py-1.5 rounded-lg">
                  <span className="font-medium text-green-800">{eventStats.completed}</span>
                  <span className="text-green-600 ml-1.5">Completed</span>
                </div>
                <div className="bg-amber-100 px-3 py-1.5 rounded-lg">
                  <span className="font-medium text-amber-800">{eventStats.pending}</span>
                  <span className="text-amber-600 ml-1.5">Pending</span>
                </div>
                {eventStats.overdue > 0 && (
                  <div className="bg-red-100 px-3 py-1.5 rounded-lg">
                    <span className="font-medium text-red-800">{eventStats.overdue}</span>
                    <span className="text-red-600 ml-1.5">Overdue</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                disabled={isAnyOperationInProgress}
                className={`flex items-center gap-1.5 px-4 py-2 border rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  showFilters 
                    ? 'bg-[#002147] border-[#002147] text-white' 
                    : 'bg-white border-gray-300 text-[#002147] hover:bg-gray-50'
                }`}
              >
                <Filter size={18} />
                Filters
              </button>
              <button
                onClick={() => setShowEventModal(true)}
                disabled={isAnyOperationInProgress}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#002147] text-white font-medium rounded-lg hover:bg-[#001a36] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                Add Event
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl mb-6">
            <div className="flex items-center">
              <AlertCircle size={20} className="mr-3" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by School
                </label>
                <select
                  value={filterSchool}
                  onChange={(e) => setFilterSchool(e.target.value)}
                  disabled={isAnyOperationInProgress}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002147] focus:border-[#002147] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="all">All Schools</option>
                  <option value="general">General/No School</option>
                  {savedUniversities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.universityName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  disabled={isAnyOperationInProgress}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002147] focus:border-[#002147] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="all">All Types</option>
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  disabled={isAnyOperationInProgress}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002147] focus:border-[#002147] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="all">All Status</option>
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <CalendarSkeleton />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Custom Calendar Toolbar */}
                <div className="p-6 border-b border-gray-200 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={goToPrevious}
                        disabled={isAnyOperationInProgress}
                        className="p-2.5 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={20} className="text-gray-600" />
                      </button>
                      <button
                        onClick={goToToday}
                        disabled={isAnyOperationInProgress}
                        className="px-4 py-2 text-sm bg-[#002147] text-white rounded-lg hover:bg-[#001a36] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Today
                      </button>
                      <button
                        onClick={goToNext}
                        disabled={isAnyOperationInProgress}
                        className="p-2.5 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={20} className="text-gray-600" />
                      </button>
                      <h2 className="text-xl font-semibold text-gray-800 ml-2">
                        {formatDateTitle()}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewChange('month')}
                        disabled={isAnyOperationInProgress}
                        className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                          view === 'month' 
                            ? 'bg-[#002147] text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        Month
                      </button>
                      <button
                        onClick={() => handleViewChange('week')}
                        disabled={isAnyOperationInProgress}
                        className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                          view === 'week' 
                            ? 'bg-[#002147] text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => handleViewChange('day')}
                        disabled={isAnyOperationInProgress}
                        className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                          view === 'day' 
                            ? 'bg-[#002147] text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        Day
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div style={{ height: '700px' }} className="calendar-container rounded-lg overflow-hidden">
                    <Calendar
                      localizer={localizer}
                      events={filteredEvents}
                      startAccessor="start"
                      endAccessor="end"
                      style={{ height: '100%', fontFamily: 'system-ui' }}
                      eventPropGetter={getEventStyle}
                      onSelectEvent={handleSelectEvent}
                      onSelectSlot={handleSelectSlot}
                      selectable={!isAnyOperationInProgress}
                      view={view}
                      onView={handleViewChange}
                      date={date}
                      onNavigate={handleNavigate}
                      toolbar={false}
                      formats={{
                        timeGutterFormat: 'h A',
                        eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                          localizer.format(start, 'h:mm A', culture) + ' - ' +
                          localizer.format(end, 'h:mm A', culture),
                        agendaTimeFormat: 'h:mm A',
                        agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
                          localizer.format(start, 'h:mm A', culture) + ' - ' +
                          localizer.format(end, 'h:mm A', culture)
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {isLoading ? (
              <SidebarSkeleton />
            ) : (
              <>
                {/* Selected Event Details */}
                {selectedEvent && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Event Details
                      </h3>
                      <button
                        onClick={() => setSelectedEvent(null)}
                        disabled={isAnyOperationInProgress}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 text-base">{selectedEvent.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span 
                            className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                            style={{ backgroundColor: selectedEvent.color || eventTypes.find(t => t.value === (selectedEvent.eventType || selectedEvent.type))?.color }}
                          >
                            {eventTypes.find(t => t.value === (selectedEvent.eventType || selectedEvent.type))?.icon} {selectedEvent.eventType || selectedEvent.type}
                          </span>
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            selectedEvent.priority === 'high' ? 'bg-red-100 text-red-800' :
                            selectedEvent.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {selectedEvent.priority} priority
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded-lg">
                            <Clock size={16} className="text-gray-500" />
                            <span className="text-sm">{moment(selectedEvent.start).format('MMM DD, YYYY h:mm A')}</span>
                          </div>
                          
                          {selectedEvent.location && (
                            <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded-lg">
                              <MapPin size={16} className="text-gray-500" />
                              <span className="text-sm">{selectedEvent.location}</span>
                            </div>
                          )}

                          {selectedEvent.school && (
                            <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded-lg">
                              <BookOpen size={16} className="text-gray-500" />
                              <span className="text-sm">{selectedEvent.school}</span>
                            </div>
                          )}

                          {selectedEvent.isSystemGenerated && (
                            <div className="flex items-center gap-3 text-purple-700 bg-purple-50 p-3 rounded-lg">
                              <Bell size={16} className="text-purple-600" />
                              <span className="text-sm">System Generated Event</span>
                            </div>
                          )}

                          {selectedEvent.hasReminders && (
                            <div className="flex items-center gap-3 text-amber-700 bg-amber-50 p-3 rounded-lg">
                              <Bell size={16} className="text-amber-600" />
                              <span className="text-sm">{selectedEvent.reminders?.length || 0} Reminder(s) Set</span>
                            </div>
                          )}
                          
                          {selectedEvent.description && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h5 className="text-xs font-medium text-gray-800 mb-2">Description</h5>
                              <p className="text-gray-700 text-sm leading-relaxed">{selectedEvent.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                        {(selectedEvent.completionStatus !== 'completed' && selectedEvent.status !== 'completed') && (
                          <button
                            onClick={() => handleCompleteEvent(selectedEvent.id)}
                            disabled={isAnyOperationInProgress}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isCompleting && operatingEventId === selectedEvent.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            Mark Complete
                          </button>
                        )}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditEvent(selectedEvent)}
                            disabled={isAnyOperationInProgress}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#002147] text-white rounded-lg hover:bg-[#001a36] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdating && operatingEventId === selectedEvent.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Edit2 size={16} />
                            )}
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(selectedEvent.id)}
                            disabled={isAnyOperationInProgress || selectedEvent.isSystemGenerated}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDeleting && operatingEventId === selectedEvent.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming Events */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-[#002147] rounded-lg">
                      <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                    Upcoming Events
                  </h3>
                  <div className="space-y-4">
                    {upcomingEvents.length > 0 ? (
                      upcomingEvents.map(event => (
                        <div
                          key={event.id}
                          className={`p-4 bg-white rounded-lg border border-gray-200 transition-all duration-200 cursor-pointer hover:shadow-sm ${
                            isAnyOperationInProgress ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'
                          }`}
                          onClick={() => !isAnyOperationInProgress && setSelectedEvent(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-2 text-sm">{event.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                                <Clock size={14} className="text-gray-500" />
                                <span>{moment(event.start).format('MMM DD, h:mm A')}</span>
                              </div>
                              {event.school && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                  <BookOpen size={14} className="text-gray-400" />
                                  <span>{event.school}</span>
                                </div>
                              )}
                              {event.isSystemGenerated && (
                                <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                                  <Bell size={12} />
                                  <span>System Generated</span>
                                </div>
                              )}
                            </div>
                            <div className="ml-3 flex flex-col items-end gap-2">
                              <span 
                                className="px-2 py-1 rounded-md text-xs font-medium text-white"
                                style={{ backgroundColor: event.color || eventTypes.find(t => t.value === (event.eventType || event.type))?.color }}
                              >
                                {eventTypes.find(t => t.value === (event.eventType || event.type))?.icon}
                              </span>
                              <span className="text-xs text-gray-500">
                                {moment(event.start).fromNow()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CalendarIcon size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-3 text-sm">No upcoming events</p>
                        <button
                          onClick={() => !isAnyOperationInProgress && setShowEventModal(true)}
                          disabled={isAnyOperationInProgress}
                          className="text-[#002147] hover:text-[#001a36] text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Create your first event
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Overdue Events (if any) */}
                {overdueEvents.length > 0 && (
                  <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-6 flex items-center gap-2">
                      <div className="p-2 bg-red-600 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                      Overdue Events ({overdueEvents.length})
                    </h3>
                    <div className="space-y-4">
                      {overdueEvents.map(event => (
                        <div
                          key={event.id}
                          className={`p-4 bg-red-50 rounded-lg border border-red-200 transition-all duration-200 cursor-pointer hover:shadow-sm ${
                            isAnyOperationInProgress ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-300'
                          }`}
                          onClick={() => !isAnyOperationInProgress && setSelectedEvent(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-red-900 mb-2 text-sm">{event.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-red-700 mb-2">
                                <Clock size={14} />
                                <span>{moment(event.start).format('MMM DD, h:mm A')}</span>
                              </div>
                              <div className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded-md font-medium">
                                Overdue by {moment(event.start).fromNow(true)}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteEvent(event.id);
                              }}
                              disabled={isAnyOperationInProgress}
                              className="p-1.5 bg-red-200 hover:bg-red-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isCompleting && operatingEventId === event.id ? (
                                <Loader2 size={16} className="animate-spin text-red-700" />
                              ) : (
                                <CheckCircle size={16} className="text-red-700" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-[#002147] rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button
                onClick={resetForm}
                disabled={isCreating || isUpdating}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={22} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle size={18} className="mr-3" />
                    <span className="font-medium">{saveError}</span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  disabled={isCreating || isUpdating}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002147] focus:border-[#002147] text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter event title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={moment(newEvent.start).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
                    disabled={isCreating || isUpdating}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002147] focus:border-[#002147] text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={moment(newEvent.end).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
                    disabled={isCreating || isUpdating}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002147] focus:border-[#002147] text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={newEvent.eventType}
                    onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                    disabled={isCreating || isUpdating}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002147] focus:border-[#002147] text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })}
                    disabled={isCreating || isUpdating}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002147] focus:border-[#002147] text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newEvent.eventStatus}
                    onChange={(e) => setNewEvent({ ...newEvent, eventStatus: e.target.value })}
                    disabled={isCreating || isUpdating}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002147] focus:border-[#002147] text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School
                  </label>
                  <select
                    value={newEvent.universityId || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, universityId: e.target.value || '' })}
                    disabled={isCreating || isUpdating}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002147] focus:border-[#002147] text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">General/No School</option>
                    {savedUniversities.map(uni => (
                      <option key={uni.id} value={uni.id}>
                        {uni.universityName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  disabled={isCreating || isUpdating}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002147] focus:border-[#002147] text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter location or online meeting link"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  disabled={isCreating || isUpdating}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#002147] focus:border-[#002147] text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  rows={4}
                  placeholder="Add event description"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={resetForm}
                disabled={isCreating || isUpdating}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={!newEvent.title.trim() || isCreating || isUpdating}
                className="px-6 py-2.5 bg-[#002147] text-white rounded-lg hover:bg-[#001a36] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(isCreating || isUpdating) && (
                  <Loader2 size={18} className="animate-spin" />
                )}
                {editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .calendar-container .rbc-calendar {
          font-family: 'system-ui', -apple-system, sans-serif;
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .calendar-container .rbc-header {
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
          color: #495057;
          font-weight: 600;
          padding: 12px 10px;
          text-align: center;
          font-size: 13px;
        }
        
        .calendar-container .rbc-month-view {
          border: 1px solid #e9ecef;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .calendar-container .rbc-date-cell {
          padding: 8px;
          text-align: right;
          font-weight: 500;
          color: #495057;
          font-size: 13px;
        }
        
        .calendar-container .rbc-today {
          background-color: #e7f5ff !important;
        }
        
        .calendar-container .rbc-off-range-bg {
          background: #f8f9fa;
        }
        
        .calendar-container .rbc-event {
          border-radius: 6px !important;
          border: none !important;
          padding: 2px 6px !important;
          margin: 1px 0 !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
        }
        
        .calendar-container .rbc-event:hover {
          transform: scale(1.02) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
        }
        
        .calendar-container .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f1f3f5;
        }
        
        .calendar-container .rbc-time-view .rbc-header {
          border-bottom: 1px solid #e9ecef;
          background: #f8f9fa;
        }
        
        .calendar-container .rbc-time-gutter .rbc-time-slot {
          border-top: 1px solid #f1f3f5;
          color: #6c757d;
          font-size: 12px;
          font-weight: 500;
          padding: 2px 6px;
        }
        
        .calendar-container .rbc-current-time-indicator {
          background: #dc2626;
          height: 2px;
          z-index: 3;
        }
        
        .calendar-container .rbc-day-bg:hover,
        .calendar-container .rbc-month-row .rbc-day-bg:hover {
          background: #f1f3f5;
          transition: all 0.2s ease;
        }
        
        .calendar-container .rbc-slot-selection {
          background: rgba(0, 33, 71, 0.1);
          border: 2px solid #002147;
          border-radius: 6px;
        }
        
        .calendar-container .rbc-month-row {
          border-bottom: 1px solid #e9ecef;
        }
        
        .calendar-container .rbc-date-cell.rbc-now {
          font-weight: 700;
          color: #002147;
        }
        
        .calendar-container .rbc-show-more {
          background: #002147;
          color: white;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: 500;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default SmartCalendar;