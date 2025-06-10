"use client"

import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Plus, Filter, Bell, Clock, MapPin, Edit2, Trash2, X, Users, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const SmartCalendar = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filterSchool, setFilterSchool] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'MIT Application Deadline',
      start: new Date(2025, 5, 15, 23, 59),
      end: new Date(2025, 5, 15, 23, 59),
      type: 'deadline',
      school: 'MIT',
      priority: 'high',
      reminder: 3,
      description: 'Submit final application materials',
      status: 'pending'
    },
    {
      id: 2,
      title: 'Stanford Interview',
      start: new Date(2025, 5, 12, 14, 0),
      end: new Date(2025, 5, 12, 15, 0),
      type: 'interview',
      school: 'Stanford',
      priority: 'high',
      reminder: 1,
      description: 'Virtual interview with admissions committee',
      status: 'scheduled'
    },
    {
      id: 3,
      title: 'Essay Review Session',
      start: new Date(2025, 5, 18, 16, 0),
      end: new Date(2025, 5, 18, 17, 0),
      type: 'task',
      school: 'Harvard',
      priority: 'medium',
      reminder: 2,
      description: 'Review personal statement with counselor',
      status: 'in-progress'
    },
    {
      id: 4,
      title: 'UC Berkeley Deadline',
      start: new Date(2025, 5, 20, 23, 59),
      end: new Date(2025, 5, 20, 23, 59),
      type: 'deadline',
      school: 'UC Berkeley',
      priority: 'high',
      reminder: 7,
      description: 'Submit supplemental essays',
      status: 'pending'
    },
    {
      id: 5,
      title: 'Financial Aid Workshop',
      start: new Date(2025, 5, 25, 10, 0),
      end: new Date(2025, 5, 25, 12, 0),
      type: 'workshop',
      school: 'General',
      priority: 'medium',
      reminder: 2,
      description: 'Learn about financial aid opportunities',
      status: 'registered'
    }
  ]);

  const [newEvent, setNewEvent] = useState({
    title: '',
    start: new Date(),
    end: new Date(),
    type: 'task',
    school: '',
    priority: 'medium',
    reminder: 1,
    description: '',
    status: 'pending'
  });

  const schools = ['MIT', 'Stanford', 'Harvard', 'UC Berkeley', 'Yale', 'Princeton', 'General'];
  const eventTypes = ['deadline', 'interview', 'task', 'workshop', 'meeting'];
  const priorities = ['low', 'medium', 'high'];
  const statuses = ['pending', 'scheduled', 'in-progress', 'completed', 'cancelled'];

  const typeStyles = {
    deadline: {
      backgroundColor: '#ef4444',
      borderColor: '#dc2626',
      color: 'white'
    },
    interview: {
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      color: 'white'
    },
    task: {
      backgroundColor: '#10b981',
      borderColor: '#059669',
      color: 'white'
    },
    workshop: {
      backgroundColor: '#f59e0b',
      borderColor: '#d97706',
      color: 'white'
    },
    meeting: {
      backgroundColor: '#8b5cf6',
      borderColor: '#7c3aed',
      color: 'white'
    }
  };

  const schoolStyles = {
    MIT: { backgroundColor: '#8b5cf6', color: 'white' },
    Stanford: { backgroundColor: '#dc2626', color: 'white' },
    Harvard: { backgroundColor: '#991b1b', color: 'white' },
    'UC Berkeley': { backgroundColor: '#ca8a04', color: 'white' },
    Yale: { backgroundColor: '#1e40af', color: 'white' },
    Princeton: { backgroundColor: '#ea580c', color: 'white' },
    General: { backgroundColor: '#6b7280', color: 'white' }
  };

  const priorityIcons = {
    low: <CheckCircle size={16} className="text-green-500" />,
    medium: <Clock size={16} className="text-yellow-500" />,
    high: <AlertCircle size={16} className="text-red-500" />
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSchool = filterSchool === 'all' || event.school === filterSchool;
      const matchesType = filterType === 'all' || event.type === filterType;
      return matchesSchool && matchesType;
    });
  }, [events, filterSchool, filterType]);

  const eventStyleGetter = useCallback((event) => {
    const baseStyle = typeStyles[event.type] || typeStyles.task;
    return {
      style: {
        ...baseStyle,
        borderRadius: '6px',
        border: 'none',
        fontSize: '12px',
        fontWeight: '500',
        padding: '2px 6px',
        opacity: event.status === 'completed' ? 0.6 : 1,
        textDecoration: event.status === 'completed' ? 'line-through' : 'none'
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }) => {
    setNewEvent({
      ...newEvent,
      start,
      end
    });
    setShowEventModal(true);
  }, [newEvent]);

  const handleSaveEvent = () => {
    if (editingEvent) {
      setEvents(events.map(event => 
        event.id === editingEvent.id ? { ...newEvent, id: editingEvent.id } : event
      ));
      setEditingEvent(null);
    } else {
      setEvents([...events, { ...newEvent, id: Date.now() }]);
    }
    resetForm();
  };

  const handleEditEvent = (event) => {
    setNewEvent(event);
    setEditingEvent(event);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(events.filter(event => event.id !== eventId));
    setSelectedEvent(null);
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      start: new Date(),
      end: new Date(),
      type: 'task',
      school: '',
      priority: 'medium',
      reminder: 1,
      description: '',
      status: 'pending'
    });
    setShowEventModal(false);
    setEditingEvent(null);
  };

  const upcomingEvents = filteredEvents
    .filter(event => event.start >= new Date())
    .sort((a, b) => a.start - b.start)
    .slice(0, 5);

  const CustomToolbar = ({ label, onNavigate, onView }) => (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('PREV')}
          className="px-4 py-2 bg-white border border-[#d9e4f1] rounded-lg hover:bg-[#e6f0fa] transition-colors text-[#002147]"
        >
          Previous
        </button>
        <h2 className="text-xl font-semibold text-[#002147]">{label}</h2>
        <button
          onClick={() => onNavigate('NEXT')}
          className="px-4 py-2 bg-white border border-[#d9e4f1] rounded-lg hover:bg-[#e6f0fa] transition-colors text-[#002147]"
        >
          Next
        </button>
      </div>
      
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterSchool}
          onChange={(e) => setFilterSchool(e.target.value)}
          className="px-3 py-2 bg-white border border-[#d9e4f1] rounded-lg text-sm focus:ring-2 focus:ring-[#3598FE] focus:border-transparent text-[#002147]"
        >
          <option value="all">All Schools</option>
          {schools.map(school => (
            <option key={school} value={school}>{school}</option>
          ))}
        </select>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 bg-white border border-[#d9e4f1] rounded-lg text-sm focus:ring-2 focus:ring-[#3598FE] focus:border-transparent text-[#002147]"
        >
          <option value="all">All Types</option>
          {eventTypes.map(type => (
            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>

        <div className="flex bg-white border border-[#d9e4f1] rounded-lg overflow-hidden">
          {['month', 'week', 'day'].map(viewType => (
            <button
              key={viewType}
              onClick={() => onView(viewType)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                view === viewType 
                  ? 'bg-[#002147] text-white' 
                  : 'text-[#002147] hover:bg-[#e6f0fa]'
              }`}
            >
              {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto  ">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002147] to-[#003a70] rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-medium  text-white font-serif mb-2">
                🎓 Application Calendar
              </h1>
              <p className="text-white/90 font-inter text-base mt-3 font-normal">
                Track deadlines, interviews, and tasks across all your applications
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEventModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#3598FE] text-white font-medium rounded-lg hover:bg-[#2a7ac8] transition-colors duration-200 shadow-lg"
              >
                <Plus size={20} />
                Add Event
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-[#d9e4f1] overflow-hidden">
              <div className="p-6">
                <CustomToolbar 
                  label={moment(date).format('MMMM YYYY')}
                  onNavigate={(action) => {
                    if (action === 'PREV') {
                      setDate(moment(date).subtract(1, view).toDate());
                    } else if (action === 'NEXT') {
                      setDate(moment(date).add(1, view).toDate());
                    }
                  }}
                  onView={(newView) => setView(newView)}
                />
                
                <div style={{ height: '600px' }} className="calendar-container">
                  <Calendar
                    localizer={localizer}
                    events={filteredEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    components={{
                      toolbar: () => null // Hide default toolbar since we have custom one
                    }}
                    formats={{
                      eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                        localizer.format(start, 'h:mm A', culture) + ' - ' + localizer.format(end, 'h:mm A', culture)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Details */}
            {selectedEvent && (
              <div className="bg-white rounded-xl shadow-lg border border-[#d9e4f1] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#002147]">Event Details</h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-1 hover:bg-[#e6f0fa] rounded-lg transition-colors text-[#002147]"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-[#002147] mb-2">{selectedEvent.title}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={schoolStyles[selectedEvent.school]}
                      >
                        {selectedEvent.school}
                      </span>
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={typeStyles[selectedEvent.type]}
                      >
                        {selectedEvent.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#002147] mb-2">
                      <Clock size={16} className="text-[#3598FE]" />
                      <span>{moment(selectedEvent.start).format('MMM DD, YYYY h:mm A')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#002147] mb-3">
                      {priorityIcons[selectedEvent.priority]}
                      <span className="capitalize">{selectedEvent.priority} priority</span>
                    </div>
                    {selectedEvent.description && (
                      <p className="text-sm text-gray-600 mb-4">{selectedEvent.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <Bell size={12} className="text-[#3598FE]" />
                      <span>{selectedEvent.reminder} day{selectedEvent.reminder !== 1 ? 's' : ''} before</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditEvent(selectedEvent)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#e6f0fa] text-[#002147] rounded-lg hover:bg-[#d0e0f5] transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-lg border border-[#d9e4f1] p-6">
              <h3 className="text-lg font-semibold text-[#002147] mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div
                    key={event.id}
                    className="p-4 bg-[#f5f9ff] rounded-lg border border-[#d9e4f1] hover:bg-[#e6f0fa] transition-colors cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-[#002147] mb-1">{event.title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={schoolStyles[event.school]}
                          >
                            {event.school}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#002147]">
                          <Clock size={14} className="text-[#3598FE]" />
                          <span>{moment(event.start).format('MMM DD, h:mm A')}</span>
                        </div>
                      </div>
                      <div className="ml-2">
                        {priorityIcons[event.priority]}
                      </div>
                    </div>
                  </div>
                ))}
                
                {upcomingEvents.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No upcoming events</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#d9e4f1]">
              <h3 className="text-xl font-semibold text-[#002147]">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#002147] mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-3 border border-[#d9e4f1] rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent text-[#002147]"
                  placeholder="Enter event title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#002147] mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={moment(newEvent.start).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
                    className="w-full px-4 py-3 border border-[#d9e4f1] rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent text-[#002147]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#002147] mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={moment(newEvent.end).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
                    className="w-full px-4 py-3 border border-[#d9e4f1] rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent text-[#002147]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#002147] mb-2">
                    Type *
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="w-full px-4 py-3 border border-[#d9e4f1] rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent text-[#002147]"
                  >
                    {eventTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#002147] mb-2">
                    School *
                  </label>
                  <select
                    value={newEvent.school}
                    onChange={(e) => setNewEvent({ ...newEvent, school: e.target.value })}
                    className="w-full px-4 py-3 border border-[#d9e4f1] rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent text-[#002147]"
                  >
                    <option value="">Select School</option>
                    {schools.map(school => (
                      <option key={school} value={school}>{school}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#002147] mb-2">
                    Priority
                  </label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })}
                    className="w-full px-4 py-3 border border-[#d9e4f1] rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent text-[#002147]"
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#002147] mb-2">
                    Status
                  </label>
                  <select
                    value={newEvent.status}
                    onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}
                    className="w-full px-4 py-3 border border-[#d9e4f1] rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent text-[#002147]"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#002147] mb-2">
                    Reminder (days)
                  </label>
                  <select
                    value={newEvent.reminder}
                    onChange={(e) => setNewEvent({ ...newEvent, reminder: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-[#d9e4f1] rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent text-[#002147]"
                  >
                    <option value={1}>1 day</option>
                    <option value={2}>2 days</option>
                    <option value={3}>3 days</option>
                    <option value={7}>1 week</option>
                    <option value={14}>2 weeks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#002147] mb-2">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-3 border border-[#d9e4f1] rounded-lg focus:ring-2 focus:ring-[#3598FE] focus:border-transparent text-[#002147]"
                  rows={4}
                  placeholder="Add event description"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-[#d9e4f1]">
              <button
                onClick={resetForm}
                className="px-6 py-3 text-[#002147] border border-[#d9e4f1] rounded-lg hover:bg-[#e6f0fa] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                className="px-6 py-3 bg-[#3598FE] text-white rounded-lg hover:bg-[#2a7ac8] transition-colors duration-200 font-medium shadow-lg"
                disabled={!newEvent.title || !newEvent.school}
              >
                {editingEvent ? 'Update Event' : 'Save Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-container .rbc-calendar {
          font-family: inherit;
        }
        .rbc-event {
          border-radius: 6px !important;
          border: none !important;
          font-weight: 500 !important;
          font-size: 12px !important;
        }
        .rbc-today {
          background-color: rgba(0, 33, 71, 0.1) !important;
        }
        .rbc-month-view {
          border: 1px solid #d9e4f1 !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .rbc-header {
          background-color: #f5f9ff !important;
          border-bottom: 1px solid #d9e4f1 !important;
          padding: 12px 8px !important;
          font-weight: 600 !important;
          color: #002147 !important;
        }
        .rbc-date-cell {
          padding: 8px !important;
          color: #002147;
        }
        .rbc-off-range-bg {
          background-color: #f5f9ff !important;
        }
        .rbc-off-range .rbc-button-link {
          color: #a0aec0 !important;
        }
        .rbc-day-bg:hover {
          background-color: rgba(0, 33, 71, 0.05) !important;
        }
        .rbc-button-link {
          color: #002147 !important;
        }
      `}</style>
    </div>
  );
};

export default SmartCalendar;