// app/api/cv/export-pdf/route.js

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ============================================
// CONSTANTS - Pre-compiled for performance
// ============================================

/**
 * Pre-compiled regex patterns for HTML processing
 * Compiled once at module load for better performance
 */
const HTML_PATTERNS = {
  // Match any HTML tag
  tags: /<[^>]*>/g,
  // Match HTML list items - captures content between <li> tags
  listItems: /<li[^>]*>([\s\S]*?)<\/li>/gi,
  // Match paragraph tags
  paragraphs: /<p[^>]*>([\s\S]*?)<\/p>/gi,
  // Match line breaks
  lineBreaks: /<br\s*\/?>/gi,
  // HTML entities
  nbsp: /&nbsp;/g,
  amp: /&amp;/g,
  lt: /&lt;/g,
  gt: /&gt;/g,
  quot: /&quot;/g,
  apos: /&#39;/g,
  // Multiple whitespace
  whitespace: /\s+/g,
};

/**
 * Patterns that indicate placeholder/empty values
 * Pre-compiled for performance in validation checks
 */
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

/**
 * Month names for date formatting
 * @constant {string[]}
 */
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Default template and color values
 */
const DEFAULTS = {
  templateId: 'modern',
  themeColor: '#1e40af',
};

/**
 * Page dimensions for PDF generation (US Letter size in points)
 * 1 point = 1/72 inch
 */
const PAGE = {
  width: 612,      // 8.5 inches
  height: 792,     // 11 inches
  margin: 50,      // Standard margin
  lineHeight: 1.4, // Default line height multiplier
};

// ============================================
// API ROUTE HANDLERS
// ============================================

