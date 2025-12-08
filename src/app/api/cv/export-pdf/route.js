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
    } : { r: 0.12, g: 0.13, b: 0.28 };
  };

  const themeRgb = hexToRgb(themeColor);
  const primaryColor = rgb(themeRgb.r, themeRgb.g, themeRgb.b);

  // Format date helper
  const formatDate = (date) => {
    if (!date) return "";
    const [year, month] = date.split("-");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Choose template
  switch (templateId) {
    case 'classic':
      return generateClassicTemplate(pdfDoc, cvData, {
        timesRoman, timesRomanBold, timesRomanItalic,
        primaryColor, formatDate
      });
    case 'minimal':
      return generateMinimalTemplate(pdfDoc, cvData, {
        helvetica, helveticaBold, helveticaOblique,
        primaryColor, formatDate
      });
    case 'modern':
    default:
      return generateModernTemplate(pdfDoc, cvData, {
        helvetica, helveticaBold, helveticaOblique,
        primaryColor, formatDate
      });
  }
}

// ==================== MODERN TEMPLATE ====================
async function generateModernTemplate(pdfDoc, cvData, fonts) {
  const { rgb } = await import('pdf-lib');
  const { helvetica, helveticaBold, helveticaOblique, primaryColor, formatDate } = fonts;
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 48;
  const contentWidth = pageWidth - (2 * margin);
  
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const checkSpace = (required) => {
    if (y - required < margin + 20) {
      addNewPage();
    }
  };

  const drawText = (text, x, yPos, size, font, color = rgb(0, 0, 0), maxWidth = null) => {
    if (!text) return yPos;
    const actualMaxWidth = maxWidth || contentWidth;
    const words = text.toString().split(' ');
    let line = '';
    let lineY = yPos;

    for (let word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      
      if (testWidth > actualMaxWidth && line) {
        page.drawText(line, { x, y: lineY, size, font, color });
        line = word;
        lineY -= size + 3;
        checkSpace(size + 3);
      } else {
        line = testLine;
      }
    }
    
    if (line) {
      page.drawText(line, { x, y: lineY, size, font, color });
      return lineY - size - 3;
    }
    return lineY;
  };

  const drawBulletList = (text, x, yPos, size, font) => {
    if (!text) return yPos;
    const lines = text.split('\n').filter(line => line.trim());
    let currentY = yPos;

    lines.forEach(line => {
      checkSpace(size + 6);
      const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
      if (cleanLine) {
        page.drawText('•', { x, y: currentY, size, font: helvetica, color: primaryColor });
        currentY = drawText(cleanLine, x + 12, currentY, size, font, rgb(0.25, 0.25, 0.25), contentWidth - 12);
        currentY -= 2;
      }
    });
    return currentY;
  };

  const drawLine = (x1, y1, x2, y2, color, thickness = 1) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness,
      color,
    });
  };

  // ==================== HEADER ====================
  checkSpace(70);
  page.drawText(cvData.personal?.fullName || 'Your Name', {
    x: margin,
    y: y,
    size: 26,
    font: helveticaBold,
    color: primaryColor,
  });
  y -= 32;

  // Contact Information
  const contactItems = [];
  if (cvData.personal?.email) contactItems.push(cvData.personal.email);
  if (cvData.personal?.phone) contactItems.push(cvData.personal.phone);
  if (cvData.personal?.location) contactItems.push(cvData.personal.location);

  if (contactItems.length > 0) {
    page.drawText(contactItems.join(' • '), {
      x: margin,
      y: y,
      size: 9,
      font: helvetica,
      color: rgb(0.35, 0.35, 0.35),
    });
    y -= 13;
  }

  if (cvData.personal?.linkedin) {
    page.drawText(cvData.personal.linkedin, {
      x: margin,
      y: y,
      size: 9,
      font: helvetica,
      color: primaryColor,
    });
    y -= 18;
  } else {
    y -= 6;
  }

  // ==================== PROFESSIONAL SUMMARY ====================
  if (cvData.personal?.summary) {
    checkSpace(55);
    page.drawText('PROFESSIONAL SUMMARY', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1.5);
    y -= 13;
    y = drawText(cvData.personal.summary, margin, y, 9.5, helvetica, rgb(0.2, 0.2, 0.2), contentWidth);
    y -= 16;
  }

  // ==================== EDUCATION ====================
  const hasEducation = cvData.education?.some(edu => edu.institution || edu.degree);
  if (hasEducation) {
    checkSpace(55);
    page.drawText('EDUCATION', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1.5);
    y -= 13;

    cvData.education.forEach((edu, idx) => {
      if (edu.institution || edu.degree) {
        checkSpace(45);
        
        // Degree and Field
        const degreeText = edu.degree && edu.field 
          ? `${edu.degree} in ${edu.field}`
          : edu.degree || edu.field || 'Degree';
        
        page.drawText(degreeText, {
          x: margin,
          y: y,
          size: 10.5,
          font: helveticaBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        // Dates (right aligned)
        if (edu.startDate || edu.endDate) {
          const dateText = `${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`;
          const dateWidth = helvetica.widthOfTextAtSize(dateText, 9);
          page.drawText(dateText, {
            x: pageWidth - margin - dateWidth,
            y: y,
            size: 9,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        y -= 13;

        // Institution
        if (edu.institution) {
          page.drawText(edu.institution, {
            x: margin,
            y: y,
            size: 9.5,
            font: helveticaBold,
            color: rgb(0.25, 0.25, 0.25),
          });
          y -= 12;
        }

        // GPA
        if (edu.gpa) {
          page.drawText(`GPA: ${edu.gpa}`, {
            x: margin,
            y: y,
            size: 9,
            font: helvetica,
            color: rgb(0.35, 0.35, 0.35),
          });
          y -= 11;
        }

        // Description
        if (edu.description) {
          y = drawText(edu.description, margin, y, 9, helvetica, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 4;
        }

        y -= idx < cvData.education.length - 1 ? 10 : 6;
      }
    });

    y -= 10;
  }

  // ==================== PROFESSIONAL EXPERIENCE ====================
  const hasExperience = cvData.experience?.some(exp => exp.company || exp.position);
  if (hasExperience) {
    checkSpace(55);
    page.drawText('PROFESSIONAL EXPERIENCE', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1.5);
    y -= 13;

    cvData.experience.forEach((exp, idx) => {
      if (exp.company || exp.position) {
        checkSpace(45);
        
        // Position
        if (exp.position) {
          page.drawText(exp.position, {
            x: margin,
            y: y,
            size: 10.5,
            font: helveticaBold,
            color: rgb(0.1, 0.1, 0.1),
          });
        }

        // Dates (right aligned)
        if (exp.startDate || exp.endDate || exp.isCurrentRole) {
          const dateText = `${formatDate(exp.startDate)} - ${exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}`;
          const dateWidth = helvetica.widthOfTextAtSize(dateText, 9);
          page.drawText(dateText, {
            x: pageWidth - margin - dateWidth,
            y: y,
            size: 9,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        y -= 13;

        // Company and Location
        if (exp.company) {
          const companyText = exp.location ? `${exp.company} • ${exp.location}` : exp.company;
          page.drawText(companyText, {
            x: margin,
            y: y,
            size: 9.5,
            font: helveticaBold,
            color: rgb(0.25, 0.25, 0.25),
          });
          y -= 13;
        }

        // Description with bullets
        if (exp.description) {
          y = drawBulletList(exp.description, margin, y, 9, helvetica);
          y -= 4;
        }

        y -= idx < cvData.experience.length - 1 ? 10 : 6;
      }
    });

    y -= 10;
  }

  // ==================== PROJECTS ====================
  const hasProjects = cvData.projects?.some(proj => proj.name);
  if (hasProjects) {
    checkSpace(55);
    page.drawText('PROJECTS', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1.5);
    y -= 13;

    cvData.projects.forEach((proj, idx) => {
      if (proj.name) {
        checkSpace(45);
        
        // Project Name
        page.drawText(proj.name, {
          x: margin,
          y: y,
          size: 10.5,
          font: helveticaBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        // Dates (right aligned)
        if (proj.startDate || proj.endDate) {
          const dateText = proj.startDate && proj.endDate
            ? `${formatDate(proj.startDate)} - ${formatDate(proj.endDate)}`
            : formatDate(proj.startDate) || formatDate(proj.endDate);
          const dateWidth = helvetica.widthOfTextAtSize(dateText, 9);
          page.drawText(dateText, {
            x: pageWidth - margin - dateWidth,
            y: y,
            size: 9,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        y -= 13;

        // Technologies
        if (proj.technologies) {
          page.drawText(`Technologies: ${proj.technologies}`, {
            x: margin,
            y: y,
            size: 9,
            font: helveticaOblique,
            color: rgb(0.35, 0.35, 0.35),
          });
          y -= 11;
        }

        // Description
        if (proj.description) {
          y = drawBulletList(proj.description, margin, y, 9, helvetica);
          y -= 4;
        }

        // URLs
        if (proj.githubUrl) {
          page.drawText(`GitHub: ${proj.githubUrl}`, {
            x: margin,
            y: y,
            size: 8.5,
            font: helvetica,
            color: primaryColor,
          });
          y -= 10;
        }

        if (proj.liveUrl) {
          page.drawText(`Live: ${proj.liveUrl}`, {
            x: margin,
            y: y,
            size: 8.5,
            font: helvetica,
            color: primaryColor,
          });
          y -= 10;
        }

        // Achievements
        if (proj.achievements) {
          page.drawText('Key Achievements:', {
            x: margin,
            y: y,
            size: 9,
            font: helveticaBold,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= 11;
          y = drawBulletList(proj.achievements, margin, y, 9, helvetica);
          y -= 4;
        }

        y -= idx < cvData.projects.length - 1 ? 10 : 6;
      }
    });

    y -= 10;
  }

  // ==================== SKILLS ====================
  const hasSkills = cvData.skills?.some(s => s.skills?.length > 0);
  if (hasSkills) {
    checkSpace(55);
    page.drawText('SKILLS', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1.5);
    y -= 13;

    cvData.skills.forEach((category, idx) => {
      if (category.skills?.length > 0) {
        checkSpace(20);
        const categoryName = category.name || category.categoryName || 'Skills';
        const skillsText = `${categoryName}: ${category.skills.join(', ')}`;
        y = drawText(skillsText, margin, y, 9, helvetica, rgb(0.25, 0.25, 0.25), contentWidth);
        y -= idx < cvData.skills.length - 1 ? 6 : 4;
      }
    });

    y -= 10;
  }

  // ==================== ACHIEVEMENTS ====================
  const hasAchievements = cvData.achievements?.some(ach => ach.title);
  if (hasAchievements) {
    checkSpace(55);
    page.drawText('ACHIEVEMENTS', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1.5);
    y -= 13;

    cvData.achievements.forEach((ach, idx) => {
      if (ach.title) {
        checkSpace(35);
        
        // Title
        page.drawText(ach.title, {
          x: margin,
          y: y,
          size: 10.5,
          font: helveticaBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        // Date (right aligned)
        if (ach.date) {
          const dateWidth = helvetica.widthOfTextAtSize(ach.date, 9);
          page.drawText(ach.date, {
            x: pageWidth - margin - dateWidth,
            y: y,
            size: 9,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        y -= 13;

        // Organization and Type
        if (ach.organization) {
          const orgText = ach.type ? `${ach.organization} • ${ach.type}` : ach.organization;
          page.drawText(orgText, {
            x: margin,
            y: y,
            size: 9,
            font: helvetica,
            color: rgb(0.35, 0.35, 0.35),
          });
          y -= 11;
        }

        // Description
        if (ach.description) {
          y = drawText(ach.description, margin, y, 9, helvetica, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 4;
        }

        y -= idx < cvData.achievements.length - 1 ? 10 : 6;
      }
    });

    y -= 10;
  }

  // ==================== VOLUNTEER EXPERIENCE ====================
  const hasVolunteer = cvData.volunteer?.some(vol => vol.organization || vol.role);
  if (hasVolunteer) {
    checkSpace(55);
    page.drawText('VOLUNTEER EXPERIENCE', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1.5);
    y -= 13;

    cvData.volunteer.forEach((vol, idx) => {
      if (vol.organization || vol.role) {
        checkSpace(40);
        
        // Role
        if (vol.role) {
          page.drawText(vol.role, {
            x: margin,
            y: y,
            size: 10.5,
            font: helveticaBold,
            color: rgb(0.1, 0.1, 0.1),
          });
        }

        // Dates (right aligned)
        if (vol.startDate || vol.endDate) {
          const dateText = `${formatDate(vol.startDate)} - ${formatDate(vol.endDate)}`;
          const dateWidth = helvetica.widthOfTextAtSize(dateText, 9);
          page.drawText(dateText, {
            x: pageWidth - margin - dateWidth,
            y: y,
            size: 9,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        y -= 13;

        // Organization and Location
        if (vol.organization) {
          const orgText = vol.location ? `${vol.organization} • ${vol.location}` : vol.organization;
          page.drawText(orgText, {
            x: margin,
            y: y,
            size: 9.5,
            font: helveticaBold,
            color: rgb(0.25, 0.25, 0.25),
          });
          y -= 13;
        }

        // Description
        if (vol.description) {
          y = drawBulletList(vol.description, margin, y, 9, helvetica);
          y -= 4;
        }

        // Impact
        if (vol.impact) {
          page.drawText(`Impact: ${vol.impact}`, {
            x: margin,
            y: y,
            size: 9,
            font: helveticaOblique,
            color: rgb(0.3, 0.3, 0.3),
          });
          y -= 11;
        }

        y -= idx < cvData.volunteer.length - 1 ? 10 : 6;
      }
    });
  }

  return await pdfDoc.save();
}

// ==================== CLASSIC TEMPLATE ====================
async function generateClassicTemplate(pdfDoc, cvData, fonts) {
  const { rgb } = await import('pdf-lib');
  const { timesRoman, timesRomanBold, timesRomanItalic, primaryColor, formatDate } = fonts;
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - (2 * margin);
  
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const checkSpace = (required) => {
    if (y - required < margin + 20) {
      addNewPage();
    }
  };

  const drawText = (text, x, yPos, size, font, color = rgb(0, 0, 0), maxWidth = null) => {
    if (!text) return yPos;
    const actualMaxWidth = maxWidth || contentWidth;
    const words = text.toString().split(' ');
    let line = '';
    let lineY = yPos;

    for (let word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      
      if (testWidth > actualMaxWidth && line) {
        page.drawText(line, { x, y: lineY, size, font, color });
        line = word;
        lineY -= size + 3;
        checkSpace(size + 3);
      } else {
        line = testLine;
      }
    }
    
    if (line) {
      page.drawText(line, { x, y: lineY, size, font, color });
      return lineY - size - 3;
    }
    return lineY;
  };

  const drawCenteredText = (text, yPos, size, font, color = rgb(0, 0, 0)) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    const x = margin + (contentWidth - textWidth) / 2;
    page.drawText(text, { x, y: yPos, size, font, color });
    return yPos - size - 3;
  };

  const drawLine = (x1, y1, x2, y2, color, thickness = 1) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness,
      color,
    });
  };

  // ==================== HEADER (CENTERED) ====================
  checkSpace(90);
  y = drawCenteredText(cvData.personal?.fullName || 'Your Name', y, 22, timesRomanBold, primaryColor);
  y -= 8;

  // Contact - Centered
  const contactItems = [
    cvData.personal?.email,
    cvData.personal?.phone,
    cvData.personal?.location,
  ].filter(Boolean);

  contactItems.forEach(item => {
    y = drawCenteredText(item, y, 10, timesRoman, rgb(0.2, 0.2, 0.2));
    y -= 2;
  });

  if (cvData.personal?.linkedin) {
    y = drawCenteredText(cvData.personal.linkedin, y, 10, timesRoman, primaryColor);
    y -= 4;
  }

  drawLine(margin, y, pageWidth - margin, y, primaryColor, 2);
  y -= 18;

  // ==================== SECTIONS ====================
  // Professional Summary
  if (cvData.personal?.summary) {
    checkSpace(50);
    y = drawCenteredText('Professional Summary', y, 12, timesRomanBold, primaryColor);
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1);
    y -= 12;
    y = drawText(cvData.personal.summary, margin, y, 10, timesRoman, rgb(0.2, 0.2, 0.2), contentWidth);
    y -= 16;
  }

  // Education
  const hasEducation = cvData.education?.some(edu => edu.institution || edu.degree);
  if (hasEducation) {
    checkSpace(50);
    y = drawCenteredText('Education', y, 12, timesRomanBold, primaryColor);
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1);
    y -= 12;

    cvData.education.forEach((edu, idx) => {
      if (edu.institution || edu.degree) {
        checkSpace(40);
        
        // Degree
        const degreeText = edu.degree && edu.field 
          ? `${edu.degree} in ${edu.field}`
          : edu.degree || edu.field || 'Degree';
        
        page.drawText(degreeText, {
          x: margin,
          y: y,
          size: 10.5,
          font: timesRomanBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        // Dates (right aligned)
        if (edu.startDate || edu.endDate) {
          const dateText = `${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`;
          const dateWidth = timesRoman.widthOfTextAtSize(dateText, 10);
          page.drawText(dateText, {
            x: pageWidth - margin - dateWidth,
            y: y,
            size: 10,
            font: timesRoman,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
        y -= 13;

        // Institution
        if (edu.institution) {
          y = drawText(edu.institution, margin, y, 10, timesRomanItalic, rgb(0.2, 0.2, 0.2), contentWidth);
          y -= 2;
        }

        // GPA
        if (edu.gpa) {
          page.drawText(`GPA: ${edu.gpa}`, {
            x: margin,
            y: y,
            size: 10,
            font: timesRoman,
            color: rgb(0.3, 0.3, 0.3),
          });
          y -= 12;
        }

        // Description
        if (edu.description) {
          y = drawText(edu.description, margin, y, 10, timesRoman, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 4;
        }

        y -= idx < cvData.education.length - 1 ? 10 : 6;
      }
    });

    y -= 12;
  }

  // Experience
  const hasExperience = cvData.experience?.some(exp => exp.company || exp.position);
  if (hasExperience) {
    checkSpace(50);
    y = drawCenteredText('Professional Experience', y, 12, timesRomanBold, primaryColor);
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1);
    y -= 12;

    cvData.experience.forEach((exp, idx) => {
      if (exp.company || exp.position) {
        checkSpace(40);
        
        // Position
        page.drawText(exp.position || 'Position', {
          x: margin,
          y: y,
          size: 10.5,
          font: timesRomanBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        // Dates (right aligned)
        if (exp.startDate || exp.endDate || exp.isCurrentRole) {
          const dateText = `${formatDate(exp.startDate)} - ${exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}`;
          const dateWidth = timesRoman.widthOfTextAtSize(dateText, 10);
          page.drawText(dateText, {
            x: pageWidth - margin - dateWidth,
            y: y,
            size: 10,
            font: timesRoman,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
        y -= 13;

        // Company
        if (exp.company) {
          const companyText = exp.location ? `${exp.company} • ${exp.location}` : exp.company;
          y = drawText(companyText, margin, y, 10, timesRomanItalic, rgb(0.2, 0.2, 0.2), contentWidth);
          y -= 2;
        }

        // Description
        if (exp.description) {
          const lines = exp.description.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            checkSpace(15);
            const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
            if (cleanLine) {
              y = drawText(`• ${cleanLine}`, margin, y, 10, timesRoman, rgb(0.3, 0.3, 0.3), contentWidth);
              y -= 2;
            }
          });
          y -= 4;
        }

        y -= idx < cvData.experience.length - 1 ? 10 : 6;
      }
    });

    y -= 12;
  }

  // Projects
  const hasProjects = cvData.projects?.some(proj => proj.name);
  if (hasProjects) {
    checkSpace(50);
    y = drawCenteredText('Projects', y, 12, timesRomanBold, primaryColor);
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1);
    y -= 12;

    cvData.projects.forEach((proj, idx) => {
      if (proj.name) {
        checkSpace(40);
        
        page.drawText(proj.name, {
          x: margin,
          y: y,
          size: 10.5,
          font: timesRomanBold,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= 13;

        if (proj.technologies) {
          y = drawText(`Technologies: ${proj.technologies}`, margin, y, 10, timesRomanItalic, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 2;
        }

        if (proj.description) {
          y = drawText(proj.description, margin, y, 10, timesRoman, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 4;
        }

        if (proj.githubUrl || proj.liveUrl) {
          if (proj.githubUrl) {
            y = drawText(`GitHub: ${proj.githubUrl}`, margin, y, 9, timesRoman, primaryColor, contentWidth);
            y -= 2;
          }
          if (proj.liveUrl) {
            y = drawText(`Live: ${proj.liveUrl}`, margin, y, 9, timesRoman, primaryColor, contentWidth);
            y -= 2;
          }
          y -= 4;
        }

        y -= idx < cvData.projects.length - 1 ? 10 : 6;
      }
    });

    y -= 12;
  }

  // Skills
  const hasSkills = cvData.skills?.some(s => s.skills?.length > 0);
  if (hasSkills) {
    checkSpace(50);
    y = drawCenteredText('Technical Skills', y, 12, timesRomanBold, primaryColor);
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1);
    y -= 12;

    cvData.skills.forEach((category, idx) => {
      if (category.skills?.length > 0) {
        checkSpace(20);
        const categoryName = category.name || category.categoryName || 'Skills';
        const skillsText = `${categoryName}: ${category.skills.join(', ')}`;
        y = drawText(skillsText, margin, y, 10, timesRoman, rgb(0.2, 0.2, 0.2), contentWidth);
        y -= idx < cvData.skills.length - 1 ? 6 : 4;
      }
    });

    y -= 12;
  }

  // Achievements
  const hasAchievements = cvData.achievements?.some(ach => ach.title);
  if (hasAchievements) {
    checkSpace(50);
    y = drawCenteredText('Achievements', y, 12, timesRomanBold, primaryColor);
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1);
    y -= 12;

    cvData.achievements.forEach((ach, idx) => {
      if (ach.title) {
        checkSpace(35);
        
        page.drawText(ach.title, {
          x: margin,
          y: y,
          size: 10.5,
          font: timesRomanBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        if (ach.date) {
          const dateWidth = timesRoman.widthOfTextAtSize(ach.date, 10);
          page.drawText(ach.date, {
            x: pageWidth - margin - dateWidth,
            y: y,
            size: 10,
            font: timesRoman,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
        y -= 13;

        if (ach.organization) {
          const orgText = ach.type ? `${ach.organization} • ${ach.type}` : ach.organization;
          y = drawText(orgText, margin, y, 10, timesRoman, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 2;
        }

        if (ach.description) {
          y = drawText(ach.description, margin, y, 10, timesRoman, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 4;
        }

        y -= idx < cvData.achievements.length - 1 ? 10 : 6;
      }
    });

    y -= 12;
  }

  // Volunteer
  const hasVolunteer = cvData.volunteer?.some(vol => vol.organization || vol.role);
  if (hasVolunteer) {
    checkSpace(50);
    y = drawCenteredText('Volunteer Experience', y, 12, timesRomanBold, primaryColor);
    y -= 4;
    drawLine(margin, y, pageWidth - margin, y, primaryColor, 1);
    y -= 12;

    cvData.volunteer.forEach((vol, idx) => {
      if (vol.organization || vol.role) {
        checkSpace(35);
        
        page.drawText(vol.role || 'Volunteer', {
          x: margin,
          y: y,
          size: 10.5,
          font: timesRomanBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        if (vol.startDate || vol.endDate) {
          const dateText = `${formatDate(vol.startDate)} - ${formatDate(vol.endDate)}`;
          const dateWidth = timesRoman.widthOfTextAtSize(dateText, 10);
          page.drawText(dateText, {
            x: pageWidth - margin - dateWidth,
            y: y,
            size: 10,
            font: timesRoman,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
        y -= 13;

        if (vol.organization) {
          const orgText = vol.location ? `${vol.organization} • ${vol.location}` : vol.organization;
          y = drawText(orgText, margin, y, 10, timesRomanItalic, rgb(0.2, 0.2, 0.2), contentWidth);
          y -= 2;
        }

        if (vol.description) {
          y = drawText(vol.description, margin, y, 10, timesRoman, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 4;
        }

        if (vol.impact) {
          y = drawText(`Impact: ${vol.impact}`, margin, y, 10, timesRomanItalic, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 4;
        }

        y -= idx < cvData.volunteer.length - 1 ? 10 : 6;
      }
    });
  }

  return await pdfDoc.save();
}

// ==================== MINIMAL TEMPLATE ====================
async function generateMinimalTemplate(pdfDoc, cvData, fonts) {
  const { rgb } = await import('pdf-lib');
  const { helvetica, helveticaBold, helveticaOblique, primaryColor, formatDate } = fonts;
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - (2 * margin);
  
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const addNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const checkSpace = (required) => {
    if (y - required < margin + 20) {
      addNewPage();
    }
  };

  const drawText = (text, x, yPos, size, font, color = rgb(0, 0, 0), maxWidth = null) => {
    if (!text) return yPos;
    const actualMaxWidth = maxWidth || contentWidth;
    const words = text.toString().split(' ');
    let line = '';
    let lineY = yPos;

    for (let word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      
      if (testWidth > actualMaxWidth && line) {
        page.drawText(line, { x, y: lineY, size, font, color });
        line = word;
        lineY -= size + 3;
        checkSpace(size + 3);
      } else {
        line = testLine;
      }
    }
    
    if (line) {
      page.drawText(line, { x, y: lineY, size, font, color });
      return lineY - size - 3;
    }
    return lineY;
  };

  // ==================== HEADER ====================
  checkSpace(70);
  page.drawText(cvData.personal?.fullName || 'Your Name', {
    x: margin,
    y: y,
    size: 24,
    font: helvetica,
    color: primaryColor,
  });
  y -= 28;

  // Contact Information
  const contactItems = [
    cvData.personal?.email,
    cvData.personal?.phone,
    cvData.personal?.location,
  ].filter(Boolean);

  contactItems.forEach(item => {
    page.drawText(item, {
      x: margin,
      y: y,
      size: 9,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 12;
  });

  if (cvData.personal?.linkedin) {
    page.drawText(cvData.personal.linkedin, {
      x: margin,
      y: y,
      size: 9,
      font: helvetica,
      color: primaryColor,
    });
    y -= 16;
  } else {
    y -= 4;
  }

  // ==================== SUMMARY ====================
  if (cvData.personal?.summary) {
    checkSpace(50);
    page.drawText('Summary', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 14;
    y = drawText(cvData.personal.summary, margin, y, 9.5, helvetica, rgb(0.2, 0.2, 0.2), contentWidth);
    y -= 16;
  }

  // ==================== EDUCATION ====================
  const hasEducation = cvData.education?.some(edu => edu.institution || edu.degree);
  if (hasEducation) {
    checkSpace(50);
    page.drawText('Education', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 14;

    cvData.education.forEach((edu, idx) => {
      if (edu.institution || edu.degree) {
        checkSpace(40);
        
        const degreeText = edu.degree && edu.field 
          ? `${edu.degree} in ${edu.field}`
          : edu.degree || edu.field || 'Degree';
        
        page.drawText(degreeText, {
          x: margin,
          y: y,
          size: 10,
          font: helveticaBold,
          color: rgb(0.15, 0.15, 0.15),
        });

        if (edu.startDate || edu.endDate) {
          const dateText = `${formatDate(edu.startDate)} — ${formatDate(edu.endDate)}`;
          const dateWidth = helvetica.widthOfTextAtSize(dateText, 9);
          page.drawText(dateText, {
            x: pageWidth - margin - dateWidth,
            y: y,
            size: 9,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        y -= 12;

        if (edu.institution) {
          y = drawText(edu.institution, margin, y, 9, helvetica, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 2;
        }

        if (edu.gpa) {
          page.drawText(`GPA: ${edu.gpa}`, {
            x: margin,
            y: y,
            size: 9,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
          y -= 10;
        }

        y -= idx < cvData.education.length - 1 ? 8 : 4;
      }
    });

    y -= 12;
  }

  // ==================== EXPERIENCE ====================
  const hasExperience = cvData.experience?.some(exp => exp.company || exp.position);
  if (hasExperience) {
    checkSpace(50);
    page.drawText('Experience', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 14;

    cvData.experience.forEach((exp, idx) => {
      if (exp.company || exp.position) {
        checkSpace(40);
        
        page.drawText(exp.position || 'Position', {
          x: margin,
          y: y,
          size: 10,
          font: helveticaBold,
          color: rgb(0.15, 0.15, 0.15),
        });

        if (exp.startDate || exp.endDate || exp.isCurrentRole) {
          const dateText = `${formatDate(exp.startDate)} — ${exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}`;
          const dateWidth = helvetica.widthOfTextAtSize(dateText, 9);
          page.drawText(dateText, {
            x: pageWidth - margin - dateWidth,
            y: y,
            size: 9,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        y -= 12;

        if (exp.company) {
          y = drawText(exp.company, margin, y, 9, helvetica, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 4;
        }

        if (exp.description) {
          const lines = exp.description.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            checkSpace(12);
            const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
            if (cleanLine) {
              y = drawText(`• ${cleanLine}`, margin, y, 9, helvetica, rgb(0.3, 0.3, 0.3), contentWidth);
              y -= 2;
            }
          });
        }

        y -= idx < cvData.experience.length - 1 ? 8 : 4;
      }
    });

    y -= 12;
  }

  // ==================== PROJECTS ====================
  const hasProjects = cvData.projects?.some(proj => proj.name);
  if (hasProjects) {
    checkSpace(50);
    page.drawText('Projects', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 14;

    cvData.projects.forEach((proj, idx) => {
      if (proj.name) {
        checkSpace(40);
        
        page.drawText(proj.name, {
          x: margin,
          y: y,
          size: 10,
          font: helveticaBold,
          color: rgb(0.15, 0.15, 0.15),
        });
        y -= 12;

        if (proj.technologies) {
          y = drawText(proj.technologies, margin, y, 9, helveticaOblique, rgb(0.35, 0.35, 0.35), contentWidth);
          y -= 4;
        }

        if (proj.description) {
          y = drawText(proj.description, margin, y, 9, helvetica, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 4;
        }

        if (proj.githubUrl || proj.liveUrl) {
          if (proj.githubUrl) {
            y = drawText(`GitHub: ${proj.githubUrl}`, margin, y, 8.5, helvetica, primaryColor, contentWidth);
            y -= 2;
          }
          if (proj.liveUrl) {
            y = drawText(`Live: ${proj.liveUrl}`, margin, y, 8.5, helvetica, primaryColor, contentWidth);
            y -= 2;
          }
        }

        y -= idx < cvData.projects.length - 1 ? 8 : 4;
      }
    });

    y -= 12;
  }

  // ==================== SKILLS ====================
  const hasSkills = cvData.skills?.some(s => s.skills?.length > 0);
  if (hasSkills) {
    checkSpace(50);
    page.drawText('Skills', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 14;

    cvData.skills.forEach((category, idx) => {
      if (category.skills?.length > 0) {
        checkSpace(18);
        const categoryName = category.name || category.categoryName || 'Skills';
        const skillsText = `${categoryName}: ${category.skills.join(', ')}`;
        y = drawText(skillsText, margin, y, 9, helvetica, rgb(0.25, 0.25, 0.25), contentWidth);
        y -= idx < cvData.skills.length - 1 ? 4 : 2;
      }
    });

    y -= 12;
  }

  // ==================== ACHIEVEMENTS ====================
  const hasAchievements = cvData.achievements?.some(ach => ach.title);
  if (hasAchievements) {
    checkSpace(50);
    page.drawText('Achievements', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 14;

    cvData.achievements.forEach((ach, idx) => {
      if (ach.title) {
        checkSpace(30);
        
        page.drawText(ach.title, {
          x: margin,
          y: y,
          size: 10,
          font: helveticaBold,
          color: rgb(0.15, 0.15, 0.15),
        });

        if (ach.date) {
          const dateWidth = helvetica.widthOfTextAtSize(ach.date, 9);
          page.drawText(ach.date, {
            x: pageWidth - margin - dateWidth,
            y: y,
            size: 9,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        y -= 12;

        if (ach.organization) {
          y = drawText(ach.organization, margin, y, 9, helvetica, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 2;
        }

        if (ach.description) {
          y = drawText(ach.description, margin, y, 9, helvetica, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 4;
        }

        y -= idx < cvData.achievements.length - 1 ? 8 : 4;
      }
    });

    y -= 12;
  }

  // ==================== VOLUNTEER ====================
  const hasVolunteer = cvData.volunteer?.some(vol => vol.organization || vol.role);
  if (hasVolunteer) {
    checkSpace(50);
    page.drawText('Volunteer', {
      x: margin,
      y: y,
      size: 11,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 14;

    cvData.volunteer.forEach((vol, idx) => {
      if (vol.organization || vol.role) {
        checkSpace(35);
        
        page.drawText(vol.role || 'Volunteer', {
          x: margin,
          y: y,
          size: 10,
          font: helveticaBold,
          color: rgb(0.15, 0.15, 0.15),
        });

        if (vol.startDate || vol.endDate) {
          const dateText = `${formatDate(vol.startDate)} — ${formatDate(vol.endDate)}`;
          const dateWidth = helvetica.widthOfTextAtSize(dateText, 9);
          page.drawText(dateText, {
            x: pageWidth - margin - dateWidth,
            y: y,
            size: 9,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        y -= 12;

        if (vol.organization) {
          y = drawText(vol.organization, margin, y, 9, helvetica, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 4;
        }

        if (vol.description) {
          y = drawText(vol.description, margin, y, 9, helvetica, rgb(0.3, 0.3, 0.3), contentWidth);
          y -= 4;
        }

        if (vol.impact) {
          y = drawText(`Impact: ${vol.impact}`, margin, y, 9, helveticaOblique, rgb(0.35, 0.35, 0.35), contentWidth);
          y -= 4;
        }

        y -= idx < cvData.volunteer.length - 1 ? 8 : 4;
      }
    });
  }

  return await pdfDoc.save();
}