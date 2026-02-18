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
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const DEFAULTS = {
  templateId: "modern",
  themeColor: "#000000",
};

const PAGE = { width: 612, height: 792 };

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
    let cvData, templateId = DEFAULTS.templateId, themeColor = DEFAULTS.themeColor;
    let fileName = `CV-${Date.now()}`;

    if (versionId) {
      const version = await prisma.cVVersion.findUnique({ where: { id: versionId } });
      if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });
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
          personalInfo: true, educations: true, experiences: true,
          projects: true, skills: true, achievements: true, volunteers: true,
        },
      });
      if (!cv) return NextResponse.json({ error: "CV not found" }, { status: 404 });
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
      return NextResponse.json({ error: "CV ID or Version ID is required" }, { status: 400 });
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
    return description.map((i) => stripHtmlTags(i)).filter((i) => i && i.trim().length > 0);
  }
  const s = String(description);
  const bullets = [];
  let m;
  HTML_PATTERNS.listItems.lastIndex = 0;
  while ((m = HTML_PATTERNS.listItems.exec(s)) !== null) {
    const c = stripHtmlTags(m[1]).trim();
    if (c.length > 0) bullets.push(c);
  }
  if (bullets.length > 0) return bullets;
  const pItems = [];
  HTML_PATTERNS.paragraphs.lastIndex = 0;
  while ((m = HTML_PATTERNS.paragraphs.exec(s)) !== null) {
    let c = m[1].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    c = c.replace(/^[•●○◦▪▸►\s]+/, "").trim();
    if (c.length > 0) pItems.push(c);
  }
  if (pItems.length > 0) return pItems;
  const withNl = s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  if (!withNl.trim()) return [];
  const result = [];
  for (const line of withNl.split(/\n+/)) {
    const t = line.replace(/^\s*[•●○◦▪▸►]\s*/, "").replace(/^\s*[-–—]\s+/, "")
      .replace(/^\s*\*\s+/, "").replace(/^\s*\d+[.)]\s+/, "").replace(/\s+/g, " ").trim();
    if (t.length > 0) result.push(t);
  }
  if (result.length > 0) return result;
  const single = withNl.replace(/\s+/g, " ").trim();
  return single ? [single] : [];
};

const hasMeaningfulValue = (value) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0 && value.some((i) => hasMeaningfulValue(i));
  if (typeof value === "object") {
    const o = { ...value }; delete o.id;
    return Object.values(o).some((v) => hasMeaningfulValue(v));
  }
  const str = stripHtmlTags(String(value));
  if (str === "") return false;
  return !PLACEHOLDER_PATTERNS.some((p) => p.test(str));
};

const getSkillName = (skill) => {
  if (!skill) return "";
  if (typeof skill === "string") return stripHtmlTags(skill);
  if (typeof skill === "object") return stripHtmlTags(skill.name || skill.value || skill.skill || skill.label || skill.title || "");
  return stripHtmlTags(String(skill));
};

const getSkillsList = (cat) => {
  if (!cat?.skills || !Array.isArray(cat.skills)) return [];
  return cat.skills.map((s) => getSkillName(s)).filter((n) => n.length > 0);
};

const formatDate = (date) => {
  if (!date) return "";
  if (date.includes("T")) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }
  const parts = date.split("-");
  if (parts.length < 2) return date;
  const mi = parseInt(parts[1]) - 1;
  if (mi < 0 || mi > 11) return date;
  return `${MONTH_NAMES[mi]} ${parts[0]}`;
};

const hasEducationData    = (d) => Array.isArray(d) && d.some((e) => hasMeaningfulValue(e.institution) || hasMeaningfulValue(e.degree) || hasMeaningfulValue(e.field));
const hasExperienceData   = (d) => Array.isArray(d) && d.some((e) => hasMeaningfulValue(e.company) || hasMeaningfulValue(e.position));
const hasSkillsData       = (d) => Array.isArray(d) && d.some((c) => hasMeaningfulValue(c.name) || getSkillsList(c).length > 0);
const hasAchievementsData = (d) => Array.isArray(d) && d.some((a) => hasMeaningfulValue(a.title));
const hasVolunteerData    = (d) => Array.isArray(d) && d.some((v) => hasMeaningfulValue(v.organization) || hasMeaningfulValue(v.role));

// ============================================
// TEXT WRAP
// ============================================
function wrapText(text, font, size, maxWidth) {
  if (!text) return [];
  const clean = stripHtmlTags(text.toString());
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
}

// ============================================
// CONTENT-AWARE LAYOUT ENGINE
// ============================================
function estimateContentLines(cvData) {
  let lines = 0;
  lines += 7;
  if (hasMeaningfulValue(cvData.personal?.headline)) lines += 1;
  if (hasMeaningfulValue(cvData.personal?.summary)) {
    const len = stripHtmlTags(cvData.personal.summary).length;
    lines += 2 + Math.ceil(len / 75);
  }
  if (hasExperienceData(cvData.experience)) {
    lines += 2;
    for (const exp of cvData.experience) {
      if (!hasMeaningfulValue(exp.company) && !hasMeaningfulValue(exp.position)) continue;
      lines += 3;
      const desc = parseDescription(exp.description);
      for (const d of desc) lines += Math.ceil(stripHtmlTags(d).length / 70);
    }
  }
  if (hasEducationData(cvData.education)) {
    lines += 2;
    for (const edu of cvData.education) {
      if (!hasMeaningfulValue(edu.institution) && !hasMeaningfulValue(edu.degree) && !hasMeaningfulValue(edu.field)) continue;
      lines += 3;
      const desc = parseDescription(edu.description);
      for (const d of desc) lines += Math.ceil(stripHtmlTags(d).length / 70);
    }
  }
  // Additional info divider line
  lines += 2;
  if (hasSkillsData(cvData.skills)) {
    lines += 2;
    for (const cat of cvData.skills) {
      const list = getSkillsList(cat);
      lines += Math.max(1, Math.ceil(list.join(", ").length / 65));
    }
  }
  if (hasAchievementsData(cvData.achievements)) {
    lines += 2;
    for (const a of cvData.achievements) {
      if (!hasMeaningfulValue(a.title)) continue;
      lines += 2;
      const desc = parseDescription(a.description);
      for (const d of desc) lines += Math.ceil(stripHtmlTags(d).length / 70);
    }
  }
  if (hasVolunteerData(cvData.volunteer)) {
    lines += 2;
    for (const v of cvData.volunteer) {
      if (!hasMeaningfulValue(v.organization) && !hasMeaningfulValue(v.role)) continue;
      lines += 3;
      const desc = parseDescription(v.description);
      for (const d of desc) lines += Math.ceil(stripHtmlTags(d).length / 70);
    }
  }
  return lines;
}

