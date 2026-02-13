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

/**
 * Improved parseDescription — handles all bullet formats:
 * - ReactQuill <ul><li> and <ol><li>
 * - ReactQuill <p> paragraphs
 * - <br> separated lines
 * - Plain text with •, -, *, numbered bullets
 * - Arrays of strings
 * - Single text paragraphs
 */
const parseDescription = (description) => {
  if (!description) return [];

  // Array input
  if (Array.isArray(description)) {
    return description
      .map((item) => stripHtmlTags(item))
      .filter((item) => item && item.trim().length > 0);
  }

  const descString = String(description);

  // 1. Extract <li> items (ReactQuill <ul>/<ol> format)
  const bullets = [];
  let match;
  HTML_PATTERNS.listItems.lastIndex = 0;
  while ((match = HTML_PATTERNS.listItems.exec(descString)) !== null) {
    const clean = stripHtmlTags(match[1]).trim();
    if (clean.length > 0) bullets.push(clean);
  }
  if (bullets.length > 0) return bullets;

  // 2. Extract <p> items (ReactQuill paragraph format)
  const pItems = [];
  HTML_PATTERNS.paragraphs.lastIndex = 0;
  while ((match = HTML_PATTERNS.paragraphs.exec(descString)) !== null) {
    const clean = stripHtmlTags(match[1]).trim();
    if (clean.length > 0) pItems.push(clean);
  }
  if (pItems.length > 0) return pItems;

  // 3. Handle <br> separated content — replace <br> with \n before stripping
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

  // 4. Split by newlines, then clean bullet prefixes
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

  // 5. Last resort — return as single item
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
const hasProjectsData = (d) =>
  Array.isArray(d) && d.some((p) => hasMeaningfulValue(p.name));
const hasSkillsData = (d) =>
  Array.isArray(d) &&
  d.some((c) => hasMeaningfulValue(c.name) || getSkillsList(c).length > 0);
const hasAchievementsData = (d) =>
  Array.isArray(d) && d.some((a) => hasMeaningfulValue(a.title));
const hasVolunteerData = (d) =>
  Array.isArray(d) &&
  d.some((v) => hasMeaningfulValue(v.organization) || hasMeaningfulValue(v.role));

// ============================================
// PDF GENERATION — MAIN
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

  // Force black — ignore frontend color
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

  const getLightColor = (hex) => {
    const c = hexToRgb(hex);
    const brightness = (c.r + c.g + c.b) / 3;
    if (brightness < 0.1) return rgb(0.93, 0.93, 0.93);
    return rgb(
      Math.min(1, c.r * 0.15 + 0.85),
      Math.min(1, c.g * 0.15 + 0.85),
      Math.min(1, c.b * 0.15 + 0.85)
    );
  };

  const themeRgb = hexToRgb(themeColor);
  const primaryColor = rgb(themeRgb.r, themeRgb.g, themeRgb.b);
  const lightColor = getLightColor(themeColor);

  const utils = {
    ...fonts,
    primaryColor,
    lightColor,
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
// SHARED HELPER: wrapText
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
// MODERN TEMPLATE — Compact Professional
// ============================================

async function generateModernTemplate(pdfDoc, cvData, utils) {
  const {
    helvetica,
    helveticaBold,
    primaryColor,
    lightColor,
    formatDate,
    rgb,
    stripHtmlTags,
    parseDescription,
    getSkillsList,
    hasMeaningfulValue,
  } = utils;

  const pageWidth = PAGE.width;
  const pageHeight = PAGE.height;
  const margin = PAGE.margin;
  const contentWidth = pageWidth - 2 * margin;
  const rightEdge = pageWidth - margin;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Neutral black/gray palette only
  const C = {
    black: rgb(0, 0, 0),
    heading: rgb(0.05, 0.05, 0.05),
    body: rgb(0.15, 0.15, 0.15),
    secondary: rgb(0.3, 0.3, 0.3),
    muted: rgb(0.45, 0.45, 0.45),
    light: rgb(0.6, 0.6, 0.6),
    border: rgb(0.78, 0.78, 0.78),
    bgLight: rgb(0.93, 0.93, 0.93),
  };

  const wrapText = createWrapText(stripHtmlTags);

  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const ensureSpace = (needed) => {
    if (y - needed < margin + 20) addNewPage();
  };

  // --- Draw right-aligned date ---
  const drawDateRight = (dateText, yPos) => {
    if (!dateText) return;
    const w = helvetica.widthOfTextAtSize(dateText, 8.5);
    page.drawText(dateText, {
      x: rightEdge - w,
      y: yPos,
      size: 8.5,
      font: helvetica,
      color: C.muted,
    });
  };

  // --- Section Header: ■ TITLE ────── ---
  const drawSectionHeader = (title) => {
    ensureSpace(24);
    y -= 10;

    page.drawRectangle({
      x: margin,
      y: y - 1,
      width: 5,
      height: 5,
      color: C.black,
    });

    page.drawText(title.toUpperCase(), {
      x: margin + 12,
      y: y - 3,
      size: 9.5,
      font: helveticaBold,
      color: C.black,
    });

    page.drawLine({
      start: { x: margin + 12, y: y - 12 },
      end: { x: rightEdge, y: y - 12 },
      thickness: 0.5,
      color: C.border,
    });

    y -= 22;
  };

  // --- Bullet List: compact ---
  const drawBullets = (items, x) => {
    for (const item of items) {
      if (!item) continue;
      const clean = stripHtmlTags(item);
      if (!clean) continue;

      ensureSpace(14);

      const textX = x + 10;
      const maxW = contentWidth - (textX - margin);
      const lines = wrapText(clean, helvetica, 9, maxW);

      lines.forEach((line, idx) => {
        ensureSpace(12);
        if (idx === 0) {
          page.drawCircle({
            x: x + 3,
            y: y - 3,
            size: 1.5,
            color: C.muted,
          });
        }
        page.drawText(line, {
          x: textX,
          y: y,
          size: 9,
          font: helvetica,
          color: C.body,
        });
        y -= 12;
      });
      y -= 1;
    }
  };

  // ==================== HEADER ====================

  ensureSpace(80);

  const fullName = stripHtmlTags(cvData.personal?.fullName) || "Your Name";
  page.drawText(fullName, {
    x: margin,
    y: y,
    size: 24,
    font: helveticaBold,
    color: C.black,
  });
  y -= 30;

  // Contact info — single line with separators
  const contactItems = [];
  if (hasMeaningfulValue(cvData.personal?.email))
    contactItems.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone))
    contactItems.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location))
    contactItems.push(stripHtmlTags(cvData.personal.location));
  if (hasMeaningfulValue(cvData.personal?.linkedin))
    contactItems.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website))
    contactItems.push(stripHtmlTags(cvData.personal.website));

  if (contactItems.length > 0) {
    const contactText = contactItems.join("  \u2022  ");
    const contactLines = wrapText(contactText, helvetica, 9, contentWidth);
    contactLines.forEach((line) => {
      page.drawText(line, {
        x: margin,
        y: y,
        size: 9,
        font: helvetica,
        color: C.secondary,
      });
      y -= 13;
    });
  }

  y -= 3;

  // Header line
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: rightEdge, y: y },
    thickness: 1.2,
    color: C.black,
  });
  y -= 14;

  // ==================== SUMMARY ====================

  if (hasMeaningfulValue(cvData.personal?.summary)) {
    drawSectionHeader("Professional Summary");

    const summaryLines = wrapText(
      stripHtmlTags(cvData.personal.summary),
      helvetica,
      9.5,
      contentWidth
    );
    summaryLines.forEach((line) => {
      ensureSpace(13);
      page.drawText(line, {
        x: margin,
        y: y,
        size: 9.5,
        font: helvetica,
        color: C.body,
      });
      y -= 13;
    });
    y -= 6;
  }

  // ==================== EDUCATION ====================

  if (hasEducationData(cvData.education)) {
    drawSectionHeader("Education");

    for (const edu of cvData.education) {
      const hasInst = hasMeaningfulValue(edu.institution);
      const hasDeg = hasMeaningfulValue(edu.degree);
      const hasField = hasMeaningfulValue(edu.field);
      if (!hasInst && !hasDeg && !hasField) continue;

      ensureSpace(36);

      let degreeText = "";
      if (hasDeg && hasField)
        degreeText = `${stripHtmlTags(edu.degree)} in ${stripHtmlTags(edu.field)}`;
      else if (hasDeg) degreeText = stripHtmlTags(edu.degree);
      else if (hasField) degreeText = stripHtmlTags(edu.field);

      let dateStr = "";
      if (edu.startDate || edu.endDate)
        dateStr = `${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`;

      if (degreeText) {
        const dateW = dateStr
          ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 15
          : 0;
        const maxW = contentWidth - dateW;
        const lines = wrapText(degreeText, helveticaBold, 10.5, maxW);
        lines.forEach((line, idx) => {
          page.drawText(line, {
            x: margin,
            y: y - idx * 13,
            size: 10.5,
            font: helveticaBold,
            color: C.heading,
          });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasInst) {
        page.drawText(stripHtmlTags(edu.institution), {
          x: margin,
          y: y,
          size: 9.5,
          font: helvetica,
          color: C.secondary,
        });
        y -= 13;
      }

      if (hasMeaningfulValue(edu.gpa)) {
        page.drawText(`GPA: ${stripHtmlTags(edu.gpa)}`, {
          x: margin,
          y: y,
          size: 9,
          font: helvetica,
          color: C.muted,
        });
        y -= 12;
      }

      if (hasMeaningfulValue(edu.description)) {
        const items = parseDescription(edu.description);
        if (items.length > 0) {
          y -= 2;
          drawBullets(items, margin + 4);
        }
      }

      y -= 6;
    }
    y -= 2;
  }

  // ==================== EXPERIENCE ====================

  if (hasExperienceData(cvData.experience)) {
    drawSectionHeader("Work Experience");

    for (const exp of cvData.experience) {
      const hasCo = hasMeaningfulValue(exp.company);
      const hasPos = hasMeaningfulValue(exp.position);
      if (!hasCo && !hasPos) continue;

      ensureSpace(40);

      let dateStr = "";
      if (exp.startDate || exp.endDate || exp.isCurrentRole) {
        dateStr = `${formatDate(exp.startDate)} - ${
          exp.isCurrentRole ? "Present" : formatDate(exp.endDate)
        }`;
      }

      if (hasPos) {
        const dateW = dateStr
          ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 15
          : 0;
        const maxW = contentWidth - dateW;
        const lines = wrapText(
          stripHtmlTags(exp.position),
          helveticaBold,
          10.5,
          maxW
        );
        lines.forEach((line, idx) => {
          page.drawText(line, {
            x: margin,
            y: y - idx * 13,
            size: 10.5,
            font: helveticaBold,
            color: C.heading,
          });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasCo) {
        let companyText = stripHtmlTags(exp.company);
        if (hasMeaningfulValue(exp.location))
          companyText += `, ${stripHtmlTags(exp.location)}`;
        page.drawText(companyText, {
          x: margin,
          y: y,
          size: 9.5,
          font: helvetica,
          color: C.secondary,
        });
        y -= 14;
      }

      if (hasMeaningfulValue(exp.description)) {
        const items = parseDescription(exp.description);
        if (items.length > 0) drawBullets(items, margin + 4);
      }

      y -= 6;
    }
    y -= 2;
  }

  // ==================== PROJECTS ====================

  if (hasProjectsData(cvData.projects)) {
    drawSectionHeader("Projects");

    for (const proj of cvData.projects) {
      if (!hasMeaningfulValue(proj.name)) continue;

      ensureSpace(40);

      let dateStr = "";
      if (proj.startDate || proj.endDate) {
        if (proj.startDate && proj.endDate)
          dateStr = `${formatDate(proj.startDate)} - ${formatDate(proj.endDate)}`;
        else dateStr = formatDate(proj.startDate) || formatDate(proj.endDate);
      }

      const dateW = dateStr
        ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 15
        : 0;
      const maxW = contentWidth - dateW;
      const nameLines = wrapText(
        stripHtmlTags(proj.name),
        helveticaBold,
        10.5,
        maxW
      );
      nameLines.forEach((line, idx) => {
        page.drawText(line, {
          x: margin,
          y: y - idx * 13,
          size: 10.5,
          font: helveticaBold,
          color: C.heading,
        });
      });
      if (nameLines.length > 1) y -= (nameLines.length - 1) * 13;
      if (dateStr) drawDateRight(dateStr, y);
      y -= 14;

      // Technologies inline
      if (hasMeaningfulValue(proj.technologies)) {
        page.drawText(`Tech: ${stripHtmlTags(proj.technologies)}`, {
          x: margin,
          y: y,
          size: 8.5,
          font: helvetica,
          color: C.muted,
        });
        y -= 12;
      }

      if (hasMeaningfulValue(proj.description)) {
        const items = parseDescription(proj.description);
        if (items.length > 0) drawBullets(items, margin + 4);
      }

      // Links on same line if both exist
      const links = [];
      if (hasMeaningfulValue(proj.githubUrl))
        links.push(`GitHub: ${stripHtmlTags(proj.githubUrl)}`);
      if (hasMeaningfulValue(proj.liveUrl))
        links.push(`Live: ${stripHtmlTags(proj.liveUrl)}`);
      if (links.length > 0) {
        ensureSpace(12);
        page.drawText(links.join("   |   "), {
          x: margin,
          y: y,
          size: 8,
          font: helvetica,
          color: C.secondary,
        });
        y -= 12;
      }

      y -= 6;
    }
    y -= 2;
  }

  // ==================== SKILLS ====================

  if (hasSkillsData(cvData.skills)) {
    drawSectionHeader("Skills");

    for (const category of cvData.skills) {
      const skillsList = getSkillsList(category);
      const hasName = hasMeaningfulValue(category.name);
      if (!hasName && skillsList.length === 0) continue;

      ensureSpace(16);

      const catName = stripHtmlTags(category.name) || "Skills";
      const label = `${catName}: `;
      const labelW = helveticaBold.widthOfTextAtSize(label, 9.5);

      page.drawText(label, {
        x: margin,
        y: y,
        size: 9.5,
        font: helveticaBold,
        color: C.heading,
      });

      if (skillsList.length > 0) {
        const skillsText = skillsList.join(", ");
        const skillLines = wrapText(
          skillsText,
          helvetica,
          9.5,
          contentWidth - labelW - 4
        );
        const startY = y;
        skillLines.forEach((line, idx) => {
          page.drawText(line, {
            x: margin + labelW,
            y: startY - idx * 12,
            size: 9.5,
            font: helvetica,
            color: C.body,
          });
        });
        y = startY - skillLines.length * 12 - 4;
      } else {
        y -= 14;
      }
    }
    y -= 2;
  }

  // ==================== ACHIEVEMENTS ====================

  if (hasAchievementsData(cvData.achievements)) {
    drawSectionHeader("Achievements");

    for (const ach of cvData.achievements) {
      if (!hasMeaningfulValue(ach.title)) continue;

      ensureSpace(30);

      let dateW = 0;
      if (hasMeaningfulValue(ach.date))
        dateW = helvetica.widthOfTextAtSize(stripHtmlTags(ach.date), 8.5) + 15;

      const maxW = contentWidth - dateW;
      const titleLines = wrapText(
        stripHtmlTags(ach.title),
        helveticaBold,
        10.5,
        maxW
      );
      titleLines.forEach((line, idx) => {
        page.drawText(line, {
          x: margin,
          y: y - idx * 13,
          size: 10.5,
          font: helveticaBold,
          color: C.heading,
        });
      });
      if (titleLines.length > 1) y -= (titleLines.length - 1) * 13;
      if (hasMeaningfulValue(ach.date)) drawDateRight(stripHtmlTags(ach.date), y);
      y -= 14;

      if (hasMeaningfulValue(ach.organization)) {
        page.drawText(stripHtmlTags(ach.organization), {
          x: margin,
          y: y,
          size: 9.5,
          font: helvetica,
          color: C.secondary,
        });
        y -= 13;
      }

      if (hasMeaningfulValue(ach.description)) {
        const descLines = wrapText(
          stripHtmlTags(ach.description),
          helvetica,
          9,
          contentWidth
        );
        descLines.forEach((line) => {
          ensureSpace(12);
          page.drawText(line, {
            x: margin,
            y: y,
            size: 9,
            font: helvetica,
            color: C.body,
          });
          y -= 12;
        });
      }

      y -= 6;
    }
    y -= 2;
  }

  // ==================== VOLUNTEER ====================

  if (hasVolunteerData(cvData.volunteer)) {
    drawSectionHeader("Volunteer Experience");

    for (const vol of cvData.volunteer) {
      const hasOrg = hasMeaningfulValue(vol.organization);
      const hasRole = hasMeaningfulValue(vol.role);
      if (!hasOrg && !hasRole) continue;

      ensureSpace(36);

      let dateStr = "";
      if (vol.startDate || vol.endDate)
        dateStr = `${formatDate(vol.startDate)} - ${formatDate(vol.endDate)}`;

      if (hasRole) {
        const dateW = dateStr
          ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 15
          : 0;
        const maxW = contentWidth - dateW;
        const lines = wrapText(
          stripHtmlTags(vol.role),
          helveticaBold,
          10.5,
          maxW
        );
        lines.forEach((line, idx) => {
          page.drawText(line, {
            x: margin,
            y: y - idx * 13,
            size: 10.5,
            font: helveticaBold,
            color: C.heading,
          });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasOrg) {
        let orgText = stripHtmlTags(vol.organization);
        if (hasMeaningfulValue(vol.location))
          orgText += `, ${stripHtmlTags(vol.location)}`;
        page.drawText(orgText, {
          x: margin,
          y: y,
          size: 9.5,
          font: helvetica,
          color: C.secondary,
        });
        y -= 14;
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
// CLASSIC TEMPLATE — Compact Professional
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

  const pageWidth = PAGE.width;
  const pageHeight = PAGE.height;
  const margin = PAGE.margin;
  const contentWidth = pageWidth - 2 * margin;
  const rightEdge = pageWidth - margin;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const C = {
    black: rgb(0, 0, 0),
    heading: rgb(0.05, 0.05, 0.05),
    body: rgb(0.15, 0.15, 0.15),
    secondary: rgb(0.3, 0.3, 0.3),
    muted: rgb(0.45, 0.45, 0.45),
    light: rgb(0.6, 0.6, 0.6),
  };

  const wrapText = createWrapText(stripHtmlTags);

  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const ensureSpace = (needed) => {
    if (y - needed < margin + 20) addNewPage();
  };

  const drawCentered = (text, size, font, color) => {
    const clean = stripHtmlTags(text);
    const w = font.widthOfTextAtSize(clean, size);
    page.drawText(clean, {
      x: margin + (contentWidth - w) / 2,
      y: y,
      size,
      font,
      color,
    });
    y -= size + 5;
  };

  const drawDateRight = (dateText, yPos) => {
    if (!dateText) return;
    const w = timesRoman.widthOfTextAtSize(dateText, 9.5);
    page.drawText(dateText, {
      x: rightEdge - w,
      y: yPos,
      size: 9.5,
      font: timesRoman,
      color: C.muted,
    });
  };

  const drawSectionHeader = (title) => {
    ensureSpace(24);
    y -= 10;

    page.drawText(title.toUpperCase(), {
      x: margin,
      y: y,
      size: 10.5,
      font: timesRomanBold,
      color: C.black,
    });

    page.drawLine({
      start: { x: margin, y: y - 5 },
      end: { x: rightEdge, y: y - 5 },
      thickness: 1,
      color: C.black,
    });

    y -= 20;
  };

  const drawBullets = (items, x) => {
    for (const item of items) {
      if (!item) continue;
      const clean = stripHtmlTags(item);
      if (!clean) continue;

      ensureSpace(13);

      const textX = x + 10;
      const maxW = contentWidth - (textX - margin);
      const lines = wrapText(clean, timesRoman, 9.5, maxW);

      lines.forEach((line, idx) => {
        ensureSpace(12);
        if (idx === 0) {
          page.drawText("\u2022", {
            x: x,
            y: y,
            size: 9.5,
            font: timesRoman,
            color: C.light,
          });
        }
        page.drawText(line, {
          x: textX,
          y: y,
          size: 9.5,
          font: timesRoman,
          color: C.body,
        });
        y -= 12;
      });
      y -= 1;
    }
  };

  // ==================== HEADER (centered) ====================

  ensureSpace(70);

  const name = (
    stripHtmlTags(cvData.personal?.fullName) || "Your Name"
  ).toUpperCase();
  drawCentered(name, 20, timesRomanBold, C.black);
  y -= 2;

  // Contact rows
  const row1 = [];
  const row2 = [];
  if (hasMeaningfulValue(cvData.personal?.email))
    row1.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone))
    row1.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location))
    row1.push(stripHtmlTags(cvData.personal.location));
  if (hasMeaningfulValue(cvData.personal?.linkedin))
    row2.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website))
    row2.push(stripHtmlTags(cvData.personal.website));

  if (row1.length > 0) drawCentered(row1.join("   |   "), 9.5, timesRoman, C.secondary);
  if (row2.length > 0) drawCentered(row2.join("   |   "), 9.5, timesRoman, C.secondary);

  y -= 4;
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: rightEdge, y: y },
    thickness: 1.5,
    color: C.black,
  });
  y -= 14;

  // ==================== SUMMARY ====================

  if (hasMeaningfulValue(cvData.personal?.summary)) {
    drawSectionHeader("Professional Summary");
    const lines = wrapText(
      stripHtmlTags(cvData.personal.summary),
      timesRoman,
      10,
      contentWidth
    );
    lines.forEach((line) => {
      ensureSpace(13);
      page.drawText(line, {
        x: margin,
        y: y,
        size: 10,
        font: timesRoman,
        color: C.body,
      });
      y -= 13;
    });
    y -= 6;
  }

  // ==================== EDUCATION ====================

  if (hasEducationData(cvData.education)) {
    drawSectionHeader("Education");

    for (const edu of cvData.education) {
      if (
        !hasMeaningfulValue(edu.institution) &&
        !hasMeaningfulValue(edu.degree) &&
        !hasMeaningfulValue(edu.field)
      )
        continue;

      ensureSpace(36);

      let deg = "";
      if (hasMeaningfulValue(edu.degree) && hasMeaningfulValue(edu.field))
        deg = `${stripHtmlTags(edu.degree)}, ${stripHtmlTags(edu.field)}`;
      else if (hasMeaningfulValue(edu.degree)) deg = stripHtmlTags(edu.degree);
      else if (hasMeaningfulValue(edu.field)) deg = stripHtmlTags(edu.field);

      let dateStr = "";
      if (edu.startDate || edu.endDate)
        dateStr = `${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`;

      if (deg) {
        const dateW = dateStr ? timesRoman.widthOfTextAtSize(dateStr, 9.5) + 15 : 0;
        const lines = wrapText(deg, timesRomanBold, 10.5, contentWidth - dateW);
        lines.forEach((l, i) =>
          page.drawText(l, {
            x: margin,
            y: y - i * 13,
            size: 10.5,
            font: timesRomanBold,
            color: C.heading,
          })
        );
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasMeaningfulValue(edu.institution)) {
        page.drawText(stripHtmlTags(edu.institution), {
          x: margin,
          y: y,
          size: 9.5,
          font: timesRomanItalic,
          color: C.secondary,
        });
        y -= 13;
      }

      if (hasMeaningfulValue(edu.gpa)) {
        page.drawText(`GPA: ${stripHtmlTags(edu.gpa)}`, {
          x: margin,
          y: y,
          size: 9,
          font: timesRoman,
          color: C.muted,
        });
        y -= 12;
      }

      if (hasMeaningfulValue(edu.description)) {
        const items = parseDescription(edu.description);
        if (items.length > 0) {
          y -= 2;
          drawBullets(items, margin);
        }
      }

      y -= 6;
    }
    y -= 2;
  }

  // ==================== EXPERIENCE ====================

  if (hasExperienceData(cvData.experience)) {
    drawSectionHeader("Professional Experience");

    for (const exp of cvData.experience) {
      if (!hasMeaningfulValue(exp.company) && !hasMeaningfulValue(exp.position))
        continue;

      ensureSpace(40);

      let dateStr = "";
      if (exp.startDate || exp.endDate || exp.isCurrentRole)
        dateStr = `${formatDate(exp.startDate)} - ${
          exp.isCurrentRole ? "Present" : formatDate(exp.endDate)
        }`;

      if (hasMeaningfulValue(exp.position)) {
        const dateW = dateStr
          ? timesRoman.widthOfTextAtSize(dateStr, 9.5) + 15
          : 0;
        const lines = wrapText(
          stripHtmlTags(exp.position),
          timesRomanBold,
          10.5,
          contentWidth - dateW
        );
        lines.forEach((l, i) =>
          page.drawText(l, {
            x: margin,
            y: y - i * 13,
            size: 10.5,
            font: timesRomanBold,
            color: C.heading,
          })
        );
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasMeaningfulValue(exp.company)) {
        let co = stripHtmlTags(exp.company);
        if (hasMeaningfulValue(exp.location))
          co += `, ${stripHtmlTags(exp.location)}`;
        page.drawText(co, {
          x: margin,
          y: y,
          size: 9.5,
          font: timesRomanItalic,
          color: C.secondary,
        });
        y -= 14;
      }

      if (hasMeaningfulValue(exp.description)) {
        const items = parseDescription(exp.description);
        if (items.length > 0) drawBullets(items, margin);
      }

      y -= 6;
    }
    y -= 2;
  }

  // ==================== PROJECTS ====================

  if (hasProjectsData(cvData.projects)) {
    drawSectionHeader("Projects");

    for (const proj of cvData.projects) {
      if (!hasMeaningfulValue(proj.name)) continue;

      ensureSpace(36);

      let dateStr = "";
      if (proj.startDate || proj.endDate) {
        dateStr =
          proj.startDate && proj.endDate
            ? `${formatDate(proj.startDate)} - ${formatDate(proj.endDate)}`
            : formatDate(proj.startDate) || formatDate(proj.endDate);
      }

      const dateW = dateStr
        ? timesRoman.widthOfTextAtSize(dateStr, 9.5) + 15
        : 0;
      const lines = wrapText(
        stripHtmlTags(proj.name),
        timesRomanBold,
        10.5,
        contentWidth - dateW
      );
      lines.forEach((l, i) =>
        page.drawText(l, {
          x: margin,
          y: y - i * 13,
          size: 10.5,
          font: timesRomanBold,
          color: C.heading,
        })
      );
      if (lines.length > 1) y -= (lines.length - 1) * 13;
      if (dateStr) drawDateRight(dateStr, y);
      y -= 14;

      if (hasMeaningfulValue(proj.technologies)) {
        page.drawText(
          `Technologies: ${stripHtmlTags(proj.technologies)}`,
          {
            x: margin,
            y: y,
            size: 9,
            font: timesRomanItalic,
            color: C.secondary,
          }
        );
        y -= 13;
      }

      if (hasMeaningfulValue(proj.description)) {
        const items = parseDescription(proj.description);
        if (items.length > 0) drawBullets(items, margin);
      }

      const links = [];
      if (hasMeaningfulValue(proj.githubUrl))
        links.push(`GitHub: ${stripHtmlTags(proj.githubUrl)}`);
      if (hasMeaningfulValue(proj.liveUrl))
        links.push(`Live: ${stripHtmlTags(proj.liveUrl)}`);
      if (links.length > 0) {
        ensureSpace(12);
        page.drawText(links.join("   |   "), {
          x: margin,
          y: y,
          size: 8.5,
          font: timesRoman,
          color: C.secondary,
        });
        y -= 12;
      }

      y -= 6;
    }
    y -= 2;
  }

  // ==================== SKILLS ====================

  if (hasSkillsData(cvData.skills)) {
    drawSectionHeader("Skills");

    for (const cat of cvData.skills) {
      const list = getSkillsList(cat);
      if (!hasMeaningfulValue(cat.name) && list.length === 0) continue;

      ensureSpace(16);

      const label = `${stripHtmlTags(cat.name) || "Skills"}: `;
      const labelW = timesRomanBold.widthOfTextAtSize(label, 9.5);

      page.drawText(label, {
        x: margin,
        y: y,
        size: 9.5,
        font: timesRomanBold,
        color: C.heading,
      });

      if (list.length > 0) {
        const lines = wrapText(
          list.join(", "),
          timesRoman,
          9.5,
          contentWidth - labelW - 4
        );
        const startY = y;
        lines.forEach((l, i) =>
          page.drawText(l, {
            x: margin + labelW,
            y: startY - i * 12,
            size: 9.5,
            font: timesRoman,
            color: C.body,
          })
        );
        y = startY - lines.length * 12 - 4;
      } else {
        y -= 14;
      }
    }
    y -= 2;
  }

  // ==================== ACHIEVEMENTS ====================

  if (hasAchievementsData(cvData.achievements)) {
    drawSectionHeader("Achievements");

    for (const ach of cvData.achievements) {
      if (!hasMeaningfulValue(ach.title)) continue;

      ensureSpace(30);

      let dateW = 0;
      if (hasMeaningfulValue(ach.date))
        dateW = timesRoman.widthOfTextAtSize(stripHtmlTags(ach.date), 9.5) + 15;

      const lines = wrapText(
        stripHtmlTags(ach.title),
        timesRomanBold,
        10.5,
        contentWidth - dateW
      );
      lines.forEach((l, i) =>
        page.drawText(l, {
          x: margin,
          y: y - i * 13,
          size: 10.5,
          font: timesRomanBold,
          color: C.heading,
        })
      );
      if (lines.length > 1) y -= (lines.length - 1) * 13;
      if (hasMeaningfulValue(ach.date))
        drawDateRight(stripHtmlTags(ach.date), y);
      y -= 14;

      if (hasMeaningfulValue(ach.organization)) {
        page.drawText(stripHtmlTags(ach.organization), {
          x: margin,
          y: y,
          size: 9.5,
          font: timesRoman,
          color: C.secondary,
        });
        y -= 13;
      }

      if (hasMeaningfulValue(ach.description)) {
        const descLines = wrapText(
          stripHtmlTags(ach.description),
          timesRoman,
          9.5,
          contentWidth
        );
        descLines.forEach((l) => {
          ensureSpace(12);
          page.drawText(l, {
            x: margin,
            y: y,
            size: 9.5,
            font: timesRoman,
            color: C.body,
          });
          y -= 12;
        });
      }

      y -= 6;
    }
    y -= 2;
  }

  // ==================== VOLUNTEER ====================

  if (hasVolunteerData(cvData.volunteer)) {
    drawSectionHeader("Volunteer Experience");

    for (const vol of cvData.volunteer) {
      if (!hasMeaningfulValue(vol.organization) && !hasMeaningfulValue(vol.role))
        continue;

      ensureSpace(36);

      let dateStr = "";
      if (vol.startDate || vol.endDate)
        dateStr = `${formatDate(vol.startDate)} - ${formatDate(vol.endDate)}`;

      if (hasMeaningfulValue(vol.role)) {
        const dateW = dateStr
          ? timesRoman.widthOfTextAtSize(dateStr, 9.5) + 15
          : 0;
        const lines = wrapText(
          stripHtmlTags(vol.role),
          timesRomanBold,
          10.5,
          contentWidth - dateW
        );
        lines.forEach((l, i) =>
          page.drawText(l, {
            x: margin,
            y: y - i * 13,
            size: 10.5,
            font: timesRomanBold,
            color: C.heading,
          })
        );
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasMeaningfulValue(vol.organization)) {
        let org = stripHtmlTags(vol.organization);
        if (hasMeaningfulValue(vol.location))
          org += `, ${stripHtmlTags(vol.location)}`;
        page.drawText(org, {
          x: margin,
          y: y,
          size: 9.5,
          font: timesRomanItalic,
          color: C.secondary,
        });
        y -= 14;
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
// MINIMAL TEMPLATE — Compact Professional
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

  const pageWidth = PAGE.width;
  const pageHeight = PAGE.height;
  const margin = 52;
  const contentWidth = pageWidth - 2 * margin;
  const rightEdge = pageWidth - margin;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin - 5;

  const C = {
    black: rgb(0, 0, 0),
    heading: rgb(0.05, 0.05, 0.05),
    body: rgb(0.18, 0.18, 0.18),
    secondary: rgb(0.35, 0.35, 0.35),
    muted: rgb(0.48, 0.48, 0.48),
    light: rgb(0.62, 0.62, 0.62),
    border: rgb(0.82, 0.82, 0.82),
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
    const w = helvetica.widthOfTextAtSize(dateText, 8.5);
    page.drawText(dateText, {
      x: rightEdge - w,
      y: yPos,
      size: 8.5,
      font: helvetica,
      color: C.muted,
    });
  };

  // Section header — spaced letters + thin line
  const drawSectionHeader = (title) => {
    ensureSpace(24);
    y -= 10;

    const spaced = title.toUpperCase().split("").join("  ");
    page.drawText(spaced, {
      x: margin,
      y: y,
      size: 7,
      font: helvetica,
      color: C.muted,
    });

    y -= 8;
    page.drawLine({
      start: { x: margin, y: y },
      end: { x: rightEdge, y: y },
      thickness: 0.3,
      color: C.border,
    });

    y -= 14;
  };

  const drawBullets = (items, x) => {
    for (const item of items) {
      if (!item) continue;
      const clean = stripHtmlTags(item);
      if (!clean) continue;

      ensureSpace(13);

      const textX = x + 12;
      const maxW = contentWidth - (textX - margin);
      const lines = wrapText(clean, helvetica, 9, maxW);

      lines.forEach((line, idx) => {
        ensureSpace(12);
        if (idx === 0) {
          page.drawText("\u2013", {
            x: x,
            y: y,
            size: 9,
            font: helvetica,
            color: C.light,
          });
        }
        page.drawText(line, {
          x: textX,
          y: y,
          size: 9,
          font: helvetica,
          color: C.body,
        });
        y -= 12;
      });
      y -= 1;
    }
  };

  // ==================== HEADER ====================

  ensureSpace(70);

  page.drawText(stripHtmlTags(cvData.personal?.fullName) || "Your Name", {
    x: margin,
    y: y,
    size: 26,
    font: helvetica,
    color: C.black,
  });
  y -= 34;

  const contacts = [];
  if (hasMeaningfulValue(cvData.personal?.email))
    contacts.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone))
    contacts.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location))
    contacts.push(stripHtmlTags(cvData.personal.location));
  if (hasMeaningfulValue(cvData.personal?.linkedin))
    contacts.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website))
    contacts.push(stripHtmlTags(cvData.personal.website));

  if (contacts.length > 0) {
    const contactLines = wrapText(
      contacts.join("   |   "),
      helvetica,
      9,
      contentWidth
    );
    contactLines.forEach((line) => {
      page.drawText(line, {
        x: margin,
        y: y,
        size: 9,
        font: helvetica,
        color: C.muted,
      });
      y -= 13;
    });
  }

  y -= 3;
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: margin + 36, y: y },
    thickness: 1,
    color: C.black,
  });
  y -= 16;

  // ==================== SUMMARY ====================

  if (hasMeaningfulValue(cvData.personal?.summary)) {
    drawSectionHeader("Summary");
    const lines = wrapText(
      stripHtmlTags(cvData.personal.summary),
      helvetica,
      9.5,
      contentWidth
    );
    lines.forEach((line) => {
      ensureSpace(13);
      page.drawText(line, {
        x: margin,
        y: y,
        size: 9.5,
        font: helvetica,
        color: C.body,
      });
      y -= 13;
    });
    y -= 6;
  }

  // ==================== EDUCATION ====================

  if (hasEducationData(cvData.education)) {
    drawSectionHeader("Education");

    for (const edu of cvData.education) {
      if (
        !hasMeaningfulValue(edu.institution) &&
        !hasMeaningfulValue(edu.degree) &&
        !hasMeaningfulValue(edu.field)
      )
        continue;

      ensureSpace(34);

      let deg = "";
      if (hasMeaningfulValue(edu.degree) && hasMeaningfulValue(edu.field))
        deg = `${stripHtmlTags(edu.degree)}, ${stripHtmlTags(edu.field)}`;
      else if (hasMeaningfulValue(edu.degree)) deg = stripHtmlTags(edu.degree);
      else if (hasMeaningfulValue(edu.field)) deg = stripHtmlTags(edu.field);

      let dateStr = "";
      if (edu.startDate || edu.endDate)
        dateStr = `${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`;

      if (deg) {
        const dateW = dateStr
          ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 15
          : 0;
        const lines = wrapText(deg, helvetica, 10.5, contentWidth - dateW);
        lines.forEach((l, i) =>
          page.drawText(l, {
            x: margin,
            y: y - i * 13,
            size: 10.5,
            font: helvetica,
            color: C.heading,
          })
        );
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasMeaningfulValue(edu.institution)) {
        page.drawText(stripHtmlTags(edu.institution), {
          x: margin,
          y: y,
          size: 9,
          font: helvetica,
          color: C.muted,
        });
        y -= 12;
      }

      if (hasMeaningfulValue(edu.gpa)) {
        page.drawText(`GPA: ${stripHtmlTags(edu.gpa)}`, {
          x: margin,
          y: y,
          size: 8.5,
          font: helvetica,
          color: C.muted,
        });
        y -= 11;
      }

      if (hasMeaningfulValue(edu.description)) {
        const items = parseDescription(edu.description);
        if (items.length > 0) {
          y -= 2;
          drawBullets(items, margin);
        }
      }

      y -= 6;
    }
    y -= 2;
  }

  // ==================== EXPERIENCE ====================

  if (hasExperienceData(cvData.experience)) {
    drawSectionHeader("Experience");

    for (const exp of cvData.experience) {
      if (!hasMeaningfulValue(exp.company) && !hasMeaningfulValue(exp.position))
        continue;

      ensureSpace(38);

      let dateStr = "";
      if (exp.startDate || exp.endDate || exp.isCurrentRole)
        dateStr = `${formatDate(exp.startDate)} - ${
          exp.isCurrentRole ? "Present" : formatDate(exp.endDate)
        }`;

      if (hasMeaningfulValue(exp.position)) {
        const dateW = dateStr
          ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 15
          : 0;
        const lines = wrapText(
          stripHtmlTags(exp.position),
          helvetica,
          10.5,
          contentWidth - dateW
        );
        lines.forEach((l, i) =>
          page.drawText(l, {
            x: margin,
            y: y - i * 13,
            size: 10.5,
            font: helvetica,
            color: C.heading,
          })
        );
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasMeaningfulValue(exp.company)) {
        page.drawText(stripHtmlTags(exp.company), {
          x: margin,
          y: y,
          size: 9,
          font: helvetica,
          color: C.muted,
        });
        y -= 13;
      }

      if (hasMeaningfulValue(exp.description)) {
        const items = parseDescription(exp.description);
        if (items.length > 0) drawBullets(items, margin);
      }

      y -= 6;
    }
    y -= 2;
  }

  // ==================== PROJECTS ====================

  if (hasProjectsData(cvData.projects)) {
    drawSectionHeader("Projects");

    for (const proj of cvData.projects) {
      if (!hasMeaningfulValue(proj.name)) continue;

      ensureSpace(34);

      let dateStr = "";
      if (proj.startDate || proj.endDate) {
        dateStr =
          proj.startDate && proj.endDate
            ? `${formatDate(proj.startDate)} - ${formatDate(proj.endDate)}`
            : formatDate(proj.startDate) || formatDate(proj.endDate);
      }

      const dateW = dateStr
        ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 15
        : 0;
      const lines = wrapText(
        stripHtmlTags(proj.name),
        helvetica,
        10.5,
        contentWidth - dateW
      );
      lines.forEach((l, i) =>
        page.drawText(l, {
          x: margin,
          y: y - i * 13,
          size: 10.5,
          font: helvetica,
          color: C.heading,
        })
      );
      if (lines.length > 1) y -= (lines.length - 1) * 13;
      if (dateStr) drawDateRight(dateStr, y);
      y -= 14;

      if (hasMeaningfulValue(proj.technologies)) {
        page.drawText(stripHtmlTags(proj.technologies), {
          x: margin,
          y: y,
          size: 8.5,
          font: helveticaOblique,
          color: C.muted,
        });
        y -= 12;
      }

      if (hasMeaningfulValue(proj.description)) {
        const items = parseDescription(proj.description);
        if (items.length > 0) drawBullets(items, margin);
      }

      const links = [];
      if (hasMeaningfulValue(proj.githubUrl))
        links.push(`GitHub: ${stripHtmlTags(proj.githubUrl)}`);
      if (hasMeaningfulValue(proj.liveUrl))
        links.push(`Live: ${stripHtmlTags(proj.liveUrl)}`);
      if (links.length > 0) {
        ensureSpace(12);
        page.drawText(links.join("   |   "), {
          x: margin,
          y: y,
          size: 8,
          font: helvetica,
          color: C.secondary,
        });
        y -= 12;
      }

      y -= 6;
    }
    y -= 2;
  }

  // ==================== SKILLS ====================

  if (hasSkillsData(cvData.skills)) {
    drawSectionHeader("Skills");

    for (const cat of cvData.skills) {
      const list = getSkillsList(cat);
      if (!hasMeaningfulValue(cat.name) && list.length === 0) continue;

      ensureSpace(16);

      const catName = stripHtmlTags(cat.name) || "Skills";
      const labelW = 90;

      page.drawText(catName, {
        x: margin,
        y: y,
        size: 9,
        font: helvetica,
        color: C.muted,
      });

      if (list.length > 0) {
        const lines = wrapText(
          list.join("  \u2022  "),
          helvetica,
          9,
          contentWidth - labelW - 4
        );
        const startY = y;
        lines.forEach((l, i) =>
          page.drawText(l, {
            x: margin + labelW,
            y: startY - i * 12,
            size: 9,
            font: helvetica,
            color: C.body,
          })
        );
        y = startY - lines.length * 12 - 4;
      } else {
        y -= 14;
      }
    }
    y -= 2;
  }

  // ==================== ACHIEVEMENTS ====================

  if (hasAchievementsData(cvData.achievements)) {
    drawSectionHeader("Achievements");

    for (const ach of cvData.achievements) {
      if (!hasMeaningfulValue(ach.title)) continue;

      ensureSpace(28);

      let dateW = 0;
      if (hasMeaningfulValue(ach.date))
        dateW = helvetica.widthOfTextAtSize(stripHtmlTags(ach.date), 8.5) + 15;

      const lines = wrapText(
        stripHtmlTags(ach.title),
        helvetica,
        10.5,
        contentWidth - dateW
      );
      lines.forEach((l, i) =>
        page.drawText(l, {
          x: margin,
          y: y - i * 13,
          size: 10.5,
          font: helvetica,
          color: C.heading,
        })
      );
      if (lines.length > 1) y -= (lines.length - 1) * 13;
      if (hasMeaningfulValue(ach.date))
        drawDateRight(stripHtmlTags(ach.date), y);
      y -= 14;

      if (hasMeaningfulValue(ach.organization)) {
        page.drawText(stripHtmlTags(ach.organization), {
          x: margin,
          y: y,
          size: 9,
          font: helvetica,
          color: C.muted,
        });
        y -= 12;
      }

      if (hasMeaningfulValue(ach.description)) {
        const descLines = wrapText(
          stripHtmlTags(ach.description),
          helvetica,
          9,
          contentWidth
        );
        descLines.forEach((l) => {
          ensureSpace(12);
          page.drawText(l, {
            x: margin,
            y: y,
            size: 9,
            font: helvetica,
            color: C.body,
          });
          y -= 12;
        });
      }

      y -= 6;
    }
    y -= 2;
  }

  // ==================== VOLUNTEER ====================

  if (hasVolunteerData(cvData.volunteer)) {
    drawSectionHeader("Volunteer");

    for (const vol of cvData.volunteer) {
      if (!hasMeaningfulValue(vol.organization) && !hasMeaningfulValue(vol.role))
        continue;

      ensureSpace(34);

      let dateStr = "";
      if (vol.startDate || vol.endDate)
        dateStr = `${formatDate(vol.startDate)} - ${formatDate(vol.endDate)}`;

      if (hasMeaningfulValue(vol.role)) {
        const dateW = dateStr
          ? helvetica.widthOfTextAtSize(dateStr, 8.5) + 15
          : 0;
        const lines = wrapText(
          stripHtmlTags(vol.role),
          helvetica,
          10.5,
          contentWidth - dateW
        );
        lines.forEach((l, i) =>
          page.drawText(l, {
            x: margin,
            y: y - i * 13,
            size: 10.5,
            font: helvetica,
            color: C.heading,
          })
        );
        if (lines.length > 1) y -= (lines.length - 1) * 13;
        if (dateStr) drawDateRight(dateStr, y);
      }
      y -= 14;

      if (hasMeaningfulValue(vol.organization)) {
        page.drawText(stripHtmlTags(vol.organization), {
          x: margin,
          y: y,
          size: 9,
          font: helvetica,
          color: C.muted,
        });
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