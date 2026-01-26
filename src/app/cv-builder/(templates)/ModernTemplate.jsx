// ModernTemplate.jsx
import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';

// =============================================
// HELPER FUNCTIONS
// =============================================

const getText = (value) => {
  if (!value) return '';
  return typeof value === 'string' ? value : String(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString + '-01');
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/**
 * Parse bullet points from HTML or plain text
 */
/**
 * Parse bullet points from HTML or plain text
 */
/**
 * Parse bullet points from HTML or plain text
 */
/**
 * Parse bullet points from HTML or plain text
 */
/**
 * Parse bullet points from HTML or plain text
 */
/**
 * Parse bullet points from HTML or plain text
 */
const parseBullets = (description) => {
  if (!description) return [];
  
  let text = typeof description === 'string' ? description : String(description);
  if (!text.trim()) return [];

  console.log('===== PARSING BULLETS =====');
  console.log('Input:', text);

  // Method 1: HTML <li> tags
  if (text.includes('<li')) {
    const items = text
      .split(/<\/li>/i)
      .map(item => item
        .replace(/<ul[^>]*>/gi, '')
        .replace(/<ol[^>]*>/gi, '')
        .replace(/<li[^>]*>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim()
      )
      .filter(item => item.length > 0);
    
    if (items.length > 0) return items;
  }

  // Method 2: Split by <p> tags that contain bullets
  if (text.includes('<p>')) {
    const paragraphs = text
      .split(/<\/p>/i)
      .map(item => {
        // Remove opening <p> tag and any attributes
        let cleaned = item.replace(/<p[^>]*>/gi, '');
        // Remove all other HTML tags
        cleaned = cleaned.replace(/<[^>]*>/g, '');
        // Replace HTML entities
        cleaned = cleaned.replace(/&nbsp;/g, ' ');
        cleaned = cleaned.replace(/&amp;/g, '&');
        // Trim whitespace
        cleaned = cleaned.trim();
        // Remove leading bullet and spaces
        cleaned = cleaned.replace(/^[•\s]+/, '');
        return cleaned.trim();
      })
      .filter(item => item.length > 0);
    
    console.log('Parsed paragraphs:', paragraphs);
    
    if (paragraphs.length > 0) {
      return paragraphs;
    }
  }

  // Method 3: Clean HTML first
  let cleanText = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();

  if (!cleanText) return [];

  // Method 4: Split by newlines (common in cleaned HTML)
  if (cleanText.includes('\n')) {
    const items = cleanText
      .split(/\n+/)
      .map(line => line.replace(/^[•\s\-\*\d.]+/, '').trim())
      .filter(line => line.length > 0);
    if (items.length > 1) return items;
  }

  // Method 5: Split by bullet character
  if (cleanText.includes('•')) {
    const items = cleanText
      .split('•')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    if (items.length > 1) return items;
  }

  // Method 6: Split by sentence-ending punctuation followed by uppercase
  const sentencePattern = /\.\s+(?=[A-Z])/;
  if (sentencePattern.test(cleanText)) {
    const items = cleanText
      .split(sentencePattern)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(item => item.endsWith('.') ? item : item + '.');
    if (items.length > 1) return items;
  }

  // Fallback: single item
  return [cleanText];
};
// =============================================
// BULLET LIST COMPONENT
// =============================================

const BulletList = ({ items, color = '#0d9488' }) => {
  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginTop: '10px' }}>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '10px',
          }}
        >
          {/* Bullet Point */}
          <div
            style={{
              width: '6px',
              height: '6px',
              minWidth: '6px',
              backgroundColor: color,
              borderRadius: '50%',
              marginTop: '7px',
              marginRight: '14px',
            }}
          />
          {/* Text */}
          <span
            style={{
              fontSize: '13px',
              color: '#475569',
              lineHeight: '1.65',
            }}
          >
            {item}
          </span>
        </div>
      ))}
    </div>
  );
};

// =============================================
// SECTION HEADER COMPONENT
// =============================================

