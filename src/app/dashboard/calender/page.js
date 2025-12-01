"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import moment from "moment";
import {
  Plus,
  Filter,
  Bell,
  Clock,
  MapPin,
  Edit2,
  Trash2,
  X,
  BookOpen,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  Star,
  CheckCircle2,
  Sparkles,
  Palette,
  Lock,
} from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { toast } from "sonner";

const localizer = momentLocalizer(moment);

// Loading Skeleton Components
const CalendarSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-5 border-b border-gray-100">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="w-16 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="w-32 h-6 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="w-16 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="w-16 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="w-14 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
    <div className="p-5">
      <div className="h-[650px] bg-gray-50 rounded-lg animate-pulse"></div>
    </div>
  </div>
);

const EventCardSkeleton = () => (
  <div className="p-4 bg-white rounded-lg border border-gray-100 animate-pulse">
    <div className="h-4 bg-gray-100 rounded w-3/4 mb-3"></div>
    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-100 rounded w-1/3"></div>
  </div>
);

const SmartCalendar = () => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const [userEmail, setUserEmail] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [savedUniversities, setSavedUniversities] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [operatingEventId, setOperatingEventId] = useState(null);
  const [isFetchingColor, setIsFetchingColor] = useState(false);
  const [colorSource, setColorSource] = useState(null);
  const [colorFetchFailed, setColorFetchFailed] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    start: new Date(),
    end: new Date(new Date().getTime() + 60 * 60 * 1000),
    eventType: "task",
    universityId: "",
    priority: "medium",
    description: "",
    eventStatus: "pending",
    location: "",
    color: "#059669",
  });

  // ========================================
  // CALENDAR CONFIGURATION
  // ========================================
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      setUserEmail(session.user.email);
    } else if (status === "unauthenticated") {
      setUserEmail("");
    }
  }, [session, status]);

  const eventTypes = [
    { value: "deadline", label: "Deadline", icon: "⏰" },
    { value: "interview", label: "Interview", icon: "👥" },
    { value: "task", label: "Task", icon: "✅" },
    { value: "workshop", label: "Workshop", icon: "🎓" },
    { value: "meeting", label: "Meeting", icon: "📅" },
  ];

  const priorities = [
    { value: "low", label: "Low", color: "#059669" },
    { value: "medium", label: "Medium", color: "#d97706" },
    { value: "high", label: "High", color: "#dc2626" },
  ];

  const statuses = [
    { value: "pending", label: "Pending" },
    { value: "scheduled", label: "Scheduled" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // ========================================
  // API FUNCTIONS
  // ========================================

  const fetchSchoolColorFromAI = async (universityId) => {
    if (!universityId) {
      setColorFetchFailed(false);
      return null;
    }

    setIsFetchingColor(true);
    setColorSource(null);
    setColorFetchFailed(false);

    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "fetch_school_color",
          universityId: universityId,
          userEmail: userEmail,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch school color");
      }

      const result = await response.json();

      if (result.success && result.color) {
        // Check if this is a fallback/default color
        const isFallback =
          result.source === "fallback" ||
          result.source === "default" ||
          result.color === "#059669"; // Your default color

        if (isFallback) {
          setColorFetchFailed(true);
          setColorSource("fallback");
          return result.color;
        }

        setColorSource(result.source); // 'ai' or 'database'
        setColorFetchFailed(false);
        return result.color;
      }

      // No color returned
      setColorFetchFailed(true);
      setColorSource("fallback");
      return null;
    } catch (error) {
      console.error("Error fetching school color:", error);
      setColorFetchFailed(true);
      setColorSource("error");
      return null;
    } finally {
      setIsFetchingColor(false);
    }
  };

  const handleUniversityChange = async (universityId) => {
    setNewEvent((prev) => ({ ...prev, universityId: universityId || "" }));

    if (universityId) {
      const color = await fetchSchoolColorFromAI(universityId);
      const uni = savedUniversities.find((u) => u.id === universityId);

      if (color) {
        setNewEvent((prev) => ({ ...prev, color: color }));

        // Check colorFetchFailed after the fetch completes
        // We need to use the state that was set in fetchSchoolColorFromAI
        setTimeout(() => {
          // Small delay to ensure state is updated
        }, 0);

        if (
          colorSource === "ai" ||
          colorSource === "database" ||
          !colorFetchFailed
        ) {
          toast.success(
            `School color applied for ${uni?.universityName || "university"}`,
            {
              icon: <Sparkles className="w-4 h-4 text-amber-500" />,
            }
          );
        } else {
          toast.info(`Using default color. You can customize it manually.`, {
            icon: <Palette className="w-4 h-4 text-gray-500" />,
          });
        }
      } else {
        // AI completely failed, use default
        setNewEvent((prev) => ({ ...prev, color: "#059669" }));
        toast.warning("Couldn't fetch school color. Please select manually.", {
          icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
        });
      }
    } else {
      setNewEvent((prev) => ({ ...prev, color: "#059669" }));
      setColorSource(null);
      setColorFetchFailed(false);
    }
  };

  const fetchSavedUniversities = useCallback(async () => {
    try {
      if (status !== "authenticated" || !session?.token) {
        setSavedUniversities([]);
        return;
      }

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      const response = await fetch(`${API_BASE_URL}/api/university/saved`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (!result.universities || !Array.isArray(result.universities)) {
        setSavedUniversities([]);
        return;
      }

      const transformedSavedUnis = result.universities.map((uni) => ({
        id: uni.id,
        universityName: uni.universityName || uni.name,
      }));

      setSavedUniversities(transformedSavedUnis);
    } catch (err) {
      console.error("Error fetching saved universities:", err);
      setSavedUniversities([]);
    }
  }, [session, status]);

  const buildApiUrl = useCallback(
    (params = {}) => {
      const searchParams = new URLSearchParams();

      if (userEmail) {
        searchParams.append("userEmail", userEmail);
      }

      Object.keys(params).forEach((key) => {
        if (
          params[key] !== undefined &&
          params[key] !== null &&
          params[key] !== "all"
        ) {
          searchParams.append(key, params[key]);
        }
      });

      const queryString = searchParams.toString();
      return `/api/calendar${queryString ? `?${queryString}` : ""}`;
    },
    [userEmail]
  );

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        ...(filterSchool !== "all" &&
          filterSchool !== "general" && { universityId: filterSchool }),
        ...(filterType !== "all" && { eventType: filterType }),
        includeSystemEvents: true,
      };

      const url = buildApiUrl(params);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch events");
      }

      const transformedEvents = result.data.map((event) => ({
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
        color: event.schoolColor || event.color || "#059669",
        isSystemGenerated: event.isSystemGenerated,
        hasReminders: event.hasReminders,
        reminders: event.reminders || [],
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        completedAt: event.completedAt,
      }));

      setEvents(transformedEvents);
    } catch (err) {
      setError(`Failed to fetch events: ${err.message}`);
      console.error("Error fetching events:", err);
      toast.error("Failed to fetch events");
    } finally {
      setIsLoading(false);
    }
  }, [buildApiUrl, filterSchool, filterType, userEmail]);

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
        timezone: "UTC",
        isAllDay: false,
        schoolColor: eventData.color || "#059669",
        userEmail: userEmail,
      };

      if (editingEvent) {
        const response = await fetch("/api/calendar", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: editingEvent.id, ...apiData }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update event");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to update event");
        }
      } else {
        const response = await fetch("/api/calendar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create event");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to create event");
        }
      }

      return { success: true };
    } catch (err) {
      throw new Error(err.message || "Failed to save event");
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      const url = `/api/calendar?id=${eventId}${
        userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ""
      }`;
      const response = await fetch(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete event");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to delete event");
      }

      return { success: true };
    } catch (err) {
      throw new Error(err.message || "Failed to delete event");
    }
  };

  const completeEvent = async (eventId) => {
    try {
      const response = await fetch("/api/calendar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: eventId,
          completionStatus: "completed",
          eventStatus: "completed",
          userEmail: userEmail,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete event");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to complete event");
      }

      return { success: true };
    } catch (err) {
      throw new Error(err.message || "Failed to complete event");
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchSavedUniversities();
    }
  }, [fetchSavedUniversities, userEmail]);

  useEffect(() => {
    if (userEmail) {
      fetchEvents();
    }
  }, [fetchEvents, userEmail]);

  // ========================================
  // EVENT HANDLERS
  // ========================================

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }) => {
    const endTime = new Date(start.getTime() + 60 * 60 * 1000);
    setNewEvent((prev) => ({
      ...prev,
      start,
      end: endTime,
    }));
    setShowEventModal(true);
  }, []);

  const handleSaveEvent = async () => {
    setSaveError(null);

    if (!newEvent.title.trim()) {
      setSaveError("Title is required");
      toast.error("Title is required");
      return;
    }

    if (newEvent.start >= newEvent.end) {
      setSaveError("End time must be after start time");
      toast.error("End time must be after start time");
      return;
    }

    const eventData = {
      title: newEvent.title.trim(),
      start: newEvent.start,
      end: newEvent.end,
      eventType: newEvent.eventType,
      eventStatus: newEvent.eventStatus,
      priority: newEvent.priority,
      description: newEvent.description.trim(),
      location: newEvent.location.trim(),
      universityId: newEvent.universityId || null,
      color: newEvent.color || "#059669",
    };

    if (editingEvent) {
      setOperatingEventId(editingEvent.id);
    } else {
      setOperatingEventId("new");
    }

    try {
      await saveEvent(eventData);
      await fetchEvents();
      resetForm();

      if (editingEvent) {
        toast.success("Event updated successfully", {
          className: "bg-blue-50 border-blue-200",
        });
      } else {
        toast.success("Event created successfully", {
          className: "bg-green-50 border-green-200",
        });
      }
    } catch (err) {
      setSaveError(err.message);
      toast.error(err.message || "Failed to save event");
    } finally {
      setOperatingEventId(null);
    }
  };

  const handleEditEvent = (event) => {
    setNewEvent({
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      eventType: event.eventType || event.type,
      universityId: event.universityId || "",
      description: event.description || "",
      eventStatus: event.eventStatus || event.status,
      priority: event.priority,
      location: event.location || "",
      color: event.color || "#059669",
    });
    setEditingEvent(event);
    setSelectedEvent(null);
    setShowEventModal(true);
    // Set color source based on whether there's a university
    if (event.universityId) {
      setColorSource("database");
      setColorFetchFailed(false);
    } else {
      setColorSource(null);
      setColorFetchFailed(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    setOperatingEventId(eventId);
    setSelectedEvent(null);

    try {
      await deleteEvent(eventId);
      await fetchEvents();

      toast.success("Event deleted successfully", {
        className: "bg-red-50 border-red-200",
      });
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to delete event");
    } finally {
      setOperatingEventId(null);
    }
  };

  const handleCompleteEvent = async (eventId) => {
    setOperatingEventId(eventId);
    setSelectedEvent(null);

    try {
      await completeEvent(eventId);
      await fetchEvents();

      toast.success("Event marked as completed! 🎉", {
        className: "bg-green-50 border-green-200",
      });
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to complete event");
    } finally {
      setOperatingEventId(null);
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: "",
      start: new Date(),
      end: new Date(new Date().getTime() + 60 * 60 * 1000),
      eventType: "task",
      universityId: "",
      priority: "medium",
      description: "",
      eventStatus: "pending",
      location: "",
      color: "#059669",
    });
    setShowEventModal(false);
    setEditingEvent(null);
    setSaveError(null);
    setColorSource(null);
    setColorFetchFailed(false);
  };

  // ========================================
  // UI HELPERS AND COMPUTED DATA
  // ========================================

  const getEventStyle = useCallback((event) => {
    const isCompleted =
      event.completionStatus === "completed" ||
      event.status === "completed" ||
      event.eventStatus === "completed";

    const eventColor = event.color || "#059669";

    return {
      style: {
        backgroundColor: isCompleted ? "#22c55e" : eventColor,
        borderColor: isCompleted ? "#16a34a" : eventColor,
        color: "white",
        borderRadius: "4px",
        border: "none",
        fontSize: "11px",
        fontWeight: isCompleted ? "500" : "400",
        padding: "2px 5px",
        opacity: isCompleted ? 0.85 : 1,
        textDecoration: isCompleted ? "line-through" : "none",
        position: "relative",
      },
    };
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSchool =
        filterSchool === "all" ||
        event.universityId === filterSchool ||
        (filterSchool === "general" &&
          (!event.universityId || event.universityId === ""));
      const matchesType =
        filterType === "all" ||
        event.eventType === filterType ||
        event.type === filterType;
      const matchesStatus =
        filterStatus === "all" ||
        event.eventStatus === filterStatus ||
        event.status === filterStatus ||
        event.completionStatus === filterStatus;
      return matchesSchool && matchesType && matchesStatus;
    });
  }, [events, filterSchool, filterType, filterStatus]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter((event) => new Date(event.start) >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 5);
  }, [filteredEvents]);

  const overdueEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents.filter(
      (event) =>
        new Date(event.start) < now &&
        event.completionStatus !== "completed" &&
        event.status !== "completed" &&
        event.eventStatus !== "completed" &&
        ["deadline", "task"].includes(event.eventType || event.type)
    );
  }, [filteredEvents]);

  const eventStats = useMemo(() => {
    const total = events.length;
    const completed = events.filter(
      (e) =>
        e.completionStatus === "completed" ||
        e.status === "completed" ||
        e.eventStatus === "completed"
    ).length;
    const pending = events.filter(
      (e) => e.status === "pending" || e.eventStatus === "pending"
    ).length;
    const overdue = overdueEvents.length;

    return { total, completed, pending, overdue };
  }, [events, overdueEvents]);

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
    if (view === "month") {
      newDate.setMonth(date.getMonth() - 1);
    } else if (view === "week") {
      newDate.setDate(date.getDate() - 7);
    } else if (view === "day") {
      newDate.setDate(date.getDate() - 1);
    }
    setDate(newDate);
  };

  const goToNext = () => {
    let newDate = new Date(date);
    if (view === "month") {
      newDate.setMonth(date.getMonth() + 1);
    } else if (view === "week") {
      newDate.setDate(date.getDate() + 7);
    } else if (view === "day") {
      newDate.setDate(date.getDate() + 1);
    }
    setDate(newDate);
  };

  const formatDateTitle = () => {
    if (view === "month") {
      return moment(date).format("MMMM YYYY");
    } else if (view === "week") {
      const start = moment(date).startOf("week");
      const end = moment(date).endOf("week");
      return `${start.format("MMM D")} - ${end.format("MMM D, YYYY")}`;
    } else {
      return moment(date).format("MMMM D, YYYY");
    }
  };

  const isEventCompleted = (event) => {
    return (
      event.completionStatus === "completed" ||
      event.status === "completed" ||
      event.eventStatus === "completed"
    );
  };

  const getEventTypeIcon = (eventType) => {
    const type = eventTypes.find((t) => t.value === eventType);
    return type?.icon || "📅";
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case "high":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          dot: "bg-red-500",
        };
      case "medium":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          dot: "bg-amber-500",
        };
      default:
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          dot: "bg-emerald-500",
        };
    }
  };

  // Check if color picker should be locked
  const isColorPickerLocked = useMemo(() => {
    return (
      newEvent.universityId &&
      !colorFetchFailed &&
      (colorSource === "ai" || colorSource === "database")
    );
  }, [newEvent.universityId, colorFetchFailed, colorSource]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-1.5 bg-[#002147] rounded-lg">
                  <CalendarIcon className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl text-[#002147]">Application Calendar</h1>
              </div>
              <p className="text-sm text-gray-500 mb-4 -ml-1">
                Track deadlines, interviews, and tasks across all your
                applications
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-gray-50 px-2.5 py-1 rounded-md text-xs">
                  <span className="text-gray-900">{eventStats.total}</span>
                  <span className="text-gray-500 ml-1">Total</span>
                </div>
                <div className="bg-green-50 px-2.5 py-1 rounded-md text-xs">
                  <span className="text-green-700">{eventStats.completed}</span>
                  <span className="text-green-600 ml-1">Completed</span>
                </div>
                <div className="bg-amber-50 px-2.5 py-1 rounded-md text-xs">
                  <span className="text-amber-700">{eventStats.pending}</span>
                  <span className="text-amber-600 ml-1">Pending</span>
                </div>
                {eventStats.overdue > 0 && (
                  <div className="bg-red-50 px-2.5 py-1 rounded-md text-xs">
                    <span className="text-red-700">{eventStats.overdue}</span>
                    <span className="text-red-600 ml-1">Overdue</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-all ${
                  showFilters
                    ? "bg-[#002147] border-[#002147] text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <Filter size={16} />
                Filters
              </button>
              <button
                onClick={() => setShowEventModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#002147] text-white rounded-lg hover:bg-[#001a36] transition-colors"
              >
                <Plus size={16} />
                Add Event
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
            <div className="flex items-center">
              <AlertCircle size={16} className="mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">
                  Filter by School
                </label>
                <select
                  value={filterSchool}
                  onChange={(e) => setFilterSchool(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#002147] focus:border-[#002147] transition-all"
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
                <label className="block text-xs text-gray-600 mb-1.5">
                  Filter by Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#002147] focus:border-[#002147] transition-all"
                >
                  <option value="all">All Types</option>
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1.5">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#002147] focus:border-[#002147] transition-all"
                >
                  <option value="all">All Status</option>
                  {statuses.map((status) => (
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Calendar */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <CalendarSkeleton />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Custom Calendar Toolbar */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={goToPrevious}
                        className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <ChevronLeft size={18} className="text-gray-600" />
                      </button>
                      <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-xs bg-[#002147] text-white rounded-lg hover:bg-[#001a36] transition-colors"
                      >
                        Today
                      </button>
                      <button
                        onClick={goToNext}
                        className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <ChevronRight size={18} className="text-gray-600" />
                      </button>
                      <h2 className="text-base text-gray-800 ml-1">
                        {formatDateTitle()}
                      </h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleViewChange("month")}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          view === "month"
                            ? "bg-[#002147] text-white"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                        }`}
                      >
                        Month
                      </button>
                      <button
                        onClick={() => handleViewChange("week")}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          view === "week"
                            ? "bg-[#002147] text-white"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                        }`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => handleViewChange("day")}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          view === "day"
                            ? "bg-[#002147] text-white"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                        }`}
                      >
                        Day
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div
                    style={{ height: "650px" }}
                    className="calendar-container"
                  >
                    <Calendar
                      localizer={localizer}
                      events={filteredEvents}
                      startAccessor="start"
                      endAccessor="end"
                      style={{ height: "100%" }}
                      eventPropGetter={getEventStyle}
                      onSelectEvent={handleSelectEvent}
                      onSelectSlot={handleSelectSlot}
                      selectable
                      view={view}
                      onView={handleViewChange}
                      date={date}
                      onNavigate={handleNavigate}
                      toolbar={false}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <EventCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Selected Event Details */}
                {selectedEvent && (
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Card Header with Color Strip */}
                    <div
                      className="h-2 w-full"
                      style={{
                        backgroundColor: isEventCompleted(selectedEvent)
                          ? "#22c55e"
                          : selectedEvent.color || "#059669",
                      }}
                    />

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                            style={{
                              backgroundColor: `${
                                isEventCompleted(selectedEvent)
                                  ? "#22c55e"
                                  : selectedEvent.color || "#059669"
                              }15`,
                            }}
                          >
                            {getEventTypeIcon(
                              selectedEvent.eventType || selectedEvent.type
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Event Details
                            </span>
                            {isEventCompleted(selectedEvent) && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <CheckCircle2
                                  size={12}
                                  className="text-green-600"
                                />
                                <span className="text-xs text-green-600 font-medium">
                                  Completed
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedEvent(null)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Event Title */}
                      <h4
                        className={`text-base font-semibold text-gray-900 mb-3 leading-snug ${
                          isEventCompleted(selectedEvent)
                            ? "line-through opacity-70"
                            : ""
                        }`}
                      >
                        {selectedEvent.title}
                      </h4>

                      {/* Tags Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                          style={{
                            backgroundColor: isEventCompleted(selectedEvent)
                              ? "#22c55e"
                              : selectedEvent.color || "#059669",
                          }}
                        >
                          {getEventTypeIcon(
                            selectedEvent.eventType || selectedEvent.type
                          )}
                          <span className="capitalize">
                            {selectedEvent.eventType || selectedEvent.type}
                          </span>
                        </span>

                        {(() => {
                          const config = getPriorityConfig(
                            selectedEvent.priority
                          );
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                              ></span>
                              <span className="capitalize">
                                {selectedEvent.priority}
                              </span>
                            </span>
                          );
                        })()}
                      </div>

                      {/* Info Cards */}
                      <div className="space-y-2.5 mb-4">
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-gray-100">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Clock size={14} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Date & Time</p>
                            <p className="text-sm font-medium text-gray-900">
                              {moment(selectedEvent.start).format(
                                "MMM DD, YYYY • h:mm A"
                              )}
                            </p>
                          </div>
                        </div>

                        {selectedEvent.location && (
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-gray-100">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                              <MapPin size={14} className="text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Location</p>
                              <p className="text-sm font-medium text-gray-900">
                                {selectedEvent.location}
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedEvent.school && (
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-gray-100">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                              <BookOpen size={14} className="text-amber-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">School</p>
                              <p className="text-sm font-medium text-gray-900">
                                {selectedEvent.school}
                              </p>
                            </div>
                          </div>
                        )}

                        {isEventCompleted(selectedEvent) &&
                          selectedEvent.completedAt && (
                            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-transparent rounded-lg border border-green-100">
                              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                <CheckCircle2
                                  size={14}
                                  className="text-green-600"
                                />
                              </div>
                              <div>
                                <p className="text-xs text-green-600">
                                  Completed on
                                </p>
                                <p className="text-sm font-medium text-green-700">
                                  {moment(selectedEvent.completedAt).format(
                                    "MMM DD, YYYY • h:mm A"
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Time Ago Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-gray-400">
                          {moment(selectedEvent.start).fromNow()}
                        </span>
                        {selectedEvent.isSystemGenerated && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-600 border border-purple-100">
                            <Sparkles size={10} />
                            Auto-generated
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {selectedEvent.description && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">
                            Description
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {selectedEvent.description}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-3 border-t border-gray-100">
                        {!isEventCompleted(selectedEvent) && (
                          <button
                            onClick={() =>
                              handleCompleteEvent(selectedEvent.id)
                            }
                            disabled={operatingEventId === selectedEvent.id}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm disabled:opacity-50"
                          >
                            {operatingEventId === selectedEvent.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            Mark as Complete
                          </button>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditEvent(selectedEvent)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-[#002147] text-white rounded-lg hover:bg-[#001a36] transition-colors"
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteEvent(selectedEvent.id)
                            }
                            disabled={
                              selectedEvent.isSystemGenerated ||
                              operatingEventId === selectedEvent.id
                            }
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {operatingEventId === selectedEvent.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming Events */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <div className="p-1.5 bg-[#002147] rounded-lg">
                        <CalendarIcon className="w-3.5 h-3.5 text-white" />
                      </div>
                      Upcoming Events
                      {upcomingEvents.length > 0 && (
                        <span className="ml-auto text-xs font-normal text-gray-400">
                          {upcomingEvents.length} events
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="p-3 space-y-2">
                    {upcomingEvents.length > 0 ? (
                      upcomingEvents.map((event) => {
                        const priorityConfig = getPriorityConfig(
                          event.priority
                        );
                        return (
                          <div
                            key={event.id}
                            className="group relative p-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md border border-transparent hover:border-gray-200"
                            style={{
                              backgroundColor: `${
                                isEventCompleted(event)
                                  ? "#22c55e"
                                  : event.color || "#059669"
                              }08`,
                            }}
                            onClick={() => setSelectedEvent(event)}
                          >
                            {/* Color indicator */}
                            <div
                              className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                              style={{
                                backgroundColor: isEventCompleted(event)
                                  ? "#22c55e"
                                  : event.color || "#059669",
                              }}
                            />

                            <div className="pl-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base">
                                      {getEventTypeIcon(
                                        event.eventType || event.type
                                      )}
                                    </span>
                                    <h4
                                      className={`text-sm font-medium text-gray-900 truncate ${
                                        isEventCompleted(event)
                                          ? "line-through opacity-70"
                                          : ""
                                      }`}
                                    >
                                      {event.title}
                                    </h4>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                    <Clock size={12} />
                                    <span>
                                      {moment(event.start).format(
                                        "MMM DD • h:mm A"
                                      )}
                                    </span>
                                  </div>

                                  {event.school && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                      <BookOpen size={11} />
                                      <span className="truncate">
                                        {event.school}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col items-end gap-1.5">
                                  {isEventCompleted(event) ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                                      <CheckCircle2 size={10} />
                                      Done
                                    </span>
                                  ) : (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${priorityConfig.bg} ${priorityConfig.text}`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`}
                                      ></span>
                                      {event.priority}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    {moment(event.start).fromNow()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <CalendarIcon size={24} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 mb-1">
                          No upcoming events
                        </p>
                        <button
                          onClick={() => setShowEventModal(true)}
                          className="text-[#002147] hover:text-[#001a36] text-sm font-medium"
                        >
                          Create your first event →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Overdue Events */}
                {overdueEvents.length > 0 && (
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-sm border border-red-100 overflow-hidden">
                    <div className="p-4 border-b border-red-100 bg-gradient-to-r from-red-50 to-transparent">
                      <h3 className="text-sm font-semibold text-red-900 flex items-center gap-2">
                        <div className="p-1.5 bg-red-500 rounded-lg">
                          <AlertCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                        Overdue
                        <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          {overdueEvents.length}
                        </span>
                      </h3>
                    </div>
                    <div className="p-3 space-y-2">
                      {overdueEvents.map((event) => (
                        <div
                          key={event.id}
                          className="group relative p-3 bg-white/70 backdrop-blur-sm rounded-xl cursor-pointer transition-all duration-200 hover:bg-white hover:shadow-md border border-red-100"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-red-500" />

                          <div className="pl-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-base">
                                    {getEventTypeIcon(
                                      event.eventType || event.type
                                    )}
                                  </span>
                                  <h4 className="text-sm font-medium text-red-900 truncate">
                                    {event.title}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-red-600 mb-1.5">
                                  <Clock size={12} />
                                  <span>
                                    {moment(event.start).format(
                                      "MMM DD • h:mm A"
                                    )}
                                  </span>
                                </div>

                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">
                                  <AlertCircle size={10} />
                                  Overdue by{" "}
                                  {moment(event.start).fromNow(true)}
                                </span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteEvent(event.id);
                                }}
                                disabled={operatingEventId === event.id}
                                className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {operatingEventId === event.id ? (
                                  <Loader2
                                    size={16}
                                    className="animate-spin text-red-700"
                                  />
                                ) : (
                                  <CheckCircle
                                    size={16}
                                    className="text-red-700"
                                  />
                                )}
                              </button>
                            </div>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1.5 bg-[#002147] rounded-lg">
                  <CalendarIcon className="w-4 h-4 text-white" />
                </div>
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h3>
              <button
                onClick={resetForm}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {saveError && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg text-xs">
                  <div className="flex items-center">
                    <AlertCircle size={14} className="mr-2" />
                    <span>{saveError}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147] transition-all"
                  placeholder="Enter event title"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={moment(newEvent.start).format("YYYY-MM-DDTHH:mm")}
                    min={moment().format("YYYY-MM-DDTHH:mm")}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        start: new Date(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={moment(newEvent.end).format("YYYY-MM-DDTHH:mm")}
                    min={moment(newEvent.start).format("YYYY-MM-DDTHH:mm")}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        end: new Date(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Type *
                  </label>
                  <select
                    value={newEvent.eventType}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, eventType: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147] transition-all"
                  >
                    {eventTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, priority: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147] transition-all"
                  >
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* School Selection with AI Color */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  School
                </label>
                <select
                  value={newEvent.universityId || ""}
                  onChange={(e) => handleUniversityChange(e.target.value)}
                  disabled={isFetchingColor}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147] transition-all disabled:opacity-50 disabled:cursor-wait"
                >
                  <option value="">General/No School</option>
                  {savedUniversities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.universityName}
                    </option>
                  ))}
                </select>
              </div>

              {/* School Color Section - Enhanced */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Palette size={14} className="text-gray-500" />
                    School Color
                    {isFetchingColor && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
                        <Loader2 size={12} className="animate-spin" />
                        Fetching school color...
                      </span>
                    )}
                  </div>
                </label>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  {/* Color Preview */}
                  <div
                    className="w-12 h-12 rounded-xl shadow-inner border-2 border-white ring-1 ring-gray-200 transition-all duration-300"
                    style={{ backgroundColor: newEvent.color || "#059669" }}
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {newEvent.color || "#059669"}
                      </span>
                      {colorSource && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                            colorSource === "ai"
                              ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200"
                              : colorSource === "database"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : colorSource === "custom"
                              ? "bg-orange-50 text-orange-700 border border-orange-200"
                              : colorSource === "error" ||
                                colorSource === "fallback"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {colorSource === "ai" && (
                            <Sparkles size={10} className="text-purple-500" />
                          )}
                          {colorSource === "custom" && <Palette size={10} />}
                          {(colorSource === "error" ||
                            colorSource === "fallback") && (
                            <AlertCircle size={10} />
                          )}
                          {colorSource === "ai"
                            ? "AI Generated"
                            : colorSource === "database"
                            ? "Saved"
                            : colorSource === "custom"
                            ? "Custom"
                            : colorSource === "error"
                            ? "Manual Required"
                            : colorSource === "fallback"
                            ? "Default"
                            : "Default"}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      {!newEvent.universityId
                        ? "Select a school to auto-fetch brand color"
                        : colorFetchFailed
                        ? "AI couldn't find school color. Please customize manually."
                        : colorSource === "ai" || colorSource === "database"
                        ? "Color locked to school branding"
                        : "Color automatically fetched based on school branding"}
                    </p>

                    {/* Warning when AI fails */}
                    {newEvent.universityId && colorFetchFailed && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={10} />
                        Manual color selection enabled
                      </p>
                    )}
                  </div>

                  {/* Manual Color Picker - Conditionally Enabled */}
                  <div className="relative group">
                    <input
                      type="color"
                      value={newEvent.color || "#059669"}
                      onChange={(e) => {
                        if (!isColorPickerLocked) {
                          setNewEvent({ ...newEvent, color: e.target.value });
                          setColorSource("custom");
                        }
                      }}
                      disabled={isColorPickerLocked || isFetchingColor}
                      className="w-10 h-10 rounded-lg cursor-pointer disabled:cursor-not-allowed"
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        zIndex: isColorPickerLocked ? -1 : 10,
                      }}
                      title={
                        isColorPickerLocked
                          ? "Color locked to school branding"
                          : "Choose custom color"
                      }
                    />
                    <div
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                        isColorPickerLocked
                          ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                          : "bg-white border-gray-200 group-hover:border-gray-300 cursor-pointer"
                      }`}
                    >
                      {isColorPickerLocked ? (
                        <div className="relative">
                          <Sparkles size={16} className="text-purple-400" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 size={8} className="text-white" />
                          </div>
                        </div>
                      ) : isFetchingColor ? (
                        <Loader2
                          size={16}
                          className="text-gray-400 animate-spin"
                        />
                      ) : (
                        <Palette size={16} className="text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={newEvent.eventStatus}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, eventStatus: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147] transition-all"
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, location: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147] transition-all"
                    placeholder="Enter location or link"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147] transition-all resize-none"
                  rows={3}
                  placeholder="Add event description"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-gray-100 sticky bottom-0 bg-white">
              <button
                onClick={resetForm}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={
                  !newEvent.title.trim() || operatingEventId || isFetchingColor
                }
                className="px-5 py-2.5 text-sm font-medium bg-[#002147] text-white rounded-lg hover:bg-[#001a36] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {operatingEventId && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {editingEvent ? "Update Event" : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.25s ease-out;
        }

        .calendar-container .rbc-calendar {
          font-family: system-ui, -apple-system, sans-serif;
          background: white;
        }

        .calendar-container .rbc-header {
          background: #fafafa;
          border-bottom: 1px solid #f0f0f0;
          color: #374151;
          font-weight: 500;
          padding: 10px 8px;
          text-align: center;
          font-size: 12px;
        }

        .calendar-container .rbc-month-view {
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          overflow: hidden;
        }

        .calendar-container .rbc-date-cell {
          padding: 6px;
          text-align: right;
          font-weight: 400;
          color: #6b7280;
          font-size: 12px;
        }

        .calendar-container .rbc-today {
          background-color: #f0f9ff !important;
        }

        .calendar-container .rbc-off-range-bg {
          background: #fafafa;
        }

        .calendar-container .rbc-event {
          border-radius: 4px !important;
          border: none !important;
          padding: 2px 5px !important;
          margin: 1px 0 !important;
          font-size: 11px !important;
          font-weight: 400 !important;
          transition: transform 0.15s ease, opacity 0.15s ease !important;
        }

        .calendar-container .rbc-event:hover {
          transform: translateY(-1px) !important;
        }

        .calendar-container .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f5f5f5;
        }

        .calendar-container .rbc-time-view .rbc-header {
          border-bottom: 1px solid #f0f0f0;
          background: #fafafa;
        }

        .calendar-container .rbc-time-gutter .rbc-time-slot {
          border-top: 1px solid #f5f5f5;
          color: #9ca3af;
          font-size: 11px;
          font-weight: 400;
          padding: 2px 6px;
        }

        .calendar-container .rbc-current-time-indicator {
          background: #dc2626;
          height: 1.5px;
        }

        .calendar-container .rbc-day-bg:hover {
          background: #fafafa;
          transition: background 0.15s ease;
        }

        .calendar-container .rbc-slot-selection {
          background: rgba(0, 33, 71, 0.08);
          border: 1px solid #002147;
          border-radius: 4px;
        }

        .calendar-container .rbc-month-row {
          border-bottom: 1px solid #f0f0f0;
        }

        .calendar-container .rbc-date-cell.rbc-now {
          font-weight: 600;
          color: #002147;
        }

        .calendar-container .rbc-show-more {
          background: #002147;
          color: white;
          border-radius: 3px;
          padding: 2px 5px;
          font-size: 10px;
          font-weight: 400;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default SmartCalendar;