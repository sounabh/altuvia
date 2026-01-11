// app/api/cv/export-pdf/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST: Export current preview
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

    const pdf = await generatePDF(cvData, templateId || 'modern', themeColor || '#1e40af');

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

// GET: Export from saved CV or version
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cvId = searchParams.get("cvId");
    const versionId = searchParams.get("versionId");

    let cvData;
    let templateId = 'modern';
    let themeColor = '#1e40af';
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
      templateId = version.templateId || 'modern';
      themeColor = version.colorScheme || '#1e40af';
      fileName = `CV-${version.versionLabel.replace(/\s+/g, '-')}`;

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
      templateId = cv.templateId || 'modern';
      themeColor = cv.colorScheme || '#1e40af';
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
// HELPER FUNCTIONS
// ============================================

// Strip HTML tags and entities from text
const stripHtmlTags = (text) => {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

// Check if a value is meaningful (not empty or placeholder)
const hasMeaningfulValue = (value) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) {
    return value.length > 0 && value.some(item => hasMeaningfulValue(item));
  }
  if (typeof value === 'object') {
    const filteredObj = { ...value };
    delete filteredObj.id;
    return Object.values(filteredObj).some(v => hasMeaningfulValue(v));
  }
  const stringValue = stripHtmlTags(String(value));
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
  return !minimalPatterns.some(pattern => pattern.test(stringValue));
};

// Get skill name from various formats
const getSkillName = (skill) => {
  if (!skill) return '';
  if (typeof skill === 'string') return stripHtmlTags(skill);
  if (typeof skill === 'object' && skill !== null) {
    return stripHtmlTags(skill.name || skill.value || skill.skill || skill.label || skill.title || '');
  }
  return stripHtmlTags(String(skill));
};

// Get skills list as array of strings
const getSkillsList = (category) => {
  if (!category || !category.skills) return [];
  if (!Array.isArray(category.skills)) return [];
  return category.skills
    .map(skill => getSkillName(skill))
    .filter(name => name.length > 0);
};

// Check if education section has valid data
const hasEducationData = (education) => {
  if (!Array.isArray(education)) return false;
  return education.some(edu => {
    const hasInstitution = hasMeaningfulValue(edu.institution);
    const hasDegree = hasMeaningfulValue(edu.degree);
    const hasField = hasMeaningfulValue(edu.field);
    return hasInstitution || hasDegree || hasField;
  });
};

// Check if experience section has valid data
const hasExperienceData = (experience) => {
  if (!Array.isArray(experience)) return false;
  return experience.some(exp => {
    const hasCompany = hasMeaningfulValue(exp.company);
    const hasPosition = hasMeaningfulValue(exp.position);
    return hasCompany || hasPosition;
  });
};

// Check if projects section has valid data
const hasProjectsData = (projects) => {
  if (!Array.isArray(projects)) return false;
  return projects.some(proj => hasMeaningfulValue(proj.name));
};

// Check if skills section has valid data
const hasSkillsData = (skills) => {
  if (!Array.isArray(skills)) return false;
  return skills.some(category => {
    const skillsList = getSkillsList(category);
    return hasMeaningfulValue(category.name) || skillsList.length > 0;
  });
};

// Check if achievements section has valid data
const hasAchievementsData = (achievements) => {
  if (!Array.isArray(achievements)) return false;
  return achievements.some(ach => hasMeaningfulValue(ach.title));
};

// Check if volunteer section has valid data
const hasVolunteerData = (volunteer) => {
  if (!Array.isArray(volunteer)) return false;
  return volunteer.some(vol => {
    const hasOrg = hasMeaningfulValue(vol.organization);
    const hasRole = hasMeaningfulValue(vol.role);
    return hasOrg || hasRole;
  });
};

async function generatePDF(cvData, templateId, themeColor) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  // Convert hex color to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    } : { r: 0.12, g: 0.25, b: 0.69 };
  };

  // Generate lighter version of theme color
  const getLightColor = (hex) => {
    const themeRgb = hexToRgb(hex);
    return rgb(
      Math.min(1, themeRgb.r * 0.15 + 0.85),
      Math.min(1, themeRgb.g * 0.15 + 0.85),
      Math.min(1, themeRgb.b * 0.15 + 0.85)
    );
  };

  const themeRgb = hexToRgb(themeColor);
  const primaryColor = rgb(themeRgb.r, themeRgb.g, themeRgb.b);
  const lightColor = getLightColor(themeColor);

  // Format date helper
  const formatDate = (date) => {
    if (!date) return "";
    const parts = date.split("-");
    if (parts.length < 2) return date;
    const [year, month] = parts;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(month) - 1;
    if (monthIndex < 0 || monthIndex > 11) return date;
    return `${monthNames[monthIndex]} ${year}`;
  };

  // Parse description into bullet points
  const parseDescription = (description) => {
    if (!description) return [];
    
    // First strip HTML tags
    let cleanDesc = stripHtmlTags(description);
    
    if (Array.isArray(description)) {
      return description.map(item => stripHtmlTags(item)).filter(Boolean);
    }
    
    if (typeof cleanDesc === 'string') {
      return cleanDesc.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[•\-]\s*/, '').trim())
        .filter(line => line);
    }
    return [];
  };

  const fonts = {
    helvetica,
    helveticaBold,
    helveticaOblique,
    timesRoman,
    timesRomanBold,
    timesRomanItalic,
    primaryColor,
    lightColor,
    formatDate,
    parseDescription,
    rgb,
    stripHtmlTags,
    getSkillsList,
  };

  // Choose template
  switch (templateId) {
    case 'classic':
      return generateClassicTemplate(pdfDoc, cvData, fonts);
    case 'minimal':
      return generateMinimalTemplate(pdfDoc, cvData, fonts);
    case 'modern':
    default:
      return generateModernTemplate(pdfDoc, cvData, fonts);
  }
}

