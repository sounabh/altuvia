'use client';

import React, { useMemo, memo } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, MapPin, ChevronRight } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darkenHex(hex, amt = 0.35) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return '#' + [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
    .map(c => Math.round(c * (1 - amt)).toString(16).padStart(2,'0'))
    .join('');
}

function getNext30DaysEvents(universities) {
  if (!universities || !Array.isArray(universities) || universities.length === 0) return [];

  const now = new Date();
  const cutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const events = [];

  universities.forEach((uni, uniIndex) => {
    const calEvents = uni?.calendarEvents || [];

    calEvents.forEach((ev, evIndex) => {
      if (!ev) return;
      const startDateValue = ev.startDate || ev.start || ev.date;
      if (!startDateValue) return;
      const start = new Date(startDateValue);
      if (isNaN(start.getTime())) return;
      if (start >= now && start <= cutoff) {
        events.push({
          id: ev.id || `event-${uniIndex}-${evIndex}`,
          title: ev.title || 'Untitled Event',
          start,
          isAllDay: ev.isAllDay || false,
          location: ev.location || null,
          school: uni.universityName || uni.school || 'General',
          eventType: ev.eventType || 'task',
          color: ev.color || uni.schoolColor || '#6b7280',
        });
      }
    });

    const admissions = uni?.admissions || [];
    admissions.forEach((adm, admIndex) => {
      (adm?.deadlines || []).forEach((dl, dlIndex) => {
        if (!dl?.deadlineDate) return;
        const date = new Date(dl.deadlineDate);
        if (isNaN(date.getTime())) return;
        if (date >= now && date <= cutoff) {
          events.push({
            id: dl.id || `dl-${uniIndex}-${admIndex}-${dlIndex}`,
            title: dl.title || `${dl.deadlineType || 'Application'} deadline`,
            start: date,
            isAllDay: true,
            location: null,
            school: uni.universityName || uni.school || 'General',
            eventType: 'deadline',
            color: uni.schoolColor || '#ef4444',
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const DateBadge = memo(({ date, color }) => (
  <div
    className="flex flex-col items-center justify-center rounded-xl min-w-[50px] h-[54px] px-2 select-none flex-shrink-0"
    style={{ background: hexToRgba(color, 0.10) }}
  >
    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
      {MONTH_ABBR[date.getMonth()]}
    </span>
    <span className="text-xl font-medium leading-none" style={{ color }}>
      {date.getDate()}
    </span>
  </div>
));
DateBadge.displayName = 'DateBadge';

const EventCard = memo(({ event }) => {
  const tagBg  = hexToRgba(event.color, 0.12);
  const tagTxt = darkenHex(event.color, 0.20);

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-gray-200 hover:shadow-sm transition-all duration-200 min-w-[220px] flex-shrink-0 lg:min-w-0 lg:flex-shrink">
      <DateBadge date={event.start} color={event.color} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#002147] truncate leading-snug">{event.title}</p>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>{formatTime(event.start, event.isAllDay)}</span>
          {event.location && (
            <>
              <span className="mx-0.5">·</span>
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[100px]">{event.location}</span>
            </>
          )}
        </div>
        <span
          className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: tagBg, color: tagTxt }}
        >
          {event.school}
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

      {/* horizontal scroll on mobile, grid on lg */}
      <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 xl:grid-cols-4 lg:overflow-visible lg:pb-0 scrollbar-hide">
        {events.slice(0, 8).map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
});
Next30Days.displayName = 'Next30Days';