// ClassicTemplate.jsx
import React from 'react';

// =============================================
// HELPER FUNCTIONS
// =============================================

const getText = (value) => (!value ? '' : typeof value === 'string' ? value : String(value));

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString + '-01');
  return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
    <div style={{ marginTop: '14px', marginLeft: '18px' }}>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              color: '#6b7280',
              marginRight: '14px',
              flexShrink: 0,
              fontSize: '14px',
              lineHeight: '1.6',
            }}
          >
            •
          </span>
          <span style={{ fontSize: '12px', color: '#374151', lineHeight: '1.7' }}>
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

export const ClassicTemplate = ({ cvData, themeColor = '#1e3a5f' }) => {
  const personal = cvData?.personal || {};
  const education = cvData?.education || [];
  const experience = cvData?.experience || [];
  const projects = cvData?.projects || [];
  const skills = cvData?.skills || [];
  const achievements = cvData?.achievements || [];
  const volunteer = cvData?.volunteer || [];

  return (
    <div style={{ padding: '44px', backgroundColor: 'white', fontFamily: 'Georgia, "Times New Roman", serif', color: '#1f2937' }}>
      
      {/* HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '22px', borderBottom: `2px solid ${themeColor}` }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '2px', color: themeColor, marginBottom: '10px', textTransform: 'uppercase' }}>
          {getText(personal.fullName) || 'Your Name'}
        </h1>
        {personal.headline && (
          <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '14px' }}>{getText(personal.headline)}</p>
        )}
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
          {[personal.email, personal.phone].filter(Boolean).map(getText).join('  •  ')}
        </p>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>
          {[personal.location, personal.linkedin, personal.website].filter(Boolean).map(getText).join('  •  ')}
        </p>
      </header>

      {/* SUMMARY */}
      {personal.summary && (
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: themeColor, borderBottom: '1px solid #9ca3af', paddingBottom: '10px', marginBottom: '18px' }}>
            Professional Summary
          </h2>
          <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.85', textAlign: 'justify' }}>
            {getText(personal.summary).replace(/<[^>]*>/g, '')}
          </p>
        </section>
      )}

      {/* EDUCATION */}
      {education.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: themeColor, borderBottom: '1px solid #9ca3af', paddingBottom: '10px', marginBottom: '18px' }}>
            Education
          </h2>
          {education.map((edu, index) => (
            <div key={edu.id || index} style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <strong style={{ fontSize: '13px', color: '#111827' }}>
                  {getText(edu.degree)}{edu.field ? `, ${getText(edu.field)}` : ''}
                </strong>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                </span>
              </div>
              <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#6b7280', marginTop: '4px' }}>
                {getText(edu.institution)}{edu.location ? `, ${getText(edu.location)}` : ''}
              </p>
              {edu.gpa && (
                <p style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>
                  <span style={{ fontWeight: '600' }}>GPA:</span> {getText(edu.gpa)}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* EXPERIENCE */}
      {experience.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: themeColor, borderBottom: '1px solid #9ca3af', paddingBottom: '10px', marginBottom: '18px' }}>
            Professional Experience
          </h2>
          {experience.map((exp, index) => (
            <div key={exp.id || index} style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <strong style={{ fontSize: '13px', color: '#111827' }}>{getText(exp.position)}</strong>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {formatDate(exp.startDate)} – {exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}
                </span>
              </div>
              <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#6b7280', marginTop: '4px' }}>
                {getText(exp.company)}{exp.location ? `, ${getText(exp.location)}` : ''}
              </p>
              
              {/* BULLET POINTS */}
              {exp.description && <BulletList items={parseBullets(exp.description)} />}
            </div>
          ))}
        </section>
      )}

      {/* PROJECTS */}
      {projects.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: themeColor, borderBottom: '1px solid #9ca3af', paddingBottom: '10px', marginBottom: '18px' }}>
            Technical Projects
          </h2>
          {projects.map((proj, index) => (
            <div key={proj.id || index} style={{ marginBottom: '28px' }}>
              <strong style={{ fontSize: '13px', color: '#111827' }}>{getText(proj.name)}</strong>
              {proj.technologies && (
                <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#6b7280', marginTop: '6px' }}>
                  Technologies: {getText(proj.technologies)}
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
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: themeColor, borderBottom: '1px solid #9ca3af', paddingBottom: '10px', marginBottom: '18px' }}>
            Technical Skills
          </h2>
          {skills.map((category, index) => (
            <p key={category.id || index} style={{ fontSize: '12px', color: '#374151', marginBottom: '10px', lineHeight: '1.7' }}>
              <span style={{ fontWeight: '600' }}>{getText(category.name)}:</span>{' '}
              {(category.skills || []).map(s => getText(s.name || s)).join(', ')}
            </p>
          ))}
        </section>
      )}

      {/* ACHIEVEMENTS */}
      {achievements.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: themeColor, borderBottom: '1px solid #9ca3af', paddingBottom: '10px', marginBottom: '18px' }}>
            Achievements
          </h2>
          {achievements.map((ach, index) => (
            <div key={ach.id || index} style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <strong style={{ fontSize: '13px', color: '#111827' }}>{getText(ach.title)}</strong>
                {ach.date && <span style={{ fontSize: '12px', color: '#6b7280' }}>{getText(ach.date)}</span>}
              </div>
              {ach.organization && <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{getText(ach.organization)}</p>}
            </div>
          ))}
        </section>
      )}

      {/* VOLUNTEER */}
      {volunteer.length > 0 && (
        <section>
          <h2 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px', color: themeColor, borderBottom: '1px solid #9ca3af', paddingBottom: '10px', marginBottom: '18px' }}>
            Volunteer Experience
          </h2>
          {volunteer.map((vol, index) => (
            <div key={vol.id || index} style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <strong style={{ fontSize: '13px', color: '#111827' }}>{getText(vol.role)}</strong>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
                </span>
              </div>
              <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#6b7280', marginTop: '4px' }}>
                {getText(vol.organization)}{vol.location ? `, ${getText(vol.location)}` : ''}
              </p>
              
              {/* BULLET POINTS */}
              {vol.description && <BulletList items={parseBullets(vol.description)} />}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default ClassicTemplate;