function getLayoutConfig(cvData) {
  const lines = estimateContentLines(cvData);
  if (lines <= 28) {
    return { topMargin: 55, bottomMargin: 50, sectionGap: 22, entryGap: 12, headerGap: 18, density: "spacious" };
  }
  if (lines <= 45) {
    return { topMargin: 48, bottomMargin: 42, sectionGap: 16, entryGap: 8, headerGap: 14, density: "normal" };
  }
  return { topMargin: 40, bottomMargin: 36, sectionGap: 12, entryGap: 5, headerGap: 10, density: "compact" };
}

// ============================================
// PAGE NUMBER HELPER
// ============================================
function addPageNumbers(pdfDoc, font, color) {
  const pages = pdfDoc.getPages();
  if (pages.length <= 1) return;
  for (let i = 0; i < pages.length; i++) {
    const pg = pages[i];
    const text = `${i + 1} / ${pages.length}`;
    const tw = font.widthOfTextAtSize(text, 8);
    pg.drawText(text, { x: PAGE.width / 2 - tw / 2, y: 22, size: 8, font, color });
  }
}

// ============================================
// PDF GENERATION ENTRY POINT
// ============================================
async function generatePDF(cvData, templateId, themeColor) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const fonts = {
    helvetica:        await pdfDoc.embedFont(StandardFonts.Helvetica),
    helveticaBold:    await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    helveticaOblique: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    timesRoman:       await pdfDoc.embedFont(StandardFonts.TimesRoman),
    timesRomanBold:   await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    timesRomanItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
    courier:          await pdfDoc.embedFont(StandardFonts.Courier),
  };
  const hexToRgb = (hex) => {
    if (!hex) return { r: 0, g: 0, b: 0 };
    const c = hex.replace("#", "");
    const res = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);
    return res
      ? { r: parseInt(res[1], 16) / 255, g: parseInt(res[2], 16) / 255, b: parseInt(res[3], 16) / 255 }
      : { r: 0, g: 0, b: 0 };
  };
  const tc = hexToRgb(themeColor);
  const primaryColor = rgb(tc.r, tc.g, tc.b);
  const primaryLight = rgb(
    Math.min(1, tc.r * 0.15 + 0.85),
    Math.min(1, tc.g * 0.15 + 0.85),
    Math.min(1, tc.b * 0.15 + 0.85)
  );
  const layout = getLayoutConfig(cvData);
  const utils = { ...fonts, primaryColor, primaryLight, rgb, layout };

  switch (templateId) {
    case "classic": return generateClassicTemplate(pdfDoc, cvData, utils);
    case "minimal": return generateMinimalTemplate(pdfDoc, cvData, utils);
    case "modern":
    default:        return generateModernTemplate(pdfDoc, cvData, utils);
  }
}

