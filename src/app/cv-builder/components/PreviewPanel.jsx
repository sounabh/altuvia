import React from "react";
import { Eye, Palette } from "lucide-react";

const Label = ({ children, className }) => (
  <span className={className}>{children}</span>
);

export const PreviewPanel = ({ selectedTemplate, onTemplateChange, cvData = {} }) => {
  const formatDate = (date) => {
    if (!date) return "";
    const [year, month] = date.split("-");
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Helper function to render description with bullet points
  const renderDescription = (description) => {
    if (!description) return null;
    
    // If it's an array, render as bullet points
    if (Array.isArray(description)) {
      return (
        <ul className="list-disc list-inside space-y-1 mt-2">
          {description.map((item, index) => (
            <li key={index} className="text-sm text-gray-700">{item}</li>
          ))}
        </ul>
      );
    }
    
    // If it's a string with bullet points (• or -)
    if (typeof description === 'string') {
      const lines = description.split('\n').filter(line => line.trim());
      const hasBullets = lines.some(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
      
      if (hasBullets) {
        return (
          <ul className="list-disc list-inside space-y-1 mt-2">
            {lines.map((line, index) => (
              <li key={index} className="text-sm text-gray-700">
                {line.replace(/^[•\-]\s*/, '')}
              </li>
            ))}
          </ul>
        );
      }
      
      // Regular text with line breaks
      return (
        <div className="text-sm text-gray-700 whitespace-pre-line mt-2">
          {description}
        </div>
      );
    }
    
    return null;
  };

  const safeData = {
    personal: cvData.personal || {},
    education: Array.isArray(cvData.education) ? cvData.education : [],
    experience: Array.isArray(cvData.experience) ? cvData.experience : [],
    projects: Array.isArray(cvData.projects) ? cvData.projects : [],
    skills: Array.isArray(cvData.skills) ? cvData.skills : [],
    achievements: Array.isArray(cvData.achievements) ? cvData.achievements : [],
    volunteer: Array.isArray(cvData.volunteer) ? cvData.volunteer : [],
  };

  const hasData = (section) => {
    if (!section || !Array.isArray(section)) return false;
    return section.some((item) => {
      if (!item) return false;
      return Object.values(item).some((value) => {
        if (Array.isArray(value)) return value.length > 0;
        return value && value.toString().trim() !== "";
      });
    });
  };

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case "modern":
        return <ModernPreview data={safeData} formatDate={formatDate} hasData={hasData} renderDescription={renderDescription} />;
      case "classic":
        return <ClassicPreview data={safeData} formatDate={formatDate} hasData={hasData} renderDescription={renderDescription} />;
      case "minimal":
        return <MinimalPreview data={safeData} formatDate={formatDate} hasData={hasData} renderDescription={renderDescription} />;
      default:
        return <ModernPreview data={safeData} formatDate={formatDate} hasData={hasData} renderDescription={renderDescription} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-300 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Live Preview</h3>
          </div>
        </div>

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
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-100">
        <div className="bg-white shadow-xl mx-auto max-w-[210mm] rounded-sm overflow-hidden">
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
};

const ModernPreview = ({ data, formatDate, hasData, renderDescription }) => (
  <div className="p-8 font-sans text-sm">
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-1">
        {data.personal?.fullName || "Your Name"}
      </h1>
      <p className="text-lg text-gray-600 mb-4">Software Engineering Student</p>
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        {data.personal?.email && <span>✉ {data.personal.email}</span>}
        {data.personal?.phone && <span>📞 {data.personal.phone}</span>}
        {data.personal?.location && <span>📍 {data.personal.location}</span>}
        {data.personal?.linkedin && <span>💼 {data.personal.linkedin}</span>}
      </div>
    </div>

    {data.personal?.summary && (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600">
          Professional Summary
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">{data.personal.summary}</p>
      </div>
    )}

    {hasData(data.education) && (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600">
          Education
        </h2>
        {data.education.map((edu, i) => (
          (edu.institution || edu.degree || edu.field) && (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-gray-900">
                  {edu.degree || "Degree"} in {edu.field || "Field"}
                </h3>
                <span className="text-sm text-gray-600">
                  {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{edu.institution}</p>
              {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
              {edu.description && <p className="text-sm text-gray-600">{edu.description}</p>}
            </div>
          )
        ))}
      </div>
    )}

    {hasData(data.experience) && (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600">
          Experience
        </h2>
        {data.experience.map((exp, i) => (
          (exp.company || exp.position) && (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                <span className="text-sm text-gray-600">
                  {formatDate(exp.startDate)} -{" "}
                  {exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                {exp.company}
                {exp.location && ` • ${exp.location}`}
              </p>
              {exp.description && renderDescription(exp.description)}
            </div>
          )
        ))}
      </div>
    )}

    {hasData(data.projects) && (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600">
          Projects
        </h2>
        {data.projects.map((proj, i) => (
          proj.name && (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-gray-900">{proj.name}</h3>
                {(proj.startDate || proj.endDate) && (
                  <span className="text-sm text-gray-600">
                    {proj.startDate ? formatDate(proj.startDate) : ''} 
                    {proj.endDate ? ` - ${formatDate(proj.endDate)}` : ''}
                  </span>
                )}
              </div>
              {proj.technologies && (
                <p className="text-sm text-gray-600 mb-2">{proj.technologies}</p>
              )}
              {proj.description && renderDescription(proj.description)}
              {(proj.githubUrl || proj.liveUrl) && (
                <div className="flex gap-4 mt-2 text-sm text-blue-600">
                  {proj.githubUrl && <span>GitHub: {proj.githubUrl}</span>}
                  {proj.liveUrl && <span>Live: {proj.liveUrl}</span>}
                </div>
              )}
              {proj.achievements && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 mb-1">Key Achievements:</p>
                  {renderDescription(proj.achievements)}
                </div>
              )}
            </div>
          )
        ))}
      </div>
    )}

    {hasData(data.skills) && (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600">
          Skills
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {data.skills.map((category, i) => {
            const skillsList = Array.isArray(category.skills) ? category.skills : [];
            return skillsList.length > 0 ? (
              <div key={i}>
                <h4 className="font-medium text-gray-900 mb-1">
                  {category.name || "Skills"}
                </h4>
                <p className="text-sm text-gray-600">{skillsList.join(", ")}</p>
              </div>
            ) : null;
          })}
        </div>
      </div>
    )}

    {hasData(data.achievements) && (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600">
          Achievements
        </h2>
        {data.achievements.map((ach, i) => (
          ach.title && (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-gray-900">{ach.title}</h3>
                {ach.date && <span className="text-sm text-gray-600">{ach.date}</span>}
              </div>
              {ach.organization && (
                <p className="text-sm text-gray-700 mb-2">{ach.organization}</p>
              )}
              {ach.type && <p className="text-sm text-gray-600 mb-2">{ach.type}</p>}
              {ach.description && renderDescription(ach.description)}
            </div>
          )
        ))}
      </div>
    )}

    {hasData(data.volunteer) && (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600">
          Volunteer Experience
        </h2>
        {data.volunteer.map((vol, i) => (
          (vol.organization || vol.role) && (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-gray-900">{vol.role}</h3>
                <span className="text-sm text-gray-600">
                  {formatDate(vol.startDate)} - {formatDate(vol.endDate)}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                {vol.organization}
                {vol.location && ` • ${vol.location}`}
              </p>
              {vol.description && renderDescription(vol.description)}
              {vol.impact && (
                <p className="text-sm text-gray-600 italic mt-2">{vol.impact}</p>
              )}
            </div>
          )
        ))}
      </div>
    )}
  </div>
);

const ClassicPreview = ({ data, formatDate, hasData, renderDescription }) => (
  <div className="p-8 font-serif text-sm">
    <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">
        {data.personal?.fullName || "Your Name"}
      </h1>
      <div className="text-sm space-y-1 text-gray-700">
        {data.personal?.email && <p>{data.personal.email}</p>}
        {data.personal?.phone && <p>{data.personal.phone}</p>}
        {data.personal?.location && <p>{data.personal.location}</p>}
        {data.personal?.linkedin && <p>{data.personal.linkedin}</p>}
      </div>
    </div>

    {data.personal?.summary && (
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-3 text-gray-900">
          Professional Summary
        </h2>
        <p className="text-sm leading-relaxed text-justify text-gray-700">
          {data.personal.summary}
        </p>
      </div>
    )}

    {hasData(data.education) && (
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-3 text-gray-900">
          Education
        </h2>
        {data.education.map((edu, i) => (
          (edu.institution || edu.degree || edu.field) && (
            <div key={i} className="mb-3">
              <div className="flex justify-between mb-1">
                <strong className="text-gray-900">
                  {edu.degree || "Degree"} in {edu.field || "Field"}
                </strong>
                <span className="text-sm text-gray-700">
                  {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                </span>
              </div>
              <em className="text-gray-700">{edu.institution}</em>
              {edu.gpa && (
                <p className="text-sm text-gray-700">
                  <strong>GPA:</strong> {edu.gpa}
                </p>
              )}
            </div>
          )
        ))}
      </div>
    )}

    {hasData(data.experience) && (
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-3 text-gray-900">
          Professional Experience
        </h2>
        {data.experience.map((exp, i) => (
          (exp.company || exp.position) && (
            <div key={i} className="mb-4">
              <div className="flex justify-between mb-1">
                <strong className="text-gray-900">{exp.position}</strong>
                <span className="text-sm text-gray-700">
                  {formatDate(exp.startDate)} -{" "}
                  {exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}
                </span>
              </div>
              <em className="text-gray-700">
                {exp.company}
                {exp.location && ` • ${exp.location}`}
              </em>
              {exp.description && renderDescription(exp.description)}
            </div>
          )
        ))}
      </div>
    )}

    {hasData(data.projects) && (
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-3 text-gray-900">
          Projects
        </h2>
        {data.projects.map((proj, i) => (
          proj.name && (
            <div key={i} className="mb-3">
              <div className="flex justify-between mb-1">
                <strong className="text-gray-900">{proj.name}</strong>
                {(proj.startDate || proj.endDate) && (
                  <span className="text-sm text-gray-700">
                    {proj.startDate ? formatDate(proj.startDate) : ''} 
                    {proj.endDate ? ` - ${formatDate(proj.endDate)}` : ''}
                  </span>
                )}
              </div>
              {proj.technologies && (
                <p className="text-sm text-gray-700 mt-1">
                  Technologies: {proj.technologies}
                </p>
              )}
              {proj.description && renderDescription(proj.description)}
              {(proj.githubUrl || proj.liveUrl) && (
                <div className="mt-2 text-sm text-blue-600 space-y-1">
                  {proj.githubUrl && <p>GitHub: {proj.githubUrl}</p>}
                  {proj.liveUrl && <p>Live: {proj.liveUrl}</p>}
                </div>
              )}
              {proj.achievements && (
                <div className="mt-2">
                  <strong className="text-sm text-gray-900">Key Achievements:</strong>
                  {renderDescription(proj.achievements)}
                </div>
              )}
            </div>
          )
        ))}
      </div>
    )}

    {hasData(data.skills) && (
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-3 text-gray-900">
          Technical Skills
        </h2>
        <div className="text-sm space-y-2">
          {data.skills.map((category, i) => {
            const skillsList = Array.isArray(category.skills) ? category.skills : [];
            return skillsList.length > 0 ? (
              <div key={i}>
                <strong className="text-gray-900">{category.name || "Skills"}:</strong>{" "}
                <span className="text-gray-700">{skillsList.join(", ")}</span>
              </div>
            ) : null;
          })}
        </div>
      </div>
    )}

    {hasData(data.achievements) && (
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-3 text-gray-900">
          Achievements
        </h2>
        <div className="text-sm space-y-3">
          {data.achievements.map((ach, i) => (
            ach.title && (
              <div key={i}>
                <div className="flex justify-between">
                  <strong className="text-gray-900">{ach.title}</strong>
                  {ach.date && <span className="text-sm text-gray-700">{ach.date}</span>}
                </div>
                {ach.organization && (
                  <p className="text-sm text-gray-700">{ach.organization}</p>
                )}
                {ach.type && <p className="text-sm text-gray-700">{ach.type}</p>}
                {ach.description && renderDescription(ach.description)}
              </div>
            )
          ))}
        </div>
      </div>
    )}

    {hasData(data.volunteer) && (
      <div>
        <h2 className="text-lg font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-3 text-gray-900">
          Volunteer
        </h2>
        <div className="text-sm space-y-3">
          {data.volunteer.map((vol, i) => (
            (vol.organization || vol.role) && (
              <div key={i}>
                <div className="flex justify-between">
                  <strong className="text-gray-900">
                    {vol.role || "Volunteer"}
                  </strong>
                  <span className="text-sm text-gray-700">
                    {formatDate(vol.startDate)} - {formatDate(vol.endDate)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{vol.organization}</p>
                {vol.description && renderDescription(vol.description)}
                {vol.impact && (
                  <p className="text-sm text-gray-700 italic">{vol.impact}</p>
                )}
              </div>
            )
          ))}
        </div>
      </div>
    )}
  </div>
);

const MinimalPreview = ({ data, formatDate, hasData, renderDescription }) => (
  <div className="p-8 font-sans text-sm">
    <div className="mb-8">
      <h1 className="text-4xl font-light text-gray-900 mb-1">
        {data.personal?.fullName || "Your Name"}
      </h1>
      <p className="text-lg text-gray-600 mb-4">Software Engineer</p>
      <div className="text-sm text-gray-500 space-y-1">
        {data.personal?.email && <p>{data.personal.email}</p>}
        {data.personal?.phone && <p>{data.personal.phone}</p>}
        {data.personal?.location && <p>{data.personal.location}</p>}
        {data.personal?.linkedin && <p>{data.personal.linkedin}</p>}
      </div>
    </div>

    {data.personal?.summary && (
      <div className="mb-8">
        <h2 className="text-lg font-light text-gray-900 mb-3">Summary</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{data.personal.summary}</p>
      </div>
    )}

    {hasData(data.education) && (
      <div className="mb-8">
        <h2 className="text-lg font-light text-gray-900 mb-3">Education</h2>
        {data.education.map((edu, i) => (
          (edu.institution || edu.degree || edu.field) && (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-medium text-gray-900">
                  {edu.degree || "Degree"} in {edu.field || "Field"}
                </h3>
                <span className="text-sm text-gray-500">
                  {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{edu.institution}</p>
              {edu.gpa && <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>}
            </div>
          )
        ))}
      </div>
    )}

    {hasData(data.experience) && (
      <div className="mb-8">
        <h2 className="text-lg font-light text-gray-900 mb-3">Experience</h2>
        {data.experience.map((exp, i) => (
          (exp.company || exp.position) && (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-medium text-gray-900">{exp.position}</h3>
                <span className="text-sm text-gray-500">
                  {formatDate(exp.startDate)} —{" "}
                  {exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{exp.company}</p>
              {exp.description && renderDescription(exp.description)}
            </div>
          )
        ))}
      </div>
    )}

    {hasData(data.projects) && (
      <div className="mb-8">
        <h2 className="text-lg font-light text-gray-900 mb-3">Projects</h2>
        {data.projects.map((proj, i) => (
          proj.name && (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-medium text-gray-900 mb-1">{proj.name}</h3>
                {(proj.startDate || proj.endDate) && (
                  <span className="text-sm text-gray-500">
                    {proj.startDate ? formatDate(proj.startDate) : ''} 
                    {proj.endDate ? ` — ${formatDate(proj.endDate)}` : ''}
                  </span>
                )}
              </div>
              {proj.technologies && (
                <p className="text-sm text-gray-600 mb-1">{proj.technologies}</p>
              )}
              {proj.description && renderDescription(proj.description)}
              {(proj.githubUrl || proj.liveUrl) && (
                <div className="flex gap-4 mt-2 text-sm text-blue-600">
                  {proj.githubUrl && <span>GitHub: {proj.githubUrl}</span>}
                  {proj.liveUrl && <span>Live: {proj.liveUrl}</span>}
                </div>
              )}
              {proj.achievements && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 mb-1">Achievements:</p>
                  {renderDescription(proj.achievements)}
                </div>
              )}
            </div>
          )
        ))}
      </div>
    )}

    {hasData(data.skills) && (
      <div className="mb-8">
        <h2 className="text-lg font-light text-gray-900 mb-3">Skills</h2>
        <div className="space-y-2 text-sm">
          {data.skills.map((category, i) => {
            const skillsList = Array.isArray(category.skills) ? category.skills : [];
            return skillsList.length > 0 ? (
              <div key={i}>
                <span className="font-medium text-gray-900">
                  {category.name || "Skills"}:
                </span>{" "}
                <span className="text-gray-600">{skillsList.join(", ")}</span>
              </div>
            ) : null;
          })}
        </div>
      </div>
    )}

    {hasData(data.achievements) && (
      <div className="mb-8">
        <h2 className="text-lg font-light text-gray-900 mb-3">Achievements</h2>
        <div className="space-y-3 text-sm">
          {data.achievements.map((ach, i) => (
            ach.title && (
              <div key={i}>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">{ach.title}</span>
                  {ach.date && <span className="text-gray-500">{ach.date}</span>}
                </div>
                {ach.organization && (
                  <p className="text-gray-600">{ach.organization}</p>
                )}
                {ach.type && <p className="text-gray-600">{ach.type}</p>}
                {ach.description && renderDescription(ach.description)}
              </div>
            )
          ))}
        </div>
      </div>
    )}

    {hasData(data.volunteer) && (
      <div>
        <h2 className="text-lg font-light text-gray-900 mb-3">Volunteer</h2>
        <div className="space-y-3 text-sm">
          {data.volunteer.map((vol, i) => (
            (vol.organization || vol.role) && (
              <div key={i}>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">
                    {vol.role || "Volunteer"}
                  </span>
                  <span className="text-gray-500">
                    {formatDate(vol.startDate)} — {formatDate(vol.endDate)}
                  </span>
                </div>
                <p className="text-gray-600">{vol.organization}</p>
                {vol.description && renderDescription(vol.description)}
                {vol.impact && (
                  <p className="text-gray-600 italic">{vol.impact}</p>
                )}
              </div>
            )
          ))}
        </div>
      </div>
    )}
  </div>
);