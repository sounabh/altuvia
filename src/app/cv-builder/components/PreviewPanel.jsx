import React from "react";
import { Eye, Palette, Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";

const Label = ({ children, className }) => <span className={className}>{children}</span>;

const THEME_COLORS = [{ name: "Black", value: "#000000", light: "#f3f4f6" }];

const getSkillName = (skill) => {
  if (!skill) return "";
  if (typeof skill === "string") return skill.trim();
  if (typeof skill === "object") return skill.name || skill.value || skill.skill || skill.label || skill.title || "";
  return String(skill);
};

const stripHtmlTags = (text) => {
  if (!text) return "";
  if (typeof text !== "string") return String(text);
  return text
    .replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
};

const getSkillsList = (category) => {
  if (!category || !category.skills || !Array.isArray(category.skills)) return [];
  return category.skills.map((s) => getSkillName(s)).filter((n) => n.length > 0);
};

const normalizeFieldValue = (value) => {
  if (!value) return "";
  const cleaned = stripHtmlTags(value).trim();
  const placeholders = /^(other|n\/a|none|not specified|enter |your |add |\[.*\]|\(.*\))$/i;
  if (placeholders.test(cleaned)) return "";
  return cleaned;
};

const parseDateValue = (date) => {
  if (!date) return "";
  const s = String(date).trim();
  if (s.includes("T") || (s.length > 7 && s.includes("-") && s.split("-").length === 3)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${names[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    }
  }
  const parts = s.split("-");
  if (parts.length === 2 && parts[0].length === 4) {
    const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const m = parseInt(parts[1], 10);
    if (m >= 1 && m <= 12) return `${names[m - 1]} ${parts[0]}`;
    return parts[0];
  }
  if (/^\d{4}$/.test(s)) return s;
  return s;
};

export const PreviewPanel = ({ selectedTemplate, onTemplateChange, cvData = {}, themeColor = "#000000", onThemeColorChange }) => {
  const formatDate = (date) => parseDateValue(date);

  const renderDescription = (description) => {
    if (!description) return null;
    if (Array.isArray(description)) return description.map((i) => stripHtmlTags(i)).filter(Boolean);
    if (typeof description === "string") {
      let text = description;
      if (text.includes("<p>")) {
        const items = text.split(/<\/p>/i)
          .map((item) => item.replace(/<p[^>]*>/gi, "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/^[•\s]+/, "").trim())
          .filter((i) => i.length > 0);
        if (items.length > 0) return items;
      }
      if (text.includes("<li>")) {
        const items = text.split(/<\/li>/i)
          .map((item) => item.replace(/<li[^>]*>/gi, "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/^[•\-\s]+/, "").trim())
          .filter((i) => i.length > 0);
        if (items.length > 0) return items;
      }
      const clean = stripHtmlTags(text);
      const lines = clean.split("\n").filter((l) => l.trim()).map((l) => l.replace(/^[•\-]\s*/, "").trim()).filter(Boolean);
      if (lines.length > 1) return lines;
      if (clean.includes("•")) { const items = clean.split("•").map((i) => i.trim()).filter(Boolean); if (items.length > 1) return items; }
      return lines.length > 0 ? lines : null;
    }
    return null;
  };

  const safeData = {
    personal:     cvData.personal     || {},
    education:    Array.isArray(cvData.education)    ? cvData.education    : [],
    experience:   Array.isArray(cvData.experience)   ? cvData.experience   : [],
    skills:       Array.isArray(cvData.skills)       ? cvData.skills       : [],
    achievements: Array.isArray(cvData.achievements) ? cvData.achievements : [],
    volunteer:    Array.isArray(cvData.volunteer)    ? cvData.volunteer    : [],
  };

  const hasMeaningfulValue = (value) => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0 && value.some((i) => hasMeaningfulValue(i));
    const s = String(value).trim();
    if (s === "") return false;
    const bad = [/^[.\-\s]*$/,/^n\/a$/i,/^not specified$/i,/^enter /i,/^your /i,/^add /i,/^\[.*\]$/,/^\(.*\)$/,/^\[object Object\]$/i,/^other$/i];
    return !bad.some((p) => p.test(s));
  };

  const hasData = (section) => {
    if (!section || !Array.isArray(section)) return false;
    return section.some((item) => {
      if (!item || typeof item !== "object") return false;
      const f = { ...item }; delete f.id;
      return Object.values(f).some((v) => hasMeaningfulValue(v));
    });
  };

  const hasSectionData = (name) => {
    const section = safeData[name];
    if (!section) return false;
    if (name === "personal") {
      const { fullName, ...rest } = section;
      return hasMeaningfulValue(fullName) || Object.values(rest).some((v) => hasMeaningfulValue(v));
    }
    if (name === "skills") return section.some((c) => c.name || getSkillsList(c).length > 0);
    return hasData(section);
  };

  const hasContactInfo = () => {
    const { fullName, summary, ...fields } = safeData.personal;
    return Object.values(fields).some((v) => hasMeaningfulValue(v));
  };

  const hasSummary = () => hasMeaningfulValue(safeData.personal?.summary);

  const currentTheme = THEME_COLORS[0];

  const commonProps = {
    data: safeData, formatDate, hasSectionData, renderDescription,
    themeColor: currentTheme, hasContactInfo, hasSummary,
    getSkillsList, stripHtmlTags, normalizeFieldValue,
  };

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case "classic": return <ClassicPreview {...commonProps} />;
      case "minimal": return <MinimalPreview {...commonProps} />;
      default:        return <ModernPreview  {...commonProps} />;
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
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-3">
            <Palette className="w-4 h-4 text-gray-600" />
            <Label className="text-gray-700 text-sm">Template:</Label>
            <select value={selectedTemplate} onChange={(e) => onTemplateChange(e.target.value)}
              className="w-[150px] border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
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

// ─── Shared edu title helpers ─────────────────────────────────────────────────
const formatEduTitle = (edu, normalizeFieldValue) => {
  const degree = stripHtmlTags(edu.degree || "");
  const field  = normalizeFieldValue(edu.field || "");
  if (degree && field) return `${degree} in ${field}`;
  if (degree) return degree;
  if (field)  return field;
  return "";
};

const formatEduTitleClassic = (edu, normalizeFieldValue) => {
  const degree = stripHtmlTags(edu.degree || "");
  const field  = normalizeFieldValue(edu.field || "");
  if (degree && field) return `${degree}, ${field}`;
  if (degree) return degree;
  if (field)  return field;
  return "";
};

// ══════════════════════════════════════════════════════════════════════════════
// MODERN TEMPLATE  — centered header
// ══════════════════════════════════════════════════════════════════════════════
const ModernPreview = ({ data, formatDate, hasSectionData, renderDescription, themeColor, hasContactInfo, hasSummary, getSkillsList, stripHtmlTags, normalizeFieldValue }) => {

  const BulletList = ({ items }) => {
    const parsed = renderDescription(items);
    if (!parsed || parsed.length === 0) return null;
    return (
      <ul className="space-y-1.5 mt-2">
        {parsed.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full mt-[0.4em] flex-shrink-0" style={{ backgroundColor: themeColor.value }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  const SectionHeading = ({ label }) => (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] whitespace-nowrap" style={{ color: themeColor.value }}>
        {label}
      </h2>
      <div className="h-px flex-1" style={{ backgroundColor: `${themeColor.value}25` }} />
    </div>
  );

  const DateBadge = ({ text }) => (
    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded whitespace-nowrap ml-3 flex-shrink-0"
      style={{ backgroundColor: themeColor.light, color: "#555" }}>
      {text}
    </span>
  );

  const hasAdditional = hasSectionData("skills") || hasSectionData("achievements") || hasSectionData("volunteer");

  return (
    <div className="p-10 font-sans antialiased bg-white text-slate-800">

      {/* ── Header — centered ── */}
      <header className="text-center mb-7">
        <h1 className="text-[2.15rem] font-bold tracking-tight leading-none mb-3"
          style={{ color: themeColor.value }}>
          {data.personal?.fullName || "Your Name"}
        </h1>

        {hasContactInfo() && (
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-3">
            {data.personal?.email && (
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <Mail className="w-3 h-3 flex-shrink-0" style={{ color: themeColor.value }} />
                <span>{data.personal.email}</span>
              </div>
            )}
            {data.personal?.phone && (
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <Phone className="w-3 h-3 flex-shrink-0" style={{ color: themeColor.value }} />
                <span>{data.personal.phone}</span>
              </div>
            )}
            {data.personal?.location && (
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: themeColor.value }} />
                <span>{data.personal.location}</span>
              </div>
            )}
            {data.personal?.linkedin && (
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <Linkedin className="w-3 h-3 flex-shrink-0" style={{ color: themeColor.value }} />
                <span>{data.personal.linkedin}</span>
              </div>
            )}
            {data.personal?.website && (
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <Globe className="w-3 h-3 flex-shrink-0" style={{ color: themeColor.value }} />
                <span>{data.personal.website}</span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Symmetric fade divider */}
      <div className="h-px w-full mb-7"
        style={{ background: `linear-gradient(to right, transparent, ${themeColor.value}88, transparent)` }} />

      {/* ── 1. Professional Summary ── */}
      {hasSummary() && (
        <section className="mb-7">
          <SectionHeading label="Professional Summary" />
          <p className="text-[13px] text-slate-600 leading-relaxed">
            {stripHtmlTags(data.personal.summary)}
          </p>
        </section>
      )}

      {/* ── 2. Professional Experience ── */}
      {hasSectionData("experience") && (
        <section className="mb-7">
          <SectionHeading label="Professional Experience" />
          <div className="space-y-5">
            {data.experience.map((exp, i) =>
              (exp.company || exp.position) ? (
                <div key={i}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-[13.5px] font-semibold text-slate-900 leading-snug">{exp.position}</h3>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        {exp.company}{exp.location && <span className="text-slate-400"> &middot; {exp.location}</span>}
                      </p>
                    </div>
                    {(exp.startDate || exp.endDate) && (
                      <DateBadge text={`${formatDate(exp.startDate)} – ${exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}`} />
                    )}
                  </div>
                  {exp.description && <BulletList items={exp.description} />}
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* ── 3. Education ── */}
      {hasSectionData("education") && (
        <section className="mb-7">
          <SectionHeading label="Education" />
          <div className="space-y-4">
            {data.education.map((edu, i) =>
              (edu.institution || edu.degree || edu.field) ? (
                <div key={i}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-[13.5px] font-semibold text-slate-900 leading-snug">
                        {formatEduTitle(edu, normalizeFieldValue)}
                      </h3>
                      {edu.institution && <p className="text-[12px] text-slate-500 mt-0.5">{edu.institution}</p>}
                      {edu.gpa && <p className="text-[11.5px] text-slate-400 mt-0.5">GPA: {edu.gpa}</p>}
                    </div>
                    {(edu.startDate || edu.endDate) && (
                      <DateBadge text={`${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}`} />
                    )}
                  </div>
                  {edu.description && <BulletList items={edu.description} />}
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* ── Additional Information ── */}
      {hasAdditional && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">Additional Information</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {hasSectionData("skills") && (
            <div className="mb-6">
              <SectionHeading label="Skills" />
              <div className="grid grid-cols-2 gap-2.5">
                {data.skills.map((cat, i) => {
                  const list = getSkillsList(cat);
                  return (cat.name || list.length > 0) ? (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-md px-3 py-2.5">
                      {cat.name && <h4 className="text-[11.5px] font-semibold text-slate-700 mb-1">{stripHtmlTags(cat.name)}</h4>}
                      {list.length > 0 && <p className="text-[11px] text-slate-500 leading-relaxed">{list.join(" · ")}</p>}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {hasSectionData("achievements") && (
            <div className="mb-6">
              <SectionHeading label="Achievements" />
              <div className="space-y-3.5">
                {data.achievements.map((ach, i) =>
                  ach.title ? (
                    <div key={i}>
                      <div className="flex justify-between items-start">
                        <h3 className="text-[13px] font-semibold text-slate-900">{stripHtmlTags(ach.title)}</h3>
                        {ach.date && <span className="text-[11px] text-slate-400 ml-3 flex-shrink-0">{formatDate(ach.date)}</span>}
                      </div>
                      {ach.organization && <p className="text-[12px] text-slate-500 mt-0.5">{stripHtmlTags(ach.organization)}</p>}
                      {ach.description && <BulletList items={ach.description} />}
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          {hasSectionData("volunteer") && (
            <div>
              <SectionHeading label="Volunteer Experience" />
              <div className="space-y-4">
                {data.volunteer.map((vol, i) =>
                  (vol.organization || vol.role) ? (
                    <div key={i}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-[13.5px] font-semibold text-slate-900 leading-snug">{vol.role}</h3>
                          <p className="text-[12px] text-slate-500 mt-0.5">
                            {vol.organization}{vol.location && <span className="text-slate-400"> &middot; {vol.location}</span>}
                          </p>
                        </div>
                        {(vol.startDate || vol.endDate) && (
                          <DateBadge text={`${formatDate(vol.startDate)} – ${formatDate(vol.endDate)}`} />
                        )}
                      </div>
                      {vol.description && <BulletList items={vol.description} />}
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CLASSIC TEMPLATE  — centered header with icons, clean spacing
// ══════════════════════════════════════════════════════════════════════════════
const ClassicPreview = ({ data, formatDate, hasSectionData, renderDescription, themeColor, hasContactInfo, hasSummary, getSkillsList, stripHtmlTags, normalizeFieldValue }) => {

  const BulletList = ({ items }) => {
    const parsed = renderDescription(items);
    if (!parsed || parsed.length === 0) return null;
    return (
      <ul className="mt-1.5 space-y-1 pl-4">
        {parsed.map((item, i) => (
          <li key={i} className="relative pl-3 text-[12.5px] text-gray-700 leading-relaxed
            before:content-['▸'] before:absolute before:left-0 before:text-gray-400 before:text-[10px] before:top-[2px]">
            {item}
          </li>
        ))}
      </ul>
    );
  };

  const SectionHeading = ({ label }) => (
    <h2 className="text-[10.5px] font-bold uppercase tracking-[0.16em] border-b mb-3.5 pb-1.5"
      style={{ borderColor: themeColor.value, color: themeColor.value }}>{label}</h2>
  );

  const hasAdditional = hasSectionData("skills") || hasSectionData("achievements") || hasSectionData("volunteer");

  return (
    <div className="p-10 font-serif antialiased bg-white text-gray-900">

      {/* ── Header — centered, well-spaced, with icons ── */}
      <header className="text-center mb-8 pb-5 border-b-2" style={{ borderColor: themeColor.value }}>

        {/* Name */}
        <h1 className="text-[1.75rem] font-bold tracking-[0.08em] mb-4 leading-tight"
          style={{ color: themeColor.value }}>
          {(data.personal?.fullName || "Your Name").toUpperCase()}
        </h1>

        {hasContactInfo() && (
          <div className="space-y-2">
            {/* Row 1 — email & phone */}
            {(data.personal?.email || data.personal?.phone) && (
              <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1">
                {data.personal?.email && (
                  <span className="flex items-center gap-1.5 text-[11.5px] text-gray-500">
                    <Mail className="w-3 h-3 flex-shrink-0" style={{ color: themeColor.value }} />
                    {data.personal.email}
                  </span>
                )}
                {data.personal?.email && data.personal?.phone && (
                  <span className="text-gray-300 text-[10px] select-none">·</span>
                )}
                {data.personal?.phone && (
                  <span className="flex items-center gap-1.5 text-[11.5px] text-gray-500">
                    <Phone className="w-3 h-3 flex-shrink-0" style={{ color: themeColor.value }} />
                    {data.personal.phone}
                  </span>
                )}
              </div>
            )}

            {/* Row 2 — location, linkedin, website */}
            {(data.personal?.location || data.personal?.linkedin || data.personal?.website) && (
              <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1">
                {data.personal?.location && (
                  <span className="flex items-center gap-1.5 text-[11.5px] text-gray-500">
                    <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: themeColor.value }} />
                    {data.personal.location}
                  </span>
                )}
                {data.personal?.location && (data.personal?.linkedin || data.personal?.website) && (
                  <span className="text-gray-300 text-[10px] select-none">·</span>
                )}
                {data.personal?.linkedin && (
                  <span className="flex items-center gap-1.5 text-[11.5px] text-gray-500">
                    <Linkedin className="w-3 h-3 flex-shrink-0" style={{ color: themeColor.value }} />
                    {data.personal.linkedin}
                  </span>
                )}
                {data.personal?.linkedin && data.personal?.website && (
                  <span className="text-gray-300 text-[10px] select-none">·</span>
                )}
                {data.personal?.website && (
                  <span className="flex items-center gap-1.5 text-[11.5px] text-gray-500">
                    <Globe className="w-3 h-3 flex-shrink-0" style={{ color: themeColor.value }} />
                    {data.personal.website}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── 1. Professional Summary ── */}
      {hasSummary() && (
        <section className="mb-5">
          <SectionHeading label="Professional Summary" />
          <p className="text-[12.5px] leading-relaxed text-justify text-gray-700">
            {stripHtmlTags(data.personal.summary)}
          </p>
        </section>
      )}

      {/* ── 2. Professional Experience ── */}
      {hasSectionData("experience") && (
        <section className="mb-5">
          <SectionHeading label="Professional Experience" />
          <div className="space-y-4">
            {data.experience.map((exp, i) =>
              (exp.company || exp.position) ? (
                <div key={i}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[13px] font-bold text-gray-900">{exp.position}</span>
                    {(exp.startDate || exp.endDate) && (
                      <span className="text-[11.5px] text-gray-500 whitespace-nowrap ml-4">
                        {formatDate(exp.startDate)} – {exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] italic text-gray-500 mt-0.5 mb-1">
                    {exp.company}{exp.location && `, ${exp.location}`}
                  </p>
                  {exp.description && <BulletList items={exp.description} />}
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* ── 3. Education ── */}
      {hasSectionData("education") && (
        <section className="mb-5">
          <SectionHeading label="Education" />
          <div className="space-y-3">
            {data.education.map((edu, i) =>
              (edu.institution || edu.degree || edu.field) ? (
                <div key={i}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[13px] font-bold text-gray-900">
                      {formatEduTitleClassic(edu, normalizeFieldValue)}
                    </span>
                    {(edu.startDate || edu.endDate) && (
                      <span className="text-[11.5px] text-gray-500 whitespace-nowrap ml-4">
                        {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                      </span>
                    )}
                  </div>
                  {edu.institution && <p className="text-[12px] italic text-gray-500 mt-0.5">{edu.institution}</p>}
                  {edu.gpa && <p className="text-[12px] text-gray-600 mt-0.5"><span className="font-semibold">GPA:</span> {edu.gpa}</p>}
                  {edu.description && <BulletList items={edu.description} />}
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* ── Additional Information ── */}
      {hasAdditional && (
        <>
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-gray-400">Additional Information</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {hasSectionData("skills") && (
            <section className="mb-5">
              <SectionHeading label="Skills" />
              <div className="text-[12.5px] text-gray-700 space-y-1.5">
                {data.skills.map((cat, i) => {
                  const list = getSkillsList(cat);
                  return (cat.name || list.length > 0) ? (
                    <p key={i}>
                      {cat.name && <span className="font-semibold text-gray-900">{stripHtmlTags(cat.name)}: </span>}
                      <span className="text-gray-600">{list.join(", ")}</span>
                    </p>
                  ) : null;
                })}
              </div>
            </section>
          )}

          {hasSectionData("achievements") && (
            <section className="mb-5">
              <SectionHeading label="Achievements" />
              <div className="space-y-3">
                {data.achievements.map((ach, i) =>
                  ach.title ? (
                    <div key={i}>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[13px] font-bold text-gray-900">{stripHtmlTags(ach.title)}</span>
                        {ach.date && <span className="text-[11.5px] text-gray-500 ml-4 flex-shrink-0">{formatDate(ach.date)}</span>}
                      </div>
                      {ach.organization && <p className="text-[12px] italic text-gray-500 mt-0.5">{stripHtmlTags(ach.organization)}</p>}
                      {ach.description && <BulletList items={ach.description} />}
                    </div>
                  ) : null
                )}
              </div>
            </section>
          )}

          {hasSectionData("volunteer") && (
            <section>
              <SectionHeading label="Volunteer Experience" />
              <div className="space-y-3">
                {data.volunteer.map((vol, i) =>
                  (vol.organization || vol.role) ? (
                    <div key={i}>
                      <div className="flex justify-between items-baseline">
                        <span className="text-[13px] font-bold text-gray-900">{vol.role}</span>
                        {(vol.startDate || vol.endDate) && (
                          <span className="text-[11.5px] text-gray-500 whitespace-nowrap ml-4">
                            {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] italic text-gray-500 mt-0.5 mb-1">
                        {vol.organization}{vol.location && `, ${vol.location}`}
                      </p>
                      {vol.description && <BulletList items={vol.description} />}
                    </div>
                  ) : null
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MINIMAL TEMPLATE  — centered header
// ══════════════════════════════════════════════════════════════════════════════
const MinimalPreview = ({ data, formatDate, hasSectionData, renderDescription, themeColor, hasContactInfo, hasSummary, getSkillsList, stripHtmlTags, normalizeFieldValue }) => {

  const BulletList = ({ items }) => {
    const parsed = renderDescription(items);
    if (!parsed || parsed.length === 0) return null;
    return (
      <ul className="mt-2.5 space-y-1.5">
        {parsed.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-[12.5px] text-gray-500 leading-relaxed">
            <span className="text-gray-300 flex-shrink-0 mt-0.5 text-xs">—</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  const SectionHeading = ({ label }) => (
    <h2 className="text-[9.5px] uppercase tracking-[0.3em] text-gray-400 mb-4 font-medium">{label}</h2>
  );

  const hasAdditional = hasSectionData("skills") || hasSectionData("achievements") || hasSectionData("volunteer");

  return (
    <div className="p-12 font-sans antialiased bg-white" style={{ fontWeight: 300 }}>

      {/* ── Header — centered ── */}
      <header className="text-center mb-9">
        <h1 className="text-[2.6rem] font-extralight tracking-tight leading-none mb-1"
          style={{ color: themeColor.value }}>
          {data.personal?.fullName || "Your Name"}
        </h1>

        {hasContactInfo() && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11.5px] text-gray-400 mt-4">
            {data.personal?.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 flex-shrink-0 text-gray-300" />
                {data.personal.email}
              </span>
            )}
            {data.personal?.email && data.personal?.phone && <span className="text-gray-200 select-none">|</span>}
            {data.personal?.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 flex-shrink-0 text-gray-300" />
                {data.personal.phone}
              </span>
            )}
            {data.personal?.phone && data.personal?.location && <span className="text-gray-200 select-none">|</span>}
            {data.personal?.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 flex-shrink-0 text-gray-300" />
                {data.personal.location}
              </span>
            )}
            {data.personal?.location && data.personal?.linkedin && <span className="text-gray-200 select-none">|</span>}
            {data.personal?.linkedin && (
              <span className="flex items-center gap-1.5">
                <Linkedin className="w-3 h-3 flex-shrink-0 text-gray-300" />
                {data.personal.linkedin}
              </span>
            )}
            {data.personal?.linkedin && data.personal?.website && <span className="text-gray-200 select-none">|</span>}
            {data.personal?.website && (
              <span className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 flex-shrink-0 text-gray-300" />
                {data.personal.website}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Centered short rule */}
      <div className="flex justify-center mb-9">
        <div className="w-12 h-px" style={{ backgroundColor: themeColor.value }} />
      </div>

      {/* ── 1. Summary ── */}
      {hasSummary() && (
        <section className="mb-9">
          <SectionHeading label="Summary" />
          <p className="text-[12.5px] text-gray-500 leading-loose max-w-2xl font-light">
            {stripHtmlTags(data.personal.summary)}
          </p>
        </section>
      )}

      {/* ── 2. Professional Experience ── */}
      {hasSectionData("experience") && (
        <section className="mb-9">
          <SectionHeading label="Professional Experience" />
          <div className="space-y-6">
            {data.experience.map((exp, i) =>
              (exp.company || exp.position) ? (
                <div key={i}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-[13.5px] font-normal text-gray-800">{exp.position}</h3>
                    {(exp.startDate || exp.endDate) && (
                      <span className="text-[11px] text-gray-400 whitespace-nowrap ml-4">
                        {formatDate(exp.startDate)} — {exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {exp.company}{exp.location && <span className="text-gray-300"> · {exp.location}</span>}
                  </p>
                  {exp.description && <BulletList items={exp.description} />}
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* ── 3. Education ── */}
      {hasSectionData("education") && (
        <section className="mb-9">
          <SectionHeading label="Education" />
          <div className="space-y-5">
            {data.education.map((edu, i) =>
              (edu.institution || edu.degree || edu.field) ? (
                <div key={i}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-[13.5px] font-normal text-gray-800">
                      {formatEduTitle(edu, normalizeFieldValue)}
                    </h3>
                    {(edu.startDate || edu.endDate) && (
                      <span className="text-[11px] text-gray-400 whitespace-nowrap ml-4">
                        {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                      </span>
                    )}
                  </div>
                  {edu.institution && <p className="text-[12px] text-gray-400 mt-0.5">{edu.institution}</p>}
                  {edu.gpa && <p className="text-[11.5px] text-gray-300 mt-0.5">GPA: {edu.gpa}</p>}
                  {edu.description && <BulletList items={edu.description} />}
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* ── Additional Information ── */}
      {hasAdditional && (
        <>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[8.5px] uppercase tracking-[0.4em] text-gray-300 font-medium">Additional Information</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {hasSectionData("skills") && (
            <section className="mb-9">
              <SectionHeading label="Skills" />
              <div className="space-y-2.5 text-[12.5px]">
                {data.skills.map((cat, i) => {
                  const list = getSkillsList(cat);
                  return (cat.name || list.length > 0) ? (
                    <div key={i} className="flex gap-4">
                      <span className="w-28 text-gray-400 flex-shrink-0 font-light">{stripHtmlTags(cat.name)}</span>
                      <span className="text-gray-500 font-light">{list.join(", ")}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </section>
          )}

          {hasSectionData("achievements") && (
            <section className="mb-9">
              <SectionHeading label="Achievements" />
              <div className="space-y-4">
                {data.achievements.map((ach, i) =>
                  ach.title ? (
                    <div key={i}>
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-[13.5px] font-normal text-gray-800">{stripHtmlTags(ach.title)}</h3>
                        {ach.date && <span className="text-[11px] text-gray-400 ml-4 flex-shrink-0">{formatDate(ach.date)}</span>}
                      </div>
                      {ach.organization && <p className="text-[12px] text-gray-400 mt-0.5">{stripHtmlTags(ach.organization)}</p>}
                      {ach.description && <BulletList items={ach.description} />}
                    </div>
                  ) : null
                )}
              </div>
            </section>
          )}

          {hasSectionData("volunteer") && (
            <section>
              <SectionHeading label="Volunteer Experience" />
              <div className="space-y-5">
                {data.volunteer.map((vol, i) =>
                  (vol.organization || vol.role) ? (
                    <div key={i}>
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-[13.5px] font-normal text-gray-800">{vol.role}</h3>
                        {(vol.startDate || vol.endDate) && (
                          <span className="text-[11px] text-gray-400 whitespace-nowrap ml-4">
                            {formatDate(vol.startDate)} — {formatDate(vol.endDate)}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-400 mt-0.5">
                        {vol.organization}{vol.location && <span className="text-gray-300"> · {vol.location}</span>}
                      </p>
                      {vol.description && <BulletList items={vol.description} />}
                    </div>
                  ) : null
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default PreviewPanel;