// ============================================
// MODERN TEMPLATE
// ============================================
async function generateModernTemplate(pdfDoc, cvData, utils) {
  const { helvetica, helveticaBold, helveticaOblique, primaryColor, primaryLight, rgb, layout } = utils;
  const W = PAGE.width, H = PAGE.height;
  const ML = 48, MR = 48, CW = W - ML - MR, RE = W - MR;
  let page = pdfDoc.addPage([W, H]);
  let y = H - layout.topMargin;

  const C = {
    name:     rgb(0.06, 0.06, 0.06),
    heading:  rgb(0.08, 0.08, 0.08),
    body:     rgb(0.16, 0.16, 0.16),
    secondary:rgb(0.32, 0.32, 0.32),
    muted:    rgb(0.48, 0.48, 0.48),
    light:    rgb(0.62, 0.62, 0.62),
    rule:     rgb(0.78, 0.78, 0.78),
    faintRule:rgb(0.88, 0.88, 0.88),
  };

  const F = layout.density === "compact"
    ? { name: 22, headline: 10, contact: 8.5, sectionHead: 9.5, title: 10.5, sub: 9,   body: 9.5, date: 8.5, bullet: 9.5, lh: 12.5 }
    : layout.density === "spacious"
    ? { name: 26, headline: 11.5,contact: 9,  sectionHead: 10,  title: 11.5, sub: 10,  body: 10.5,date: 9,   bullet: 10.5,lh: 14   }
    : { name: 24, headline: 11,  contact: 8.5, sectionHead: 10,  title: 11,   sub: 9.5, body: 10,  date: 8.5, bullet: 10,  lh: 13   };

  const addNewPage = () => { page = pdfDoc.addPage([W, H]); y = H - layout.topMargin; };
  const ensureSpace = (n) => { if (y - n < layout.bottomMargin + 15) addNewPage(); };

  const drawDateRight = (text, yPos) => {
    if (!text) return;
    const w = helvetica.widthOfTextAtSize(text, F.date);
    page.drawText(text, { x: RE - w, y: yPos, size: F.date, font: helvetica, color: C.muted });
  };

  const drawSectionHeader = (title) => {
    ensureSpace(30);
    y -= layout.sectionGap;
    const barH = 13;
    page.drawRectangle({ x: ML, y: y - 2, width: 3.5, height: barH, color: primaryColor });
    page.drawText(title.toUpperCase(), { x: ML + 10, y, size: F.sectionHead, font: helveticaBold, color: C.heading });
    y -= 6;
    page.drawLine({ start: { x: ML, y }, end: { x: RE, y }, thickness: 0.5, color: C.rule });
    y -= layout.headerGap;
  };

  // ── "Additional Information" divider — matches preview panel style
  const drawAdditionalInfoDivider = () => {
    ensureSpace(24);
    y -= layout.sectionGap;
    const label = "ADDITIONAL INFORMATION";
    const labelW = helveticaBold.widthOfTextAtSize(label, 7.5);
    const cx = W / 2;
    const lineY = y + 4;
    // Left rule
    page.drawLine({ start: { x: ML, y: lineY }, end: { x: cx - labelW / 2 - 8, y: lineY }, thickness: 0.5, color: C.rule });
    // Label
    page.drawText(label, { x: cx - labelW / 2, y, size: 7.5, font: helveticaBold, color: C.muted });
    // Right rule
    page.drawLine({ start: { x: cx + labelW / 2 + 8, y: lineY }, end: { x: RE, y: lineY }, thickness: 0.5, color: C.rule });
    y -= 14;
  };

  const drawBullets = (items, indent) => {
    const textX = indent + 12;
    const maxW = CW - (textX - ML);
    for (const item of items) {
      const clean = stripHtmlTags(item);
      if (!clean) continue;
      const lines = wrapText(clean, helvetica, F.bullet, maxW);
      lines.forEach((line, idx) => {
        ensureSpace(F.lh);
        if (idx === 0) page.drawCircle({ x: indent + 4, y: y + 3, size: 1.8, color: C.secondary });
        page.drawText(line, { x: textX, y, size: F.bullet, font: helvetica, color: C.body });
        y -= F.lh;
      });
    }
  };

  const drawWrappedBold = (text, maxW, yStart) => {
    const lines = wrapText(text, helveticaBold, F.title, maxW);
    lines.forEach((l, i) => {
      page.drawText(l, { x: ML, y: yStart - i * (F.lh + 0.5), size: F.title, font: helveticaBold, color: C.heading });
    });
    return lines.length;
  };

  // ── HEADER ──
  ensureSpace(80);
  const fullName = stripHtmlTags(cvData.personal?.fullName) || "Your Name";
  page.drawText(fullName, { x: ML, y, size: F.name, font: helveticaBold, color: primaryColor });
  y -= F.name + 6;

  if (hasMeaningfulValue(cvData.personal?.headline)) {
    const hl = stripHtmlTags(cvData.personal.headline);
    page.drawText(hl, { x: ML, y, size: F.headline, font: helvetica, color: C.secondary });
    y -= F.headline + 5;
  }

  const contactItems = [];
  if (hasMeaningfulValue(cvData.personal?.email))    contactItems.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone))    contactItems.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location)) contactItems.push(stripHtmlTags(cvData.personal.location));
  if (hasMeaningfulValue(cvData.personal?.linkedin)) contactItems.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website))  contactItems.push(stripHtmlTags(cvData.personal.website));
  if (contactItems.length > 0) {
    const contactStr = contactItems.join(" \u2022 ");
    const contactLines = wrapText(contactStr, helvetica, F.contact, CW);
    for (const line of contactLines) {
      page.drawText(line, { x: ML, y, size: F.contact, font: helvetica, color: C.muted });
      y -= F.contact + 3;
    }
    y -= 2;
  }
  page.drawLine({ start: { x: ML, y }, end: { x: RE, y }, thickness: 2, color: primaryColor });
  y -= 4;

  // ── 1. PROFESSIONAL SUMMARY ──
  if (hasMeaningfulValue(cvData.personal?.summary)) {
    drawSectionHeader("Professional Summary");
    const lines = wrapText(stripHtmlTags(cvData.personal.summary), helvetica, F.body, CW);
    for (const line of lines) {
      ensureSpace(F.lh);
      page.drawText(line, { x: ML, y, size: F.body, font: helvetica, color: C.body });
      y -= F.lh;
    }
    y -= 2;
  }

  // ── 2. PROFESSIONAL EXPERIENCE ──
  if (hasExperienceData(cvData.experience)) {
    drawSectionHeader("Professional Experience");
    cvData.experience.forEach((exp, idx) => {
      const hasCo = hasMeaningfulValue(exp.company);
      const hasPos = hasMeaningfulValue(exp.position);
      if (!hasCo && !hasPos) return;
      ensureSpace(40);
      let dateStr = "";
      if (exp.startDate || exp.endDate || exp.isCurrentRole)
        dateStr = `${formatDate(exp.startDate)} \u2013 ${exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}`;
      if (hasPos) {
        const dateW = dateStr ? helvetica.widthOfTextAtSize(dateStr, F.date) + 10 : 0;
        const numLines = drawWrappedBold(stripHtmlTags(exp.position), CW - dateW, y);
        if (dateStr) drawDateRight(dateStr, y);
        y -= numLines > 1 ? (numLines - 1) * (F.lh + 0.5) + F.lh + 2 : F.lh + 2;
      }
      if (hasCo) {
        let companyText = stripHtmlTags(exp.company);
        if (hasMeaningfulValue(exp.location)) companyText += " \u2022 " + stripHtmlTags(exp.location);
        page.drawText(companyText, { x: ML, y, size: F.sub, font: helveticaOblique, color: C.secondary });
        y -= F.sub + 4;
      }
      if (hasMeaningfulValue(exp.description)) {
        const items = parseDescription(exp.description);
        if (items.length > 0) drawBullets(items, ML + 2);
      }
      y -= layout.entryGap;
      if (idx < cvData.experience.length - 1) {
        const nextHas = hasMeaningfulValue(cvData.experience[idx + 1]?.company) || hasMeaningfulValue(cvData.experience[idx + 1]?.position);
        if (nextHas) {
          page.drawLine({ start: { x: ML + 20, y: y + 2 }, end: { x: RE - 20, y: y + 2 }, thickness: 0.3, color: C.faintRule });
          y -= 2;
        }
      }
    });
    y -= 2;
  }

  // ── 3. EDUCATION ──
  if (hasEducationData(cvData.education)) {
    drawSectionHeader("Education");
    for (const edu of cvData.education) {
      const hasI = hasMeaningfulValue(edu.institution);
      const hasD = hasMeaningfulValue(edu.degree);
      const hasF = hasMeaningfulValue(edu.field);
      if (!hasI && !hasD && !hasF) continue;
      ensureSpace(36);
      let degText = "";
      if (hasD && hasF) degText = `${stripHtmlTags(edu.degree)} in ${stripHtmlTags(edu.field)}`;
      else if (hasD) degText = stripHtmlTags(edu.degree);
      else if (hasF) degText = stripHtmlTags(edu.field);
      let dateStr = "";
      if (edu.startDate || edu.endDate) dateStr = `${formatDate(edu.startDate)} \u2013 ${formatDate(edu.endDate)}`;
      if (degText) {
        const dateW = dateStr ? helvetica.widthOfTextAtSize(dateStr, F.date) + 10 : 0;
        const numLines = drawWrappedBold(degText, CW - dateW, y);
        if (dateStr) drawDateRight(dateStr, y);
        y -= numLines > 1 ? (numLines - 1) * (F.lh + 0.5) + F.lh + 2 : F.lh + 2;
      }
      if (hasI) {
        page.drawText(stripHtmlTags(edu.institution), { x: ML, y, size: F.sub, font: helveticaOblique, color: C.secondary });
        y -= F.sub + 3;
      }
      if (hasMeaningfulValue(edu.gpa)) {
        page.drawText("GPA: " + stripHtmlTags(edu.gpa), { x: ML, y, size: F.sub, font: helvetica, color: C.muted });
        y -= F.sub + 3;
      }
      if (hasMeaningfulValue(edu.description)) {
        const items = parseDescription(edu.description);
        if (items.length > 0) drawBullets(items, ML + 2);
      }
      y -= layout.entryGap;
    }
    y -= 2;
  }

  // ── ADDITIONAL INFORMATION DIVIDER ──
  const hasAdditional = hasSkillsData(cvData.skills) || hasAchievementsData(cvData.achievements) || hasVolunteerData(cvData.volunteer);
  if (hasAdditional) {
    drawAdditionalInfoDivider();

    // ── 4. SKILLS ──
    if (hasSkillsData(cvData.skills)) {
      drawSectionHeader("Skills");
      for (const cat of cvData.skills) {
        const list = getSkillsList(cat);
        const hasN = hasMeaningfulValue(cat.name);
        if (!hasN && list.length === 0) continue;
        ensureSpace(F.lh + 4);
        const label = (stripHtmlTags(cat.name) || "Skills") + ": ";
        const labelW = helveticaBold.widthOfTextAtSize(label, F.body);
        page.drawText(label, { x: ML, y, size: F.body, font: helveticaBold, color: C.heading });
        if (list.length > 0) {
          const skillLines = wrapText(list.join(", "), helvetica, F.body, CW - labelW - 4);
          const startY = y;
          skillLines.forEach((l, i) => {
            page.drawText(l, { x: ML + labelW, y: startY - i * F.lh, size: F.body, font: helvetica, color: C.body });
          });
          y = startY - skillLines.length * F.lh;
        } else {
          y -= F.lh;
        }
        y -= 3;
      }
      y -= 2;
    }

    // ── 5. ACHIEVEMENTS ──
    if (hasAchievementsData(cvData.achievements)) {
      drawSectionHeader("Achievements");
      for (const ach of cvData.achievements) {
        if (!hasMeaningfulValue(ach.title)) continue;
        ensureSpace(28);
        let dateW = 0;
        if (hasMeaningfulValue(ach.date)) dateW = helvetica.widthOfTextAtSize(formatDate(ach.date), F.date) + 10;
        const numLines = drawWrappedBold(stripHtmlTags(ach.title), CW - dateW, y);
        if (hasMeaningfulValue(ach.date)) drawDateRight(formatDate(ach.date), y);
        y -= numLines > 1 ? (numLines - 1) * (F.lh + 0.5) + F.lh + 2 : F.lh + 2;
        if (hasMeaningfulValue(ach.organization)) {
          page.drawText(stripHtmlTags(ach.organization), { x: ML, y, size: F.sub, font: helveticaOblique, color: C.secondary });
          y -= F.sub + 3;
        }
        if (hasMeaningfulValue(ach.description)) {
          const items = parseDescription(ach.description);
          if (items.length > 0) drawBullets(items, ML + 2);
        }
        y -= layout.entryGap;
      }
      y -= 2;
    }

    // ── 6. VOLUNTEER EXPERIENCE ──
    if (hasVolunteerData(cvData.volunteer)) {
      drawSectionHeader("Volunteer Experience");
      for (const vol of cvData.volunteer) {
        const hasO = hasMeaningfulValue(vol.organization);
        const hasR = hasMeaningfulValue(vol.role);
        if (!hasO && !hasR) continue;
        ensureSpace(34);
        let dateStr = "";
        if (vol.startDate || vol.endDate) dateStr = `${formatDate(vol.startDate)} \u2013 ${formatDate(vol.endDate)}`;
        if (hasR) {
          const dateW = dateStr ? helvetica.widthOfTextAtSize(dateStr, F.date) + 10 : 0;
          const numLines = drawWrappedBold(stripHtmlTags(vol.role), CW - dateW, y);
          if (dateStr) drawDateRight(dateStr, y);
          y -= numLines > 1 ? (numLines - 1) * (F.lh + 0.5) + F.lh + 2 : F.lh + 2;
        }
        if (hasO) {
          let orgT = stripHtmlTags(vol.organization);
          if (hasMeaningfulValue(vol.location)) orgT += " \u2022 " + stripHtmlTags(vol.location);
          page.drawText(orgT, { x: ML, y, size: F.sub, font: helveticaOblique, color: C.secondary });
          y -= F.sub + 4;
        }
        if (hasMeaningfulValue(vol.description)) {
          const items = parseDescription(vol.description);
          if (items.length > 0) drawBullets(items, ML + 2);
        }
        y -= layout.entryGap;
      }
    }
  }

  addPageNumbers(pdfDoc, helvetica, C.light);
  return await pdfDoc.save();
}