// ============================================
// MODERN TEMPLATE - Clean Layout
// ============================================
async function generateModernTemplate(pdfDoc, cvData, fonts) {
  const { helvetica, helveticaBold, primaryColor, lightColor, formatDate, parseDescription, rgb, stripHtmlTags, getSkillsList } = fonts;
  
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - (2 * margin);
  
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Colors
  const slate900 = rgb(0.06, 0.09, 0.13);
  const slate700 = rgb(0.20, 0.25, 0.33);
  const slate600 = rgb(0.28, 0.33, 0.42);
  const slate500 = rgb(0.39, 0.45, 0.55);
  const slate100 = rgb(0.95, 0.96, 0.98);
  const slate50 = rgb(0.97, 0.98, 0.99);

  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const checkSpace = (required) => {
    if (y - required < margin + 30) {
      addNewPage();
    }
  };

  // Text wrapping helper - improved
  const wrapText = (text, font, size, maxWidth) => {
    if (!text) return [];
    const cleanText = stripHtmlTags(text.toString());
    const words = cleanText.split(' ').filter(w => w);
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

  // Draw wrapped text and return new Y position
  const drawWrappedText = (text, x, yPos, size, font, color, maxWidth, lineHeight = 1.4) => {
    const lines = wrapText(text, font, size, maxWidth);
    let currentY = yPos;
    
    for (const line of lines) {
      checkSpace(size * lineHeight);
      page.drawText(line, { x, y: currentY, size, font, color });
      currentY -= size * lineHeight;
    }
    return currentY;
  };

  // Draw section header with dot
  const drawSectionHeader = (title, yPos) => {
    checkSpace(30);
    
    // Small dot
    page.drawCircle({
      x: margin + 4,
      y: yPos - 3,
      size: 3,
      color: primaryColor,
    });
    
    // Section title
    page.drawText(title.toUpperCase(), {
      x: margin + 14,
      y: yPos - 6,
      size: 9,
      font: helveticaBold,
      color: primaryColor,
    });
    
    return yPos - 24;
  };

  // Draw bullet list - improved spacing
  const drawBulletList = (items, x, yPos) => {
    let currentY = yPos;
    
    items.forEach((item) => {
      if (!item) return;
      const cleanItem = stripHtmlTags(item);
      if (!cleanItem) return;
      
      checkSpace(20);
      
      // Small colored dot
      page.drawCircle({
        x: x + 3,
        y: currentY - 3,
        size: 2,
        color: primaryColor,
      });
      
      // Text with proper wrapping
      const lines = wrapText(cleanItem, helvetica, 9, contentWidth - 25);
      lines.forEach((line, idx) => {
        checkSpace(13);
        page.drawText(line, {
          x: x + 12,
          y: currentY - (idx * 13),
          size: 9,
          font: helvetica,
          color: slate700,
        });
      });
      currentY -= (lines.length * 13) + 4;
    });
    
    return currentY;
  };

  // Draw date badge
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

  // ==================== HEADER ====================
  checkSpace(100);
  
  // Name
  const fullName = stripHtmlTags(cvData.personal?.fullName) || 'Your Name';
  page.drawText(fullName, {
    x: margin,
    y: y,
    size: 28,
    font: helveticaBold,
    color: primaryColor,
  });
  y -= 38;

  // Contact info - simple clean layout without problematic icons
  const contacts = [];
  if (hasMeaningfulValue(cvData.personal?.email)) contacts.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone)) contacts.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location)) contacts.push(stripHtmlTags(cvData.personal.location));
  if (hasMeaningfulValue(cvData.personal?.linkedin)) contacts.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website)) contacts.push(stripHtmlTags(cvData.personal.website));

  if (contacts.length > 0) {
    // Display contacts in a clean row format with separators
    const contactText = contacts.join('  •  ');
    const contactLines = wrapText(contactText, helvetica, 9, contentWidth);
    
    contactLines.forEach((line) => {
      page.drawText(line, {
        x: margin,
        y: y,
        size: 9,
        font: helvetica,
        color: slate600,
      });
      y -= 14;
    });
    y -= 6;
  }

  // Gradient accent line
  const gradientSteps = 20;
  const lineWidth = contentWidth / gradientSteps;
  for (let i = 0; i < gradientSteps; i++) {
    const opacity = 1 - (i * 0.04);
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
  y -= 24;

  // ==================== PROFESSIONAL SUMMARY ====================
  if (hasMeaningfulValue(cvData.personal?.summary)) {
    y = drawSectionHeader('Professional Summary', y);
    
    const summaryStartY = y + 5;
    const cleanSummary = stripHtmlTags(cvData.personal.summary);
    y = drawWrappedText(cleanSummary, margin + 12, y, 9.5, helvetica, slate700, contentWidth - 16);
    
    // Draw left border line
    page.drawLine({
      start: { x: margin + 4, y: summaryStartY },
      end: { x: margin + 4, y: y + 10 },
      thickness: 2,
      color: slate100,
    });
    
    y -= 20;
  }

  // ==================== EDUCATION ====================
  if (hasEducationData(cvData.education)) {
    y = drawSectionHeader('Education', y);
    
    const sectionStartY = y + 5;
    
    cvData.education.forEach((edu) => {
      const hasInstitution = hasMeaningfulValue(edu.institution);
      const hasDegree = hasMeaningfulValue(edu.degree);
      const hasField = hasMeaningfulValue(edu.field);
      
      if (hasInstitution || hasDegree || hasField) {
        checkSpace(55);
        
        // Calculate date width first
        let dateWidth = 0;
        let dateText = '';
        if (edu.startDate || edu.endDate) {
          dateText = `${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`;
          dateWidth = helvetica.widthOfTextAtSize(dateText, 8) + 24;
        }
        
        // Degree and Field
        let degreeText = '';
        if (hasDegree && hasField) {
          degreeText = `${stripHtmlTags(edu.degree)} in ${stripHtmlTags(edu.field)}`;
        } else if (hasDegree) {
          degreeText = stripHtmlTags(edu.degree);
        } else if (hasField) {
          degreeText = stripHtmlTags(edu.field);
        }
        
        if (degreeText) {
          const maxDegreeWidth = contentWidth - dateWidth - 16;
          const degreeLines = wrapText(degreeText, helveticaBold, 10.5, maxDegreeWidth);
          
          degreeLines.forEach((line, lineIdx) => {
            page.drawText(line, {
              x: margin + 12,
              y: y - (lineIdx * 14),
              size: 10.5,
              font: helveticaBold,
              color: slate900,
            });
          });
          
          if (degreeLines.length > 1) {
            y -= (degreeLines.length - 1) * 14;
          }
        }

        // Date badge
        if (dateText) {
          drawDateBadge(dateText, pageWidth - margin, y + 4);
        }
        y -= 16;

        // Institution
        if (hasInstitution) {
          page.drawText(stripHtmlTags(edu.institution), {
            x: margin + 12,
            y: y,
            size: 9,
            font: helvetica,
            color: slate600,
          });
          y -= 14;
        }

        // GPA
        if (hasMeaningfulValue(edu.gpa)) {
          page.drawText(`GPA: ${stripHtmlTags(edu.gpa)}`, {
            x: margin + 12,
            y: y,
            size: 9,
            font: helvetica,
            color: slate500,
          });
          y -= 14;
        }

        // Description
        if (hasMeaningfulValue(edu.description)) {
          y = drawWrappedText(stripHtmlTags(edu.description), margin + 12, y, 8.5, helvetica, slate600, contentWidth - 20);
        }

        y -= 10;
      }
    });

    // Left border
    page.drawLine({
      start: { x: margin + 4, y: sectionStartY },
      end: { x: margin + 4, y: y + 10 },
      thickness: 2,
      color: slate100,
    });

    y -= 10;
  }

  // ==================== EXPERIENCE ====================
  if (hasExperienceData(cvData.experience)) {
    y = drawSectionHeader('Experience', y);
    
    const sectionStartY = y + 5;
    
    cvData.experience.forEach((exp) => {
      const hasCompany = hasMeaningfulValue(exp.company);
      const hasPosition = hasMeaningfulValue(exp.position);
      
      if (hasCompany || hasPosition) {
        checkSpace(60);
        
        // Calculate date width first
        let dateWidth = 0;
        let dateText = '';
        if (exp.startDate || exp.endDate || exp.isCurrentRole) {
          dateText = `${formatDate(exp.startDate)} - ${exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}`;
          dateWidth = helvetica.widthOfTextAtSize(dateText, 8) + 24;
        }
        
        // Position
        if (hasPosition) {
          const maxPositionWidth = contentWidth - dateWidth - 16;
          const positionLines = wrapText(stripHtmlTags(exp.position), helveticaBold, 10.5, maxPositionWidth);
          
          positionLines.forEach((line, lineIdx) => {
            page.drawText(line, {
              x: margin + 12,
              y: y - (lineIdx * 14),
              size: 10.5,
              font: helveticaBold,
              color: slate900,
            });
          });
          
          if (positionLines.length > 1) {
            y -= (positionLines.length - 1) * 14;
          }
        }

        // Date badge
        if (dateText) {
          drawDateBadge(dateText, pageWidth - margin, y + 4);
        }
        y -= 16;

        // Company and Location
        if (hasCompany) {
          let companyText = stripHtmlTags(exp.company);
          if (hasMeaningfulValue(exp.location)) {
            companyText += ` • ${stripHtmlTags(exp.location)}`;
          }
          page.drawText(companyText, {
            x: margin + 12,
            y: y,
            size: 9,
            font: helvetica,
            color: slate600,
          });
          y -= 16;
        }

        // Description bullets
        if (hasMeaningfulValue(exp.description)) {
          const items = parseDescription(exp.description);
          if (items.length > 0) {
            y = drawBulletList(items, margin + 8, y);
          }
        }

        y -= 10;
      }
    });

    // Left border
    page.drawLine({
      start: { x: margin + 4, y: sectionStartY },
      end: { x: margin + 4, y: y + 10 },
      thickness: 2,
      color: slate100,
    });

    y -= 10;
  }

  // ==================== PROJECTS ====================
  if (hasProjectsData(cvData.projects)) {
    y = drawSectionHeader('Projects', y);
    
    const sectionStartY = y + 5;
    
    cvData.projects.forEach((proj) => {
      if (hasMeaningfulValue(proj.name)) {
        checkSpace(60);
        
        // Calculate date width first
        let dateWidth = 0;
        let dateText = '';
        if (proj.startDate || proj.endDate) {
          if (proj.startDate && proj.endDate) {
            dateText = `${formatDate(proj.startDate)} - ${formatDate(proj.endDate)}`;
          } else {
            dateText = formatDate(proj.startDate) || formatDate(proj.endDate);
          }
          dateWidth = helvetica.widthOfTextAtSize(dateText, 8) + 24;
        }
        
        // Project Name
        const maxNameWidth = contentWidth - dateWidth - 16;
        const nameLines = wrapText(stripHtmlTags(proj.name), helveticaBold, 10.5, maxNameWidth);
        
        nameLines.forEach((line, lineIdx) => {
          page.drawText(line, {
            x: margin + 12,
            y: y - (lineIdx * 14),
            size: 10.5,
            font: helveticaBold,
            color: slate900,
          });
        });
        
        if (nameLines.length > 1) {
          y -= (nameLines.length - 1) * 14;
        }

        // Date badge
        if (dateText) {
          drawDateBadge(dateText, pageWidth - margin, y + 4);
        }
        y -= 16;

        // Technology tags
        if (hasMeaningfulValue(proj.technologies)) {
          let tagX = margin + 12;
          let tagY = y;
          const tags = stripHtmlTags(proj.technologies).split(',').map(t => t.trim()).filter(t => t);
          
          tags.forEach((tag) => {
            const tagWidth = helvetica.widthOfTextAtSize(tag, 8) + 10;
            
            if (tagX + tagWidth > pageWidth - margin - 10) {
              tagX = margin + 12;
              tagY -= 16;
            }
            
            // Tag background
            page.drawRectangle({
              x: tagX,
              y: tagY - 8,
              width: tagWidth,
              height: 14,
              color: slate100,
            });
            
            // Tag text
            page.drawText(tag, {
              x: tagX + 5,
              y: tagY - 4,
              size: 8,
              font: helvetica,
              color: slate600,
            });
            
            tagX += tagWidth + 6;
          });
          y = tagY - 18;
        }

        // Description bullets
        if (hasMeaningfulValue(proj.description)) {
          const items = parseDescription(proj.description);
          if (items.length > 0) {
            y = drawBulletList(items, margin + 8, y);
          }
        }

        // URLs
        if (hasMeaningfulValue(proj.githubUrl)) {
          checkSpace(15);
          page.drawText(`GitHub: ${stripHtmlTags(proj.githubUrl)}`, {
            x: margin + 12,
            y: y,
            size: 8,
            font: helvetica,
            color: primaryColor,
          });
          y -= 13;
        }

        if (hasMeaningfulValue(proj.liveUrl)) {
          checkSpace(15);
          page.drawText(`Live: ${stripHtmlTags(proj.liveUrl)}`, {
            x: margin + 12,
            y: y,
            size: 8,
            font: helvetica,
            color: primaryColor,
          });
          y -= 13;
        }

        y -= 10;
      }
    });

    // Left border
    page.drawLine({
      start: { x: margin + 4, y: sectionStartY },
      end: { x: margin + 4, y: y + 10 },
      thickness: 2,
      color: slate100,
    });

    y -= 10;
  }

  // ==================== SKILLS (Grid Layout) ====================
  if (hasSkillsData(cvData.skills)) {
    y = drawSectionHeader('Technical Skills', y);
    
    const sectionStartY = y + 5;
    const colWidth = (contentWidth - 30) / 2;
    let col = 0;
    let rowY = y;

    cvData.skills.forEach((category) => {
      const skillsList = getSkillsList(category);
      const hasName = hasMeaningfulValue(category.name);
      
      if (hasName || skillsList.length > 0) {
        checkSpace(50);
        
        const xPos = margin + 12 + (col * (colWidth + 12));
        
        // Skill card background
        page.drawRectangle({
          x: xPos,
          y: rowY - 32,
          width: colWidth,
          height: 38,
          color: slate50,
        });
        
        // Category name
        if (hasName) {
          page.drawText(stripHtmlTags(category.name), {
            x: xPos + 8,
            y: rowY - 12,
            size: 9,
            font: helveticaBold,
            color: slate900,
          });
        }
        
        // Skills list
        if (skillsList.length > 0) {
          const skillsText = skillsList.join(', ');
          const lines = wrapText(skillsText, helvetica, 8, colWidth - 16);
          lines.slice(0, 2).forEach((line, lineIdx) => {
            page.drawText(line, {
              x: xPos + 8,
              y: rowY - 24 - (lineIdx * 11),
              size: 8,
              font: helvetica,
              color: slate600,
            });
          });
        }
        
        col++;
        if (col >= 2) {
          col = 0;
          rowY -= 48;
        }
      }
    });

    y = col > 0 ? rowY - 48 : rowY;

    // Left border
    page.drawLine({
      start: { x: margin + 4, y: sectionStartY },
      end: { x: margin + 4, y: y + 10 },
      thickness: 2,
      color: slate100,
    });

    y -= 10;
  }

  // ==================== ACHIEVEMENTS ====================
  if (hasAchievementsData(cvData.achievements)) {
    y = drawSectionHeader('Achievements', y);
    
    const sectionStartY = y + 5;
    
    cvData.achievements.forEach((ach) => {
      if (hasMeaningfulValue(ach.title)) {
        checkSpace(40);
        
        // Calculate date width
        let dateWidth = 0;
        if (hasMeaningfulValue(ach.date)) {
          dateWidth = helvetica.widthOfTextAtSize(stripHtmlTags(ach.date), 8) + 10;
        }
        
        // Title
        const maxTitleWidth = contentWidth - dateWidth - 20;
        const titleLines = wrapText(stripHtmlTags(ach.title), helveticaBold, 10.5, maxTitleWidth);
        
        titleLines.forEach((line, lineIdx) => {
          page.drawText(line, {
            x: margin + 12,
            y: y - (lineIdx * 14),
            size: 10.5,
            font: helveticaBold,
            color: slate900,
          });
        });
        
        if (titleLines.length > 1) {
          y -= (titleLines.length - 1) * 14;
        }

        // Date
        if (hasMeaningfulValue(ach.date)) {
          page.drawText(stripHtmlTags(ach.date), {
            x: pageWidth - margin - dateWidth + 5,
            y: y,
            size: 8,
            font: helvetica,
            color: slate500,
          });
        }
        y -= 14;

        // Organization
        if (hasMeaningfulValue(ach.organization)) {
          page.drawText(stripHtmlTags(ach.organization), {
            x: margin + 12,
            y: y,
            size: 9,
            font: helvetica,
            color: slate600,
          });
          y -= 14;
        }

        // Description
        if (hasMeaningfulValue(ach.description)) {
          y = drawWrappedText(stripHtmlTags(ach.description), margin + 12, y, 9, helvetica, slate600, contentWidth - 20);
        }

        y -= 10;
      }
    });

    // Left border
    page.drawLine({
      start: { x: margin + 4, y: sectionStartY },
      end: { x: margin + 4, y: y + 10 },
      thickness: 2,
      color: slate100,
    });

    y -= 10;
  }

  // ==================== VOLUNTEER ====================
  if (hasVolunteerData(cvData.volunteer)) {
    y = drawSectionHeader('Volunteer Experience', y);
    
    const sectionStartY = y + 5;
    
    cvData.volunteer.forEach((vol) => {
      const hasOrg = hasMeaningfulValue(vol.organization);
      const hasRole = hasMeaningfulValue(vol.role);
      
      if (hasOrg || hasRole) {
        checkSpace(55);
        
        // Calculate date width
        let dateWidth = 0;
        let dateText = '';
        if (vol.startDate || vol.endDate) {
          dateText = `${formatDate(vol.startDate)} - ${formatDate(vol.endDate)}`;
          dateWidth = helvetica.widthOfTextAtSize(dateText, 8) + 24;
        }
        
        // Role
        if (hasRole) {
          const maxRoleWidth = contentWidth - dateWidth - 16;
          const roleLines = wrapText(stripHtmlTags(vol.role), helveticaBold, 10.5, maxRoleWidth);
          
          roleLines.forEach((line, lineIdx) => {
            page.drawText(line, {
              x: margin + 12,
              y: y - (lineIdx * 14),
              size: 10.5,
              font: helveticaBold,
              color: slate900,
            });
          });
          
          if (roleLines.length > 1) {
            y -= (roleLines.length - 1) * 14;
          }
        }

        // Date badge
        if (dateText) {
          drawDateBadge(dateText, pageWidth - margin, y + 4);
        }
        y -= 16;

        // Organization
        if (hasOrg) {
          let orgText = stripHtmlTags(vol.organization);
          if (hasMeaningfulValue(vol.location)) {
            orgText += ` • ${stripHtmlTags(vol.location)}`;
          }
          page.drawText(orgText, {
            x: margin + 12,
            y: y,
            size: 9,
            font: helvetica,
            color: slate600,
          });
          y -= 16;
        }

        // Description
        if (hasMeaningfulValue(vol.description)) {
          const items = parseDescription(vol.description);
          if (items.length > 0) {
            y = drawBulletList(items, margin + 8, y);
          }
        }

        y -= 10;
      }
    });

    // Left border
    page.drawLine({
      start: { x: margin + 4, y: sectionStartY },
      end: { x: margin + 4, y: y + 10 },
      thickness: 2,
      color: slate100,
    });
  }

  return await pdfDoc.save();
}

