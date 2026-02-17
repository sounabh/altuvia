// app/api/cv/export-pdf/route.js

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ============================================
// CONSTANTS
// ============================================

const HTML_PATTERNS = {
  tags: /<[^>]*>/g,
  listItems: /<li[^>]*>([\s\S]*?)<\/li>/gi,
  paragraphs: /<p[^>]*>([\s\S]*?)<\/p>/gi,
  lineBreaks: /<br\s*\/?>/gi,
  nbsp: /&nbsp;/g,
  amp: /&amp;/g,
  lt: /&lt;/g,
  gt: /&gt;/g,
  quot: /&quot;/g,
  apos: /&#39;/g,
  whitespace: /\s+/g,
};

const PLACEHOLDER_PATTERNS = [
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

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DEFAULTS = {
  templateId: "modern",
  themeColor: "#000000",
};

const PAGE = {
  width: 612,
  height: 792,
  margin: 50,
};

// ============================================
// API ROUTE HANDLERS
// ============================================

export async function POST(request) {
  try {
    const body = await request.json();
    const { cvData, templateId, cvNumber, themeColor } = body;

    if (!cvData) {
      return NextResponse.json({ error: "CV data is required" }, { status: 400 });
    }

    const pdf = await generatePDF(
      cvData,
      templateId || DEFAULTS.templateId,
      themeColor || DEFAULTS.themeColor
    );

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=CV-${cvNumber || Date.now()}.pdf`,
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to export PDF", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cvId = searchParams.get("cvId");
    const versionId = searchParams.get("versionId");

    let cvData;
    let templateId = DEFAULTS.templateId;
    let themeColor = DEFAULTS.themeColor;
    let fileName = `CV-${Date.now()}`;

    if (versionId) {
      const version = await prisma.cVVersion.findUnique({
        where: { id: versionId },
      });
      if (!version) {
        return NextResponse.json({ error: "Version not found" }, { status: 404 });
      }
      cvData = {
        personal: JSON.parse(version.personalInfoSnapshot || "{}"),
        education: JSON.parse(version.educationSnapshot || "[]"),
        experience: JSON.parse(version.experienceSnapshot || "[]"),
        projects: JSON.parse(version.projectsSnapshot || "[]"),
        skills: JSON.parse(version.skillsSnapshot || "[]"),
        achievements: JSON.parse(version.achievementsSnapshot || "[]"),
        volunteer: JSON.parse(version.volunteerSnapshot || "[]"),
      };
      templateId = version.templateId || DEFAULTS.templateId;
      themeColor = version.colorScheme || DEFAULTS.themeColor;
      fileName = `CV-${version.versionLabel.replace(/\s+/g, "-")}`;
    } else if (cvId) {
      const cv = await prisma.cV.findUnique({
        where: { id: cvId },
        include: {
          personalInfo: true,
          educations: true,
          experiences: true,
          projects: true,
          skills: true,
          achievements: true,
          volunteers: true,
        },
      });
      if (!cv) {
        return NextResponse.json({ error: "CV not found" }, { status: 404 });
      }
      cvData = {
        personal: cv.personalInfo,
        education: cv.educations,
        experience: cv.experiences,
        projects: cv.projects,
        skills: cv.skills,
        achievements: cv.achievements,
        volunteer: cv.volunteers,
      };
      templateId = cv.templateId || DEFAULTS.templateId;
      themeColor = cv.colorScheme || DEFAULTS.themeColor;
      fileName = `CV-${cv.cvNumber}`;
    } else {
      return NextResponse.json(
        { error: "CV ID or Version ID is required" },
        { status: 400 }
      );
    }

    const pdf = await generatePDF(cvData, templateId, themeColor);

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${fileName}.pdf`,
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to export PDF", details: error.message },
      { status: 500 }
    );
  }
}

// ============================================
// TEXT UTILITIES
// ============================================

const stripHtmlTags = (text) => {
  if (!text) return "";
  if (typeof text !== "string") return String(text);
  return text
    .replace(HTML_PATTERNS.lineBreaks, " ")
    .replace(HTML_PATTERNS.tags, "")
    .replace(HTML_PATTERNS.nbsp, " ")
    .replace(HTML_PATTERNS.amp, "&")
    .replace(HTML_PATTERNS.lt, "<")
    .replace(HTML_PATTERNS.gt, ">")
    .replace(HTML_PATTERNS.quot, '"')
    .replace(HTML_PATTERNS.apos, "'")
    .replace(HTML_PATTERNS.whitespace, " ")
    .trim();
};

const parseDescription = (description) => {
  if (!description) return [];

  if (Array.isArray(description)) {
    return description
      .map((item) => stripHtmlTags(item))
      .filter((item) => item && item.trim().length > 0);
  }

  const descString = String(description);

  // 1. Extract <li> items
  const bullets = [];
  let match;
  HTML_PATTERNS.listItems.lastIndex = 0;
  while ((match = HTML_PATTERNS.listItems.exec(descString)) !== null) {
    const clean = stripHtmlTags(match[1]).trim();
    if (clean.length > 0) bullets.push(clean);
  }
  if (bullets.length > 0) return bullets;

  // 2. Extract <p> items
  const pItems = [];
  HTML_PATTERNS.paragraphs.lastIndex = 0;
  while ((match = HTML_PATTERNS.paragraphs.exec(descString)) !== null) {
    let cleaned = match[1]
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    cleaned = cleaned.replace(/^[•●○◦▪▸►\s]+/, "").trim();
    if (cleaned.length > 0) pItems.push(cleaned);
  }
  if (pItems.length > 0) return pItems;

  // 3. Handle <br> separated content
  const withNewlines = descString
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  if (!withNewlines.trim()) return [];

  // 4. Split by newlines
  const lines = withNewlines.split(/\n+/);
  const result = [];
  for (const line of lines) {
    const trimmed = line
      .replace(/^\s*[•●○◦▪▸►]\s*/, "")
      .replace(/^\s*[-–—]\s+/, "")
      .replace(/^\s*\*\s+/, "")
      .replace(/^\s*\d+[.)]\s+/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (trimmed.length > 0) result.push(trimmed);
  }
  if (result.length > 0) return result;

  const singleClean = withNewlines.replace(/\s+/g, " ").trim();
  return singleClean ? [singleClean] : [];
};

const hasMeaningfulValue = (value) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value))
    return value.length > 0 && value.some((i) => hasMeaningfulValue(i));
  if (typeof value === "object") {
    const obj = { ...value };
    delete obj.id;
    return Object.values(obj).some((v) => hasMeaningfulValue(v));
  }
  const str = stripHtmlTags(String(value));
  if (str === "") return false;
  return !PLACEHOLDER_PATTERNS.some((p) => p.test(str));
};

