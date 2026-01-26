// MinimalTemplate.jsx
import React from 'react';

// =============================================
// HELPER FUNCTIONS
// =============================================

const getText = (value) => (!value ? '' : typeof value === 'string' ? value : String(value));

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString + '-01');
  return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const parseBullets = (description) => {
  if (!description) return [];
  let text = typeof description === 'string' ? description : String(description);
  if (!text.trim()) return [];

  // Method 1: HTML <li> tags
  if (text.includes('<li')) {
    const items = text.split(/<\/li>/i)
      .map(item => item.replace(/<ul[^>]*>/gi, '').replace(/<ol[^>]*>/gi, '').replace(/<li[^>]*>/gi, '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim())
      .filter(item => item.length > 0);
    if (items.length > 0) return items;
  }

  // Method 2: Clean HTML
  let cleanText = text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/div>/gi, '\n').replace(/<\/li>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  if (!cleanText) return [];

  // Method 3: Split by •
  if (cleanText.includes('•')) {
    const items = cleanText.split(/\s*•\s*/).map(item => item.trim()).filter(item => item.length > 0);
    if (items.length > 1) return items;
  }

  // Method 4: Split by newlines
  if (cleanText.includes('\n')) {
    const items = cleanText.split(/\n+/).map(line => line.replace(/^[\s•\-\*\d.]+\s*/, '').trim()).filter(line => line.length > 0);
    if (items.length > 1) return items;
  }

  // Fallback
  return [cleanText];
};

// =============================================
// BULLET LIST COMPONENT
// =============================================

const BulletList = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginTop: '14px' }}>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '12px',
          }}
        >
          <span
            style={{
              color: '#d1d5db',
              marginRight: '18px',
              flexShrink: 0,
              fontSize: '16px',
              lineHeight: '1.5',
            }}
          >
            —
          </span>
          <span style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.75' }}>
            {item}
          </span>
        </div>
      ))}
    </div>
  );
};

// =============================================
// MAIN TEMPLATE
// =============================================

export const MinimalTemplate = ({ cvData, themeColor = '#374151' }) => {
  const personal = cvData?.personal || {};
  const education = cvData?.education || [];
  const experience = cvData?.experience || [];
  const projects = cvData?.projects || [];
  const skills = cvData?.skills || [];
  const achievements = cvData?.achievements || [];
  const volunteer = cvData?.volunteer || [];

  return (
    <div style={{ padding: '50px', backgroundColor: 'white', fontFamily: 'system-ui, sans-serif', fontWeight: '300' }}>
      
      {/* HEADER */}
      <header style={{ marginBottom: '44px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '200', color: '#111827', marginBottom: '10px', letterSpacing: '-1px' }}>
          {getText(personal.fullName) || 'Your Name'}
        </h1>
        {personal.headline && (
          <p style={{ fontSize: '18px', color: '#9ca3af', fontWeight: '300', marginBottom: '28px' }}>
            {getText(personal.headline)}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', color: '#6b7280' }}>
          {personal.email && <span>{getText(personal.email)}</span>}
          {personal.email && personal.phone && <span style={{ color: '#d1d5db' }}>|</span>}
          {personal.phone && <span>{getText(personal.phone)}</span>}
          {personal.phone && personal.location && <span style={{ color: '#d1d5db' }}>|</span>}
          {personal.location && <span>{getText(personal.location)}</span>}
          {personal.location && personal.linkedin && <span style={{ color: '#d1d5db' }}>|</span>}
          {personal.linkedin && <span>{getText(personal.linkedin)}</span>}
        </div>
      </header>

      {/* DIVIDER */}
      <div style={{ width: '50px', height: '1px', backgroundColor: themeColor, marginBottom: '44px' }} />

      {/* SUMMARY */}
      {personal.summary && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: '#9ca3af', marginBottom: '18px' }}>
            Summary
          </h2>
          <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.85', maxWidth: '640px' }}>
            {getText(personal.summary).replace(/<[^>]*>/g, '')}
          </p>
        </section>
      )}

      {/* EDUCATION */}
      {education.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: '#9ca3af', marginBottom: '18px' }}>
            Education
          </h2>
          {education.map((edu, index) => (
            <div key={edu.id || index} style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '400', color: '#111827' }}>
                  {getText(edu.degree)}{edu.field ? `, ${getText(edu.field)}` : ''}
                </h3>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                  {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{getText(edu.institution)}</p>
              {edu.gpa && <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>GPA: {getText(edu.gpa)}</p>}
            </div>
          ))}
        </section>
      )}

      {/* EXPERIENCE */}
      {experience.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: '#9ca3af', marginBottom: '18px' }}>
            Experience
          </h2>
          {experience.map((exp, index) => (
            <div key={exp.id || index} style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '400', color: '#111827' }}>{getText(exp.position)}</h3>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                  {formatDate(exp.startDate)} — {exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{getText(exp.company)}</p>
              
              {/* BULLET POINTS */}
              {exp.description && <BulletList items={parseBullets(exp.description)} />}
            </div>
          ))}
        </section>
      )}

      {/* PROJECTS */}
      {projects.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: '#9ca3af', marginBottom: '18px' }}>
            Projects
          </h2>
          {projects.map((proj, index) => (
            <div key={proj.id || index} style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '400', color: '#111827' }}>{getText(proj.name)}</h3>
              {proj.technologies && (
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px', fontStyle: 'italic' }}>
                  {getText(proj.technologies)}
                </p>
              )}
              
              {/* BULLET POINTS */}
              {proj.description && <BulletList items={parseBullets(proj.description)} />}
            </div>
          ))}
        </section>
      )}

      {/* SKILLS */}
      {skills.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: '#9ca3af', marginBottom: '18px' }}>
            Skills
          </h2>
          {skills.map((category, index) => (
            <div key={category.id || index} style={{ display: 'flex', marginBottom: '14px', fontSize: '13px' }}>
              <span style={{ width: '130px', color: '#9ca3af', flexShrink: 0 }}>{getText(category.name)}</span>
              <span style={{ color: '#4b5563' }}>
                {(category.skills || []).map(s => getText(s.name || s)).join('  •  ')}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* ACHIEVEMENTS */}
      {achievements.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: '#9ca3af', marginBottom: '18px' }}>
            Achievements
          </h2>
          {achievements.map((ach, index) => (
            <div key={ach.id || index} style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '400', color: '#111827' }}>{getText(ach.title)}</h3>
                {ach.date && <span style={{ fontSize: '13px', color: '#9ca3af' }}>{getText(ach.date)}</span>}
              </div>
              {ach.organization && <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{getText(ach.organization)}</p>}
            </div>
          ))}
        </section>
      )}

      {/* VOLUNTEER */}
      {volunteer.length > 0 && (
        <section>
          <h2 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3px', color: '#9ca3af', marginBottom: '18px' }}>
            Volunteer
          </h2>
          {volunteer.map((vol, index) => (
            <div key={vol.id || index} style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '400', color: '#111827' }}>{getText(vol.role)}</h3>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                  {formatDate(vol.startDate)} — {formatDate(vol.endDate)}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{getText(vol.organization)}</p>
              
              {/* BULLET POINTS */}
              {vol.description && <BulletList items={parseBullets(vol.description)} />}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default MinimalTemplate;