// ============================================
// CLASSIC TEMPLATE
// ============================================
async function generateClassicTemplate(pdfDoc, cvData, fonts) {
  const { timesRoman, timesRomanBold, timesRomanItalic, primaryColor, formatDate, parseDescription, rgb, stripHtmlTags, getSkillsList } = fonts;
  
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - (2 * margin);
  
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Colors
  const gray900 = rgb(0.07, 0.07, 0.07);
  const gray700 = rgb(0.25, 0.25, 0.25);
  const gray600 = rgb(0.35, 0.35, 0.35);
  const gray400 = rgb(0.55, 0.55, 0.55);

  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const checkSpace = (required) => {
    if (y - required < margin + 30) {
      addNewPage();
    }
  };

  // Text wrapping helper
  const wrapText = (text, font, size, maxWidth) => {
    if (!text) return [];
    const cleanText = stripHtmlTags(text.toString());
    const words = cleanText.split(' ').filter(w => w);
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

  // Draw wrapped text
  const drawWrappedText = (text, x, yPos, size, font, color, maxWidth) => {
    const lines = wrapText(text, font, size, maxWidth);
    let currentY = yPos;
    
    for (const line of lines) {
      checkSpace(size + 5);
      page.drawText(line, { x, y: currentY, size, font, color });
      currentY -= size + 5;
    }
    return currentY;
  };

  // Draw centered text
  const drawCenteredText = (text, yPos, size, font, color) => {
    const cleanText = stripHtmlTags(text);
    const textWidth = font.widthOfTextAtSize(cleanText, size);
    const x = margin + (contentWidth - textWidth) / 2;
    page.drawText(cleanText, { x, y: yPos, size, font, color });
    return yPos - size - 6;
  };

  // Draw section header
  const drawSectionHeader = (title, yPos) => {
    checkSpace(30);
    
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
      thickness: 1,
      color: primaryColor,
    });
    
    return yPos - 26;
  };

  // Draw bullet list
  const drawBulletList = (items, x, yPos) => {
    let currentY = yPos;
    
    items.forEach((item) => {
      if (!item) return;
      const cleanItem = stripHtmlTags(item);
      if (!cleanItem) return;
      
      checkSpace(16);
      
      const lines = wrapText(cleanItem, timesRoman, 10, contentWidth - 20);
      lines.forEach((line, idx) => {
        if (idx === 0) {
          page.drawText('•', { x, y: currentY, size: 10, font: timesRoman, color: gray400 });
        }
        page.drawText(line, { x: x + 12, y: currentY, size: 10, font: timesRoman, color: gray700 });
        currentY -= 14;
      });
      currentY -= 2;
    });
    
    return currentY;
  };

  // ==================== HEADER ====================
  checkSpace(100);
  
  const name = (stripHtmlTags(cvData.personal?.fullName) || 'Your Name').toUpperCase();
  y = drawCenteredText(name, y, 22, timesRomanBold, primaryColor);
  y -= 4;

  // Contact lines
  const contacts1 = [];
  const contacts2 = [];
  
  if (hasMeaningfulValue(cvData.personal?.email)) contacts1.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone)) contacts1.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location)) contacts2.push(stripHtmlTags(cvData.personal.location));
  if (hasMeaningfulValue(cvData.personal?.linkedin)) contacts2.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website)) contacts2.push(stripHtmlTags(cvData.personal.website));

  if (contacts1.length > 0) {
    y = drawCenteredText(contacts1.join('  •  '), y, 10, timesRoman, gray600);
  }
  if (contacts2.length > 0) {
    y = drawCenteredText(contacts2.join('  •  '), y, 10, timesRoman, gray600);
  }

  page.drawLine({
    start: { x: margin, y: y - 5 },
    end: { x: pageWidth - margin, y: y - 5 },
    thickness: 2,
    color: primaryColor,
  });
  y -= 28;

  // ==================== PROFESSIONAL SUMMARY ====================
  if (hasMeaningfulValue(cvData.personal?.summary)) {
    y = drawSectionHeader('Professional Summary', y);
    y = drawWrappedText(stripHtmlTags(cvData.personal.summary), margin, y, 10, timesRoman, gray700, contentWidth);
    y -= 18;
  }

  // ==================== EDUCATION ====================
  if (hasEducationData(cvData.education)) {
    y = drawSectionHeader('Education', y);
    
    cvData.education.forEach((edu) => {
      const hasInstitution = hasMeaningfulValue(edu.institution);
      const hasDegree = hasMeaningfulValue(edu.degree);
      const hasField = hasMeaningfulValue(edu.field);
      
      if (hasInstitution || hasDegree || hasField) {
        checkSpace(50);
        
        let degreeText = '';
        if (hasDegree && hasField) {
          degreeText = `${stripHtmlTags(edu.degree)}, ${stripHtmlTags(edu.field)}`;
        } else if (hasDegree) {
          degreeText = stripHtmlTags(edu.degree);
        } else if (hasField) {
          degreeText = stripHtmlTags(edu.field);
        }
        
        // Calculate available width for degree text
        let dateText = '';
        let dateWidth = 0;
        if (edu.startDate || edu.endDate) {
          dateText = `${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}`;
          dateWidth = timesRoman.widthOfTextAtSize(dateText, 10) + 15;
        }
        
        if (degreeText) {
          const maxDegreeWidth = contentWidth - dateWidth - 10;
          const degreeLines = wrapText(degreeText, timesRomanBold, 10.5, maxDegreeWidth);
          
          degreeLines.forEach((line, idx) => {
            page.drawText(line, { x: margin, y: y - (idx * 14), size: 10.5, font: timesRomanBold, color: gray900 });
          });
          
          if (degreeLines.length > 1) y -= (degreeLines.length - 1) * 14;
          
          if (dateText) {
            page.drawText(dateText, {
              x: pageWidth - margin - dateWidth + 10,
              y: y,
              size: 10,
              font: timesRoman,
              color: gray600,
            });
          }
        }
        y -= 16;

        if (hasInstitution) {
          page.drawText(stripHtmlTags(edu.institution), { x: margin, y: y, size: 10, font: timesRomanItalic, color: gray600 });
          y -= 14;
        }

        if (hasMeaningfulValue(edu.gpa)) {
          page.drawText(`GPA: ${stripHtmlTags(edu.gpa)}`, { x: margin, y: y, size: 10, font: timesRoman, color: gray700 });
          y -= 14;
        }

        if (hasMeaningfulValue(edu.description)) {
          y = drawWrappedText(stripHtmlTags(edu.description), margin, y, 10, timesRoman, gray700, contentWidth);
        }

        y -= 12;
      }
    });
    y -= 8;
  }

  // ==================== EXPERIENCE ====================
  if (hasExperienceData(cvData.experience)) {
    y = drawSectionHeader('Professional Experience', y);
    
    cvData.experience.forEach((exp) => {
      const hasCompany = hasMeaningfulValue(exp.company);
      const hasPosition = hasMeaningfulValue(exp.position);
      
      if (hasCompany || hasPosition) {
        checkSpace(55);
        
        let dateText = '';
        let dateWidth = 0;
        if (exp.startDate || exp.endDate || exp.isCurrentRole) {
          dateText = `${formatDate(exp.startDate)} – ${exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}`;
          dateWidth = timesRoman.widthOfTextAtSize(dateText, 10) + 15;
        }
        
        if (hasPosition) {
          const maxPosWidth = contentWidth - dateWidth - 10;
          const posLines = wrapText(stripHtmlTags(exp.position), timesRomanBold, 10.5, maxPosWidth);
          
          posLines.forEach((line, idx) => {
            page.drawText(line, { x: margin, y: y - (idx * 14), size: 10.5, font: timesRomanBold, color: gray900 });
          });
          
          if (posLines.length > 1) y -= (posLines.length - 1) * 14;
          
          if (dateText) {
            page.drawText(dateText, { x: pageWidth - margin - dateWidth + 10, y: y, size: 10, font: timesRoman, color: gray600 });
          }
        }
        y -= 16;

        if (hasCompany) {
          let companyText = stripHtmlTags(exp.company);
          if (hasMeaningfulValue(exp.location)) {
            companyText += `, ${stripHtmlTags(exp.location)}`;
          }
          page.drawText(companyText, { x: margin, y: y, size: 10, font: timesRomanItalic, color: gray600 });
          y -= 16;
        }

        if (hasMeaningfulValue(exp.description)) {
          const items = parseDescription(exp.description);
          if (items.length > 0) {
            y = drawBulletList(items, margin, y);
          }
        }

        y -= 12;
      }
    });
    y -= 8;
  }

  // ==================== PROJECTS ====================
  if (hasProjectsData(cvData.projects)) {
    y = drawSectionHeader('Technical Projects', y);
    
    cvData.projects.forEach((proj) => {
      if (hasMeaningfulValue(proj.name)) {
        checkSpace(50);
        
        let dateText = '';
        let dateWidth = 0;
        if (proj.startDate || proj.endDate) {
          if (proj.startDate && proj.endDate) {
            dateText = `${formatDate(proj.startDate)} – ${formatDate(proj.endDate)}`;
          } else {
            dateText = formatDate(proj.startDate) || formatDate(proj.endDate);
          }
          dateWidth = timesRoman.widthOfTextAtSize(dateText, 10) + 15;
        }
        
        const maxNameWidth = contentWidth - dateWidth - 10;
        const nameLines = wrapText(stripHtmlTags(proj.name), timesRomanBold, 10.5, maxNameWidth);
        
        nameLines.forEach((line, idx) => {
          page.drawText(line, { x: margin, y: y - (idx * 14), size: 10.5, font: timesRomanBold, color: gray900 });
        });
        
        if (nameLines.length > 1) y -= (nameLines.length - 1) * 14;
        
        if (dateText) {
          page.drawText(dateText, { x: pageWidth - margin - dateWidth + 10, y: y, size: 10, font: timesRoman, color: gray600 });
        }
        y -= 16;

        if (hasMeaningfulValue(proj.technologies)) {
          page.drawText(`Technologies: ${stripHtmlTags(proj.technologies)}`, { x: margin, y: y, size: 10, font: timesRomanItalic, color: gray600 });
          y -= 16;
        }

        if (hasMeaningfulValue(proj.description)) {
          const items = parseDescription(proj.description);
          if (items.length > 0) {
            y = drawBulletList(items, margin, y);
          }
        }

        if (hasMeaningfulValue(proj.githubUrl)) {
          page.drawText(`GitHub: ${stripHtmlTags(proj.githubUrl)}`, { x: margin, y: y, size: 9, font: timesRoman, color: primaryColor });
          y -= 13;
        }

        if (hasMeaningfulValue(proj.liveUrl)) {
          page.drawText(`Live: ${stripHtmlTags(proj.liveUrl)}`, { x: margin, y: y, size: 9, font: timesRoman, color: primaryColor });
          y -= 13;
        }

        y -= 12;
      }
    });
    y -= 8;
  }

  // ==================== SKILLS ====================
  if (hasSkillsData(cvData.skills)) {
    y = drawSectionHeader('Technical Skills', y);
    
    cvData.skills.forEach((category) => {
      const skillsList = getSkillsList(category);
      const hasName = hasMeaningfulValue(category.name);
      
      if (hasName || skillsList.length > 0) {
        checkSpace(20);
        
        const categoryName = stripHtmlTags(category.name) || 'Skills';
        const skillsText = skillsList.join(', ');
        
        page.drawText(`${categoryName}:`, { x: margin, y: y, size: 10, font: timesRomanBold, color: gray900 });
        
        const labelWidth = timesRomanBold.widthOfTextAtSize(`${categoryName}: `, 10);
        y = drawWrappedText(skillsText, margin + labelWidth, y, 10, timesRoman, gray700, contentWidth - labelWidth);
        y -= 6;
      }
    });
    y -= 14;
  }

  // ==================== ACHIEVEMENTS ====================
  if (hasAchievementsData(cvData.achievements)) {
    y = drawSectionHeader('Achievements', y);
    
    cvData.achievements.forEach((ach) => {
      if (hasMeaningfulValue(ach.title)) {
        checkSpace(40);
        
        let dateWidth = 0;
        if (hasMeaningfulValue(ach.date)) {
          dateWidth = timesRoman.widthOfTextAtSize(stripHtmlTags(ach.date), 10) + 15;
        }
        
        const maxTitleWidth = contentWidth - dateWidth - 10;
        const titleLines = wrapText(stripHtmlTags(ach.title), timesRomanBold, 10.5, maxTitleWidth);
        
        titleLines.forEach((line, idx) => {
          page.drawText(line, { x: margin, y: y - (idx * 14), size: 10.5, font: timesRomanBold, color: gray900 });
        });
        
        if (titleLines.length > 1) y -= (titleLines.length - 1) * 14;
        
        if (hasMeaningfulValue(ach.date)) {
          page.drawText(stripHtmlTags(ach.date), { x: pageWidth - margin - dateWidth + 10, y: y, size: 10, font: timesRoman, color: gray600 });
        }
        y -= 16;

        if (hasMeaningfulValue(ach.organization)) {
          page.drawText(stripHtmlTags(ach.organization), { x: margin, y: y, size: 10, font: timesRoman, color: gray600 });
          y -= 14;
        }

        if (hasMeaningfulValue(ach.description)) {
          y = drawWrappedText(stripHtmlTags(ach.description), margin, y, 10, timesRoman, gray700, contentWidth);
        }

        y -= 12;
      }
    });
    y -= 8;
  }

  // ==================== VOLUNTEER ====================
  if (hasVolunteerData(cvData.volunteer)) {
    y = drawSectionHeader('Volunteer Experience', y);
    
    cvData.volunteer.forEach((vol) => {
      const hasOrg = hasMeaningfulValue(vol.organization);
      const hasRole = hasMeaningfulValue(vol.role);
      
      if (hasOrg || hasRole) {
        checkSpace(45);
        
        let dateText = '';
        let dateWidth = 0;
        if (vol.startDate || vol.endDate) {
          dateText = `${formatDate(vol.startDate)} – ${formatDate(vol.endDate)}`;
          dateWidth = timesRoman.widthOfTextAtSize(dateText, 10) + 15;
        }
        
        if (hasRole) {
          const maxRoleWidth = contentWidth - dateWidth - 10;
          const roleLines = wrapText(stripHtmlTags(vol.role), timesRomanBold, 10.5, maxRoleWidth);
          
          roleLines.forEach((line, idx) => {
            page.drawText(line, { x: margin, y: y - (idx * 14), size: 10.5, font: timesRomanBold, color: gray900 });
          });
          
          if (roleLines.length > 1) y -= (roleLines.length - 1) * 14;
          
          if (dateText) {
            page.drawText(dateText, { x: pageWidth - margin - dateWidth + 10, y: y, size: 10, font: timesRoman, color: gray600 });
          }
        }
        y -= 16;

        if (hasOrg) {
          let orgText = stripHtmlTags(vol.organization);
          if (hasMeaningfulValue(vol.location)) {
            orgText += `, ${stripHtmlTags(vol.location)}`;
          }
          page.drawText(orgText, { x: margin, y: y, size: 10, font: timesRomanItalic, color: gray600 });
          y -= 16;
        }

        if (hasMeaningfulValue(vol.description)) {
          const items = parseDescription(vol.description);
          if (items.length > 0) {
            y = drawBulletList(items, margin, y);
          }
        }

        y -= 12;
      }
    });
  }

  return await pdfDoc.save();
}

