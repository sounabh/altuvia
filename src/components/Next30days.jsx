'use client';

import React, { useMemo, memo } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, MapPin, ChevronRight } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNext30DaysEvents(universities) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const events = [];

  universities.forEach((uni) => {
    // Calendar events attached to each university
    const calEvents = uni.calendarEvents || uni.events || [];
    calEvents.forEach((ev) => {
      const start = new Date(ev.startDate || ev.start);
      if (start >= now && start <= cutoff) {
        events.push({
          id: ev.id,
          title: ev.title,
          start,
          isAllDay: ev.isAllDay || false,
          location: ev.location || ev.interviewLocation || null,
          school: uni.universityName || uni.school || 'General',
          program: ev.program || uni.primaryProgram || null,
          eventType: ev.eventType || ev.type || 'task',
          color: ev.color || uni.schoolColor || '#6b7280',
        });
      }
    });

    // Admission deadlines
    const admissions = uni.admissions || [];
    admissions.forEach((adm) => {
      (adm.deadlines || []).forEach((dl) => {
        const date = new Date(dl.deadlineDate);
        if (date >= now && date <= cutoff) {
          events.push({
            id: `dl-${dl.id}`,
            title: dl.title || `${dl.deadlineType} deadline`,
            start: date,
            isAllDay: false,
            location: null,
            school: uni.universityName || uni.school || 'General',
            program: null,
            eventType: 'deadline',
            color: uni.schoolColor || '#6b7280',
          });
        }
      });
    });
  });

  return events.sort((a, b) => a.start - b.start);
}

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatTime(date, isAllDay) {
  if (isAllDay) return 'All day';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const TYPE_COLORS = {
  deadline:  { bg: 'bg-red-50',    text: 'text-red-600',    dot: '#ef4444' },
  interview: { bg: 'bg-purple-50', text: 'text-purple-600', dot: '#7c3aed' },
  task:      { bg: 'bg-blue-50',   text: 'text-blue-600',   dot: '#3598FE' },
  meeting:   { bg: 'bg-amber-50',  text: 'text-amber-600',  dot: '#f59e0b' },
  default:   { bg: 'bg-gray-50',   text: 'text-gray-500',   dot: '#6b7280' },
};

function typeStyle(eventType) {
  return TYPE_COLORS[eventType] || TYPE_COLORS.default;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const DateBadge = memo(({ date, color }) => (
  <div
    className="flex flex-col items-center justify-center rounded-xl min-w-[52px] h-[56px] px-2 select-none"
    style={{ background: `${color}18` }}
  >
    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
      {MONTH_ABBR[date.getMonth()]}
    </span>
    <span className="text-xl font-bold leading-none" style={{ color }}>
      {date.getDate()}
    </span>
  </div>
));
DateBadge.displayName = 'DateBadge';

const EventCard = memo(({ event }) => {
  const style = typeStyle(event.eventType);
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-[#3598FE]/40 hover:shadow-sm transition-all duration-200 min-w-[220px] flex-shrink-0 lg:min-w-0 lg:flex-shrink">
      <DateBadge date={event.start} color={event.color} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#002147] truncate leading-snug">{event.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3 flex-shrink-0" />
            {formatTime(event.start, event.isAllDay)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-gray-400 truncate max-w-[120px]">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {event.location}
            </span>
          )}
        </div>
        <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
          {event.school}
          {event.program ? ` · ${event.program}` : ''}
        </span>
      </div>
    </div>
  );
});
EventCard.displayName = 'EventCard';

// ─── Main export ──────────────────────────────────────────────────────────────

export const Next30Days = memo(({ universities = [] }) => {
  const events = useMemo(() => getNext30DaysEvents(universities), [universities]);

  if (events.length === 0) return null;

  return (
    <section className="mt-8 mb-2" aria-labelledby="next30-heading">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#3598FE]/10 rounded-xl" aria-hidden="true">
            <CalendarDays className="w-5 h-5 text-[#3598FE]" />
          </div>
          <div>
            <h2 id="next30-heading" className="text-lg font-bold text-[#002147]">Next 30 Days</h2>
            <p className="text-sm text-gray-500">Deadlines, meetings, and tasks across all schools</p>
          </div>
        </div>
        <Link
          href="/dashboard/calendar"
          className="flex items-center gap-1 text-sm text-[#3598FE] font-medium hover:underline"
        >
          Open calendar
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Cards — horizontal scroll on mobile, grid on lg */}
      <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 xl:grid-cols-4 lg:overflow-visible lg:pb-0 scrollbar-hide">
        {events.slice(0, 8).map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
});
Next30Days.displayName = 'Next30Days';