const SectionHeader = ({ title, color = '#0d9488' }) => (
  <h2
    style={{
      fontSize: '11px',
      fontWeight: '700',
      color: color,
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      marginBottom: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}
  >
    <span
      style={{
        width: '8px',
        height: '8px',
        backgroundColor: color,
        borderRadius: '50%',
      }}
    />
    {title}
  </h2>
);

// =============================================
// MAIN TEMPLATE COMPONENT
// =============================================

export const ModernTemplate = ({ cvData, themeColor = '#0d9488' }) => {
  const theme = {
    primary: themeColor,
    primaryLight: `${themeColor}15`,
  };

  const personal = cvData?.personal || {};
  const education = cvData?.education || [];
  const experience = cvData?.experience || [];
  const projects = cvData?.projects || [];
  const skills = cvData?.skills || [];
  const achievements = cvData?.achievements || [];
  const volunteer = cvData?.volunteer || [];

  return (
    <div
      style={{
        padding: '40px',
        backgroundColor: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ==================== HEADER ==================== */}
      <header style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#0f172a',
            marginBottom: '6px',
            letterSpacing: '-0.5px',
          }}
        >
          {getText(personal.fullName) || 'Your Name'}
        </h1>

        {personal.headline && (
          <p
            style={{
              fontSize: '16px',
              color: theme.primary,
              fontWeight: '500',
              marginBottom: '18px',
            }}
          >
            {getText(personal.headline)}
          </p>
        )}

        {/* Contact Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px' }}>
          {personal.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: theme.primaryLight,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mail size={14} color={theme.primary} />
              </div>
              <span style={{ fontSize: '13px', color: '#475569' }}>
                {getText(personal.email)}
              </span>
            </div>
          )}

          {personal.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: theme.primaryLight,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Phone size={14} color={theme.primary} />
              </div>
              <span style={{ fontSize: '13px', color: '#475569' }}>
                {getText(personal.phone)}
              </span>
            </div>
          )}

          {personal.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: theme.primaryLight,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MapPin size={14} color={theme.primary} />
              </div>
              <span style={{ fontSize: '13px', color: '#475569' }}>
                {getText(personal.location)}
              </span>
            </div>
          )}

          {personal.linkedin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: theme.primaryLight,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Linkedin size={14} color={theme.primary} />
              </div>
              <span style={{ fontSize: '13px', color: '#475569' }}>
                {getText(personal.linkedin)}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ==================== GRADIENT LINE ==================== */}
      <div
        style={{
          height: '4px',
          width: '100%',
          background: `linear-gradient(to right, ${theme.primary}, ${theme.primary}40, transparent)`,
          borderRadius: '2px',
          marginBottom: '28px',
        }}
      />

      {/* ==================== SUMMARY ==================== */}
      {personal.summary && (
        <section style={{ marginBottom: '28px' }}>
          <SectionHeader title="Professional Summary" color={theme.primary} />
          <div style={{ paddingLeft: '18px', borderLeft: '2px solid #f1f5f9' }}>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.75' }}>
              {getText(personal.summary).replace(/<[^>]*>/g, '')}
            </p>
          </div>
        </section>
      )}

      {/* ==================== EDUCATION ==================== */}
      {education.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <SectionHeader title="Education" color={theme.primary} />
          <div style={{ paddingLeft: '18px', borderLeft: '2px solid #f1f5f9' }}>
            {education.map((edu, index) => (
              <div
                key={edu.id || index}
                style={{ marginBottom: index < education.length - 1 ? '20px' : 0 }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    {getText(edu.degree)}
                    {edu.field ? ` in ${getText(edu.field)}` : ''}
                  </h3>
                  {(edu.startDate || edu.endDate) && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: theme.primary,
                        backgroundColor: theme.primaryLight,
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {getText(edu.institution)}
                  {edu.location ? ` • ${getText(edu.location)}` : ''}
                </p>
                {edu.gpa && (
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    GPA: {getText(edu.gpa)}
                  </p>
                )}
                {edu.description && (
                  <BulletList
                    items={parseBullets(edu.description)}
                    color={theme.primary}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================== EXPERIENCE ==================== */}
      {experience.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <SectionHeader title="Experience" color={theme.primary} />
          <div style={{ paddingLeft: '18px', borderLeft: '2px solid #f1f5f9' }}>
            {experience.map((exp, index) => (
              <div
                key={exp.id || index}
                style={{ marginBottom: index < experience.length - 1 ? '24px' : 0 }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    {getText(exp.position)}
                  </h3>
                  {(exp.startDate || exp.endDate || exp.isCurrentRole) && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: theme.primary,
                        backgroundColor: theme.primaryLight,
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatDate(exp.startDate)} -{' '}
                      {exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {getText(exp.company)}
                  {exp.location ? ` • ${getText(exp.location)}` : ''}
                </p>

                {/* BULLET POINTS */}
                {exp.description && (
                  <BulletList
                    items={parseBullets(exp.description)}
                    color={theme.primary}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================== PROJECTS ==================== */}
      {projects.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <SectionHeader title="Projects" color={theme.primary} />
          <div style={{ paddingLeft: '18px', borderLeft: '2px solid #f1f5f9' }}>
            {projects.map((proj, index) => (
              <div
                key={proj.id || index}
                style={{ marginBottom: index < projects.length - 1 ? '24px' : 0 }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                  {getText(proj.name)}
                </h3>

                {proj.technologies && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '10px',
                    }}
                  >
                    {getText(proj.technologies)
                      .split(',')
                      .map((tech, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            borderRadius: '4px',
                          }}
                        >
                          {tech.trim()}
                        </span>
                      ))}
                  </div>
                )}

                {/* BULLET POINTS */}
                {proj.description && (
                  <BulletList
                    items={parseBullets(proj.description)}
                    color={theme.primary}
                  />
                )}

                {/* Links */}
                {(proj.githubUrl || proj.liveUrl) && (
                  <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                    {proj.githubUrl && (
                      <span style={{ fontSize: '12px', color: theme.primary }}>
                        GitHub: {getText(proj.githubUrl)}
                      </span>
                    )}
                    {proj.liveUrl && (
                      <span style={{ fontSize: '12px', color: theme.primary }}>
                        Live: {getText(proj.liveUrl)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================== SKILLS ==================== */}
      {skills.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <SectionHeader title="Skills" color={theme.primary} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
              paddingLeft: '18px',
              borderLeft: '2px solid #f1f5f9',
            }}
          >
            {skills.map((category, index) => (
              <div
                key={category.id || index}
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '8px',
                  }}
                >
                  {getText(category.name)}
                </h4>
                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                  {(category.skills || [])
                    .map((s) => getText(s.name || s))
                    .join(', ')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================== ACHIEVEMENTS ==================== */}
      {achievements.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <SectionHeader title="Achievements" color={theme.primary} />
          <div style={{ paddingLeft: '18px', borderLeft: '2px solid #f1f5f9' }}>
            {achievements.map((ach, index) => (
              <div
                key={ach.id || index}
                style={{ marginBottom: index < achievements.length - 1 ? '18px' : 0 }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    {getText(ach.title)}
                  </h3>
                  {ach.date && (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {getText(ach.date)}
                    </span>
                  )}
                </div>
                {ach.organization && (
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    {getText(ach.organization)}
                  </p>
                )}
                {ach.description && (
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#475569',
                      lineHeight: '1.6',
                      marginTop: '6px',
                    }}
                  >
                    {getText(ach.description).replace(/<[^>]*>/g, '')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================== VOLUNTEER ==================== */}
      {volunteer.length > 0 && (
        <section>
          <SectionHeader title="Volunteer Experience" color={theme.primary} />
          <div style={{ paddingLeft: '18px', borderLeft: '2px solid #f1f5f9' }}>
            {volunteer.map((vol, index) => (
              <div
                key={vol.id || index}
                style={{ marginBottom: index < volunteer.length - 1 ? '24px' : 0 }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    {getText(vol.role)}
                  </h3>
                  {(vol.startDate || vol.endDate) && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: theme.primary,
                        backgroundColor: theme.primaryLight,
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontWeight: '500',
                      }}
                    >
                      {formatDate(vol.startDate)} - {formatDate(vol.endDate)}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {getText(vol.organization)}
                  {vol.location ? ` • ${getText(vol.location)}` : ''}
                </p>

                {/* BULLET POINTS */}
                {vol.description && (
                  <BulletList
                    items={parseBullets(vol.description)}
                    color={theme.primary}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ModernTemplate;