// ============================================
// MINIMAL TEMPLATE
// ============================================
async function generateMinimalTemplate(pdfDoc, cvData, fonts) {
  const { helvetica, helveticaBold, helveticaOblique, primaryColor, formatDate, parseDescription, rgb, stripHtmlTags, getSkillsList } = fonts;
  
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 55;
  const contentWidth = pageWidth - (2 * margin);
  
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin - 10;

  const gray900 = rgb(0.07, 0.07, 0.07);
  const gray600 = rgb(0.35, 0.35, 0.35);
  const gray500 = rgb(0.45, 0.45, 0.45);
  const gray400 = rgb(0.55, 0.55, 0.55);
  const gray300 = rgb(0.70, 0.70, 0.70);

  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const checkSpace = (required) => {
    if (y - required < margin + 30) {
      addNewPage();
    }
  };

  const wrapText = (text, font, size, maxWidth) => {
    if (!text) return [];
    const cleanText = stripHtmlTags(text.toString());
    const words = cleanText.split(' ').filter(w => w);
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

  const drawWrappedText = (text, x, yPos, size, font, color, maxWidth) => {
    const lines = wrapText(text, font, size, maxWidth);
    let currentY = yPos;
    
    for (const line of lines) {
      checkSpace(size + 6);
      page.drawText(line, { x, y: currentY, size, font, color });
      currentY -= size + 6;
    }
    return currentY;
  };

  const drawSectionHeader = (title, yPos) => {
    checkSpace(30);
    const spacedTitle = title.toUpperCase().split('').join(' ');
    page.drawText(spacedTitle, { x: margin, y: yPos, size: 8, font: helvetica, color: gray400 });
    return yPos - 24;
  };

  const drawBulletList = (items, x, yPos) => {
    let currentY = yPos;
    
    items.forEach((item) => {
      if (!item) return;
      const cleanItem = stripHtmlTags(item);
      if (!cleanItem) return;
      
      checkSpace(18);
      
      page.drawText('—', { x, y: currentY, size: 9, font: helvetica, color: gray300 });
      
      const lines = wrapText(cleanItem, helvetica, 9, contentWidth - 24);
      lines.forEach((line, idx) => {
        page.drawText(line, { x: x + 18, y: currentY - (idx * 14), size: 9, font: helvetica, color: gray600 });
      });
      currentY -= lines.length * 14 + 6;
    });
    
    return currentY;
  };

  // ==================== HEADER ====================
  checkSpace(90);
  
  page.drawText(stripHtmlTags(cvData.personal?.fullName) || 'Your Name', {
    x: margin,
    y: y,
    size: 32,
    font: helvetica,
    color: primaryColor,
  });
  y -= 44;

  // Contact info
  const contacts = [];
  if (hasMeaningfulValue(cvData.personal?.email)) contacts.push(stripHtmlTags(cvData.personal.email));
  if (hasMeaningfulValue(cvData.personal?.phone)) contacts.push(stripHtmlTags(cvData.personal.phone));
  if (hasMeaningfulValue(cvData.personal?.location)) contacts.push(stripHtmlTags(cvData.personal.location));
  if (hasMeaningfulValue(cvData.personal?.linkedin)) contacts.push(stripHtmlTags(cvData.personal.linkedin));
  if (hasMeaningfulValue(cvData.personal?.website)) contacts.push(stripHtmlTags(cvData.personal.website));

  if (contacts.length > 0) {
    const contactText = contacts.join('  |  ');
    const lines = wrapText(contactText, helvetica, 9, contentWidth);
    lines.forEach((line) => {
      page.drawText(line, { x: margin, y: y, size: 9, font: helvetica, color: gray500 });
      y -= 15;
    });
  }
  y -= 6;

  page.drawLine({
    start: { x: margin, y: y },
    end: { x: margin + 50, y: y },
    thickness: 1,
    color: primaryColor,
  });
  y -= 30;

  // ==================== SUMMARY ====================
  if (hasMeaningfulValue(cvData.personal?.summary)) {
    y = drawSectionHeader('Summary', y);
    y = drawWrappedText(stripHtmlTags(cvData.personal.summary), margin, y, 9.5, helvetica, gray600, contentWidth);
    y -= 26;
  }

  // ==================== EDUCATION ====================
  if (hasEducationData(cvData.education)) {
    y = drawSectionHeader('Education', y);
    
    cvData.education.forEach((edu) => {
      const hasInstitution = hasMeaningfulValue(edu.institution);
      const hasDegree = hasMeaningfulValue(edu.degree);
      const hasField = hasMeaningfulValue(edu.field);
      
      if (hasInstitution || hasDegree || hasField) {
        checkSpace(50);
        
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
          dateWidth = helvetica.widthOfTextAtSize(dateText, 9) + 15;
        }
        
        if (degreeText) {
          const maxDegreeWidth = contentWidth - dateWidth - 10;
          const degreeLines = wrapText(degreeText, helvetica, 11, maxDegreeWidth);
          
          degreeLines.forEach((line, idx) => {
            page.drawText(line, { x: margin, y: y - (idx * 15), size: 11, font: helvetica, color: gray900 });
          });
          
          if (degreeLines.length > 1) y -= (degreeLines.length - 1) * 15;
          
          if (dateText) {
            page.drawText(dateText, { x: pageWidth - margin - dateWidth + 10, y: y, size: 9, font: helvetica, color: gray400 });
          }
        }
        y -= 17;

        if (hasInstitution) {
          page.drawText(stripHtmlTags(edu.institution), { x: margin, y: y, size: 9, font: helvetica, color: gray500 });
          y -= 14;
        }

        if (hasMeaningfulValue(edu.gpa)) {
          page.drawText(`GPA: ${stripHtmlTags(edu.gpa)}`, { x: margin, y: y, size: 9, font: helvetica, color: gray400 });
          y -= 14;
        }

        y -= 14;
      }
    });
    y -= 10;
  }

  // ==================== EXPERIENCE ====================
  if (hasExperienceData(cvData.experience)) {
    y = drawSectionHeader('Experience', y);
    
    cvData.experience.forEach((exp) => {
      const hasCompany = hasMeaningfulValue(exp.company);
      const hasPosition = hasMeaningfulValue(exp.position);
      
      if (hasCompany || hasPosition) {
        checkSpace(55);
        
        let dateText = '';
        let dateWidth = 0;
        if (exp.startDate || exp.endDate || exp.isCurrentRole) {
          dateText = `${formatDate(exp.startDate)} — ${exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}`;
          dateWidth = helvetica.widthOfTextAtSize(dateText, 9) + 15;
        }
        
        if (hasPosition) {
          const maxPosWidth = contentWidth - dateWidth - 10;
          const posLines = wrapText(stripHtmlTags(exp.position), helvetica, 11, maxPosWidth);
          
          posLines.forEach((line, idx) => {
            page.drawText(line, { x: margin, y: y - (idx * 15), size: 11, font: helvetica, color: gray900 });
          });
          
          if (posLines.length > 1) y -= (posLines.length - 1) * 15;
          
          if (dateText) {
            page.drawText(dateText, { x: pageWidth - margin - dateWidth + 10, y: y, size: 9, font: helvetica, color: gray400 });
          }
        }
        y -= 17;

        if (hasCompany) {
          page.drawText(stripHtmlTags(exp.company), { x: margin, y: y, size: 9, font: helvetica, color: gray500 });
          y -= 18;
        }

        if (hasMeaningfulValue(exp.description)) {
          const items = parseDescription(exp.description);
          if (items.length > 0) {
            y = drawBulletList(items, margin, y);
          }
        }

        y -= 14;
      }
    });
    y -= 10;
  }

  // ==================== PROJECTS ====================
  if (hasProjectsData(cvData.projects)) {
    y = drawSectionHeader('Projects', y);
    
    cvData.projects.forEach((proj) => {
      if (hasMeaningfulValue(proj.name)) {
        checkSpace(50);
        
        let dateText = '';
        let dateWidth = 0;
        if (proj.startDate || proj.endDate) {
          if (proj.startDate && proj.endDate) {
            dateText = `${formatDate(proj.startDate)} — ${formatDate(proj.endDate)}`;
          } else {
            dateText = formatDate(proj.startDate) || formatDate(proj.endDate);
          }
          dateWidth = helvetica.widthOfTextAtSize(dateText, 9) + 15;
        }
        
        const maxNameWidth = contentWidth - dateWidth - 10;
        const nameLines = wrapText(stripHtmlTags(proj.name), helvetica, 11, maxNameWidth);
        
        nameLines.forEach((line, idx) => {
          page.drawText(line, { x: margin, y: y - (idx * 15), size: 11, font: helvetica, color: gray900 });
        });
        
        if (nameLines.length > 1) y -= (nameLines.length - 1) * 15;
        
        if (dateText) {
          page.drawText(dateText, { x: pageWidth - margin - dateWidth + 10, y: y, size: 9, font: helvetica, color: gray400 });
        }
        y -= 17;

        if (hasMeaningfulValue(proj.technologies)) {
          page.drawText(stripHtmlTags(proj.technologies), { x: margin, y: y, size: 9, font: helveticaOblique, color: gray400 });
          y -= 16;
        }

        if (hasMeaningfulValue(proj.description)) {
          const items = parseDescription(proj.description);
          if (items.length > 0) {
            y = drawBulletList(items, margin, y);
          }
        }

        if (hasMeaningfulValue(proj.githubUrl)) {
          page.drawText(`GitHub: ${stripHtmlTags(proj.githubUrl)}`, { x: margin, y: y, size: 8.5, font: helvetica, color: primaryColor });
          y -= 13;
        }

        if (hasMeaningfulValue(proj.liveUrl)) {
          page.drawText(`Live: ${stripHtmlTags(proj.liveUrl)}`, { x: margin, y: y, size: 8.5, font: helvetica, color: primaryColor });
          y -= 13;
        }

        y -= 14;
      }
    });
    y -= 10;
  }

  // ==================== SKILLS ====================
  if (hasSkillsData(cvData.skills)) {
    y = drawSectionHeader('Skills', y);
    
    cvData.skills.forEach((category) => {
      const skillsList = getSkillsList(category);
      const hasName = hasMeaningfulValue(category.name);
      
      if (hasName || skillsList.length > 0) {
        checkSpace(20);
        
        const categoryName = stripHtmlTags(category.name) || 'Skills';
        const labelWidth = 95;
        
        page.drawText(categoryName, { x: margin, y: y, size: 9, font: helvetica, color: gray400 });
        
        const skillsText = skillsList.join(', ');
        y = drawWrappedText(skillsText, margin + labelWidth, y, 9, helvetica, gray600, contentWidth - labelWidth);
        y -= 6;
      }
    });
    y -= 18;
  }

  // ==================== ACHIEVEMENTS ====================
  if (hasAchievementsData(cvData.achievements)) {
    y = drawSectionHeader('Achievements', y);
    
    cvData.achievements.forEach((ach) => {
      if (hasMeaningfulValue(ach.title)) {
        checkSpace(40);
        
        let dateWidth = 0;
        if (hasMeaningfulValue(ach.date)) {
          dateWidth = helvetica.widthOfTextAtSize(stripHtmlTags(ach.date), 9) + 15;
        }
        
        const maxTitleWidth = contentWidth - dateWidth - 10;
        const titleLines = wrapText(stripHtmlTags(ach.title), helvetica, 11, maxTitleWidth);
        
        titleLines.forEach((line, idx) => {
          page.drawText(line, { x: margin, y: y - (idx * 15), size: 11, font: helvetica, color: gray900 });
        });
        
        if (titleLines.length > 1) y -= (titleLines.length - 1) * 15;
        
        if (hasMeaningfulValue(ach.date)) {
          page.drawText(stripHtmlTags(ach.date), { x: pageWidth - margin - dateWidth + 10, y: y, size: 9, font: helvetica, color: gray400 });
        }
        y -= 17;

        if (hasMeaningfulValue(ach.organization)) {
          page.drawText(stripHtmlTags(ach.organization), { x: margin, y: y, size: 9, font: helvetica, color: gray500 });
          y -= 14;
        }

        if (hasMeaningfulValue(ach.description)) {
          y = drawWrappedText(stripHtmlTags(ach.description), margin, y, 9, helvetica, gray600, contentWidth);
        }

        y -= 14;
      }
    });
    y -= 10;
  }

  // ==================== VOLUNTEER ====================
  if (hasVolunteerData(cvData.volunteer)) {
    y = drawSectionHeader('Volunteer', y);
    
    cvData.volunteer.forEach((vol) => {
      const hasOrg = hasMeaningfulValue(vol.organization);
      const hasRole = hasMeaningfulValue(vol.role);
      
      if (hasOrg || hasRole) {
        checkSpace(50);
        
        let dateText = '';
        let dateWidth = 0;
        if (vol.startDate || vol.endDate) {
          dateText = `${formatDate(vol.startDate)} — ${formatDate(vol.endDate)}`;
          dateWidth = helvetica.widthOfTextAtSize(dateText, 9) + 15;
        }
        
        if (hasRole) {
          const maxRoleWidth = contentWidth - dateWidth - 10;
          const roleLines = wrapText(stripHtmlTags(vol.role), helvetica, 11, maxRoleWidth);
          
          roleLines.forEach((line, idx) => {
            page.drawText(line, { x: margin, y: y - (idx * 15), size: 11, font: helvetica, color: gray900 });
          });
          
          if (roleLines.length > 1) y -= (roleLines.length - 1) * 15;
          
          if (dateText) {
            page.drawText(dateText, { x: pageWidth - margin - dateWidth + 10, y: y, size: 9, font: helvetica, color: gray400 });
          }
        }
        y -= 17;

        if (hasOrg) {
          page.drawText(stripHtmlTags(vol.organization), { x: margin, y: y, size: 9, font: helvetica, color: gray500 });
          y -= 16;
        }

        if (hasMeaningfulValue(vol.description)) {
          const items = parseDescription(vol.description);
          if (items.length > 0) {
            y = drawBulletList(items, margin, y);
          }
        }

        y -= 14;
      }
    });
  }

  return await pdfDoc.save();
}