// ============================================
// CLASSIC TEMPLATE
// ============================================
async function generateClassicTemplate(pdfDoc, cvData, utils) {
  const { timesRoman, timesRomanBold, timesRomanItalic, helveticaBold, primaryColor, rgb, layout } = utils;
  const W = PAGE.width, H = PAGE.height;
  const ML = 50, MR = 50, CW = W - ML - MR, CX = W / 2, RE = W - MR;
  let page = pdfDoc.addPage([W, H]);
  let y = H - layout.topMargin;

  const C = {
    name:     rgb(0.05, 0.05, 0.05),
    heading:  rgb(0.06, 0.06, 0.06),
    body:     rgb(0.14, 0.14, 0.14),
    secondary:rgb(0.30, 0.30, 0.30),
    muted:    rgb(0.45, 0.45, 0.45),
    light:    rgb(0.60, 0.60, 0.60),
    rule:     rgb(0.72, 0.72, 0.72),
  };

  const F = layout.density === "compact"
    ? { name: 24, headline: 11,   contact: 9,   sectionHead: 10.5, title: 11,   sub: 9.5,  body: 10,   date: 9,   bullet: 10,   lh: 13 }
    : layout.density === "spacious"
    ? { name: 28, headline: 12,   contact: 10,  sectionHead: 11.5, title: 12,   sub: 10.5, body: 11,   date: 9.5, bullet: 11,   lh: 15 }
    : { name: 26, headline: 11.5, contact: 9.5, sectionHead: 11,   title: 11.5, sub: 10,   body: 10.5, date: 9.5, bullet: 10.5, lh: 14 };

  const addNewPage = () => { page = pdfDoc.addPage([W, H]); y = H - layout.topMargin; };
  const ensureSpace = (n) => { if (y - n < layout.bottomMargin + 15) addNewPage(); };

  const drawDateRight = (text, yPos) => {
    if (!text) return;
    const w = timesRoman.widthOfTextAtSize(text, F.date);
    page.drawText(text, { x: RE - w, y: yPos, size: F.date, font: timesRoman, color: C.muted });
  };

  const drawSectionHeader = (title) => {
    ensureSpace(30);
    y -= layout.sectionGap;
    page.drawText(title.toUpperCase(), { x: ML, y, size: F.sectionHead, font: timesRomanBold, color: primaryColor });
    y -= 5;
    page.drawLine({ start: { x: ML, y }, end: { x: RE, y }, thickness: 1.2, color: primaryColor });
    y -= layout.headerGap;
  };

  // ── "Additional Information" divider — matches preview panel classic style
  const drawAdditionalInfoDivider = () => {
    ensureSpace(24);
    y -= layout.sectionGap;
    const label = "ADDITIONAL INFORMATION";
    const labelW = timesRomanBold.widthOfTextAtSize(label, 7.5);
    const cx = W / 2;
    const lineY = y + 4;
    page.drawLine({ start: { x: ML, y: lineY }, end: { x: cx - labelW / 2 - 8, y: lineY }, thickness: 0.5, color: C.rule });
    page.drawText(label, { x: cx - labelW / 2, y, size: 7.5, font: timesRomanBold, color: C.muted });
    page.drawLine({ start: { x: cx + labelW / 2 + 8, y: lineY }, end: { x: RE, y: lineY }, thickness: 0.5, color: C.rule });
    y -= 14;
  };

  const drawBullets = (items, indent) => {
    const textX = indent + 12;
    const maxW = CW - (textX - ML);
    for (const item of items) {
      const clean = stripHtmlTags(item);
      if (!clean) continue;
      const lines = wrapText(clean, timesRoman, F.bullet, maxW);
      lines.forEach((line, idx) => {
        ensureSpace(F.lh);
        if (idx === 0) page.drawText("\u2013", { x: indent + 2, y, size: F.bullet, font: timesRoman, color: C.light });
        page.drawText(line, { x: textX, y, size: F.bullet, font: timesRoman, color: C.body });
        y -= F.lh;
      });
    }
  };

  const drawWrappedBold = (text, maxW, yStart) => {
    const lines = wrapText(text, timesRomanBold, F.title, maxW);
    lines.forEach((l, i) => {
      page.drawText(l, { x: ML, y: yStart - i * (F.lh + 0.5), size: F.title, font: timesRomanBold, color: C.heading });
    });
    return lines.length;
  };

  // ── HEADER ──
  ensureSpace(85);
  const name = (stripHtmlTags(cvData.personal?.fullName) || "Your Name").toUpperCase();
  const nameW = timesRomanBold.widthOfTextAtSize(name, F.name);
  page.drawText(name, { x: CX - nameW / 2, y, size: F.name, font: timesRomanBold, color: primaryColor });
  y -= F.name + 6;

  if (hasMeaningfulValue(cvData.personal?.headline)) {
    const hl = stripHtmlTags(cvData.personal.headline);
    const hlW = timesRomanItalic.widthOfTextAtSize(hl, F.headline);
    page.drawText(hl, { x: CX - hlW / 2, y, size: F.headline, font: timesRomanItalic, color: C.secondary });
    y -= F.headline + 5;
  }

  const row1 = [];
  if (hasMeaningfulValue(cvData.personal?.email))    row1.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone))    row1.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location)) row1.push(stripHtmlTags(cvData.personal.location));
  const row2 = [];
  if (hasMeaningfulValue(cvData.personal?.linkedin)) row2.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website))  row2.push(stripHtmlTags(cvData.personal.website));
  for (const row of [row1, row2]) {
    if (row.length > 0) {
      const t = row.join(" | ");
      const w = timesRoman.widthOfTextAtSize(t, F.contact);
      page.drawText(t, { x: CX - w / 2, y, size: F.contact, font: timesRoman, color: C.muted });
      y -= F.contact + 3;
    }
  }
  y -= 3;
  page.drawLine({ start: { x: ML, y: y + 2 }, end: { x: RE, y: y + 2 }, thickness: 2.5, color: primaryColor });
  page.drawLine({ start: { x: ML, y: y - 1 }, end: { x: RE, y: y - 1 }, thickness: 0.5, color: primaryColor });
  y -= 6;

  // ── 1. PROFESSIONAL SUMMARY ──
  if (hasMeaningfulValue(cvData.personal?.summary)) {
    drawSectionHeader("Professional Summary");
    const lines = wrapText(stripHtmlTags(cvData.personal.summary), timesRoman, F.body, CW);
    for (const line of lines) {
      ensureSpace(F.lh);
      page.drawText(line, { x: ML, y, size: F.body, font: timesRoman, color: C.body });
      y -= F.lh;
    }
    y -= 2;
  }

  // ── 2. PROFESSIONAL EXPERIENCE ──
  if (hasExperienceData(cvData.experience)) {
    drawSectionHeader("Professional Experience");
    for (const exp of cvData.experience) {
      if (!hasMeaningfulValue(exp.company) && !hasMeaningfulValue(exp.position)) continue;
      ensureSpace(40);
      let dateStr = "";
      if (exp.startDate || exp.endDate || exp.isCurrentRole)
        dateStr = `${formatDate(exp.startDate)} \u2013 ${exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}`;
      if (hasMeaningfulValue(exp.position)) {
        const dateW = dateStr ? timesRoman.widthOfTextAtSize(dateStr, F.date) + 10 : 0;
        const numLines = drawWrappedBold(stripHtmlTags(exp.position), CW - dateW, y);
        if (dateStr) drawDateRight(dateStr, y);
        y -= numLines > 1 ? (numLines - 1) * (F.lh + 0.5) + F.lh + 2 : F.lh + 2;
      }
      if (hasMeaningfulValue(exp.company)) {
        let co = stripHtmlTags(exp.company);
        if (hasMeaningfulValue(exp.location)) co += ", " + stripHtmlTags(exp.location);
        page.drawText(co, { x: ML, y, size: F.sub, font: timesRomanItalic, color: C.secondary });
        y -= F.sub + 4;
      }
      if (hasMeaningfulValue(exp.description)) {
        const items = parseDescription(exp.description);
        if (items.length > 0) drawBullets(items, ML);
      }
      y -= layout.entryGap;
    }
    y -= 2;
  }

  // ── 3. EDUCATION ──
  if (hasEducationData(cvData.education)) {
    drawSectionHeader("Education");
    for (const edu of cvData.education) {
      if (!hasMeaningfulValue(edu.institution) && !hasMeaningfulValue(edu.degree) && !hasMeaningfulValue(edu.field)) continue;
      ensureSpace(36);
      let deg = "";
      if (hasMeaningfulValue(edu.degree) && hasMeaningfulValue(edu.field)) deg = `${stripHtmlTags(edu.degree)}, ${stripHtmlTags(edu.field)}`;
      else if (hasMeaningfulValue(edu.degree)) deg = stripHtmlTags(edu.degree);
      else if (hasMeaningfulValue(edu.field))  deg = stripHtmlTags(edu.field);
      let dateStr = "";
      if (edu.startDate || edu.endDate) dateStr = `${formatDate(edu.startDate)} \u2013 ${formatDate(edu.endDate)}`;
      if (deg) {
        const dateW = dateStr ? timesRoman.widthOfTextAtSize(dateStr, F.date) + 10 : 0;
        const numLines = drawWrappedBold(deg, CW - dateW, y);
        if (dateStr) drawDateRight(dateStr, y);
        y -= numLines > 1 ? (numLines - 1) * (F.lh + 0.5) + F.lh + 2 : F.lh + 2;
      }
      if (hasMeaningfulValue(edu.institution)) {
        page.drawText(stripHtmlTags(edu.institution), { x: ML, y, size: F.sub, font: timesRomanItalic, color: C.secondary });
        y -= F.sub + 3;
      }
      if (hasMeaningfulValue(edu.gpa)) {
        page.drawText("GPA: " + stripHtmlTags(edu.gpa), { x: ML, y, size: F.sub, font: timesRoman, color: C.muted });
        y -= F.sub + 3;
      }
      if (hasMeaningfulValue(edu.description)) {
        const items = parseDescription(edu.description);
        if (items.length > 0) drawBullets(items, ML);
      }
      y -= layout.entryGap;
    }
    y -= 2;
  }

  // ── ADDITIONAL INFORMATION DIVIDER ──
  const hasAdditional = hasSkillsData(cvData.skills) || hasAchievementsData(cvData.achievements) || hasVolunteerData(cvData.volunteer);
  if (hasAdditional) {
    drawAdditionalInfoDivider();

    // ── 4. SKILLS ──
    if (hasSkillsData(cvData.skills)) {
      drawSectionHeader("Skills");
      for (const cat of cvData.skills) {
        const list = getSkillsList(cat);
        if (!hasMeaningfulValue(cat.name) && list.length === 0) continue;
        ensureSpace(F.lh + 4);
        const label = (stripHtmlTags(cat.name) || "Skills") + ": ";
        const labelW = timesRomanBold.widthOfTextAtSize(label, F.body);
        page.drawText(label, { x: ML, y, size: F.body, font: timesRomanBold, color: C.heading });
        if (list.length > 0) {
          const lines = wrapText(list.join(", "), timesRoman, F.body, CW - labelW - 4);
          const startY = y;
          lines.forEach((l, i) => {
            page.drawText(l, { x: ML + labelW, y: startY - i * F.lh, size: F.body, font: timesRoman, color: C.body });
          });
          y = startY - lines.length * F.lh;
        } else {
          y -= F.lh;
        }
        y -= 3;
      }
      y -= 2;
    }

    // ── 5. ACHIEVEMENTS ──
    if (hasAchievementsData(cvData.achievements)) {
      drawSectionHeader("Achievements");
      for (const ach of cvData.achievements) {
        if (!hasMeaningfulValue(ach.title)) continue;
        ensureSpace(28);
        let dateW = 0;
        if (hasMeaningfulValue(ach.date)) dateW = timesRoman.widthOfTextAtSize(formatDate(ach.date), F.date) + 10;
        const numLines = drawWrappedBold(stripHtmlTags(ach.title), CW - dateW, y);
        if (hasMeaningfulValue(ach.date)) drawDateRight(formatDate(ach.date), y);
        y -= numLines > 1 ? (numLines - 1) * (F.lh + 0.5) + F.lh + 2 : F.lh + 2;
        if (hasMeaningfulValue(ach.organization)) {
          page.drawText(stripHtmlTags(ach.organization), { x: ML, y, size: F.sub, font: timesRomanItalic, color: C.secondary });
          y -= F.sub + 3;
        }
        if (hasMeaningfulValue(ach.description)) {
          const items = parseDescription(ach.description);
          if (items.length > 0) drawBullets(items, ML);
        }
        y -= layout.entryGap;
      }
      y -= 2;
    }

    // ── 6. VOLUNTEER EXPERIENCE ──
    if (hasVolunteerData(cvData.volunteer)) {
      drawSectionHeader("Volunteer Experience");
      for (const vol of cvData.volunteer) {
        if (!hasMeaningfulValue(vol.organization) && !hasMeaningfulValue(vol.role)) continue;
        ensureSpace(34);
        let dateStr = "";
        if (vol.startDate || vol.endDate) dateStr = `${formatDate(vol.startDate)} \u2013 ${formatDate(vol.endDate)}`;
        if (hasMeaningfulValue(vol.role)) {
          const dateW = dateStr ? timesRoman.widthOfTextAtSize(dateStr, F.date) + 10 : 0;
          const numLines = drawWrappedBold(stripHtmlTags(vol.role), CW - dateW, y);
          if (dateStr) drawDateRight(dateStr, y);
          y -= numLines > 1 ? (numLines - 1) * (F.lh + 0.5) + F.lh + 2 : F.lh + 2;
        }
        if (hasMeaningfulValue(vol.organization)) {
          let org = stripHtmlTags(vol.organization);
          if (hasMeaningfulValue(vol.location)) org += ", " + stripHtmlTags(vol.location);
          page.drawText(org, { x: ML, y, size: F.sub, font: timesRomanItalic, color: C.secondary });
          y -= F.sub + 4;
        }
        if (hasMeaningfulValue(vol.description)) {
          const items = parseDescription(vol.description);
          if (items.length > 0) drawBullets(items, ML);
        }
        y -= layout.entryGap;
      }
    }
  }

  addPageNumbers(pdfDoc, timesRoman, C.light);
  return await pdfDoc.save();
}