const getSkillName = (skill) => {
  if (!skill) return "";
  if (typeof skill === "string") return stripHtmlTags(skill);
  if (typeof skill === "object")
    return stripHtmlTags(
      skill.name || skill.value || skill.skill || skill.label || skill.title || ""
    );
  return stripHtmlTags(String(skill));
};

const getSkillsList = (category) => {
  if (!category?.skills || !Array.isArray(category.skills)) return [];
  return category.skills.map((s) => getSkillName(s)).filter((n) => n.length > 0);
};

const formatDate = (date) => {
  if (!date) return "";
  if (date.includes("T")) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    }
  }
  const parts = date.split("-");
  if (parts.length < 2) return date;
  const monthIndex = parseInt(parts[1]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return date;
  return `${MONTH_NAMES[monthIndex]} ${parts[0]}`;
};

// Section validators
const hasEducationData = (d) =>
  Array.isArray(d) &&
  d.some(
    (e) =>
      hasMeaningfulValue(e.institution) ||
      hasMeaningfulValue(e.degree) ||
      hasMeaningfulValue(e.field)
  );
const hasExperienceData = (d) =>
  Array.isArray(d) &&
  d.some((e) => hasMeaningfulValue(e.company) || hasMeaningfulValue(e.position));
const hasSkillsData = (d) =>
  Array.isArray(d) &&
  d.some((c) => hasMeaningfulValue(c.name) || getSkillsList(c).length > 0);
const hasAchievementsData = (d) =>
  Array.isArray(d) && d.some((a) => hasMeaningfulValue(a.title));
const hasVolunteerData = (d) =>
  Array.isArray(d) &&
  d.some((v) => hasMeaningfulValue(v.organization) || hasMeaningfulValue(v.role));

// ============================================
// TEXT WRAP UTILITY
// ============================================

function createWrapText(stripFn) {
  return (text, font, size, maxWidth) => {
    if (!text) return [];
    const clean = stripFn(text.toString());
    const words = clean.split(/\s+/).filter((w) => w);
    if (words.length === 0) return [];
    const lines = [];
    let cur = "";
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && cur) {
        lines.push(cur);
        cur = word;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };
}

// ============================================
// PDF GENERATION ENTRY POINT
// ============================================

async function generatePDF(cvData, templateId, themeColor) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const pdfDoc = await PDFDocument.create();

  const fonts = {
    helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
    helveticaBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    helveticaOblique: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    timesRoman: await pdfDoc.embedFont(StandardFonts.TimesRoman),
    timesRomanBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    timesRomanItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
  };

  const hexToRgb = (hex) => {
    if (!hex) return { r: 0, g: 0, b: 0 };
    const cleaned = hex.replace("#", "");
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleaned);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  };

  const themeRgb = hexToRgb(themeColor);
  const primaryColor = rgb(themeRgb.r, themeRgb.g, themeRgb.b);

  const utils = {
    ...fonts,
    primaryColor,
    formatDate,
    rgb,
    stripHtmlTags,
    parseDescription,
    getSkillsList,
    hasMeaningfulValue,
  };

  switch (templateId) {
    case "classic":
      return generateClassicTemplate(pdfDoc, cvData, utils);
    case "minimal":
      return generateMinimalTemplate(pdfDoc, cvData, utils);
    case "modern":
    default:
      return generateModernTemplate(pdfDoc, cvData, utils);
  }
}

// ============================================
// MODERN TEMPLATE
// Centered header · clean section headers with small square accent
// Professional MBA-grade spacing and typography
// ============================================