/**
 * POST Handler - Export current CV preview to PDF
 * Used when user exports directly from the CV builder preview
 * 
 * @param {Request} request - Next.js request object
 * @returns {NextResponse} PDF file response or error
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { cvData, templateId, cvNumber, themeColor } = body;

    if (!cvData) {
      return NextResponse.json(
        { error: "CV data is required" },
        { status: 400 }
      );
    }

    const pdf = await generatePDF(
      cvData,
      templateId || DEFAULTS.templateId,
      themeColor || DEFAULTS.themeColor
    );

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=CV-${cvNumber || Date.now()}.pdf`,
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

/**
 * GET Handler - Export saved CV or specific version to PDF
 * 
 * @param {Request} request - Next.js request object with query params
 * @returns {NextResponse} PDF file response or error
 */
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
      // Fetch specific version from database
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
      fileName = `CV-${version.versionLabel.replace(/\s+/g, '-')}`;

    } else if (cvId) {
      // Fetch CV with all related data
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
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${fileName}.pdf`,
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
// TEXT PROCESSING UTILITIES
// ============================================

/**
 * Strips HTML tags and decodes HTML entities from text
 * Preserves text content while removing all markup
 * 
 * @param {string|any} text - Text to clean
 * @returns {string} Cleaned plain text
 */
const stripHtmlTags = (text) => {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);
  
  return text
    // Replace line breaks with spaces
    .replace(HTML_PATTERNS.lineBreaks, ' ')
    // Remove all HTML tags
    .replace(HTML_PATTERNS.tags, '')
    // Decode HTML entities
    .replace(HTML_PATTERNS.nbsp, ' ')
    .replace(HTML_PATTERNS.amp, '&')
    .replace(HTML_PATTERNS.lt, '<')
    .replace(HTML_PATTERNS.gt, '>')
    .replace(HTML_PATTERNS.quot, '"')
    .replace(HTML_PATTERNS.apos, "'")
    // Normalize whitespace
    .replace(HTML_PATTERNS.whitespace, ' ')
    .trim();
};

/**
 * Parses HTML description into array of bullet points
 * Handles ReactQuill output with <ul><li> structure
 * 
 * @param {string|Array} description - Description content (may contain HTML)
 * @returns {string[]} Array of clean bullet point strings
 */
const parseDescription = (description) => {
  if (!description) return [];
  
  // If already an array, clean each item
  if (Array.isArray(description)) {
    return description
      .map(item => stripHtmlTags(item))
      .filter(item => item && item.trim().length > 0);
  }
  
  // Convert to string if needed
  const descString = String(description);
  
  // Extract content from <li> tags (ReactQuill format)
  const bulletPoints = [];
  let match;
  
  // Reset regex lastIndex for global matching
  HTML_PATTERNS.listItems.lastIndex = 0;
  
  while ((match = HTML_PATTERNS.listItems.exec(descString)) !== null) {
    const cleanText = stripHtmlTags(match[1]).trim();
    if (cleanText && cleanText.length > 0) {
      bulletPoints.push(cleanText);
    }
  }
  
  // If we found list items, return them
  if (bulletPoints.length > 0) {
    return bulletPoints;
  }
  
  // Fallback: try to split by common delimiters
  const cleanDesc = stripHtmlTags(descString);
  
  if (!cleanDesc) return [];
  
  // Split by newlines, bullet characters, or numbered lists
  const lines = cleanDesc
    .split(/[\n\r]+|(?:^|\s)[•\-\*]\s|(?:^|\s)\d+\.\s/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  return lines;
};

/**
 * Checks if a value is meaningful (not empty or placeholder)
 * 
 * @param {any} value - Value to validate
 * @returns {boolean} True if value contains meaningful content
 */
const hasMeaningfulValue = (value) => {
  if (value === null || value === undefined) return false;
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.length > 0 && value.some(item => hasMeaningfulValue(item));
  }
  
  // Handle objects
  if (typeof value === 'object') {
    const filteredObj = { ...value };
    delete filteredObj.id;
    return Object.values(filteredObj).some(v => hasMeaningfulValue(v));
  }
  
  // Handle strings
  const stringValue = stripHtmlTags(String(value));
  if (stringValue === "") return false;
  
  // Check against placeholder patterns
  return !PLACEHOLDER_PATTERNS.some(pattern => pattern.test(stringValue));
};

// ============================================
// SKILLS PROCESSING UTILITIES
// ============================================

/**
 * Extracts skill name from various data formats
 * 
 * @param {string|Object} skill - Skill data
 * @returns {string} Cleaned skill name
 */
const getSkillName = (skill) => {
  if (!skill) return '';
  if (typeof skill === 'string') return stripHtmlTags(skill);
  
  if (typeof skill === 'object' && skill !== null) {
    return stripHtmlTags(
      skill.name || skill.value || skill.skill || skill.label || skill.title || ''
    );
  }
  
  return stripHtmlTags(String(skill));
};

/**
 * Extracts skills list from a category
 * 
 * @param {Object} category - Skill category with skills array
 * @returns {string[]} Array of skill name strings
 */
const getSkillsList = (category) => {
  if (!category || !category.skills || !Array.isArray(category.skills)) return [];
  
  return category.skills
    .map(skill => getSkillName(skill))
    .filter(name => name.length > 0);
};

// ============================================
// SECTION VALIDATION UTILITIES
// ============================================

/**
 * Checks if education section has valid data
 */
const hasEducationData = (education) => {
  if (!Array.isArray(education)) return false;
  return education.some(edu => 
    hasMeaningfulValue(edu.institution) || 
    hasMeaningfulValue(edu.degree) || 
    hasMeaningfulValue(edu.field)
  );
};

/**
 * Checks if experience section has valid data
 */
const hasExperienceData = (experience) => {
  if (!Array.isArray(experience)) return false;
  return experience.some(exp => 
    hasMeaningfulValue(exp.company) || 
    hasMeaningfulValue(exp.position)
  );
};

/**
 * Checks if projects section has valid data
 */
const hasProjectsData = (projects) => {
  if (!Array.isArray(projects)) return false;
  return projects.some(proj => hasMeaningfulValue(proj.name));
};

/**
 * Checks if skills section has valid data
 */
const hasSkillsData = (skills) => {
  if (!Array.isArray(skills)) return false;
  return skills.some(category => 
    hasMeaningfulValue(category.name) || getSkillsList(category).length > 0
  );
};

/**
 * Checks if achievements section has valid data
 */
const hasAchievementsData = (achievements) => {
  if (!Array.isArray(achievements)) return false;
  return achievements.some(ach => hasMeaningfulValue(ach.title));
};

/**
 * Checks if volunteer section has valid data
 */
const hasVolunteerData = (volunteer) => {
  if (!Array.isArray(volunteer)) return false;
  return volunteer.some(vol => 
    hasMeaningfulValue(vol.organization) || 
    hasMeaningfulValue(vol.role)
  );
};

// ============================================
// PDF GENERATION - MAIN FUNCTION
// ============================================

/**
 * Main PDF generation function
 * Initializes document and delegates to template-specific generator
 * 
 * @param {Object} cvData - Complete CV data object
 * @param {string} templateId - Template identifier
 * @param {string} themeColor - Theme color in hex format
 * @returns {Promise<Uint8Array>} Generated PDF as byte array
 */
async function generatePDF(cvData, templateId, themeColor) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  // Create new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Embed all required fonts
  const fonts = {
    helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
    helveticaBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    helveticaOblique: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    timesRoman: await pdfDoc.embedFont(StandardFonts.TimesRoman),
    timesRomanBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    timesRomanItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
  };

  /**
   * Converts hex color to RGB (0-1 range)
   */
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    } : { r: 0.12, g: 0.25, b: 0.69 };
  };

  /**
   * Creates a lighter version of the theme color
   */
  const getLightColor = (hex) => {
    const c = hexToRgb(hex);
    return rgb(
      Math.min(1, c.r * 0.15 + 0.85),
      Math.min(1, c.g * 0.15 + 0.85),
      Math.min(1, c.b * 0.15 + 0.85)
    );
  };

  // Calculate theme colors
  const themeRgb = hexToRgb(themeColor);
  const primaryColor = rgb(themeRgb.r, themeRgb.g, themeRgb.b);
  const lightColor = getLightColor(themeColor);

  /**
   * Formats date string to "Mon YYYY" format
   */
  const formatDate = (date) => {
    if (!date) return "";
    const parts = date.split("-");
    if (parts.length < 2) return date;
    
    const [year, month] = parts;
    const monthIndex = parseInt(month) - 1;
    
    if (monthIndex < 0 || monthIndex > 11) return date;
    return `${MONTH_NAMES[monthIndex]} ${year}`;
  };

  // Bundle utilities for template functions
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

  // Route to appropriate template
  switch (templateId) {
    case 'classic':
      return generateClassicTemplate(pdfDoc, cvData, utils);
    case 'minimal':
      return generateMinimalTemplate(pdfDoc, cvData, utils);
    case 'modern':
    default:
      return generateModernTemplate(pdfDoc, cvData, utils);
  }
}

// ============================================
// MODERN TEMPLATE
// ============================================

/**
 * Generates PDF using Modern template
 * Features: Gradient accents, colored badges, clean layout
 */
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

  // Page setup
  const pageWidth = PAGE.width;
  const pageHeight = PAGE.height;
  const margin = PAGE.margin;
  const contentWidth = pageWidth - (2 * margin);

  // Initialize first page and Y position
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Color palette - Slate grays for modern look
  const colors = {
    slate900: rgb(0.06, 0.09, 0.13),   // Darkest - headings
    slate700: rgb(0.20, 0.25, 0.33),   // Body text
    slate600: rgb(0.28, 0.33, 0.42),   // Secondary text
    slate500: rgb(0.39, 0.45, 0.55),   // Muted text
    slate200: rgb(0.89, 0.90, 0.92),   // Borders
    slate100: rgb(0.95, 0.96, 0.98),   // Light background
    slate50: rgb(0.97, 0.98, 0.99),    // Lighter background
  };

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Adds a new page and resets Y position
   */
  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  /**
   * Checks if we need a new page
   * @param {number} requiredSpace - Space needed in points
   */
  const ensureSpace = (requiredSpace) => {
    if (y - requiredSpace < margin + 40) {
      addNewPage();
    }
  };

  /**
   * Wraps text to fit within specified width
   * @param {string} text - Text to wrap
   * @param {Object} font - Font object
   * @param {number} size - Font size
   * @param {number} maxWidth - Maximum width in points
   * @returns {string[]} Array of wrapped lines
   */
  const wrapText = (text, font, size, maxWidth) => {
    if (!text) return [];
    
    const cleanText = stripHtmlTags(text.toString());
    const words = cleanText.split(/\s+/).filter(w => w);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  /**
   * Draws text with automatic wrapping
   * @returns {number} New Y position after text
   */
  const drawText = (text, x, yPos, size, font, color, maxWidth, lineHeight = 1.5) => {
    const lines = wrapText(text, font, size, maxWidth);
    let currentY = yPos;
    
    for (const line of lines) {
      ensureSpace(size * lineHeight);
      page.drawText(line, { x, y: currentY, size, font, color });
      currentY -= size * lineHeight;
    }
    
    return currentY;
  };

  /**
   * Draws a section header with decorative indicator
   * @returns {number} New Y position
   */
  const drawSectionHeader = (title, yPos) => {
    ensureSpace(35);
    
    // Add extra space before section
    yPos -= 8;
    
    // Decorative dot
    page.drawCircle({
      x: margin + 4,
      y: yPos - 3,
      size: 3.5,
      color: primaryColor,
    });
    
    // Section title
    page.drawText(title.toUpperCase(), {
      x: margin + 16,
      y: yPos - 6,
      size: 10,
      font: helveticaBold,
      color: primaryColor,
    });
    
    // Subtle underline
    page.drawLine({
      start: { x: margin + 16, y: yPos - 18 },
      end: { x: pageWidth - margin, y: yPos - 18 },
      thickness: 0.5,
      color: colors.slate200,
    });
    
    return yPos - 32;
  };

  /**
   * Draws a bullet list with proper spacing
   * @param {string[]} items - List items
   * @param {number} x - X position
   * @param {number} yPos - Starting Y position
   * @returns {number} New Y position
   */
  const drawBulletList = (items, x, yPos) => {
    let currentY = yPos;
    
    for (const item of items) {
      if (!item) continue;
      
      const cleanItem = stripHtmlTags(item);
      if (!cleanItem) continue;
      
      ensureSpace(24);
      
      // Bullet point
      page.drawCircle({
        x: x + 4,
        y: currentY - 4,
        size: 2,
        color: primaryColor,
      });
      
      // Bullet text with proper indentation
      const bulletTextX = x + 16;
      const maxTextWidth = contentWidth - (bulletTextX - margin) - 10;
      const lines = wrapText(cleanItem, helvetica, 9.5, maxTextWidth);
      
      lines.forEach((line, lineIndex) => {
        ensureSpace(14);
        page.drawText(line, {
          x: bulletTextX,
          y: currentY - (lineIndex * 14),
          size: 9.5,
          font: helvetica,
          color: colors.slate700,
        });
      });
      
      // Move down for next bullet (accounting for wrapped lines)
      currentY -= (lines.length * 14) + 8;
    }
    
    return currentY;
  };

  /**
   * Draws a date badge
   */
  const drawDateBadge = (dateText, xRight, yPos) => {
    if (!dateText) return;
    
    const textWidth = helvetica.widthOfTextAtSize(dateText, 8);
    const badgeWidth = textWidth + 16;
    const badgeX = xRight - badgeWidth;
    
    // Badge background
    page.drawRectangle({
      x: badgeX,
      y: yPos - 10,
      width: badgeWidth,
      height: 16,
      color: lightColor,
      borderRadius: 3,
    });
    
    // Badge text
    page.drawText(dateText, {
      x: badgeX + 8,
      y: yPos - 5,
      size: 8,
      font: helvetica,
      color: primaryColor,
    });
  };

  // ==================== HEADER SECTION ====================
  
  ensureSpace(120);

  // Full name - large and prominent
  const fullName = stripHtmlTags(cvData.personal?.fullName) || 'Your Name';
  page.drawText(fullName, {
    x: margin,
    y: y,
    size: 28,
    font: helveticaBold,
    color: primaryColor,
  });
  y -= 42;

  // Build contact info array
  const contactItems = [];
  if (hasMeaningfulValue(cvData.personal?.email)) {
    contactItems.push(stripHtmlTags(cvData.personal.email));
  }
  if (hasMeaningfulValue(cvData.personal?.phone)) {
    contactItems.push(stripHtmlTags(cvData.personal.phone));
  }
  if (hasMeaningfulValue(cvData.personal?.location)) {
    contactItems.push(stripHtmlTags(cvData.personal.location));
  }
  if (hasMeaningfulValue(cvData.personal?.linkedin)) {
    contactItems.push(stripHtmlTags(cvData.personal.linkedin));
  }
  if (hasMeaningfulValue(cvData.personal?.website)) {
    contactItems.push(stripHtmlTags(cvData.personal.website));
  }

  // Draw contact info with separators
  if (contactItems.length > 0) {
    const contactText = contactItems.join('   •   ');
    const contactLines = wrapText(contactText, helvetica, 9.5, contentWidth);
    
    contactLines.forEach((line) => {
      page.drawText(line, {
        x: margin,
        y: y,
        size: 9.5,
        font: helvetica,
        color: colors.slate600,
      });
      y -= 16;
    });
  }
  
  y -= 8;

  // Gradient accent line
  const gradientSteps = 25;
  const lineWidth = contentWidth / gradientSteps;
  
  for (let i = 0; i < gradientSteps; i++) {
    const opacity = 1 - (i * 0.038);
    page.drawRectangle({
      x: margin + (i * lineWidth),
      y: y,
      width: lineWidth + 1,
      height: 3,
      color: rgb(
        primaryColor.red * opacity + (1 - opacity),
        primaryColor.green * opacity + (1 - opacity),
        primaryColor.blue * opacity + (1 - opacity)
      ),
    });
  }
  y -= 28;

  // ==================== PROFESSIONAL SUMMARY ====================
  
  if (hasMeaningfulValue(cvData.personal?.summary)) {
    y = drawSectionHeader('Professional Summary', y);
    
    const summaryStartY = y + 4;
    const cleanSummary = stripHtmlTags(cvData.personal.summary);
    y = drawText(cleanSummary, margin + 16, y, 10, helvetica, colors.slate700, contentWidth - 20, 1.6);
    
    // Left accent line for summary
    page.drawLine({
      start: { x: margin + 4, y: summaryStartY },
      end: { x: margin + 4, y: y + 8 },
      thickness: 2,
      color: colors.slate100,
    });
    
    y -= 20;
  }

  // ==================== EDUCATION SECTION ====================
  
  if (hasEducationData(cvData.education)) {
    y = drawSectionHeader('Education', y);
    
    const sectionStartY = y + 4;

    for (const edu of cvData.education) {
      const hasInstitution = hasMeaningfulValue(edu.institution);
      const hasDegree = hasMeaningfulValue(edu.degree);
      const hasField = hasMeaningfulValue(edu.field);
      
      if (!hasInstitution && !hasDegree && !hasField) continue;
      
      ensureSpace(60);
      
      // Build degree text
      let degreeText = '';
      if (hasDegree && hasField) {
        degreeText = `${stripHtmlTags(edu.degree)} in ${stripHtmlTags(edu.field)}`;
      } else if (hasDegree) {
        degreeText = stripHtmlTags(edu.degree);
      } else if (hasField) {
        degreeText = stripHtmlTags(edu.field);
      }
      
      // Calculate date width for layout
      let dateText = '';
      let dateWidth = 0;
      if (edu.startDate || edu.endDate) {
        dateText = `${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`;
        dateWidth = helvetica.widthOfTextAtSize(dateText, 8) + 30;
      }
      
      // Draw degree
      if (degreeText) {
        const maxDegreeWidth = contentWidth - dateWidth - 20;
        const degreeLines = wrapText(degreeText, helveticaBold, 11, maxDegreeWidth);
        
        degreeLines.forEach((line, idx) => {
          page.drawText(line, {
            x: margin + 16,
            y: y - (idx * 15),
            size: 11,
            font: helveticaBold,
            color: colors.slate900,
          });
        });
        
        if (degreeLines.length > 1) y -= (degreeLines.length - 1) * 15;
        
        // Date badge
        if (dateText) {
          drawDateBadge(dateText, pageWidth - margin, y + 4);
        }
      }
      y -= 18;

      // Institution name
      if (hasInstitution) {
        page.drawText(stripHtmlTags(edu.institution), {
          x: margin + 16,
          y: y,
          size: 10,
          font: helvetica,
          color: colors.slate600,
        });
        y -= 16;
      }

      // GPA
      if (hasMeaningfulValue(edu.gpa)) {
        page.drawText(`GPA: ${stripHtmlTags(edu.gpa)}`, {
          x: margin + 16,
          y: y,
          size: 9,
          font: helvetica,
          color: colors.slate500,
        });
        y -= 14;
      }

      // Description
      if (hasMeaningfulValue(edu.description)) {
        const descItems = parseDescription(edu.description);
        if (descItems.length > 0) {
          y -= 4;
          y = drawBulletList(descItems, margin + 12, y);
        }
      }

      y -= 12;
    }

    // Left accent line
    page.drawLine({
      start: { x: margin + 4, y: sectionStartY },
      end: { x: margin + 4, y: y + 8 },
      thickness: 2,
      color: colors.slate100,
    });

    y -= 8;
  }

  // ==================== EXPERIENCE SECTION ====================
  
  if (hasExperienceData(cvData.experience)) {
    y = drawSectionHeader('Work Experience', y);
    
    const sectionStartY = y + 4;

    for (const exp of cvData.experience) {
      const hasCompany = hasMeaningfulValue(exp.company);
      const hasPosition = hasMeaningfulValue(exp.position);
      
      if (!hasCompany && !hasPosition) continue;
      
      ensureSpace(70);
      
      // Calculate date width
      let dateText = '';
      let dateWidth = 0;
      if (exp.startDate || exp.endDate || exp.isCurrentRole) {
        dateText = `${formatDate(exp.startDate)} - ${exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}`;
        dateWidth = helvetica.widthOfTextAtSize(dateText, 8) + 30;
      }
      
      // Position title
      if (hasPosition) {
        const maxPositionWidth = contentWidth - dateWidth - 20;
        const positionLines = wrapText(stripHtmlTags(exp.position), helveticaBold, 11, maxPositionWidth);
        
        positionLines.forEach((line, idx) => {
          page.drawText(line, {
            x: margin + 16,
            y: y - (idx * 15),
            size: 11,
            font: helveticaBold,
            color: colors.slate900,
          });
        });
        
        if (positionLines.length > 1) y -= (positionLines.length - 1) * 15;
        
        // Date badge
        if (dateText) {
          drawDateBadge(dateText, pageWidth - margin, y + 4);
        }
      }
      y -= 18;

      // Company and location
      if (hasCompany) {
        let companyText = stripHtmlTags(exp.company);
        if (hasMeaningfulValue(exp.location)) {
          companyText += `  •  ${stripHtmlTags(exp.location)}`;
        }
        page.drawText(companyText, {
          x: margin + 16,
          y: y,
          size: 10,
          font: helvetica,
          color: colors.slate600,
        });
        y -= 18;
      }

      // Description bullets
      if (hasMeaningfulValue(exp.description)) {
        const descItems = parseDescription(exp.description);
        if (descItems.length > 0) {
          y = drawBulletList(descItems, margin + 12, y);
        }
      }

      y -= 12;
    }

    // Left accent line
    page.drawLine({
      start: { x: margin + 4, y: sectionStartY },
      end: { x: margin + 4, y: y + 8 },
      thickness: 2,
      color: colors.slate100,
    });

    y -= 8;
  }

  // ==================== PROJECTS SECTION ====================
  
  if (hasProjectsData(cvData.projects)) {
    y = drawSectionHeader('Projects', y);
    
    const sectionStartY = y + 4;

    for (const proj of cvData.projects) {
      if (!hasMeaningfulValue(proj.name)) continue;
      
      ensureSpace(70);
      
      // Calculate date width
      let dateText = '';
      let dateWidth = 0;
      if (proj.startDate || proj.endDate) {
        if (proj.startDate && proj.endDate) {
          dateText = `${formatDate(proj.startDate)} - ${formatDate(proj.endDate)}`;
        } else {
          dateText = formatDate(proj.startDate) || formatDate(proj.endDate);
        }
        dateWidth = helvetica.widthOfTextAtSize(dateText, 8) + 30;
      }
      
      // Project name
      const maxNameWidth = contentWidth - dateWidth - 20;
      const nameLines = wrapText(stripHtmlTags(proj.name), helveticaBold, 11, maxNameWidth);
      
      nameLines.forEach((line, idx) => {
        page.drawText(line, {
          x: margin + 16,
          y: y - (idx * 15),
          size: 11,
          font: helveticaBold,
          color: colors.slate900,
        });
      });
      
      if (nameLines.length > 1) y -= (nameLines.length - 1) * 15;
      
      // Date badge
      if (dateText) {
        drawDateBadge(dateText, pageWidth - margin, y + 4);
      }
      y -= 18;

      // Technologies as tags
      if (hasMeaningfulValue(proj.technologies)) {
        const tags = stripHtmlTags(proj.technologies)
          .split(',')
          .map(t => t.trim())
          .filter(t => t);
        
        if (tags.length > 0) {
          let tagX = margin + 16;
          let tagY = y;
          
          for (const tag of tags) {
            const tagWidth = helvetica.widthOfTextAtSize(tag, 8) + 12;
            
            // Wrap to next line if needed
            if (tagX + tagWidth > pageWidth - margin - 10) {
              tagX = margin + 16;
              tagY -= 18;
            }
            
            // Tag background
            page.drawRectangle({
              x: tagX,
              y: tagY - 9,
              width: tagWidth,
              height: 14,
              color: colors.slate100,
            });
            
            // Tag text
            page.drawText(tag, {
              x: tagX + 6,
              y: tagY - 4,
              size: 8,
              font: helvetica,
              color: colors.slate600,
            });
            
            tagX += tagWidth + 8;
          }
          y = tagY - 20;
        }
      }

      // Description bullets
      if (hasMeaningfulValue(proj.description)) {
        const descItems = parseDescription(proj.description);
        if (descItems.length > 0) {
          y = drawBulletList(descItems, margin + 12, y);
        }
      }

      // Project links
      if (hasMeaningfulValue(proj.githubUrl)) {
        ensureSpace(16);
        page.drawText(`GitHub: ${stripHtmlTags(proj.githubUrl)}`, {
          x: margin + 16,
          y: y,
          size: 8.5,
          font: helvetica,
          color: primaryColor,
        });
        y -= 14;
      }

      if (hasMeaningfulValue(proj.liveUrl)) {
        ensureSpace(16);
        page.drawText(`Live: ${stripHtmlTags(proj.liveUrl)}`, {
          x: margin + 16,
          y: y,
          size: 8.5,
          font: helvetica,
          color: primaryColor,
        });
        y -= 14;
      }

      y -= 12;
    }

    // Left accent line
    page.drawLine({
      start: { x: margin + 4, y: sectionStartY },
      end: { x: margin + 4, y: y + 8 },
      thickness: 2,
      color: colors.slate100,
    });

    y -= 8;
  }

  // ==================== SKILLS SECTION ====================
  
  if (hasSkillsData(cvData.skills)) {
    y = drawSectionHeader('Skills', y);
    
    const sectionStartY = y + 4;

    for (const category of cvData.skills) {
      const skillsList = getSkillsList(category);
      const hasName = hasMeaningfulValue(category.name);
      
      if (!hasName && skillsList.length === 0) continue;
      
      ensureSpace(30);
      
      const categoryName = stripHtmlTags(category.name) || 'Skills';
      const labelWidth = helveticaBold.widthOfTextAtSize(`${categoryName}:`, 10) + 12;
      
      // Category name
      page.drawText(`${categoryName}:`, {
        x: margin + 16,
        y: y,
        size: 10,
        font: helveticaBold,
        color: colors.slate900,
      });
      
      // Skills list
      if (skillsList.length > 0) {
        const skillsText = skillsList.join('  •  ');
        const maxSkillsWidth = contentWidth - labelWidth - 24;
        const skillsLines = wrapText(skillsText, helvetica, 9.5, maxSkillsWidth);
        
        skillsLines.forEach((line, idx) => {
          page.drawText(line, {
            x: margin + 16 + labelWidth,
            y: y - (idx * 14),
            size: 9.5,
            font: helvetica,
            color: colors.slate700,
          });
        });
        
        y -= (skillsLines.length * 14) + 8;
      } else {
        y -= 18;
      }
    }

    // Left accent line
    page.drawLine({
      start: { x: margin + 4, y: sectionStartY },
      end: { x: margin + 4, y: y + 8 },
      thickness: 2,
      color: colors.slate100,
    });

    y -= 8;
  }

  // ==================== ACHIEVEMENTS SECTION ====================
  
  if (hasAchievementsData(cvData.achievements)) {
    y = drawSectionHeader('Achievements', y);
    
    const sectionStartY = y + 4;

    for (const ach of cvData.achievements) {
      if (!hasMeaningfulValue(ach.title)) continue;
      
      ensureSpace(50);
      
      // Calculate date width
      let dateWidth = 0;
      if (hasMeaningfulValue(ach.date)) {
        dateWidth = helvetica.widthOfTextAtSize(stripHtmlTags(ach.date), 8) + 15;
      }
      
      // Title
      const maxTitleWidth = contentWidth - dateWidth - 24;
      const titleLines = wrapText(stripHtmlTags(ach.title), helveticaBold, 11, maxTitleWidth);
      
      titleLines.forEach((line, idx) => {
        page.drawText(line, {
          x: margin + 16,
          y: y - (idx * 15),
          size: 11,
          font: helveticaBold,
          color: colors.slate900,
        });
      });
      
      if (titleLines.length > 1) y -= (titleLines.length - 1) * 15;

      // Date
      if (hasMeaningfulValue(ach.date)) {
        page.drawText(stripHtmlTags(ach.date), {
          x: pageWidth - margin - dateWidth + 10,
          y: y,
          size: 8,
          font: helvetica,
          color: colors.slate500,
        });
      }
      y -= 16;

      // Organization
      if (hasMeaningfulValue(ach.organization)) {
        page.drawText(stripHtmlTags(ach.organization), {
          x: margin + 16,
          y: y,
          size: 10,
          font: helvetica,
          color: colors.slate600,
        });
        y -= 16;
      }

      // Description
      if (hasMeaningfulValue(ach.description)) {
        y = drawText(stripHtmlTags(ach.description), margin + 16, y, 9.5, helvetica, colors.slate700, contentWidth - 20, 1.5);
      }

      y -= 12;
    }

    // Left accent line
    page.drawLine({
      start: { x: margin + 4, y: sectionStartY },
      end: { x: margin + 4, y: y + 8 },
      thickness: 2,
      color: colors.slate100,
    });

    y -= 8;
  }

  // ==================== VOLUNTEER SECTION ====================
  
  if (hasVolunteerData(cvData.volunteer)) {
    y = drawSectionHeader('Volunteer Experience', y);
    
    const sectionStartY = y + 4;

    for (const vol of cvData.volunteer) {
      const hasOrg = hasMeaningfulValue(vol.organization);
      const hasRole = hasMeaningfulValue(vol.role);
      
      if (!hasOrg && !hasRole) continue;
      
      ensureSpace(60);
      
      // Calculate date width
      let dateText = '';
      let dateWidth = 0;
      if (vol.startDate || vol.endDate) {
        dateText = `${formatDate(vol.startDate)} - ${formatDate(vol.endDate)}`;
        dateWidth = helvetica.widthOfTextAtSize(dateText, 8) + 30;
      }
      
      // Role
      if (hasRole) {
        const maxRoleWidth = contentWidth - dateWidth - 20;
        const roleLines = wrapText(stripHtmlTags(vol.role), helveticaBold, 11, maxRoleWidth);
        
        roleLines.forEach((line, idx) => {
          page.drawText(line, {
            x: margin + 16,
            y: y - (idx * 15),
            size: 11,
            font: helveticaBold,
            color: colors.slate900,
          });
        });
        
        if (roleLines.length > 1) y -= (roleLines.length - 1) * 15;
        
        // Date badge
        if (dateText) {
          drawDateBadge(dateText, pageWidth - margin, y + 4);
        }
      }
      y -= 18;

      // Organization and location
      if (hasOrg) {
        let orgText = stripHtmlTags(vol.organization);
        if (hasMeaningfulValue(vol.location)) {
          orgText += `  •  ${stripHtmlTags(vol.location)}`;
        }
        page.drawText(orgText, {
          x: margin + 16,
          y: y,
          size: 10,
          font: helvetica,
          color: colors.slate600,
        });
        y -= 18;
      }

      // Description bullets
      if (hasMeaningfulValue(vol.description)) {
        const descItems = parseDescription(vol.description);
        if (descItems.length > 0) {
          y = drawBulletList(descItems, margin + 12, y);
        }
      }

      y -= 12;
    }

    // Left accent line
    page.drawLine({
      start: { x: margin + 4, y: sectionStartY },
      end: { x: margin + 4, y: y + 8 },
      thickness: 2,
      color: colors.slate100,
    });
  }

  return await pdfDoc.save();
}

// ============================================
// CLASSIC TEMPLATE
// ============================================

/**
 * Generates PDF using Classic template
 * Features: Serif fonts, centered header, underlined sections
 */
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

  // Page setup
  const pageWidth = PAGE.width;
  const pageHeight = PAGE.height;
  const margin = PAGE.margin;
  const contentWidth = pageWidth - (2 * margin);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Color palette
  const colors = {
    gray900: rgb(0.07, 0.07, 0.07),
    gray700: rgb(0.25, 0.25, 0.25),
    gray600: rgb(0.35, 0.35, 0.35),
    gray400: rgb(0.55, 0.55, 0.55),
  };

  // Helper functions
  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const ensureSpace = (required) => {
    if (y - required < margin + 40) addNewPage();
  };

  const wrapText = (text, font, size, maxWidth) => {
    if (!text) return [];
    const cleanText = stripHtmlTags(text.toString());
    const words = cleanText.split(/\s+/).filter(w => w);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(testLine, size) > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const drawCenteredText = (text, yPos, size, font, color) => {
    const cleanText = stripHtmlTags(text);
    const textWidth = font.widthOfTextAtSize(cleanText, size);
    const x = margin + (contentWidth - textWidth) / 2;
    page.drawText(cleanText, { x, y: yPos, size, font, color });
    return yPos - size - 8;
  };

  const drawSectionHeader = (title, yPos) => {
    ensureSpace(35);
    yPos -= 10;
    
    page.drawText(title.toUpperCase(), {
      x: margin,
      y: yPos,
      size: 11,
      font: timesRomanBold,
      color: primaryColor,
    });
    
    page.drawLine({
      start: { x: margin, y: yPos - 8 },
      end: { x: pageWidth - margin, y: yPos - 8 },
      thickness: 1.5,
      color: primaryColor,
    });
    
    return yPos - 28;
  };

  const drawBulletList = (items, x, yPos) => {
    let currentY = yPos;
    
    for (const item of items) {
      if (!item) continue;
      const cleanItem = stripHtmlTags(item);
      if (!cleanItem) continue;
      
      ensureSpace(22);
      
      const lines = wrapText(cleanItem, timesRoman, 10, contentWidth - 20);
      lines.forEach((line, idx) => {
        if (idx === 0) {
          page.drawText('•', { x, y: currentY, size: 10, font: timesRoman, color: colors.gray400 });
        }
        page.drawText(line, { x: x + 14, y: currentY, size: 10, font: timesRoman, color: colors.gray700 });
        currentY -= 15;
      });
      currentY -= 4;
    }
    
    return currentY;
  };

  // ==================== HEADER ====================
  
  ensureSpace(110);

  // Centered name
  const name = (stripHtmlTags(cvData.personal?.fullName) || 'Your Name').toUpperCase();
  y = drawCenteredText(name, y, 22, timesRomanBold, primaryColor);
  y -= 6;

  // Contact info in two rows
  const contacts1 = [];
  const contacts2 = [];
  
  if (hasMeaningfulValue(cvData.personal?.email)) contacts1.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone)) contacts1.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location)) contacts2.push(stripHtmlTags(cvData.personal.location));
  if (hasMeaningfulValue(cvData.personal?.linkedin)) contacts2.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website)) contacts2.push(stripHtmlTags(cvData.personal.website));

  if (contacts1.length > 0) {
    y = drawCenteredText(contacts1.join('   |   '), y, 10, timesRoman, colors.gray600);
  }
  if (contacts2.length > 0) {
    y = drawCenteredText(contacts2.join('   |   '), y, 10, timesRoman, colors.gray600);
  }

  // Header divider
  y -= 8;
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: pageWidth - margin, y: y },
    thickness: 2,
    color: primaryColor,
  });
  y -= 28;

  // ==================== SUMMARY ====================
  
  if (hasMeaningfulValue(cvData.personal?.summary)) {
    y = drawSectionHeader('Professional Summary', y);
    
    const summaryLines = wrapText(stripHtmlTags(cvData.personal.summary), timesRoman, 10.5, contentWidth);
    summaryLines.forEach(line => {
      ensureSpace(16);
      page.drawText(line, { x: margin, y, size: 10.5, font: timesRoman, color: colors.gray700 });
      y -= 16;
    });
    y -= 16;
  }

  // ==================== EDUCATION ====================
  
  if (hasEducationData(cvData.education)) {
    y = drawSectionHeader('Education', y);
    
    for (const edu of cvData.education) {
      const hasInstitution = hasMeaningfulValue(edu.institution);
      const hasDegree = hasMeaningfulValue(edu.degree);
      const hasField = hasMeaningfulValue(edu.field);
      
      if (!hasInstitution && !hasDegree && !hasField) continue;
      
      ensureSpace(55);
      
      let degreeText = '';
      if (hasDegree && hasField) {
        degreeText = `${stripHtmlTags(edu.degree)}, ${stripHtmlTags(edu.field)}`;
      } else if (hasDegree) {
        degreeText = stripHtmlTags(edu.degree);
      } else if (hasField) {
        degreeText = stripHtmlTags(edu.field);
      }
      
      let dateText = '';
      let dateWidth = 0;
      if (edu.startDate || edu.endDate) {
        dateText = `${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}`;
        dateWidth = timesRoman.widthOfTextAtSize(dateText, 10) + 20;
      }
      
      if (degreeText) {
        const maxWidth = contentWidth - dateWidth - 10;
        const lines = wrapText(degreeText, timesRomanBold, 11, maxWidth);
        
        lines.forEach((line, idx) => {
          page.drawText(line, { x: margin, y: y - (idx * 15), size: 11, font: timesRomanBold, color: colors.gray900 });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 15;
        
        if (dateText) {
          page.drawText(dateText, { x: pageWidth - margin - dateWidth + 15, y, size: 10, font: timesRoman, color: colors.gray600 });
        }
      }
      y -= 18;

      if (hasInstitution) {
        page.drawText(stripHtmlTags(edu.institution), { x: margin, y, size: 10, font: timesRomanItalic, color: colors.gray600 });
        y -= 16;
      }

      if (hasMeaningfulValue(edu.gpa)) {
        page.drawText(`GPA: ${stripHtmlTags(edu.gpa)}`, { x: margin, y, size: 10, font: timesRoman, color: colors.gray700 });
        y -= 14;
      }

      if (hasMeaningfulValue(edu.description)) {
        const descItems = parseDescription(edu.description);
        if (descItems.length > 0) {
          y -= 4;
          y = drawBulletList(descItems, margin, y);
        }
      }

      y -= 14;
    }
    y -= 6;
  }

  // ==================== EXPERIENCE ====================
  
  if (hasExperienceData(cvData.experience)) {
    y = drawSectionHeader('Professional Experience', y);
    
    for (const exp of cvData.experience) {
      const hasCompany = hasMeaningfulValue(exp.company);
      const hasPosition = hasMeaningfulValue(exp.position);
      
      if (!hasCompany && !hasPosition) continue;
      
      ensureSpace(60);
      
      let dateText = '';
      let dateWidth = 0;
      if (exp.startDate || exp.endDate || exp.isCurrentRole) {
        dateText = `${formatDate(exp.startDate)} – ${exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}`;
        dateWidth = timesRoman.widthOfTextAtSize(dateText, 10) + 20;
      }
      
      if (hasPosition) {
        const maxWidth = contentWidth - dateWidth - 10;
        const lines = wrapText(stripHtmlTags(exp.position), timesRomanBold, 11, maxWidth);
        
        lines.forEach((line, idx) => {
          page.drawText(line, { x: margin, y: y - (idx * 15), size: 11, font: timesRomanBold, color: colors.gray900 });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 15;
        
        if (dateText) {
          page.drawText(dateText, { x: pageWidth - margin - dateWidth + 15, y, size: 10, font: timesRoman, color: colors.gray600 });
        }
      }
      y -= 18;

      if (hasCompany) {
        let companyText = stripHtmlTags(exp.company);
        if (hasMeaningfulValue(exp.location)) companyText += `, ${stripHtmlTags(exp.location)}`;
        page.drawText(companyText, { x: margin, y, size: 10, font: timesRomanItalic, color: colors.gray600 });
        y -= 18;
      }

      if (hasMeaningfulValue(exp.description)) {
        const descItems = parseDescription(exp.description);
        if (descItems.length > 0) {
          y = drawBulletList(descItems, margin, y);
        }
      }

      y -= 14;
    }
    y -= 6;
  }

  // ==================== PROJECTS ====================
  
  if (hasProjectsData(cvData.projects)) {
    y = drawSectionHeader('Projects', y);
    
    for (const proj of cvData.projects) {
      if (!hasMeaningfulValue(proj.name)) continue;
      
      ensureSpace(55);
      
      let dateText = '';
      let dateWidth = 0;
      if (proj.startDate || proj.endDate) {
        if (proj.startDate && proj.endDate) {
          dateText = `${formatDate(proj.startDate)} – ${formatDate(proj.endDate)}`;
        } else {
          dateText = formatDate(proj.startDate) || formatDate(proj.endDate);
        }
        dateWidth = timesRoman.widthOfTextAtSize(dateText, 10) + 20;
      }
      
      const maxWidth = contentWidth - dateWidth - 10;
      const nameLines = wrapText(stripHtmlTags(proj.name), timesRomanBold, 11, maxWidth);
      
      nameLines.forEach((line, idx) => {
        page.drawText(line, { x: margin, y: y - (idx * 15), size: 11, font: timesRomanBold, color: colors.gray900 });
      });
      if (nameLines.length > 1) y -= (nameLines.length - 1) * 15;
      
      if (dateText) {
        page.drawText(dateText, { x: pageWidth - margin - dateWidth + 15, y, size: 10, font: timesRoman, color: colors.gray600 });
      }
      y -= 18;

      if (hasMeaningfulValue(proj.technologies)) {
        page.drawText(`Technologies: ${stripHtmlTags(proj.technologies)}`, { x: margin, y, size: 10, font: timesRomanItalic, color: colors.gray600 });
        y -= 18;
      }

      if (hasMeaningfulValue(proj.description)) {
        const descItems = parseDescription(proj.description);
        if (descItems.length > 0) {
          y = drawBulletList(descItems, margin, y);
        }
      }

      if (hasMeaningfulValue(proj.githubUrl)) {
        page.drawText(`GitHub: ${stripHtmlTags(proj.githubUrl)}`, { x: margin, y, size: 9, font: timesRoman, color: primaryColor });
        y -= 14;
      }
      if (hasMeaningfulValue(proj.liveUrl)) {
        page.drawText(`Live: ${stripHtmlTags(proj.liveUrl)}`, { x: margin, y, size: 9, font: timesRoman, color: primaryColor });
        y -= 14;
      }

      y -= 14;
    }
    y -= 6;
  }

  // ==================== SKILLS ====================
  
  if (hasSkillsData(cvData.skills)) {
    y = drawSectionHeader('Skills', y);
    
    for (const category of cvData.skills) {
      const skillsList = getSkillsList(category);
      const hasName = hasMeaningfulValue(category.name);
      
      if (!hasName && skillsList.length === 0) continue;
      
      ensureSpace(24);
      
      const categoryName = stripHtmlTags(category.name) || 'Skills';
      const skillsText = skillsList.join(', ');
      const labelWidth = timesRomanBold.widthOfTextAtSize(`${categoryName}: `, 10);
      
      page.drawText(`${categoryName}:`, { x: margin, y, size: 10, font: timesRomanBold, color: colors.gray900 });
      
      const skillLines = wrapText(skillsText, timesRoman, 10, contentWidth - labelWidth - 5);
      skillLines.forEach((line, idx) => {
        page.drawText(line, { x: margin + labelWidth, y: y - (idx * 14), size: 10, font: timesRoman, color: colors.gray700 });
      });
      
      y -= (skillLines.length * 14) + 8;
    }
    y -= 10;
  }

  // ==================== ACHIEVEMENTS ====================
  
  if (hasAchievementsData(cvData.achievements)) {
    y = drawSectionHeader('Achievements', y);
    
    for (const ach of cvData.achievements) {
      if (!hasMeaningfulValue(ach.title)) continue;
      
      ensureSpace(45);
      
      let dateWidth = 0;
      if (hasMeaningfulValue(ach.date)) {
        dateWidth = timesRoman.widthOfTextAtSize(stripHtmlTags(ach.date), 10) + 20;
      }
      
      const maxWidth = contentWidth - dateWidth - 10;
      const titleLines = wrapText(stripHtmlTags(ach.title), timesRomanBold, 11, maxWidth);
      
      titleLines.forEach((line, idx) => {
        page.drawText(line, { x: margin, y: y - (idx * 15), size: 11, font: timesRomanBold, color: colors.gray900 });
      });
      if (titleLines.length > 1) y -= (titleLines.length - 1) * 15;
      
      if (hasMeaningfulValue(ach.date)) {
        page.drawText(stripHtmlTags(ach.date), { x: pageWidth - margin - dateWidth + 15, y, size: 10, font: timesRoman, color: colors.gray600 });
      }
      y -= 16;

      if (hasMeaningfulValue(ach.organization)) {
        page.drawText(stripHtmlTags(ach.organization), { x: margin, y, size: 10, font: timesRoman, color: colors.gray600 });
        y -= 14;
      }

      if (hasMeaningfulValue(ach.description)) {
        const descLines = wrapText(stripHtmlTags(ach.description), timesRoman, 10, contentWidth);
        descLines.forEach(line => {
          page.drawText(line, { x: margin, y, size: 10, font: timesRoman, color: colors.gray700 });
          y -= 14;
        });
      }

      y -= 14;
    }
    y -= 6;
  }

  // ==================== VOLUNTEER ====================
  
  if (hasVolunteerData(cvData.volunteer)) {
    y = drawSectionHeader('Volunteer Experience', y);
    
    for (const vol of cvData.volunteer) {
      const hasOrg = hasMeaningfulValue(vol.organization);
      const hasRole = hasMeaningfulValue(vol.role);
      
      if (!hasOrg && !hasRole) continue;
      
      ensureSpace(50);
      
      let dateText = '';
      let dateWidth = 0;
      if (vol.startDate || vol.endDate) {
        dateText = `${formatDate(vol.startDate)} – ${formatDate(vol.endDate)}`;
        dateWidth = timesRoman.widthOfTextAtSize(dateText, 10) + 20;
      }
      
      if (hasRole) {
        const maxWidth = contentWidth - dateWidth - 10;
        const roleLines = wrapText(stripHtmlTags(vol.role), timesRomanBold, 11, maxWidth);
        
        roleLines.forEach((line, idx) => {
          page.drawText(line, { x: margin, y: y - (idx * 15), size: 11, font: timesRomanBold, color: colors.gray900 });
        });
        if (roleLines.length > 1) y -= (roleLines.length - 1) * 15;
        
        if (dateText) {
          page.drawText(dateText, { x: pageWidth - margin - dateWidth + 15, y, size: 10, font: timesRoman, color: colors.gray600 });
        }
      }
      y -= 18;

      if (hasOrg) {
        let orgText = stripHtmlTags(vol.organization);
        if (hasMeaningfulValue(vol.location)) orgText += `, ${stripHtmlTags(vol.location)}`;
        page.drawText(orgText, { x: margin, y, size: 10, font: timesRomanItalic, color: colors.gray600 });
        y -= 18;
      }

      if (hasMeaningfulValue(vol.description)) {
        const descItems = parseDescription(vol.description);
        if (descItems.length > 0) {
          y = drawBulletList(descItems, margin, y);
        }
      }

      y -= 14;
    }
  }

  return await pdfDoc.save();
}

// ============================================
// MINIMAL TEMPLATE
// ============================================

/**
 * Generates PDF using Minimal template
 * Features: Light typography, subtle separators, spacious layout
 */
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

  // Page setup - larger margins for minimal look
  const pageWidth = PAGE.width;
  const pageHeight = PAGE.height;
  const margin = 55;
  const contentWidth = pageWidth - (2 * margin);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin - 10;

  // Color palette - subtle grays
  const colors = {
    gray900: rgb(0.07, 0.07, 0.07),
    gray600: rgb(0.35, 0.35, 0.35),
    gray500: rgb(0.45, 0.45, 0.45),
    gray400: rgb(0.55, 0.55, 0.55),
    gray300: rgb(0.70, 0.70, 0.70),
  };

  // Helper functions
  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const ensureSpace = (required) => {
    if (y - required < margin + 40) addNewPage();
  };

  const wrapText = (text, font, size, maxWidth) => {
    if (!text) return [];
    const cleanText = stripHtmlTags(text.toString());
    const words = cleanText.split(/\s+/).filter(w => w);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(testLine, size) > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const drawSectionHeader = (title, yPos) => {
    ensureSpace(35);
    yPos -= 12;
    
    // Spaced letters for minimal aesthetic
    const spacedTitle = title.toUpperCase().split('').join(' ');
    page.drawText(spacedTitle, { x: margin, y: yPos, size: 8, font: helvetica, color: colors.gray400 });
    
    return yPos - 26;
  };

  const drawBulletList = (items, x, yPos) => {
    let currentY = yPos;
    
    for (const item of items) {
      if (!item) continue;
      const cleanItem = stripHtmlTags(item);
      if (!cleanItem) continue;
      
      ensureSpace(22);
      
      // Em-dash bullet for minimal look
      page.drawText('—', { x, y: currentY, size: 9, font: helvetica, color: colors.gray300 });
      
      const lines = wrapText(cleanItem, helvetica, 9.5, contentWidth - 26);
      lines.forEach((line, idx) => {
        page.drawText(line, { x: x + 20, y: currentY - (idx * 15), size: 9.5, font: helvetica, color: colors.gray600 });
      });
      
      currentY -= (lines.length * 15) + 8;
    }
    
    return currentY;
  };

  // ==================== HEADER ====================
  
  ensureSpace(100);

  // Large light name
  page.drawText(stripHtmlTags(cvData.personal?.fullName) || 'Your Name', {
    x: margin,
    y: y,
    size: 32,
    font: helvetica,
    color: primaryColor,
  });
  y -= 48;

  // Contact info
  const contacts = [];
  if (hasMeaningfulValue(cvData.personal?.email)) contacts.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone)) contacts.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location)) contacts.push(stripHtmlTags(cvData.personal.location));
  if (hasMeaningfulValue(cvData.personal?.linkedin)) contacts.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website)) contacts.push(stripHtmlTags(cvData.personal.website));

  if (contacts.length > 0) {
    const contactText = contacts.join('   |   ');
    const lines = wrapText(contactText, helvetica, 9.5, contentWidth);
    lines.forEach(line => {
      page.drawText(line, { x: margin, y, size: 9.5, font: helvetica, color: colors.gray500 });
      y -= 16;
    });
  }
  y -= 8;

  // Short accent line
  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + 50, y },
    thickness: 1,
    color: primaryColor,
  });
  y -= 32;

  // ==================== SUMMARY ====================
  
  if (hasMeaningfulValue(cvData.personal?.summary)) {
    y = drawSectionHeader('Summary', y);
    
    const summaryLines = wrapText(stripHtmlTags(cvData.personal.summary), helvetica, 10, contentWidth);
    summaryLines.forEach(line => {
      ensureSpace(16);
      page.drawText(line, { x: margin, y, size: 10, font: helvetica, color: colors.gray600 });
      y -= 16;
    });
    y -= 24;
  }

  // ==================== EDUCATION ====================
  
  if (hasEducationData(cvData.education)) {
    y = drawSectionHeader('Education', y);
    
    for (const edu of cvData.education) {
      const hasInstitution = hasMeaningfulValue(edu.institution);
      const hasDegree = hasMeaningfulValue(edu.degree);
      const hasField = hasMeaningfulValue(edu.field);
      
      if (!hasInstitution && !hasDegree && !hasField) continue;
      
      ensureSpace(55);
      
      let degreeText = '';
      if (hasDegree && hasField) {
        degreeText = `${stripHtmlTags(edu.degree)}, ${stripHtmlTags(edu.field)}`;
      } else if (hasDegree) {
        degreeText = stripHtmlTags(edu.degree);
      } else if (hasField) {
        degreeText = stripHtmlTags(edu.field);
      }
      
      let dateText = '';
      let dateWidth = 0;
      if (edu.startDate || edu.endDate) {
        dateText = `${formatDate(edu.startDate)} — ${formatDate(edu.endDate)}`;
        dateWidth = helvetica.widthOfTextAtSize(dateText, 9) + 20;
      }
      
      if (degreeText) {
        const maxWidth = contentWidth - dateWidth - 10;
        const lines = wrapText(degreeText, helvetica, 11, maxWidth);
        
        lines.forEach((line, idx) => {
          page.drawText(line, { x: margin, y: y - (idx * 16), size: 11, font: helvetica, color: colors.gray900 });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 16;
        
        if (dateText) {
          page.drawText(dateText, { x: pageWidth - margin - dateWidth + 15, y, size: 9, font: helvetica, color: colors.gray400 });
        }
      }
      y -= 18;

      if (hasInstitution) {
        page.drawText(stripHtmlTags(edu.institution), { x: margin, y, size: 9.5, font: helvetica, color: colors.gray500 });
        y -= 16;
      }

      if (hasMeaningfulValue(edu.gpa)) {
        page.drawText(`GPA: ${stripHtmlTags(edu.gpa)}`, { x: margin, y, size: 9, font: helvetica, color: colors.gray400 });
        y -= 14;
      }

      y -= 16;
    }
    y -= 8;
  }

  // ==================== EXPERIENCE ====================
  
  if (hasExperienceData(cvData.experience)) {
    y = drawSectionHeader('Experience', y);
    
    for (const exp of cvData.experience) {
      const hasCompany = hasMeaningfulValue(exp.company);
      const hasPosition = hasMeaningfulValue(exp.position);
      
      if (!hasCompany && !hasPosition) continue;
      
      ensureSpace(60);
      
      let dateText = '';
      let dateWidth = 0;
      if (exp.startDate || exp.endDate || exp.isCurrentRole) {
        dateText = `${formatDate(exp.startDate)} — ${exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}`;
        dateWidth = helvetica.widthOfTextAtSize(dateText, 9) + 20;
      }
      
      if (hasPosition) {
        const maxWidth = contentWidth - dateWidth - 10;
        const lines = wrapText(stripHtmlTags(exp.position), helvetica, 11, maxWidth);
        
        lines.forEach((line, idx) => {
          page.drawText(line, { x: margin, y: y - (idx * 16), size: 11, font: helvetica, color: colors.gray900 });
        });
        if (lines.length > 1) y -= (lines.length - 1) * 16;
        
        if (dateText) {
          page.drawText(dateText, { x: pageWidth - margin - dateWidth + 15, y, size: 9, font: helvetica, color: colors.gray400 });
        }
      }
      y -= 18;

      if (hasCompany) {
        page.drawText(stripHtmlTags(exp.company), { x: margin, y, size: 9.5, font: helvetica, color: colors.gray500 });
        y -= 20;
      }

      if (hasMeaningfulValue(exp.description)) {
        const descItems = parseDescription(exp.description);
        if (descItems.length > 0) {
          y = drawBulletList(descItems, margin, y);
        }
      }

      y -= 16;
    }
    y -= 8;
  }

  // ==================== PROJECTS ====================
  
  if (hasProjectsData(cvData.projects)) {
    y = drawSectionHeader('Projects', y);
    
    for (const proj of cvData.projects) {
      if (!hasMeaningfulValue(proj.name)) continue;
      
      ensureSpace(55);
      
      let dateText = '';
      let dateWidth = 0;
      if (proj.startDate || proj.endDate) {
        if (proj.startDate && proj.endDate) {
          dateText = `${formatDate(proj.startDate)} — ${formatDate(proj.endDate)}`;
        } else {
          dateText = formatDate(proj.startDate) || formatDate(proj.endDate);
        }
        dateWidth = helvetica.widthOfTextAtSize(dateText, 9) + 20;
      }
      
      const maxWidth = contentWidth - dateWidth - 10;
      const nameLines = wrapText(stripHtmlTags(proj.name), helvetica, 11, maxWidth);
      
      nameLines.forEach((line, idx) => {
        page.drawText(line, { x: margin, y: y - (idx * 16), size: 11, font: helvetica, color: colors.gray900 });
      });
      if (nameLines.length > 1) y -= (nameLines.length - 1) * 16;
      
      if (dateText) {
        page.drawText(dateText, { x: pageWidth - margin - dateWidth + 15, y, size: 9, font: helvetica, color: colors.gray400 });
      }
      y -= 18;

      if (hasMeaningfulValue(proj.technologies)) {
        page.drawText(stripHtmlTags(proj.technologies), { x: margin, y, size: 9, font: helveticaOblique, color: colors.gray400 });
        y -= 18;
      }

      if (hasMeaningfulValue(proj.description)) {
        const descItems = parseDescription(proj.description);
        if (descItems.length > 0) {
          y = drawBulletList(descItems, margin, y);
        }
      }

      if (hasMeaningfulValue(proj.githubUrl)) {
        page.drawText(`GitHub: ${stripHtmlTags(proj.githubUrl)}`, { x: margin, y, size: 8.5, font: helvetica, color: primaryColor });
        y -= 14;
      }
      if (hasMeaningfulValue(proj.liveUrl)) {
        page.drawText(`Live: ${stripHtmlTags(proj.liveUrl)}`, { x: margin, y, size: 8.5, font: helvetica, color: primaryColor });
        y -= 14;
      }

      y -= 16;
    }
    y -= 8;
  }

  // ==================== SKILLS ====================
  
  if (hasSkillsData(cvData.skills)) {
    y = drawSectionHeader('Skills', y);
    
    for (const category of cvData.skills) {
      const skillsList = getSkillsList(category);
      const hasName = hasMeaningfulValue(category.name);
      
      if (!hasName && skillsList.length === 0) continue;
      
      ensureSpace(24);
      
      const categoryName = stripHtmlTags(category.name) || 'Skills';
      const labelWidth = 100;
      
      page.drawText(categoryName, { x: margin, y, size: 9.5, font: helvetica, color: colors.gray400 });
      
      const skillsText = skillsList.join('  •  ');
      const skillLines = wrapText(skillsText, helvetica, 9.5, contentWidth - labelWidth - 10);
      skillLines.forEach((line, idx) => {
        page.drawText(line, { x: margin + labelWidth, y: y - (idx * 14), size: 9.5, font: helvetica, color: colors.gray600 });
      });
      
      y -= (skillLines.length * 14) + 10;
    }
    y -= 16;
  }

  // ==================== ACHIEVEMENTS ====================
  
  if (hasAchievementsData(cvData.achievements)) {
    y = drawSectionHeader('Achievements', y);
    
    for (const ach of cvData.achievements) {
      if (!hasMeaningfulValue(ach.title)) continue;
      
      ensureSpace(45);
      
      let dateWidth = 0;
      if (hasMeaningfulValue(ach.date)) {
        dateWidth = helvetica.widthOfTextAtSize(stripHtmlTags(ach.date), 9) + 20;
      }
      
      const maxWidth = contentWidth - dateWidth - 10;
      const titleLines = wrapText(stripHtmlTags(ach.title), helvetica, 11, maxWidth);
      
      titleLines.forEach((line, idx) => {
        page.drawText(line, { x: margin, y: y - (idx * 16), size: 11, font: helvetica, color: colors.gray900 });
      });
      if (titleLines.length > 1) y -= (titleLines.length - 1) * 16;
      
      if (hasMeaningfulValue(ach.date)) {
        page.drawText(stripHtmlTags(ach.date), { x: pageWidth - margin - dateWidth + 15, y, size: 9, font: helvetica, color: colors.gray400 });
      }
      y -= 18;

      if (hasMeaningfulValue(ach.organization)) {
        page.drawText(stripHtmlTags(ach.organization), { x: margin, y, size: 9.5, font: helvetica, color: colors.gray500 });
        y -= 16;
      }

      if (hasMeaningfulValue(ach.description)) {
        const descLines = wrapText(stripHtmlTags(ach.description), helvetica, 9.5, contentWidth);
        descLines.forEach(line => {
          page.drawText(line, { x: margin, y, size: 9.5, font: helvetica, color: colors.gray600 });
          y -= 14;
        });
      }

      y -= 16;
    }
    y -= 8;
  }

  // ==================== VOLUNTEER ====================
  
  if (hasVolunteerData(cvData.volunteer)) {
    y = drawSectionHeader('Volunteer', y);
    
    for (const vol of cvData.volunteer) {
      const hasOrg = hasMeaningfulValue(vol.organization);
      const hasRole = hasMeaningfulValue(vol.role);
      
      if (!hasOrg && !hasRole) continue;
      
      ensureSpace(55);
      
      let dateText = '';
      let dateWidth = 0;
      if (vol.startDate || vol.endDate) {
        dateText = `${formatDate(vol.startDate)} — ${formatDate(vol.endDate)}`;
        dateWidth = helvetica.widthOfTextAtSize(dateText, 9) + 20;
      }
      
      if (hasRole) {
        const maxWidth = contentWidth - dateWidth - 10;
        const roleLines = wrapText(stripHtmlTags(vol.role), helvetica, 11, maxWidth);
        
        roleLines.forEach((line, idx) => {
          page.drawText(line, { x: margin, y: y - (idx * 16), size: 11, font: helvetica, color: colors.gray900 });
        });
        if (roleLines.length > 1) y -= (roleLines.length - 1) * 16;
        
        if (dateText) {
          page.drawText(dateText, { x: pageWidth - margin - dateWidth + 15, y, size: 9, font: helvetica, color: colors.gray400 });
        }
      }
      y -= 18;

      if (hasOrg) {
        page.drawText(stripHtmlTags(vol.organization), { x: margin, y, size: 9.5, font: helvetica, color: colors.gray500 });
        y -= 18;
      }

      if (hasMeaningfulValue(vol.description)) {
        const descItems = parseDescription(vol.description);
        if (descItems.length > 0) {
          y = drawBulletList(descItems, margin, y);
        }
      }

      y -= 16;
    }
  }

  return await pdfDoc.save();
}