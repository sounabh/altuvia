import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Eye, Palette } from 'lucide-react';
import { ModernTemplate } from '../(templates)/ModernTemplate';
import { ClassicTemplate } from '../(templates)/ClassicTemplate';
import { MinimalTemplate } from '../(templates)/MinimalTemplate';
import { useCVData } from '../page';

const Label = ({ children, className }) => (
  <span className={className}>{children}</span>
);

export const PreviewPanel = ({
  selectedTemplate,
  onTemplateChange,
}) => {
  const { cvData } = useCVData();

  const formatDate = (date) => {
    if (!date) return '';
    const [year, month] = date.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Preview Header */}
      <div className="p-4 border-b border-cvBorder bg-cvLightBg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 cv-accent" />
            <h3 className="font-semibold cv-heading">Live Preview</h3>
          </div>
          <Button
            size="sm"
            className="bg-cvAccent hover:bg-cvAccentHover text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <Palette className="w-4 h-4 cv-body" />
          <Label className="cv-body text-sm">Template:</Label>
          <Select value={selectedTemplate} onValueChange={onTemplateChange}>
            <SelectTrigger className="w-[150px] border-cvBorder">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        <div className="bg-white shadow-lg mx-auto max-w-[210mm] min-h-[297mm] p-8">
          <CVPreview data={cvData} formatDate={formatDate} />
        </div>
      </div>
    </div>
  );
};

// CV Preview Component
const CVPreview = ({ data, formatDate }) => {
  return (
    <div className="space-y-6">
      {/* Personal Info */}
      {data.personal.fullName && (
        <div className="text-center border-b-2 border-gray-300 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{data.personal.fullName}</h1>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600">
            {data.personal.email && <span>✉ {data.personal.email}</span>}
            {data.personal.phone && <span>📞 {data.personal.phone}</span>}
            {data.personal.location && <span>📍 {data.personal.location}</span>}
            {data.personal.website && <span>🌐 {data.personal.website}</span>}
            {data.personal.linkedin && <span>💼 {data.personal.linkedin}</span>}
          </div>
          {data.personal.summary && (
            <p className="mt-3 text-gray-700 text-sm leading-relaxed">{data.personal.summary}</p>
          )}
        </div>
      )}

      {/* Education */}
      {data.education.some(e => e.institution || e.field) && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">EDUCATION</h2>
          {data.education.filter(e => e.institution || e.field).map((edu, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{edu.institution || 'Institution'}</h3>
                  <p className="text-sm text-gray-600">
                    {edu.degree && `${edu.degree} in `}{edu.field}
                    {edu.gpa && ` - GPA: ${edu.gpa}`}
                  </p>
                </div>
                {(edu.startDate || edu.endDate) && (
                  <span className="text-sm text-gray-600">
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate) || 'Present'}
                  </span>
                )}
              </div>
              {edu.description && <p className="text-sm text-gray-600 mt-1">{edu.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Experience */}
      {data.experience.some(e => e.company || e.position) && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">EXPERIENCE</h2>
          {data.experience.filter(e => e.company || e.position).map((exp, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{exp.position || 'Position'}</h3>
                  <p className="text-sm text-gray-600">{exp.company}{exp.location && ` - ${exp.location}`}</p>
                </div>
                {(exp.startDate || exp.endDate) && (
                  <span className="text-sm text-gray-600">
                    {formatDate(exp.startDate)} - {exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}
                  </span>
                )}
              </div>
              {exp.description && (
                <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">{exp.description}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {data.projects.some(p => p.name) && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">PROJECTS</h2>
          {data.projects.filter(p => p.name).map((proj, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-800">{proj.name}</h3>
                {(proj.startDate || proj.endDate) && (
                  <span className="text-sm text-gray-600">
                    {formatDate(proj.startDate)} - {formatDate(proj.endDate)}
                  </span>
                )}
              </div>
              {proj.description && <p className="text-sm text-gray-600 mt-1">{proj.description}</p>}
              {proj.technologies && (
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Technologies:</strong> {proj.technologies}
                </p>
              )}
              <div className="flex gap-3 text-sm text-blue-600 mt-1">
                {proj.githubUrl && <a href={proj.githubUrl} className="hover:underline">GitHub</a>}
                {proj.liveUrl && <a href={proj.liveUrl} className="hover:underline">Live Demo</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills.some(c => c.name && c.skills.length > 0) && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">SKILLS</h2>
          {data.skills.filter(c => c.name && c.skills.length > 0).map((category, i) => (
            <div key={i} className="mb-2">
              <span className="font-semibold text-gray-800">{category.name}: </span>
              <span className="text-sm text-gray-600">{category.skills.join(', ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Achievements */}
      {data.achievements.some(a => a.title) && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">ACHIEVEMENTS</h2>
          {data.achievements.filter(a => a.title).map((ach, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <h3 className="font-semibold text-gray-800">{ach.title}</h3>
                {ach.date && <span className="text-sm text-gray-600">{formatDate(ach.date)}</span>}
              </div>
              {ach.organization && <p className="text-sm text-gray-600">{ach.organization}</p>}
              {ach.description && <p className="text-sm text-gray-600 mt-1">{ach.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Volunteer */}
      {data.volunteer.some(v => v.organization) && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">VOLUNTEER & ACTIVITIES</h2>
          {data.volunteer.filter(v => v.organization).map((vol, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{vol.role || 'Volunteer'}</h3>
                  <p className="text-sm text-gray-600">{vol.organization}</p>
                </div>
                {(vol.startDate || vol.endDate) && (
                  <span className="text-sm text-gray-600">
                    {formatDate(vol.startDate)} - {formatDate(vol.endDate)}
                  </span>
                )}
              </div>
              {vol.description && <p className="text-sm text-gray-600 mt-1">{vol.description}</p>}
              {vol.impact && <p className="text-sm text-gray-600 mt-1"><strong>Impact:</strong> {vol.impact}</p>}
            </div>
          ))}
        </div>
      )}

      {!data.personal.fullName && !data.education[0].institution && !data.experience[0].company && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">Start filling out the form to see your CV preview here</p>
        </div>
      )}
    </div>
  );
};