// ============================================
// MINIMAL TEMPLATE
// ============================================
async function generateMinimalTemplate(pdfDoc, cvData, utils) {
  const { helvetica, helveticaBold, helveticaOblique, primaryColor, rgb, layout } = utils;
  const W = PAGE.width, H = PAGE.height;
  const ML = 54, MR = 54, CW = W - ML - MR, CX = W / 2, RE = W - MR;
  let page = pdfDoc.addPage([W, H]);
  let y = H - layout.topMargin;

  const C = {
    name:     rgb(0.10, 0.10, 0.10),
    heading:  rgb(0.10, 0.10, 0.10),
    body:     rgb(0.20, 0.20, 0.20),
    secondary:rgb(0.38, 0.38, 0.38),
    muted:    rgb(0.52, 0.52, 0.52),
    light:    rgb(0.65, 0.65, 0.65),
    rule:     rgb(0.82, 0.82, 0.82),
    faint:    rgb(0.90, 0.90, 0.90),
  };

  const F = layout.density === "compact"
    ? { name: 24, headline: 9.5, contact: 8,   sectionHead: 7.5, title: 10,   sub: 8.5, body: 9,   date: 8,   bullet: 9,   lh: 12 }
    : layout.density === "spacious"
    ? { name: 30, headline: 11,  contact: 9,   sectionHead: 8.5, title: 11,   sub: 9.5, body: 10,  date: 8.5, bullet: 10,  lh: 14 }
    : { name: 28, headline: 10,  contact: 8.5, sectionHead: 8,   title: 10.5, sub: 9,   body: 9.5, date: 8.5, bullet: 9.5, lh: 13 };

  const addNewPage = () => { page = pdfDoc.addPage([W, H]); y = H - layout.topMargin; };
  const ensureSpace = (n) => { if (y - n < layout.bottomMargin + 15) addNewPage(); };

  const drawDateRight = (text, yPos) => {
    if (!text) return;
    const w = helvetica.widthOfTextAtSize(text, F.date);
    page.drawText(text, { x: RE - w, y: yPos, size: F.date, font: helvetica, color: C.muted });
  };

  const drawSectionHeader = (title) => {
    ensureSpace(28);
    y -= layout.sectionGap;
    page.drawText(title.toUpperCase(), { x: ML, y, size: F.sectionHead, font: helveticaBold, color: C.muted });
    y -= 6;
    page.drawLine({ start: { x: ML, y }, end: { x: RE, y }, thickness: 0.35, color: C.rule });
    y -= layout.headerGap;
  };

  // ── "Additional Information" divider — matches preview panel minimal style
  const drawAdditionalInfoDivider = () => {
    ensureSpace(24);
    y -= layout.sectionGap;
    const label = "ADDITIONAL INFORMATION";
    const labelW = helveticaBold.widthOfTextAtSize(label, 7);
    const cx = W / 2;
    const lineY = y + 4;
    page.drawLine({ start: { x: ML, y: lineY }, end: { x: cx - labelW / 2 - 8, y: lineY }, thickness: 0.3, color: C.faint });
    page.drawText(label, { x: cx - labelW / 2, y, size: 7, font: helveticaBold, color: C.light });
    page.drawLine({ start: { x: cx + labelW / 2 + 8, y: lineY }, end: { x: RE, y: lineY }, thickness: 0.3, color: C.faint });
    y -= 14;
  };

  const drawBullets = (items, indent) => {
    const textX = indent + 12;
    const maxW = CW - (textX - ML);
    for (const item of items) {
      const clean = stripHtmlTags(item);
      if (!clean) continue;
      const lines = wrapText(clean, helvetica, F.bullet, maxW);
      lines.forEach((line, idx) => {
        ensureSpace(F.lh);
        if (idx === 0) page.drawText("\u2013", { x: indent + 1, y, size: F.bullet - 1, font: helvetica, color: C.light });
        page.drawText(line, { x: textX, y, size: F.bullet, font: helvetica, color: C.body });
        y -= F.lh;
      });
    }
  };

  const drawWrappedBold = (text, maxW, yStart) => {
    const lines = wrapText(text, helveticaBold, F.title, maxW);
    lines.forEach((l, i) => {
      page.drawText(l, { x: ML, y: yStart - i * (F.lh + 0.5), size: F.title, font: helveticaBold, color: C.heading });
    });
    return lines.length;
  };

  // ── HEADER ──
  ensureSpace(80);
  const fullName = stripHtmlTags(cvData.personal?.fullName) || "Your Name";
  const nameW = helvetica.widthOfTextAtSize(fullName, F.name);
  page.drawText(fullName, { x: CX - nameW / 2, y, size: F.name, font: helvetica, color: primaryColor });
  y -= F.name + 8;

  if (hasMeaningfulValue(cvData.personal?.headline)) {
    const hl = stripHtmlTags(cvData.personal.headline);
    const hlW = helvetica.widthOfTextAtSize(hl, F.headline);
    page.drawText(hl, { x: CX - hlW / 2, y, size: F.headline, font: helvetica, color: C.secondary });
    y -= F.headline + 6;
  }

  const contacts = [];
  if (hasMeaningfulValue(cvData.personal?.email))    contacts.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone))    contacts.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location)) contacts.push(stripHtmlTags(cvData.personal.location));
  if (hasMeaningfulValue(cvData.personal?.linkedin)) contacts.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website))  contacts.push(stripHtmlTags(cvData.personal.website));
  if (contacts.length > 0) {
    const cText = contacts.join(" | ");
    const cLines = wrapText(cText, helvetica, F.contact, CW);
    for (const line of cLines) {
      const lw = helvetica.widthOfTextAtSize(line, F.contact);
      page.drawText(line, { x: CX - lw / 2, y, size: F.contact, font: helvetica, color: C.muted });
      y -= F.contact + 3;
    }
    y -= 4;
  }
  const accentLen = 40;
  page.drawLine({ start: { x: CX - accentLen / 2, y }, end: { x: CX + accentLen / 2, y }, thickness: 1, color: primaryColor });
  y -= 6;

  // ── 1. SUMMARY ──
  if (hasMeaningfulValue(cvData.personal?.summary)) {
    drawSectionHeader("Summary");
    const lines = wrapText(stripHtmlTags(cvData.personal.summary), helvetica, F.body, CW);
    for (const line of lines) {
      ensureSpace(F.lh);
      page.drawText(line, { x: ML, y, size: F.body, font: helvetica, color: C.body });
      y -= F.lh;
    }
    y -= 2;
  }

  // ── 2. EXPERIENCE ──
  if (hasExperienceData(cvData.experience)) {
    drawSectionHeader("Experience");
    for (const exp of cvData.experience) {
      if (!hasMeaningfulValue(exp.company) && !hasMeaningfulValue(exp.position)) continue;
      ensureSpace(36);
      let dateStr = "";
      if (exp.startDate || exp.endDate || exp.isCurrentRole)
        dateStr = `${formatDate(exp.startDate)} \u2013 ${exp.isCurrentRole ? "Present" : formatDate(exp.endDate)}`;
      if (hasMeaningfulValue(exp.position)) {
        const dateW = dateStr ? helvetica.widthOfTextAtSize(dateStr, F.date) + 10 : 0;
        const numLines = drawWrappedBold(stripHtmlTags(exp.position), CW - dateW, y);
        if (dateStr) drawDateRight(dateStr, y);
        y -= numLines > 1 ? (numLines - 1) * (F.lh + 0.5) + F.lh + 2 : F.lh + 2;
      }
      if (hasMeaningfulValue(exp.company)) {
        let co = stripHtmlTags(exp.company);
        if (hasMeaningfulValue(exp.location)) co += " | " + stripHtmlTags(exp.location);
        page.drawText(co, { x: ML, y, size: F.sub, font: helvetica, color: C.muted });
        y -= F.sub + 4;
      }
      if (hasMeaningfulValue(exp.description)) {
        const items = parseDescription(exp.description);
        if (items.length > 0) drawBullets(items, ML);
      }
      y -= layout.entryGap;
    }
    y -= 2;
  }

  // ── 3. EDUCATION ──
  if (hasEducationData(cvData.education)) {
    drawSectionHeader("Education");
    for (const edu of cvData.education) {
      if (!hasMeaningfulValue(edu.institution) && !hasMeaningfulValue(edu.degree) && !hasMeaningfulValue(edu.field)) continue;
      ensureSpace(32);
      let deg = "";
      if (hasMeaningfulValue(edu.degree) && hasMeaningfulValue(edu.field)) deg = `${stripHtmlTags(edu.degree)}, ${stripHtmlTags(edu.field)}`;
      else if (hasMeaningfulValue(edu.degree)) deg = stripHtmlTags(edu.degree);
      else if (hasMeaningfulValue(edu.field))  deg = stripHtmlTags(edu.field);
      let dateStr = "";
      if (edu.startDate || edu.endDate) dateStr = `${formatDate(edu.startDate)} \u2013 ${formatDate(edu.endDate)}`;
      if (deg) {
        const dateW = dateStr ? helvetica.widthOfTextAtSize(dateStr, F.date) + 10 : 0;
        const numLines = drawWrappedBold(deg, CW - dateW, y);
        if (dateStr) drawDateRight(dateStr, y);
        y -= numLines > 1 ? (numLines - 1) * (F.lh + 0.5) + F.lh + 2 : F.lh + 2;
      }
      if (hasMeaningfulValue(edu.institution)) {
        page.drawText(stripHtmlTags(edu.institution), { x: ML, y, size: F.sub, font: helvetica, color: C.muted });
        y -= F.sub + 3;
      }
      if (hasMeaningfulValue(edu.gpa)) {
        page.drawText("GPA: " + stripHtmlTags(edu.gpa), { x: ML, y, size: F.sub, font: helvetica, color: C.muted });
        y -= F.sub + 3;
      }
      if (hasMeaningfulValue(edu.description)) {
        const items = parseDescription(edu.description);
        if (items.length > 0) drawBullets(items, ML);
      }
      y -= layout.entryGap;
    }
    y -= 2;
  }

  // ── ADDITIONAL INFORMATION DIVIDER ──
  const hasAdditional = hasSkillsData(cvData.skills) || hasAchievementsData(cvData.achievements) || hasVolunteerData(cvData.volunteer);
  if (hasAdditional) {
    drawAdditionalInfoDivider();

    // ── 4. SKILLS ──
    if (hasSkillsData(cvData.skills)) {
      drawSectionHeader("Skills");
      for (const cat of cvData.skills) {
        const list = getSkillsList(cat);
        if (!hasMeaningfulValue(cat.name) && list.length === 0) continue;
        ensureSpace(F.lh + 4);
        const label = stripHtmlTags(cat.name) || "Skills";
        const colW = Math.min(100, helveticaBold.widthOfTextAtSize(label, F.body) + 16);
        page.drawText(label, { x: ML, y, size: F.body, font: helveticaBold, color: C.secondary });
        if (list.length > 0) {
          const skillText = list.join(" \u2022 ");
          const sLines = wrapText(skillText, helvetica, F.body, CW - colW - 4);
          const startY = y;
          sLines.forEach((l, i) => {
            page.drawText(l, { x: ML + colW, y: startY - i * F.lh, size: F.body, font: helvetica, color: C.body });
          });
          y = startY - sLines.length * F.lh;
        } else {
          y -= F.lh;
        }
        y -= 3;
      }
      y -= 2;
    }

    // ── 5. ACHIEVEMENTS ──
    if (hasAchievementsData(cvData.achievements)) {
      drawSectionHeader("Achievements");
      for (const ach of cvData.achievements) {
        if (!hasMeaningfulValue(ach.title)) continue;
        ensureSpace(26);
        let dateW = 0;
        if (hasMeaningfulValue(ach.date)) dateW = helvetica.widthOfTextAtSize(formatDate(ach.date), F.date) + 10;
        const numLines = drawWrappedBold(stripHtmlTags(ach.title), CW - dateW, y);
        if (hasMeaningfulValue(ach.date)) drawDateRight(formatDate(ach.date), y);
        y -= numLines > 1 ? (numLines - 1) * (F.lh + 0.5) + F.lh + 2 : F.lh + 2;
        if (hasMeaningfulValue(ach.organization)) {
          page.drawText(stripHtmlTags(ach.organization), { x: ML, y, size: F.sub, font: helvetica, color: C.muted });
          y -= F.sub + 3;
        }
        if (hasMeaningfulValue(ach.description)) {
          const items = parseDescription(ach.description);
          if (items.length > 0) drawBullets(items, ML);
        }
        y -= layout.entryGap;
      }
      y -= 2;
    }

    // ── 6. VOLUNTEER ──
    if (hasVolunteerData(cvData.volunteer)) {
      drawSectionHeader("Volunteer Experience");
      for (const vol of cvData.volunteer) {
        if (!hasMeaningfulValue(vol.organization) && !hasMeaningfulValue(vol.role)) continue;
        ensureSpace(32);
        let dateStr = "";
        if (vol.startDate || vol.endDate) dateStr = `${formatDate(vol.startDate)} \u2013 ${formatDate(vol.endDate)}`;
        if (hasMeaningfulValue(vol.role)) {
          const dateW = dateStr ? helvetica.widthOfTextAtSize(dateStr, F.date) + 10 : 0;
          const numLines = drawWrappedBold(stripHtmlTags(vol.role), CW - dateW, y);
          if (dateStr) drawDateRight(dateStr, y);
          y -= numLines > 1 ? (numLines - 1) * (F.lh + 0.5) + F.lh + 2 : F.lh + 2;
        }
        if (hasMeaningfulValue(vol.organization)) {
          let org = stripHtmlTags(vol.organization);
          if (hasMeaningfulValue(vol.location)) org += " | " + stripHtmlTags(vol.location);
          page.drawText(org, { x: ML, y, size: F.sub, font: helvetica, color: C.muted });
          y -= F.sub + 4;
        }
        if (hasMeaningfulValue(vol.description)) {
          const items = parseDescription(vol.description);
          if (items.length > 0) drawBullets(items, ML);
        }
        y -= layout.entryGap;
      }
    }
  }

  addPageNumbers(pdfDoc, helvetica, C.light);
  return await pdfDoc.save();
}