async function generateModernTemplate(pdfDoc, cvData, utils) {
  const {
    helvetica,
    helveticaBold,
    primaryColor,
    formatDate,
    rgb,
    stripHtmlTags,
    parseDescription,
    getSkillsList,
    hasMeaningfulValue,
  } = utils;

  const pageWidth  = PAGE.width;
  const pageHeight = PAGE.height;
  const margin     = PAGE.margin;
  const contentWidth = pageWidth - 2 * margin;
  const centerX      = pageWidth / 2;
  const rightEdge    = pageWidth - margin;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y    = pageHeight - margin;

  const C = {
    black:     rgb(0,    0,    0),
    heading:   rgb(0.05, 0.05, 0.05),
    body:      rgb(0.15, 0.15, 0.15),
    secondary: rgb(0.30, 0.30, 0.30),
    muted:     rgb(0.45, 0.45, 0.45),
    light:     rgb(0.60, 0.60, 0.60),
    border:    rgb(0.78, 0.78, 0.78),
    veryLight: rgb(0.88, 0.88, 0.88),
  };

  const wrapText = createWrapText(stripHtmlTags);

  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const ensureSpace = (needed) => {
    if (y - needed < margin + 20) addNewPage();
  };

  // Right-aligned date badge (matches preview DateBadge)
  const drawDateRight = (dateText, yPos) => {
    if (!dateText) return;
    const size = 8.5;
    const w    = helvetica.widthOfTextAtSize(dateText, size);
    const pad  = 5;
    const bx   = rightEdge - w - pad * 2;
    const bh   = 11;
    // subtle pill background
    page.drawRectangle({
      x: bx,
      y: yPos - 2,
      width: w + pad * 2,
      height: bh,
      color: C.veryLight,
    });
    page.drawText(dateText, {
      x: bx + pad,
      y: yPos,
      size,
      font: helvetica,
      color: C.muted,
    });
  };

  // Section header: small square accent + bold uppercase label + thin rule
  const drawSectionHeader = (title) => {
    ensureSpace(28);
    y -= 10;

    // Tiny filled square (matches preview theme dot)
    page.drawRectangle({
      x: margin,
      y: y - 0.5,
      width: 4.5,
      height: 4.5,
      color: primaryColor,
    });

    page.drawText(title.toUpperCase(), {
      x: margin + 10,
      y: y - 1,
      size: 9,
      font: helveticaBold,
      color: C.heading,
    });

    const titleW = helveticaBold.widthOfTextAtSize(title.toUpperCase(), 9);
    page.drawLine({
      start: { x: margin + 10 + titleW + 6, y: y + 1.5 },
      end:   { x: rightEdge,               y: y + 1.5 },
      thickness: 0.5,
      color: C.border,
    });

    y -= 16;
  };

  // "ADDITIONAL INFORMATION" centered divider
  const drawAdditionalDivider = () => {
    ensureSpace(36);
    y -= 18;
    const label  = "ADDITIONAL INFORMATION";
    const size   = 7;
    const labelW = helvetica.widthOfTextAtSize(label, size);
    const gap    = 10;
    const lx     = centerX - labelW / 2;

    page.drawLine({
      start: { x: margin, y },
      end:   { x: lx - gap, y },
      thickness: 0.4,
      color: C.veryLight,
    });
    page.drawText(label, {
      x: lx,
      y: y - 2.5,
      size,
      font: helvetica,
      color: C.light,
    });
    page.drawLine({
      start: { x: lx + labelW + gap, y },
      end:   { x: rightEdge,         y },
      thickness: 0.4,
      color: C.veryLight,
    });
    y -= 16;
  };

  // Bullet list helper
  const drawBullets = (items, x) => {
    const textX = x + 11;
    const maxW  = contentWidth - (textX - margin);
    for (const item of items) {
      if (!item) continue;
      const clean = stripHtmlTags(item);
      if (!clean) continue;
      const lines = wrapText(clean, helvetica, 9.5, maxW);
      lines.forEach((line, idx) => {
        ensureSpace(13);
        if (idx === 0) {
          // Small filled circle bullet
          page.drawCircle({ x: x + 3.5, y: y - 2.5, size: 1.6, color: C.muted });
        }
        page.drawText(line, { x: textX, y, size: 9.5, font: helvetica, color: C.body });
        y -= 12;
      });
      y -= 1;
    }
  };

  // ── HEADER (CENTERED) ──────────────────────────────────────────────────────

  ensureSpace(90);

  // Name — large, centered, bold
  const fullName = stripHtmlTags(cvData.personal?.fullName) || "Your Name";
  const nameSize = 26;
  const nameW    = helveticaBold.widthOfTextAtSize(fullName, nameSize);
  page.drawText(fullName, {
    x: centerX - nameW / 2,
    y,
    size: nameSize,
    font: helveticaBold,
    color: primaryColor,
  });
  y -= nameSize + 7;

  // Headline / title — centered, medium weight
  if (hasMeaningfulValue(cvData.personal?.headline)) {
    const hl  = stripHtmlTags(cvData.personal.headline);
    const hlW = helvetica.widthOfTextAtSize(hl, 11);
    page.drawText(hl, {
      x: centerX - hlW / 2,
      y,
      size: 11,
      font: helvetica,
      color: C.secondary,
    });
    y -= 16;
  }

  // Contact line — centered, smaller, separated by bullets
  const contactItems = [];
  if (hasMeaningfulValue(cvData.personal?.email))    contactItems.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone))    contactItems.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location)) contactItems.push(stripHtmlTags(cvData.personal.location));
  if (hasMeaningfulValue(cvData.personal?.linkedin)) contactItems.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website))  contactItems.push(stripHtmlTags(cvData.personal.website));

  if (contactItems.length > 0) {
    const contactText  = contactItems.join("  •  ");
    const contactLines = wrapText(contactText, helvetica, 9, contentWidth - 60);
    for (const line of contactLines) {
      const lw = helvetica.widthOfTextAtSize(line, 9);
      page.drawText(line, {
        x: centerX - lw / 2,
        y,
        size: 9,
        font: helvetica,
        color: C.muted,
      });
      y -= 12;
    }
    y -= 4;
  }

  // Full-width rule under header
  page.drawLine({
    start: { x: margin, y },
    end:   { x: rightEdge, y },
    thickness: 1.2,
    color: primaryColor,
  });
  y -= 18;

  // ── 1. PROFESSIONAL SUMMARY ────────────────────────────────────────────────

  if (hasMeaningfulValue(cvData.personal?.summary)) {
    drawSectionHeader("Professional Summary");
    const lines = wrapText(stripHtmlTags(cvData.personal.summary), helvetica, 10, contentWidth);
    for (const line of lines) {
      ensureSpace(13);
      page.drawText(line, { x: margin, y, size: 10, font: helvetica, color: C.body });
      y -= 13;
    }
    y -= 6;
  }

  // ── 2. PROFESSIONAL EXPERIENCE ────────────────────────────────────────────

  if (hasExperienceData(cvData.experience)) {
    drawSectionHeader("Professional Experience");

    for (const exp of cvData.experience) {
      const hasCo  = hasMeaningfulValue(exp.company);
      const hasPos = hasMeaningfulValue(exp.position);
      if (!hasCo && !hasPos) continue;
      ensureSpace(42);

      let dateStr = "";
      if (exp.startDate || exp.endDate || exp.isCurrentRole)
        dateStr = `${formatDate(exp.startDate)} – ${exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}`;

      // Position — bold, left
      if (hasPos) {
        const dateW = dateStr ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 26 : 0;
        const lines = wrapText(stripHtmlTags(exp.position), helveticaBold, 11, contentWidth - dateW);
        lines.forEach((l, i) => {
          page.drawText(l, { x: margin, y: y - i * 13, size: 11, font: helveticaBold, color: C.heading });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      // Company + location — secondary
      if (hasCo) {
        let co = stripHtmlTags(exp.company);
        if (hasMeaningfulValue(exp.location)) co += `  ·  ${stripHtmlTags(exp.location)}`;
        page.drawText(co, { x: margin, y, size: 10, font: helvetica, color: C.secondary });
        y -= 13;
      }

      // Bullets
      if (hasMeaningfulValue(exp.description)) {
        const items = parseDescription(exp.description);
        if (items.length > 0) { y -= 1; drawBullets(items, margin + 4); }
      }
      y -= 7;
    }
    y -= 2;
  }

  // ── 3. EDUCATION ──────────────────────────────────────────────────────────

  if (hasEducationData(cvData.education)) {
    drawSectionHeader("Education");

    for (const edu of cvData.education) {
      const hasInst  = hasMeaningfulValue(edu.institution);
      const hasDeg   = hasMeaningfulValue(edu.degree);
      const hasField = hasMeaningfulValue(edu.field);
      if (!hasInst && !hasDeg && !hasField) continue;
      ensureSpace(38);

      let degText = "";
      if (hasDeg && hasField) degText = `${stripHtmlTags(edu.degree)} in ${stripHtmlTags(edu.field)}`;
      else if (hasDeg)        degText = stripHtmlTags(edu.degree);
      else if (hasField)      degText = stripHtmlTags(edu.field);

      let dateStr = "";
      if (edu.startDate || edu.endDate)
        dateStr = `${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}`;

      if (degText) {
        const dateW = dateStr ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 26 : 0;
        const lines = wrapText(degText, helveticaBold, 11, contentWidth - dateW);
        lines.forEach((l, i) => {
          page.drawText(l, { x: margin, y: y - i * 13, size: 11, font: helveticaBold, color: C.heading });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasInst) {
        page.drawText(stripHtmlTags(edu.institution), { x: margin, y, size: 10, font: helvetica, color: C.secondary });
        y -= 13;
      }

      if (hasMeaningfulValue(edu.gpa)) {
        page.drawText(`GPA: ${stripHtmlTags(edu.gpa)}`, { x: margin, y, size: 9.5, font: helvetica, color: C.muted });
        y -= 12;
      }

      if (hasMeaningfulValue(edu.description)) {
        const items = parseDescription(edu.description);
        if (items.length > 0) { y -= 2; drawBullets(items, margin + 4); }
      }
      y -= 7;
    }
    y -= 2;
  }

  // ── ADDITIONAL INFORMATION DIVIDER ────────────────────────────────────────

  const hasAdditional =
    hasSkillsData(cvData.skills) ||
    hasAchievementsData(cvData.achievements) ||
    hasVolunteerData(cvData.volunteer);

  if (hasAdditional) drawAdditionalDivider();

  // ── 4. SKILLS ─────────────────────────────────────────────────────────────

  if (hasSkillsData(cvData.skills)) {
    drawSectionHeader("Skills");

    for (const category of cvData.skills) {
      const list    = getSkillsList(category);
      const hasName = hasMeaningfulValue(category.name);
      if (!hasName && list.length === 0) continue;
      ensureSpace(16);

      const catLabel = `${stripHtmlTags(category.name) || "Skills"}: `;
      const labelW   = helveticaBold.widthOfTextAtSize(catLabel, 10);

      page.drawText(catLabel, { x: margin, y, size: 10, font: helveticaBold, color: C.heading });

      if (list.length > 0) {
        const skillLines = wrapText(list.join(", "), helvetica, 10, contentWidth - labelW - 4);
        const startY = y;
        skillLines.forEach((l, i) => {
          page.drawText(l, { x: margin + labelW, y: startY - i * 12, size: 10, font: helvetica, color: C.body });
        });
        y = startY - skillLines.length * 12 - 4;
      } else {
        y -= 14;
      }
    }
    y -= 4;
  }

  // ── 5. ACHIEVEMENTS ───────────────────────────────────────────────────────

  if (hasAchievementsData(cvData.achievements)) {
    drawSectionHeader("Achievements");

    for (const ach of cvData.achievements) {
      if (!hasMeaningfulValue(ach.title)) continue;
      ensureSpace(30);

      let dateW = 0;
      if (hasMeaningfulValue(ach.date))
        dateW = helvetica.widthOfTextAtSize(formatDate(ach.date), 8.5) + 26;

      const tLines = wrapText(stripHtmlTags(ach.title), helveticaBold, 11, contentWidth - dateW);
      tLines.forEach((l, i) => {
        page.drawText(l, { x: margin, y: y - i * 13, size: 11, font: helveticaBold, color: C.heading });
      });
      if (tLines.length > 1) y -= (tLines.length - 1) * 13;
      if (hasMeaningfulValue(ach.date)) drawDateRight(formatDate(ach.date), y);
      y -= 14;

      if (hasMeaningfulValue(ach.organization)) {
        page.drawText(stripHtmlTags(ach.organization), { x: margin, y, size: 10, font: helvetica, color: C.secondary });
        y -= 13;
      }

      if (hasMeaningfulValue(ach.description)) {
        const items = parseDescription(ach.description);
        if (items.length > 0) { y -= 2; drawBullets(items, margin + 4); }
      }
      y -= 7;
    }
    y -= 2;
  }

  // ── 6. VOLUNTEER ──────────────────────────────────────────────────────────

  if (hasVolunteerData(cvData.volunteer)) {
    drawSectionHeader("Volunteer Experience");

    for (const vol of cvData.volunteer) {
      const hasOrg  = hasMeaningfulValue(vol.organization);
      const hasRole = hasMeaningfulValue(vol.role);
      if (!hasOrg && !hasRole) continue;
      ensureSpace(38);

      let dateStr = "";
      if (vol.startDate || vol.endDate)
        dateStr = `${formatDate(vol.startDate)} – ${formatDate(vol.endDate)}`;

      if (hasRole) {
        const dateW = dateStr ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 26 : 0;
        const lines = wrapText(stripHtmlTags(vol.role), helveticaBold, 11, contentWidth - dateW);
        lines.forEach((l, i) => {
          page.drawText(l, { x: margin, y: y - i * 13, size: 11, font: helveticaBold, color: C.heading });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasOrg) {
        let orgText = stripHtmlTags(vol.organization);
        if (hasMeaningfulValue(vol.location)) orgText += `  ·  ${stripHtmlTags(vol.location)}`;
        page.drawText(orgText, { x: margin, y, size: 10, font: helvetica, color: C.secondary });
        y -= 13;
      }

      if (hasMeaningfulValue(vol.description)) {
        const items = parseDescription(vol.description);
        if (items.length > 0) drawBullets(items, margin + 4);
      }
      y -= 6;
    }
  }

  return await pdfDoc.save();
}

// ============================================
// CLASSIC TEMPLATE
// Centered header · Times Roman · thick bottom rule
// MBA traditional style — section headers bold+underline
// ============================================

async function generateClassicTemplate(pdfDoc, cvData, utils) {
  const {
    timesRoman,
    timesRomanBold,
    timesRomanItalic,
    primaryColor,
    formatDate,
    rgb,
    stripHtmlTags,
    parseDescription,
    getSkillsList,
    hasMeaningfulValue,
  } = utils;

  const pageWidth    = PAGE.width;
  const pageHeight   = PAGE.height;
  const margin       = PAGE.margin;
  const contentWidth = pageWidth - 2 * margin;
  const centerX      = pageWidth / 2;
  const rightEdge    = pageWidth - margin;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y    = pageHeight - margin;

  const C = {
    black:     rgb(0,    0,    0),
    heading:   rgb(0.05, 0.05, 0.05),
    body:      rgb(0.15, 0.15, 0.15),
    secondary: rgb(0.30, 0.30, 0.30),
    muted:     rgb(0.45, 0.45, 0.45),
    light:     rgb(0.60, 0.60, 0.60),
  };

  const wrapText = createWrapText(stripHtmlTags);

  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const ensureSpace = (needed) => {
    if (y - needed < margin + 20) addNewPage();
  };

  // Centered text helper
  const drawCenteredText = (text, size, font, color, lineSpacing = 4) => {
    const clean = stripHtmlTags(text);
    const w     = font.widthOfTextAtSize(clean, size);
    page.drawText(clean, {
      x: centerX - w / 2,
      y,
      size,
      font,
      color,
    });
    y -= size + lineSpacing;
  };

  const drawDateRight = (dateText, yPos) => {
    if (!dateText) return;
    const size = 9.5;
    const w    = timesRoman.widthOfTextAtSize(dateText, size);
    page.drawText(dateText, {
      x: rightEdge - w,
      y: yPos,
      size,
      font: timesRoman,
      color: C.muted,
    });
  };

  // Classic section header: all-caps bold, full-width rule below
  const drawSectionHeader = (title) => {
    ensureSpace(28);
    y -= 10;

    page.drawText(title.toUpperCase(), {
      x: margin,
      y,
      size: 10.5,
      font: timesRomanBold,
      color: primaryColor,
    });

    page.drawLine({
      start: { x: margin,     y: y - 5 },
      end:   { x: rightEdge,  y: y - 5 },
      thickness: 1,
      color: primaryColor,
    });

    y -= 18;
  };

  // Additional info divider
  const drawAdditionalDivider = () => {
    ensureSpace(36);
    y -= 18;
    const label  = "ADDITIONAL INFORMATION";
    const size   = 7.5;
    const labelW = timesRoman.widthOfTextAtSize(label, size);
    const gap    = 10;
    const lx     = centerX - labelW / 2;

    page.drawLine({ start: { x: margin, y }, end: { x: lx - gap, y }, thickness: 0.4, color: C.light });
    page.drawText(label, { x: lx, y: y - 2.5, size, font: timesRoman, color: C.light });
    page.drawLine({ start: { x: lx + labelW + gap, y }, end: { x: rightEdge, y }, thickness: 0.4, color: C.light });

    y -= 16;
  };

  // Bullet list — classic triangle bullet
  const drawBullets = (items, x) => {
    const textX = x + 10;
    const maxW  = contentWidth - (textX - margin);
    for (const item of items) {
      if (!item) continue;
      const clean = stripHtmlTags(item);
      if (!clean) continue;
      const lines = wrapText(clean, timesRoman, 10, maxW);
      lines.forEach((line, idx) => {
        ensureSpace(13);
        if (idx === 0) {
          page.drawText(">", { x, y, size: 8, font: timesRoman, color: C.muted });
        }
        page.drawText(line, { x: textX, y, size: 10, font: timesRoman, color: C.body });
        y -= 12.5;
      });
      y -= 1;
    }
  };

  // ── HEADER (CENTERED) ──────────────────────────────────────────────────────

  ensureSpace(95);

  // Name — large centered all-caps
  const name     = (stripHtmlTags(cvData.personal?.fullName) || "Your Name").toUpperCase();
  const nameSize = 24;
  const nameW    = timesRomanBold.widthOfTextAtSize(name, nameSize);
  page.drawText(name, {
    x: centerX - nameW / 2,
    y,
    size: nameSize,
    font: timesRomanBold,
    color: primaryColor,
  });
  y -= nameSize + 8;

  // Headline
  if (hasMeaningfulValue(cvData.personal?.headline)) {
    drawCenteredText(stripHtmlTags(cvData.personal.headline), 11, timesRomanItalic, C.secondary, 6);
  }

  // Contact row 1: email · phone · location
  const row1 = [];
  if (hasMeaningfulValue(cvData.personal?.email))    row1.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone))    row1.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location)) row1.push(stripHtmlTags(cvData.personal.location));

  // Contact row 2: linkedin · website
  const row2 = [];
  if (hasMeaningfulValue(cvData.personal?.linkedin)) row2.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website))  row2.push(stripHtmlTags(cvData.personal.website));

  if (row1.length > 0) {
    const t = row1.join("  ·  ");
    const w = timesRoman.widthOfTextAtSize(t, 9.5);
    page.drawText(t, { x: centerX - w / 2, y, size: 9.5, font: timesRoman, color: C.muted });
    y -= 14;
  }
  if (row2.length > 0) {
    const t = row2.join("  ·  ");
    const w = timesRoman.widthOfTextAtSize(t, 9.5);
    page.drawText(t, { x: centerX - w / 2, y, size: 9.5, font: timesRoman, color: C.muted });
    y -= 14;
  }

  y -= 6;

  // Bold double rule
  page.drawLine({ start: { x: margin, y: y + 1.5 }, end: { x: rightEdge, y: y + 1.5 }, thickness: 2.5, color: primaryColor });
  page.drawLine({ start: { x: margin, y         }, end: { x: rightEdge, y         }, thickness: 0.5, color: primaryColor });
  y -= 16;

  // ── 1. PROFESSIONAL SUMMARY ────────────────────────────────────────────────

  if (hasMeaningfulValue(cvData.personal?.summary)) {
    drawSectionHeader("Professional Summary");
    const lines = wrapText(stripHtmlTags(cvData.personal.summary), timesRoman, 10, contentWidth);
    for (const line of lines) {
      ensureSpace(13);
      page.drawText(line, { x: margin, y, size: 10, font: timesRoman, color: C.body });
      y -= 13;
    }
    y -= 6;
  }

  // ── 2. PROFESSIONAL EXPERIENCE ────────────────────────────────────────────

  if (hasExperienceData(cvData.experience)) {
    drawSectionHeader("Professional Experience");

    for (const exp of cvData.experience) {
      if (!hasMeaningfulValue(exp.company) && !hasMeaningfulValue(exp.position)) continue;
      ensureSpace(44);

      let dateStr = "";
      if (exp.startDate || exp.endDate || exp.isCurrentRole)
        dateStr = `${formatDate(exp.startDate)} – ${exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}`;

      if (hasMeaningfulValue(exp.position)) {
        const dateW = dateStr ? timesRoman.widthOfTextAtSize(dateStr, 9.5) + 20 : 0;
        const lines = wrapText(stripHtmlTags(exp.position), timesRomanBold, 11, contentWidth - dateW);
        lines.forEach((l, i) => {
          page.drawText(l, { x: margin, y: y - i * 13, size: 11, font: timesRomanBold, color: C.heading });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasMeaningfulValue(exp.company)) {
        let co = stripHtmlTags(exp.company);
        if (hasMeaningfulValue(exp.location)) co += `, ${stripHtmlTags(exp.location)}`;
        page.drawText(co, { x: margin, y, size: 9.5, font: timesRomanItalic, color: C.secondary });
        y -= 13;
      }

      if (hasMeaningfulValue(exp.description)) {
        const items = parseDescription(exp.description);
        if (items.length > 0) drawBullets(items, margin);
      }
      y -= 7;
    }
    y -= 2;
  }

  // ── 3. EDUCATION ──────────────────────────────────────────────────────────

  if (hasEducationData(cvData.education)) {
    drawSectionHeader("Education");

    for (const edu of cvData.education) {
      if (!hasMeaningfulValue(edu.institution) && !hasMeaningfulValue(edu.degree) && !hasMeaningfulValue(edu.field)) continue;
      ensureSpace(38);

      let deg = "";
      if (hasMeaningfulValue(edu.degree) && hasMeaningfulValue(edu.field))
        deg = `${stripHtmlTags(edu.degree)}, ${stripHtmlTags(edu.field)}`;
      else if (hasMeaningfulValue(edu.degree)) deg = stripHtmlTags(edu.degree);
      else if (hasMeaningfulValue(edu.field))  deg = stripHtmlTags(edu.field);

      let dateStr = "";
      if (edu.startDate || edu.endDate)
        dateStr = `${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}`;

      if (deg) {
        const dateW = dateStr ? timesRoman.widthOfTextAtSize(dateStr, 9.5) + 20 : 0;
        const lines = wrapText(deg, timesRomanBold, 11, contentWidth - dateW);
        lines.forEach((l, i) => {
          page.drawText(l, { x: margin, y: y - i * 13, size: 11, font: timesRomanBold, color: C.heading });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasMeaningfulValue(edu.institution)) {
        page.drawText(stripHtmlTags(edu.institution), { x: margin, y, size: 9.5, font: timesRomanItalic, color: C.secondary });
        y -= 13;
      }

      if (hasMeaningfulValue(edu.gpa)) {
        page.drawText(`GPA: ${stripHtmlTags(edu.gpa)}`, { x: margin, y, size: 9, font: timesRoman, color: C.muted });
        y -= 12;
      }

      if (hasMeaningfulValue(edu.description)) {
        const items = parseDescription(edu.description);
        if (items.length > 0) { y -= 2; drawBullets(items, margin); }
      }
      y -= 7;
    }
    y -= 2;
  }

  // ── ADDITIONAL INFO DIVIDER ────────────────────────────────────────────────

  const hasAdditional =
    hasSkillsData(cvData.skills) ||
    hasAchievementsData(cvData.achievements) ||
    hasVolunteerData(cvData.volunteer);

  if (hasAdditional) drawAdditionalDivider();

  // ── 4. SKILLS ─────────────────────────────────────────────────────────────

  if (hasSkillsData(cvData.skills)) {
    drawSectionHeader("Skills");

    for (const cat of cvData.skills) {
      const list = getSkillsList(cat);
      if (!hasMeaningfulValue(cat.name) && list.length === 0) continue;
      ensureSpace(16);

      const label  = `${stripHtmlTags(cat.name) || "Skills"}: `;
      const labelW = timesRomanBold.widthOfTextAtSize(label, 10);

      page.drawText(label, { x: margin, y, size: 10, font: timesRomanBold, color: C.heading });

      if (list.length > 0) {
        const lines  = wrapText(list.join(", "), timesRoman, 10, contentWidth - labelW - 4);
        const startY = y;
        lines.forEach((l, i) => {
          page.drawText(l, { x: margin + labelW, y: startY - i * 12, size: 10, font: timesRoman, color: C.body });
        });
        y = startY - lines.length * 12 - 4;
      } else {
        y -= 14;
      }
    }
    y -= 4;
  }

  // ── 5. ACHIEVEMENTS ───────────────────────────────────────────────────────

  if (hasAchievementsData(cvData.achievements)) {
    drawSectionHeader("Achievements");

    for (const ach of cvData.achievements) {
      if (!hasMeaningfulValue(ach.title)) continue;
      ensureSpace(30);

      let dateW = 0;
      if (hasMeaningfulValue(ach.date))
        dateW = timesRoman.widthOfTextAtSize(formatDate(ach.date), 9.5) + 20;

      const lines = wrapText(stripHtmlTags(ach.title), timesRomanBold, 11, contentWidth - dateW);
      lines.forEach((l, i) => {
        page.drawText(l, { x: margin, y: y - i * 13, size: 11, font: timesRomanBold, color: C.heading });
      });
      if (lines.length > 1) y -= (lines.length - 1) * 13;
      if (hasMeaningfulValue(ach.date)) drawDateRight(formatDate(ach.date), y);
      y -= 14;

      if (hasMeaningfulValue(ach.organization)) {
        page.drawText(stripHtmlTags(ach.organization), { x: margin, y, size: 10, font: timesRomanItalic, color: C.secondary });
        y -= 13;
      }

      if (hasMeaningfulValue(ach.description)) {
        const items = parseDescription(ach.description);
        if (items.length > 0) { y -= 2; drawBullets(items, margin); }
      }
      y -= 7;
    }
    y -= 2;
  }

  // ── 6. VOLUNTEER ──────────────────────────────────────────────────────────

  if (hasVolunteerData(cvData.volunteer)) {
    drawSectionHeader("Volunteer Experience");

    for (const vol of cvData.volunteer) {
      if (!hasMeaningfulValue(vol.organization) && !hasMeaningfulValue(vol.role)) continue;
      ensureSpace(38);

      let dateStr = "";
      if (vol.startDate || vol.endDate)
        dateStr = `${formatDate(vol.startDate)} – ${formatDate(vol.endDate)}`;

      if (hasMeaningfulValue(vol.role)) {
        const dateW = dateStr ? timesRoman.widthOfTextAtSize(dateStr, 9.5) + 20 : 0;
        const lines = wrapText(stripHtmlTags(vol.role), timesRomanBold, 11, contentWidth - dateW);
        lines.forEach((l, i) => {
          page.drawText(l, { x: margin, y: y - i * 13, size: 11, font: timesRomanBold, color: C.heading });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasMeaningfulValue(vol.organization)) {
        let org = stripHtmlTags(vol.organization);
        if (hasMeaningfulValue(vol.location)) org += `, ${stripHtmlTags(vol.location)}`;
        page.drawText(org, { x: margin, y, size: 9.5, font: timesRomanItalic, color: C.secondary });
        y -= 13;
      }

      if (hasMeaningfulValue(vol.description)) {
        const items = parseDescription(vol.description);
        if (items.length > 0) drawBullets(items, margin);
      }
      y -= 6;
    }
  }

  return await pdfDoc.save();
}

// ============================================
// MINIMAL TEMPLATE
// Centered header · ultra-light weight · spaced lettertracking on headings
// Horizontal rule starts as short center accent, sections use spaced caps
// ============================================

async function generateMinimalTemplate(pdfDoc, cvData, utils) {
  const {
    helvetica,
    helveticaBold,
    helveticaOblique,
    primaryColor,
    formatDate,
    rgb,
    stripHtmlTags,
    parseDescription,
    getSkillsList,
    hasMeaningfulValue,
  } = utils;

  const pageWidth    = PAGE.width;
  const pageHeight   = PAGE.height;
  const margin       = 52;
  const contentWidth = pageWidth - 2 * margin;
  const centerX      = pageWidth / 2;
  const rightEdge    = pageWidth - margin;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y    = pageHeight - margin - 5;

  const C = {
    black:   rgb(0,    0,    0),
    heading: rgb(0.05, 0.05, 0.05),
    body:    rgb(0.18, 0.18, 0.18),
    second:  rgb(0.35, 0.35, 0.35),
    muted:   rgb(0.48, 0.48, 0.48),
    light:   rgb(0.62, 0.62, 0.62),
    border:  rgb(0.84, 0.84, 0.84),
  };

  const wrapText = createWrapText(stripHtmlTags);

  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const ensureSpace = (needed) => {
    if (y - needed < margin + 20) addNewPage();
  };

  const drawDateRight = (dateText, yPos) => {
    if (!dateText) return;
    const size = 8.5;
    const w    = helvetica.widthOfTextAtSize(dateText, size);
    page.drawText(dateText, { x: rightEdge - w, y: yPos, size, font: helvetica, color: C.muted });
  };

  // Minimal section header: spaced small-caps, thin rule across full width
  const drawSectionHeader = (title) => {
    ensureSpace(26);
    y -= 10;

    // Letter-spaced by inserting spaces
    const spaced = title.toUpperCase().split("").join(" ");
    page.drawText(spaced, { x: margin, y, size: 7, font: helveticaBold, color: C.muted });

    y -= 9;
    page.drawLine({
      start: { x: margin, y },
      end:   { x: rightEdge, y },
      thickness: 0.3,
      color: C.border,
    });
    y -= 13;
  };

  // Additional info divider — spaced lettering style
  const drawAdditionalDivider = () => {
    ensureSpace(36);
    y -= 18;
    const label  = "A D D I T I O N A L   I N F O R M A T I O N";
    const size   = 6.5;
    const labelW = helvetica.widthOfTextAtSize(label, size);
    const gap    = 10;
    const lx     = centerX - labelW / 2;

    page.drawLine({ start: { x: margin, y }, end: { x: lx - gap, y }, thickness: 0.3, color: C.border });
    page.drawText(label, { x: lx, y: y - 2.5, size, font: helvetica, color: C.light });
    page.drawLine({ start: { x: lx + labelW + gap, y }, end: { x: rightEdge, y }, thickness: 0.3, color: C.border });

    y -= 16;
  };

  // Dash bullet — minimal style
  const drawBullets = (items, x) => {
    const textX = x + 12;
    const maxW  = contentWidth - (textX - margin);
    for (const item of items) {
      if (!item) continue;
      const clean = stripHtmlTags(item);
      if (!clean) continue;
      const lines = wrapText(clean, helvetica, 9.5, maxW);
      lines.forEach((line, idx) => {
        ensureSpace(13);
        if (idx === 0) {
          page.drawText("\u2013", { x, y, size: 9.5, font: helvetica, color: C.light });
        }
        page.drawText(line, { x: textX, y, size: 9.5, font: helvetica, color: C.body });
        y -= 12;
      });
      y -= 1;
    }
  };

  // ── HEADER (CENTERED) ──────────────────────────────────────────────────────

  ensureSpace(90);

  // Name — extra-light feel, large, centered
  const fullName = stripHtmlTags(cvData.personal?.fullName) || "Your Name";
  const nameSize = 30;
  const nameW    = helvetica.widthOfTextAtSize(fullName, nameSize);
  page.drawText(fullName, {
    x: centerX - nameW / 2,
    y,
    size: nameSize,
    font: helvetica,
    color: primaryColor,
  });
  y -= nameSize + 9;

  // Headline
  if (hasMeaningfulValue(cvData.personal?.headline)) {
    const hl  = stripHtmlTags(cvData.personal.headline);
    const hlW = helvetica.widthOfTextAtSize(hl, 11);
    page.drawText(hl, { x: centerX - hlW / 2, y, size: 11, font: helvetica, color: C.second });
    y -= 17;
  }

  // Contact row — centered, pipe-separated
  const contacts = [];
  if (hasMeaningfulValue(cvData.personal?.email))    contacts.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone))    contacts.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location)) contacts.push(stripHtmlTags(cvData.personal.location));
  if (hasMeaningfulValue(cvData.personal?.linkedin)) contacts.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website))  contacts.push(stripHtmlTags(cvData.personal.website));

  if (contacts.length > 0) {
    const contactText  = contacts.join("  |  ");
    const contactLines = wrapText(contactText, helvetica, 9, contentWidth - 60);
    for (const line of contactLines) {
      const lw = helvetica.widthOfTextAtSize(line, 9);
      page.drawText(line, { x: centerX - lw / 2, y, size: 9, font: helvetica, color: C.muted });
      y -= 12;
    }
    y -= 4;
  }

  // Short center accent rule (matches minimal preview short rule)
  const accentW = 44;
  page.drawLine({
    start: { x: centerX - accentW / 2, y },
    end:   { x: centerX + accentW / 2, y },
    thickness: 1,
    color: primaryColor,
  });
  y -= 20;

  // ── 1. SUMMARY ────────────────────────────────────────────────────────────

  if (hasMeaningfulValue(cvData.personal?.summary)) {
    drawSectionHeader("Summary");
    const lines = wrapText(stripHtmlTags(cvData.personal.summary), helvetica, 9.5, contentWidth);
    for (const line of lines) {
      ensureSpace(13);
      page.drawText(line, { x: margin, y, size: 9.5, font: helvetica, color: C.body });
      y -= 13;
    }
    y -= 6;
  }

  // ── 2. PROFESSIONAL EXPERIENCE ────────────────────────────────────────────

  if (hasExperienceData(cvData.experience)) {
    drawSectionHeader("Professional Experience");

    for (const exp of cvData.experience) {
      if (!hasMeaningfulValue(exp.company) && !hasMeaningfulValue(exp.position)) continue;
      ensureSpace(40);

      let dateStr = "";
      if (exp.startDate || exp.endDate || exp.isCurrentRole)
        dateStr = `${formatDate(exp.startDate)} – ${exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}`;

      if (hasMeaningfulValue(exp.position)) {
        const dateW = dateStr ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 20 : 0;
        const lines = wrapText(stripHtmlTags(exp.position), helveticaBold, 10.5, contentWidth - dateW);
        lines.forEach((l, i) => {
          page.drawText(l, { x: margin, y: y - i * 13, size: 10.5, font: helveticaBold, color: C.heading });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasMeaningfulValue(exp.company)) {
        let co = stripHtmlTags(exp.company);
        if (hasMeaningfulValue(exp.location)) co += `  ·  ${stripHtmlTags(exp.location)}`;
        page.drawText(co, { x: margin, y, size: 9, font: helvetica, color: C.muted });
        y -= 13;
      }

      if (hasMeaningfulValue(exp.description)) {
        const items = parseDescription(exp.description);
        if (items.length > 0) drawBullets(items, margin);
      }
      y -= 7;
    }
    y -= 2;
  }

  // ── 3. EDUCATION ──────────────────────────────────────────────────────────

  if (hasEducationData(cvData.education)) {
    drawSectionHeader("Education");

    for (const edu of cvData.education) {
      if (!hasMeaningfulValue(edu.institution) && !hasMeaningfulValue(edu.degree) && !hasMeaningfulValue(edu.field)) continue;
      ensureSpace(36);

      let deg = "";
      if (hasMeaningfulValue(edu.degree) && hasMeaningfulValue(edu.field))
        deg = `${stripHtmlTags(edu.degree)}, ${stripHtmlTags(edu.field)}`;
      else if (hasMeaningfulValue(edu.degree)) deg = stripHtmlTags(edu.degree);
      else if (hasMeaningfulValue(edu.field))  deg = stripHtmlTags(edu.field);

      let dateStr = "";
      if (edu.startDate || edu.endDate)
        dateStr = `${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}`;

      if (deg) {
        const dateW = dateStr ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 20 : 0;
        const lines = wrapText(deg, helveticaBold, 10.5, contentWidth - dateW);
        lines.forEach((l, i) => {
          page.drawText(l, { x: margin, y: y - i * 13, size: 10.5, font: helveticaBold, color: C.heading });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasMeaningfulValue(edu.institution)) {
        page.drawText(stripHtmlTags(edu.institution), { x: margin, y, size: 9, font: helvetica, color: C.muted });
        y -= 13;
      }

      if (hasMeaningfulValue(edu.gpa)) {
        page.drawText(`GPA: ${stripHtmlTags(edu.gpa)}`, { x: margin, y, size: 8.5, font: helvetica, color: C.muted });
        y -= 12;
      }

      if (hasMeaningfulValue(edu.description)) {
        const items = parseDescription(edu.description);
        if (items.length > 0) { y -= 2; drawBullets(items, margin); }
      }
      y -= 7;
    }
    y -= 2;
  }

  // ── ADDITIONAL INFORMATION DIVIDER ────────────────────────────────────────

  const hasAdditional =
    hasSkillsData(cvData.skills) ||
    hasAchievementsData(cvData.achievements) ||
    hasVolunteerData(cvData.volunteer);

  if (hasAdditional) drawAdditionalDivider();

  // ── 4. SKILLS ─────────────────────────────────────────────────────────────

  if (hasSkillsData(cvData.skills)) {
    drawSectionHeader("Skills");

    for (const cat of cvData.skills) {
      const list = getSkillsList(cat);
      if (!hasMeaningfulValue(cat.name) && list.length === 0) continue;
      ensureSpace(16);

      // Two-column layout: category name (fixed width), skills list
      const catLabel = stripHtmlTags(cat.name) || "Skills";
      const colW     = 92;

      page.drawText(catLabel, { x: margin, y, size: 9, font: helvetica, color: C.muted });

      if (list.length > 0) {
        const lines  = wrapText(list.join("  ·  "), helvetica, 9, contentWidth - colW - 4);
        const startY = y;
        lines.forEach((l, i) => {
          page.drawText(l, { x: margin + colW, y: startY - i * 12, size: 9, font: helvetica, color: C.body });
        });
        y = startY - lines.length * 12 - 4;
      } else {
        y -= 13;
      }
    }
    y -= 4;
  }

  // ── 5. ACHIEVEMENTS ───────────────────────────────────────────────────────

  if (hasAchievementsData(cvData.achievements)) {
    drawSectionHeader("Achievements");

    for (const ach of cvData.achievements) {
      if (!hasMeaningfulValue(ach.title)) continue;
      ensureSpace(30);

      let dateW = 0;
      if (hasMeaningfulValue(ach.date))
        dateW = helvetica.widthOfTextAtSize(formatDate(ach.date), 8.5) + 20;

      const lines = wrapText(stripHtmlTags(ach.title), helveticaBold, 10.5, contentWidth - dateW);
      lines.forEach((l, i) => {
        page.drawText(l, { x: margin, y: y - i * 13, size: 10.5, font: helveticaBold, color: C.heading });
      });
      if (lines.length > 1) y -= (lines.length - 1) * 13;
      if (hasMeaningfulValue(ach.date)) drawDateRight(formatDate(ach.date), y);
      y -= 14;

      if (hasMeaningfulValue(ach.organization)) {
        page.drawText(stripHtmlTags(ach.organization), { x: margin, y, size: 9, font: helvetica, color: C.muted });
        y -= 13;
      }

      if (hasMeaningfulValue(ach.description)) {
        const items = parseDescription(ach.description);
        if (items.length > 0) { y -= 2; drawBullets(items, margin); }
      }
      y -= 7;
    }
    y -= 2;
  }

  // ── 6. VOLUNTEER ──────────────────────────────────────────────────────────

  if (hasVolunteerData(cvData.volunteer)) {
    drawSectionHeader("Volunteer Experience");

    for (const vol of cvData.volunteer) {
      if (!hasMeaningfulValue(vol.organization) && !hasMeaningfulValue(vol.role)) continue;
      ensureSpace(36);

      let dateStr = "";
      if (vol.startDate || vol.endDate)
        dateStr = `${formatDate(vol.startDate)} – ${formatDate(vol.endDate)}`;

      if (hasMeaningfulValue(vol.role)) {
        const dateW = dateStr ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 20 : 0;
        const lines = wrapText(stripHtmlTags(vol.role), helveticaBold, 10.5, contentWidth - dateW);
        lines.forEach((l, i) => {
          page.drawText(l, { x: margin, y: y - i * 13, size: 10.5, font: helveticaBold, color: C.heading });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasMeaningfulValue(vol.organization)) {
        let org = stripHtmlTags(vol.organization);
        if (hasMeaningfulValue(vol.location)) org += `  ·  ${stripHtmlTags(vol.location)}`;
        page.drawText(org, { x: margin, y, size: 9, font: helvetica, color: C.muted });
        y -= 13;
      }

      if (hasMeaningfulValue(vol.description)) {
        const items = parseDescription(vol.description);
        if (items.length > 0) drawBullets(items, margin);
      }
      y -= 6;
    }
  }

  return await pdfDoc.save();
}