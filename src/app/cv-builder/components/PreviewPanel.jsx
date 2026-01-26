import React from "react";
import { Eye, Palette, Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";

/**
 * Label component for form labels
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Label content
 * @param {string} props.className - Additional CSS classes
 */
const Label = ({ children, className }) => (
  <span className={className}>{children}</span>
);

/**
 * Available theme colors for the CV templates
 * Each theme has a main color and a light variant for backgrounds
 */
const THEME_COLORS = [
  { name: "Navy Blue", value: "#1e40af", light: "#dbeafe" },
  { name: "Emerald", value: "#059669", light: "#d1fae5" },
  { name: "Purple", value: "#7c3aed", light: "#ede9fe" },
  { name: "Rose", value: "#e11d48", light: "#ffe4e6" },
  { name: "Amber", value: "#d97706", light: "#fef3c7" },
  { name: "Teal", value: "#0d9488", light: "#ccfbf1" },
  { name: "Indigo", value: "#4f46e5", light: "#e0e7ff" },
  { name: "Slate", value: "#475569", light: "#e2e8f0" },
  { name: "Black", value: "#000000", light: "#f3f4f6" },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extracts skill name from various formats (string or object)
 * @param {string|Object} skill - Skill data in various formats
 * @returns {string} Cleaned skill name
 */
const getSkillName = (skill) => {
  if (!skill) return '';
  if (typeof skill === 'string') return skill.trim();
  if (typeof skill === 'object' && skill !== null) {
    // Handle various object structures
    return skill.name || skill.value || skill.skill || skill.label || skill.title || '';
  }
  return String(skill);
};

/**
 * Cleans HTML tags and entities from text
 * @param {string} text - Text containing HTML
 * @returns {string} Clean text without HTML
 */
const stripHtmlTags = (text) => {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&')  // Replace &amp; with &
    .replace(/&lt;/g, '<')   // Replace &lt; with <
    .replace(/&gt;/g, '>')   // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'")  // Replace &#39; with '
    .trim();
};

/**
 * Gets skills list as array of strings from a category
 * @param {Object} category - Skill category object
 * @returns {Array} Array of skill names
 */
const getSkillsList = (category) => {
  if (!category || !category.skills) return [];
  if (!Array.isArray(category.skills)) return [];
  return category.skills
    .map(skill => getSkillName(skill))
    .filter(name => name.length > 0);
};

/**
 * PreviewPanel - Main component for displaying CV preview with template selection
 * @param {Object} props - Component props
 * @param {string} props.selectedTemplate - Currently selected template name
 * @param {Function} props.onTemplateChange - Callback for template change
 * @param {Object} props.cvData - CV data object
 * @param {string} props.themeColor - Current theme color
 * @param {Function} props.onThemeColorChange - Callback for theme color change
 * @returns {JSX.Element} Preview panel component
 */
export const PreviewPanel = ({ selectedTemplate, onTemplateChange, cvData = {}, themeColor = "#1e40af", onThemeColorChange }) => {
  console.log("PreviewPanel - cvData received:", cvData);
  
  /**
   * Formats date from YYYY-MM format to human readable format
   * @param {string} date - Date in YYYY-MM format
   * @returns {string} Formatted date (e.g., "Jan 2023")
   */
  const formatDate = (date) => {
    if (!date) return "";
    const [year, month] = date.split("-");
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  /**
   * Renders description content, handling arrays and strings
   * @param {string|Array} description - Description content
   * @returns {Array|null} Array of cleaned description items or null
   */
  const renderDescription = (description) => {
    if (!description) return null;
    
    if (Array.isArray(description)) {
      return description.map(item => stripHtmlTags(item)).filter(Boolean);
    }
    
    if (typeof description === 'string') {
      // First strip HTML tags, then split by newlines
      const cleanedDesc = stripHtmlTags(description);
      const lines = cleanedDesc.split('\n').filter(line => line.trim());
      return lines.map(line => line.replace(/^[•\-]\s*/, '').trim()).filter(Boolean);
    }
    
    return null;
  };

  /**
   * Safely extracts and validates CV data with default values
   */
  const safeData = {
    personal: cvData.personal || {},
    education: Array.isArray(cvData.education) ? cvData.education : [],
    experience: Array.isArray(cvData.experience) ? cvData.experience : [],
    projects: Array.isArray(cvData.projects) ? cvData.projects : [],
    skills: Array.isArray(cvData.skills) ? cvData.skills : [],
    achievements: Array.isArray(cvData.achievements) ? cvData.achievements : [],
    volunteer: Array.isArray(cvData.volunteer) ? cvData.volunteer : [],
  };

  /**
   * Checks if a value has meaningful content (not empty or placeholder)
   * @param {*} value - Value to check
   * @returns {boolean} True if value is meaningful
   */
  const hasMeaningfulValue = (value) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) {
      return value.length > 0 && value.some(item => hasMeaningfulValue(item));
    }
    const stringValue = String(value).trim();
    if (stringValue === "") return false;
    const minimalPatterns = [
      /^[.\-\s]*$/,
      /^n\/a$/i,
      /^not specified$/i,
      /^enter /i,
      /^your /i,
      /^add /i,
      /^\[.*\]$/,
      /^\(.*\)$/,
      /^\[object Object\]$/i,
    ];
    if (minimalPatterns.some(pattern => pattern.test(stringValue))) {
      return false;
    }
    return true;
  };

  /**
   * Checks if a section array has meaningful data
   * @param {Array} section - Section data array
   * @returns {boolean} True if section has meaningful data
   */
  const hasData = (section) => {
    if (!section || !Array.isArray(section)) return false;
    return section.some((item) => {
      if (!item || typeof item !== 'object') return false;
      const filteredItem = { ...item };
      delete filteredItem.id;
      return Object.values(filteredItem).some(value => hasMeaningfulValue(value));
    });
  };

  /**
   * Checks if a specific section has data
   * @param {string} sectionName - Name of the section
   * @returns {boolean} True if section has data
   */
  const hasSectionData = (sectionName) => {
    const section = safeData[sectionName];
    if (sectionName === 'personal') {
      const { fullName, ...otherPersonalData } = section;
      const hasOtherData = Object.values(otherPersonalData).some(value => hasMeaningfulValue(value));
      return hasMeaningfulValue(fullName) || hasOtherData;
    }
    if (sectionName === 'skills') {
      // Special check for skills - ensure at least one category has actual skills
      return section.some(category => {
        const skillsList = getSkillsList(category);
        return category.name || skillsList.length > 0;
      });
    }
    return hasData(section);
  };

  /**
   * Checks if contact information exists
   * @returns {boolean} True if contact info exists
   */
  const hasContactInfo = () => {
    const { fullName, summary, ...contactFields } = safeData.personal;
    return Object.values(contactFields).some(value => hasMeaningfulValue(value));
  };

  /**
   * Checks if professional summary exists
   * @returns {boolean} True if summary exists
   */
  const hasSummary = () => {
    return hasMeaningfulValue(safeData.personal?.summary);
  };

  // Get current theme object based on selected color
  const currentTheme = THEME_COLORS.find(t => t.value === themeColor) || THEME_COLORS[0];

  /**
   * Renders the selected template component
   * @returns {JSX.Element} Template component
   */
  const renderTemplate = () => {
    // Common props passed to all templates
    const commonProps = {
      data: safeData,
      formatDate,
      hasSectionData,
      hasData,
      renderDescription,
      themeColor: currentTheme,
      hasContactInfo,
      hasSummary,
      getSkillsList,
      stripHtmlTags,
    };

    switch (selectedTemplate) {
      case "modern":
        return <ModernPreview {...commonProps} />;
      case "classic":
        return <ClassicPreview {...commonProps} />;
      case "minimal":
        return <MinimalPreview {...commonProps} />;
      default:
        return <ModernPreview {...commonProps} />;
    }
  };

  return (
    /* Main container for preview panel */
    <div className="h-full flex flex-col bg-white">
      
      {/* Preview controls header */}
      <div className="p-4 border-b border-gray-300 bg-gray-50">
        
        {/* Title section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Live Preview</h3>
          </div>
        </div>

        {/* Template and theme controls */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Template selection */}
          <div className="flex items-center space-x-3">
            <Palette className="w-4 h-4 text-gray-600" />
            <Label className="text-gray-700 text-sm">Template:</Label>
            <select
              value={selectedTemplate}
              onChange={(e) => onTemplateChange(e.target.value)}
              className="w-[150px] border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>

          {/* Theme color selection */}
          <div className="flex items-center space-x-3">
            <Label className="text-gray-700 text-sm">Theme:</Label>
            <div className="flex gap-2">
              {THEME_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onThemeColorChange(color.value)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    themeColor === color.value 
                      ? 'border-gray-800 scale-110' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview content area */}
      <div className="flex-1 overflow-auto p-6 bg-gray-100">
        
        {/* CV preview container (A4 size simulation) */}
        <div className="bg-white shadow-xl mx-auto max-w-[210mm] rounded-sm overflow-hidden">
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MODERN TEMPLATE - Clean with accent colors
// ============================================

/**
 * ModernPreview - Clean, contemporary CV template with accent colors
 * @param {Object} props - Template props
 * @param {Object} props.data - CV data
 * @param {Function} props.formatDate - Date formatting function
 * @param {Function} props.hasSectionData - Section data checker
 * @param {Function} props.renderDescription - Description renderer
 * @param {Object} props.themeColor - Theme color object
 * @param {Function} props.hasContactInfo - Contact info checker
 * @param {Function} props.hasSummary - Summary checker
 * @param {Function} props.getSkillsList - Skills list getter
 * @param {Function} props.stripHtmlTags - HTML stripper
 * @returns {JSX.Element} Modern template component
 */
const ModernPreview = ({ data, formatDate, hasSectionData, renderDescription, themeColor, hasContactInfo, hasSummary, getSkillsList, stripHtmlTags }) => {
  
  /**
   * BulletList component for rendering bullet points
   * @param {Object} props - Component props
   * @param {Array|string} props.items - Items to render as bullets
   * @returns {JSX.Element|null} Bullet list or null if no items
   */
  const BulletList = ({ items }) => {
    const parsedItems = renderDescription(items);
    if (!parsedItems || parsedItems.length === 0) return null;
    
    return (
      <ul className="space-y-1.5 mt-2">
        {parsedItems.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
            {/* Custom bullet point using theme color */}
            <span 
              className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" 
              style={{ backgroundColor: themeColor.value }}
            />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    /* Modern template container */
    <div className="p-10 font-sans antialiased bg-white">
      
      {/* Header with name and contact info */}
      <header className="mb-6">
        
        {/* Full name */}
        <h1 
          className="text-4xl font-bold tracking-tight mb-1"
          style={{ color: themeColor.value }}
        >
          {data.personal?.fullName || "Your Name"}
        </h1>
        
        {/* Contact information */}
        {hasContactInfo() && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 mt-4">
            
            {/* Email */}
            {data.personal?.email && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeColor.light }}
                >
                  <Mail className="w-3.5 h-3.5" style={{ color: themeColor.value }} />
                </div>
                <span>{data.personal.email}</span>
              </div>
            )}
            
            {/* Phone */}
            {data.personal?.phone && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeColor.light }}
                >
                  <Phone className="w-3.5 h-3.5" style={{ color: themeColor.value }} />
                </div>
                <span>{data.personal.phone}</span>
              </div>
            )}
            
            {/* Location */}
            {data.personal?.location && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeColor.light }}
                >
                  <MapPin className="w-3.5 h-3.5" style={{ color: themeColor.value }} />
                </div>
                <span>{data.personal.location}</span>
              </div>
            )}
            
            {/* LinkedIn */}
            {data.personal?.linkedin && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeColor.light }}
                >
                  <Linkedin className="w-3.5 h-3.5" style={{ color: themeColor.value }} />
                </div>
                <span>{data.personal.linkedin}</span>
              </div>
            )}
            
            {/* Website */}
            {data.personal?.website && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: themeColor.light }}
                >
                  <Globe className="w-3.5 h-3.5" style={{ color: themeColor.value }} />
                </div>
                <span>{data.personal.website}</span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Accent line separator */}
      <div 
        className="h-1 w-full rounded-full mb-6"
        style={{ 
          background: `linear-gradient(to right, ${themeColor.value}, ${themeColor.value}88, ${themeColor.value}44)` 
        }}
      />

      {/* Professional Summary section */}
      {hasSummary() && (
        <section className="mb-6">
          <h2 
            className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
            style={{ color: themeColor.value }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: themeColor.value }}
            />
            Professional Summary
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed pl-4 border-l-2 border-slate-100">
            {stripHtmlTags(data.personal.summary)}
          </p>
        </section>
      )}

      {/* Education section */}
      {hasSectionData('education') && (
        <section className="mb-6">
          <h2 
            className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
            style={{ color: themeColor.value }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: themeColor.value }}
            />
            Education
          </h2>
          <div className="pl-4 border-l-2 border-slate-100 space-y-4">
            {data.education.map((edu, i) => (
              (edu.institution || edu.degree || edu.field) && (
                <div key={i}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-slate-900">
                      {edu.degree}{edu.field && ` in ${edu.field}`}
                    </h3>
                    {/* Date range with theme styling */}
                    {(edu.startDate || edu.endDate) && (
                      <span 
                        className="text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ml-4"
                        style={{ backgroundColor: themeColor.light, color: themeColor.value }}
                      >
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </span>
                    )}
                  </div>
                  {edu.institution && (
                    <p className="text-sm text-slate-600 mb-1">{edu.institution}</p>
                  )}
                  {edu.gpa && (
                    <p className="text-sm text-slate-500">GPA: {edu.gpa}</p>
                  )}
                  {edu.description && (
                    <p className="text-xs text-slate-600 mt-2">{stripHtmlTags(edu.description)}</p>
                  )}
                </div>
              )
            ))}
          </div>
        </section>
      )}

      {/* Work Experience section */}
      {hasSectionData('experience') && (
        <section className="mb-6">
          <h2 
            className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
            style={{ color: themeColor.value }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: themeColor.value }}
            />
            Experience
          </h2>
          <div className="pl-4 border-l-2 border-slate-100 space-y-4">
            {data.experience.map((exp, i) => (
              (exp.company || exp.position) && (
                <div key={i}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-slate-900">{exp.position}</h3>
                    {/* Date range with theme styling */}
                    {(exp.startDate || exp.endDate) && (
                      <span 
                        className="text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ml-4"
                        style={{ backgroundColor: themeColor.light, color: themeColor.value }}
                      >
                        {formatDate(exp.startDate)} - {exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    {exp.company}{exp.location && ` • ${exp.location}`}
                  </p>
                  {exp.description && <BulletList items={exp.description} />}
                </div>
              )
            ))}
          </div>
        </section>
      )}

      {/* Projects section */}
      {hasSectionData('projects') && (
        <section className="mb-6">
          <h2 
            className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
            style={{ color: themeColor.value }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: themeColor.value }}
            />
            Projects
          </h2>
          <div className="pl-4 border-l-2 border-slate-100 space-y-4">
            {data.projects.map((proj, i) => (
              proj.name && (
                <div key={i}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-slate-900">{proj.name}</h3>
                    {/* Project date range */}
                    {(proj.startDate || proj.endDate) && (
                      <span 
                        className="text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ml-4"
                        style={{ backgroundColor: themeColor.light, color: themeColor.value }}
                      >
                        {proj.startDate ? formatDate(proj.startDate) : ''} 
                        {proj.endDate ? ` - ${formatDate(proj.endDate)}` : ''}
                      </span>
                    )}
                  </div>
                  {/* Technology tags */}
                  {proj.technologies && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {proj.technologies.split(',').map((tech, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                        >
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  {proj.description && <BulletList items={proj.description} />}
                  {/* Project links */}
                  {(proj.githubUrl || proj.liveUrl) && (
                    <div className="flex gap-4 mt-2 text-xs" style={{ color: themeColor.value }}>
                      {proj.githubUrl && <span>GitHub: {proj.githubUrl}</span>}
                      {proj.liveUrl && <span>Live: {proj.liveUrl}</span>}
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        </section>
      )}

      {/* Technical Skills section */}
      {hasSectionData('skills') && (
        <section className="mb-6">
          <h2 
            className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
            style={{ color: themeColor.value }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: themeColor.value }}
            />
            Technical Skills
          </h2>
          <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-slate-100">
            {data.skills.map((category, i) => {
              const skillsList = getSkillsList(category);
              return (category.name || skillsList.length > 0) ? (
                <div key={i} className="bg-slate-50 rounded-lg p-3">
                  {category.name && (
                    <h4 className="font-semibold text-slate-800 text-sm mb-1">
                      {stripHtmlTags(category.name)}
                    </h4>
                  )}
                  {skillsList.length > 0 && (
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {skillsList.join(", ")}
                    </p>
                  )}
                </div>
              ) : null;
            })}
          </div>
        </section>
      )}

      {/* Achievements section */}
      {hasSectionData('achievements') && (
        <section className="mb-6">
          <h2 
            className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
            style={{ color: themeColor.value }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: themeColor.value }}
            />
            Achievements
          </h2>
          <div className="pl-4 border-l-2 border-slate-100 space-y-3">
            {data.achievements.map((ach, i) => (
              ach.title && (
                <div key={i}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-slate-900">{stripHtmlTags(ach.title)}</h3>
                    {ach.date && (
                      <span className="text-xs text-slate-500 ml-4">{ach.date}</span>
                    )}
                  </div>
                  {ach.organization && (
                    <p className="text-sm text-slate-600">{stripHtmlTags(ach.organization)}</p>
                  )}
                  {ach.description && (
                    <p className="text-sm text-slate-600 mt-1">{stripHtmlTags(ach.description)}</p>
                  )}
                </div>
              )
            ))}
          </div>
        </section>
      )}

      {/* Volunteer Experience section */}
      {hasSectionData('volunteer') && (
        <section>
          <h2 
            className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
            style={{ color: themeColor.value }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: themeColor.value }}
            />
            Volunteer Experience
          </h2>
          <div className="pl-4 border-l-2 border-slate-100 space-y-4">
            {data.volunteer.map((vol, i) => (
              (vol.organization || vol.role) && (
                <div key={i}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-slate-900">{vol.role}</h3>
                    {/* Volunteer date range */}
                    {(vol.startDate || vol.endDate) && (
                      <span 
                        className="text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ml-4"
                        style={{ backgroundColor: themeColor.light, color: themeColor.value }}
                      >
                        {formatDate(vol.startDate)} - {formatDate(vol.endDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    {vol.organization}{vol.location && ` • ${vol.location}`}
                  </p>
                  {vol.description && <BulletList items={vol.description} />}
                </div>
              )
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ============================================
// CLASSIC TEMPLATE - Traditional formal style
// ============================================

/**
 * ClassicPreview - Traditional, formal CV template
 * @param {Object} props - Template props
 * @param {Object} props.data - CV data
 * @param {Function} props.formatDate - Date formatting function
 * @param {Function} props.hasSectionData - Section data checker
 * @param {Function} props.renderDescription - Description renderer
 * @param {Object} props.themeColor - Theme color object
 * @param {Function} props.hasContactInfo - Contact info checker
 * @param {Function} props.hasSummary - Summary checker
 * @param {Function} props.getSkillsList - Skills list getter
 * @param {Function} props.stripHtmlTags - HTML stripper
 * @returns {JSX.Element} Classic template component
 */
const ClassicPreview = ({ data, formatDate, hasSectionData, renderDescription, themeColor, hasContactInfo, hasSummary, getSkillsList, stripHtmlTags }) => {
  
  /**
   * BulletList component for classic template
   * @param {Object} props - Component props
   * @param {Array|string} props.items - Items to render as bullets
   * @returns {JSX.Element|null} Bullet list or null if no items
   */
  const BulletList = ({ items }) => {
    const parsedItems = renderDescription(items);
    if (!parsedItems || parsedItems.length === 0) return null;
    
    return (
      <ul className="mt-2 ml-4 space-y-1">
        {parsedItems.map((item, idx) => (
          <li 
            key={idx} 
            className="relative pl-4 text-sm text-gray-700 leading-relaxed before:content-['•'] before:absolute before:left-0 before:text-gray-400"
          >
            {item}
          </li>
        ))}
      </ul>
    );
  };

  return (
    /* Classic template container with serif font */
    <div className="p-10 font-serif antialiased bg-white text-gray-900">
      
      {/* Centered header with border */}
      <header className="text-center mb-8 pb-5 border-b-2" style={{ borderColor: themeColor.value }}>
        
        {/* Uppercase name */}
        <h1 
          className="text-3xl font-bold tracking-wide mb-2"
          style={{ color: themeColor.value }}
        >
          {(data.personal?.fullName || "Your Name").toUpperCase()}
        </h1>
        
        {/* Contact info in centered paragraphs */}
        {hasContactInfo() && (
          <div className="text-sm text-gray-600 space-y-0.5">
            <p>
              {[data.personal?.email, data.personal?.phone].filter(Boolean).join("  •  ")}
            </p>
            <p>
              {[data.personal?.location, data.personal?.linkedin, data.personal?.website].filter(Boolean).join("  •  ")}
            </p>
          </div>
        )}
      </header>

      {/* Professional Summary section */}
      {hasSummary() && (
        <section className="mb-6">
          <h2 
            className="text-sm font-bold uppercase tracking-widest border-b pb-2 mb-4"
            style={{ borderColor: themeColor.value, color: themeColor.value }}
          >
            Professional Summary
          </h2>
          <p className="text-sm leading-relaxed text-justify text-gray-700">
            {stripHtmlTags(data.personal.summary)}
          </p>
        </section>
      )}

      {/* Education section */}
      {hasSectionData('education') && (
        <section className="mb-6">
          <h2 
            className="text-sm font-bold uppercase tracking-widest border-b pb-2 mb-4"
            style={{ borderColor: themeColor.value, color: themeColor.value }}
          >
            Education
          </h2>
          {data.education.map((edu, i) => (
            (edu.institution || edu.degree || edu.field) && (
              <div key={i} className="mb-3">
                <div className="flex justify-between items-start mb-1">
                  <strong className="text-gray-900">
                    {edu.degree}{edu.field && `, ${edu.field}`}
                  </strong>
                  {(edu.startDate || edu.endDate) && (
                    <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                      {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                    </span>
                  )}
                </div>
                {edu.institution && (
                  <p className="text-sm italic text-gray-600 mb-1">{edu.institution}</p>
                )}
                {edu.gpa && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">GPA:</span> {edu.gpa}
                  </p>
                )}
                {edu.description && (
                  <p className="text-sm text-gray-700 mt-1">{stripHtmlTags(edu.description)}</p>
                )}
              </div>
            )
          ))}
        </section>
      )}

      {/* Professional Experience section */}
      {hasSectionData('experience') && (
        <section className="mb-6">
          <h2 
            className="text-sm font-bold uppercase tracking-widest border-b pb-2 mb-4"
            style={{ borderColor: themeColor.value, color: themeColor.value }}
          >
            Professional Experience
          </h2>
          {data.experience.map((exp, i) => (
            (exp.company || exp.position) && (
              <div key={i} className="mb-4">
                <div className="flex justify-between items-start mb-1">
                  <strong className="text-gray-900">{exp.position}</strong>
                  {(exp.startDate || exp.endDate) && (
                    <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                      {formatDate(exp.startDate)} – {exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}
                    </span>
                  )}
                </div>
                <p className="text-sm italic text-gray-600 mb-2">
                  {exp.company}{exp.location && `, ${exp.location}`}
                </p>
                {exp.description && <BulletList items={exp.description} />}
              </div>
            )
          ))}
        </section>
      )}

      {/* Technical Projects section */}
      {hasSectionData('projects') && (
        <section className="mb-6">
          <h2 
            className="text-sm font-bold uppercase tracking-widest border-b pb-2 mb-4"
            style={{ borderColor: themeColor.value, color: themeColor.value }}
          >
            Technical Projects
          </h2>
          {data.projects.map((proj, i) => (
            proj.name && (
              <div key={i} className="mb-4">
                <div className="flex justify-between items-start mb-1">
                  <strong className="text-gray-900">{proj.name}</strong>
                  {(proj.startDate || proj.endDate) && (
                    <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                      {proj.startDate ? formatDate(proj.startDate) : ''} 
                      {proj.endDate ? ` – ${formatDate(proj.endDate)}` : ''}
                    </span>
                  )}
                </div>
                {proj.technologies && (
                  <p className="text-sm italic text-gray-600 mb-2">
                    Technologies: {proj.technologies}
                  </p>
                )}
                {proj.description && <BulletList items={proj.description} />}
                {(proj.githubUrl || proj.liveUrl) && (
                  <div className="mt-2 text-sm space-y-0.5" style={{ color: themeColor.value }}>
                    {proj.githubUrl && <p>GitHub: {proj.githubUrl}</p>}
                    {proj.liveUrl && <p>Live: {proj.liveUrl}</p>}
                  </div>
                )}
              </div>
            )
          ))}
        </section>
      )}

      {/* Technical Skills section */}
      {hasSectionData('skills') && (
        <section className="mb-6">
          <h2 
            className="text-sm font-bold uppercase tracking-widest border-b pb-2 mb-4"
            style={{ borderColor: themeColor.value, color: themeColor.value }}
          >
            Technical Skills
          </h2>
          <div className="text-sm text-gray-700 space-y-2">
            {data.skills.map((category, i) => {
              const skillsList = getSkillsList(category);
              return (category.name || skillsList.length > 0) ? (
                <p key={i}>
                  <span className="font-semibold text-gray-900">
                    {stripHtmlTags(category.name)}:
                  </span>{" "}
                  {skillsList.join(", ")}
                </p>
              ) : null;
            })}
          </div>
        </section>
      )}

      {/* Achievements section */}
      {hasSectionData('achievements') && (
        <section className="mb-6">
          <h2 
            className="text-sm font-bold uppercase tracking-widest border-b pb-2 mb-4"
            style={{ borderColor: themeColor.value, color: themeColor.value }}
          >
            Achievements
          </h2>
          <div className="space-y-3">
            {data.achievements.map((ach, i) => (
              ach.title && (
                <div key={i}>
                  <div className="flex justify-between items-start">
                    <strong className="text-gray-900">{stripHtmlTags(ach.title)}</strong>
                    {ach.date && (
                      <span className="text-sm text-gray-600 ml-4">{ach.date}</span>
                    )}
                  </div>
                  {ach.organization && (
                    <p className="text-sm text-gray-600">{stripHtmlTags(ach.organization)}</p>
                  )}
                  {ach.description && (
                    <p className="text-sm text-gray-700 mt-1">{stripHtmlTags(ach.description)}</p>
                  )}
                </div>
              )
            ))}
          </div>
        </section>
      )}

      {/* Volunteer Experience section */}
      {hasSectionData('volunteer') && (
        <section>
          <h2 
            className="text-sm font-bold uppercase tracking-widest border-b pb-2 mb-4"
            style={{ borderColor: themeColor.value, color: themeColor.value }}
          >
            Volunteer Experience
          </h2>
          <div className="space-y-4">
            {data.volunteer.map((vol, i) => (
              (vol.organization || vol.role) && (
                <div key={i}>
                  <div className="flex justify-between items-start mb-1">
                    <strong className="text-gray-900">{vol.role}</strong>
                    {(vol.startDate || vol.endDate) && (
                      <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                        {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm italic text-gray-600 mb-2">
                    {vol.organization}{vol.location && `, ${vol.location}`}
                  </p>
                  {vol.description && <BulletList items={vol.description} />}
                </div>
              )
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ============================================
// MINIMAL TEMPLATE - Ultra clean, lots of whitespace
// ============================================

/**
 * MinimalPreview - Clean, minimalist CV template with ample whitespace
 * @param {Object} props - Template props
 * @param {Object} props.data - CV data
 * @param {Function} props.formatDate - Date formatting function
 * @param {Function} props.hasSectionData - Section data checker
 * @param {Function} props.renderDescription - Description renderer
 * @param {Object} props.themeColor - Theme color object
 * @param {Function} props.hasContactInfo - Contact info checker
 * @param {Function} props.hasSummary - Summary checker
 * @param {Function} props.getSkillsList - Skills list getter
 * @param {Function} props.stripHtmlTags - HTML stripper
 * @returns {JSX.Element} Minimal template component
 */
const MinimalPreview = ({ data, formatDate, hasSectionData, renderDescription, themeColor, hasContactInfo, hasSummary, getSkillsList, stripHtmlTags }) => {
  
  /**
   * BulletList component for minimal template
   * @param {Object} props - Component props
   * @param {Array|string} props.items - Items to render as bullets
   * @returns {JSX.Element|null} Bullet list or null if no items
   */
  const BulletList = ({ items }) => {
    const parsedItems = renderDescription(items);
    if (!parsedItems || parsedItems.length === 0) return null;
    
    return (
      <ul className="mt-3 space-y-2">
        {parsedItems.map((item, idx) => (
          <li key={idx} className="flex items-start gap-4 text-sm text-gray-600">
            <span className="text-gray-300 mt-0.5">—</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    /* Minimal template container with light font weight */
    <div className="p-12 font-sans antialiased bg-white" style={{ fontWeight: 300 }}>
      
      {/* Header with extra-light typography */}
      <header className="mb-10">
        <h1 
          className="text-5xl font-extralight tracking-tight mb-2"
          style={{ color: themeColor.value }}
        >
          {data.personal?.fullName || "Your Name"}
        </h1>
        
        {/* Horizontal contact info with separator pipes */}
        {hasContactInfo() && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 mt-4">
            {data.personal?.email && <span>{data.personal.email}</span>}
            {data.personal?.email && data.personal?.phone && <span className="text-gray-300">|</span>}
            {data.personal?.phone && <span>{data.personal.phone}</span>}
            {data.personal?.phone && data.personal?.location && <span className="text-gray-300">|</span>}
            {data.personal?.location && <span>{data.personal.location}</span>}
            {data.personal?.location && data.personal?.linkedin && <span className="text-gray-300">|</span>}
            {data.personal?.linkedin && <span>{data.personal.linkedin}</span>}
            {data.personal?.linkedin && data.personal?.website && <span className="text-gray-300">|</span>}
            {data.personal?.website && <span>{data.personal.website}</span>}
          </div>
        )}
      </header>

      {/* Thin divider line */}
      <div className="w-16 h-px mb-10" style={{ backgroundColor: themeColor.value }} />

      {/* Summary section */}
      {hasSummary() && (
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">
            Summary
          </h2>
          <p className="text-sm text-gray-600 leading-loose max-w-2xl">
            {stripHtmlTags(data.personal.summary)}
          </p>
        </section>
      )}

      {/* Education section */}
      {hasSectionData('education') && (
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">
            Education
          </h2>
          <div className="space-y-4">
            {data.education.map((edu, i) => (
              (edu.institution || edu.degree || edu.field) && (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-normal text-gray-900">
                      {edu.degree}{edu.field && `, ${edu.field}`}
                    </h3>
                    {(edu.startDate || edu.endDate) && (
                      <span className="text-sm text-gray-400 whitespace-nowrap ml-4">
                        {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                      </span>
                    )}
                  </div>
                  {edu.institution && (
                    <p className="text-sm text-gray-500">{edu.institution}</p>
                  )}
                  {edu.gpa && (
                    <p className="text-sm text-gray-400 mt-1">GPA: {edu.gpa}</p>
                  )}
                </div>
              )
            ))}
          </div>
        </section>
      )}

      {/* Experience section */}
      {hasSectionData('experience') && (
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">
            Experience
          </h2>
          <div className="space-y-6">
            {data.experience.map((exp, i) => (
              (exp.company || exp.position) && (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-normal text-gray-900">{exp.position}</h3>
                    {(exp.startDate || exp.endDate) && (
                      <span className="text-sm text-gray-400 whitespace-nowrap ml-4">
                        {formatDate(exp.startDate)} — {exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{exp.company}</p>
                  {exp.description && <BulletList items={exp.description} />}
                </div>
              )
            ))}
          </div>
        </section>
      )}

      {/* Projects section */}
      {hasSectionData('projects') && (
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">
            Projects
          </h2>
          <div className="space-y-6">
            {data.projects.map((proj, i) => (
              proj.name && (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-normal text-gray-900">{proj.name}</h3>
                    {(proj.startDate || proj.endDate) && (
                      <span className="text-sm text-gray-400 whitespace-nowrap ml-4">
                        {proj.startDate ? formatDate(proj.startDate) : ''} 
                        {proj.endDate ? ` — ${formatDate(proj.endDate)}` : ''}
                      </span>
                    )}
                  </div>
                  {proj.technologies && (
                    <p className="text-sm text-gray-400 mb-1">{proj.technologies}</p>
                  )}
                  {proj.description && <BulletList items={proj.description} />}
                  {(proj.githubUrl || proj.liveUrl) && (
                    <div className="mt-3 text-sm space-y-1" style={{ color: themeColor.value }}>
                      {proj.githubUrl && <p>GitHub: {proj.githubUrl}</p>}
                      {proj.liveUrl && <p>Live: {proj.liveUrl}</p>}
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        </section>
      )}

      {/* Skills section with two-column layout */}
      {hasSectionData('skills') && (
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">
            Skills
          </h2>
          <div className="space-y-3 text-sm">
            {data.skills.map((category, i) => {
              const skillsList = getSkillsList(category);
              return (category.name || skillsList.length > 0) ? (
                <div key={i} className="flex">
                  <span className="w-28 text-gray-400 flex-shrink-0">
                    {stripHtmlTags(category.name)}
                  </span>
                  <span className="text-gray-600">{skillsList.join(", ")}</span>
                </div>
              ) : null;
            })}
          </div>
        </section>
      )}

      {/* Achievements section */}
      {hasSectionData('achievements') && (
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">
            Achievements
          </h2>
          <div className="space-y-4">
            {data.achievements.map((ach, i) => (
              ach.title && (
                <div key={i}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-base font-normal text-gray-900">
                      {stripHtmlTags(ach.title)}
                    </h3>
                    {ach.date && (
                      <span className="text-sm text-gray-400 ml-4">{ach.date}</span>
                    )}
                  </div>
                  {ach.organization && (
                    <p className="text-sm text-gray-500">{stripHtmlTags(ach.organization)}</p>
                  )}
                  {ach.description && (
                    <p className="text-sm text-gray-600 mt-1">{stripHtmlTags(ach.description)}</p>
                  )}
                </div>
              )
            ))}
          </div>
        </section>
      )}

      {/* Volunteer section */}
      {hasSectionData('volunteer') && (
        <section>
          <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4">
            Volunteer
          </h2>
          <div className="space-y-6">
            {data.volunteer.map((vol, i) => (
              (vol.organization || vol.role) && (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-normal text-gray-900">{vol.role}</h3>
                    {(vol.startDate || vol.endDate) && (
                      <span className="text-sm text-gray-400 whitespace-nowrap ml-4">
                        {formatDate(vol.startDate)} — {formatDate(vol.endDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{vol.organization}</p>
                  {vol.description && <BulletList items={vol.description} />}
                </div>
              )
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default PreviewPanel;