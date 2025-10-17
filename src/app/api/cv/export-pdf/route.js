// app/api/cv/export-pdf/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST: Export current preview
export async function POST(request) {
  try {
    const body = await request.json();
    const { cvData, templateId, cvNumber } = body;

    if (!cvData) {
      return NextResponse.json(
        { error: "CV data is required" },
        { status: 400 }
      );
    }

    const pdf = await generatePDF(cvData);

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
      fileName = `CV-${cv.cvNumber}`;
    } else {
      return NextResponse.json(
        { error: "CV ID or Version ID is required" },
        { status: 400 }
      );
    }

    const pdf = await generatePDF(cvData);

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

async function generatePDF(cvData) {
  const { PDFDocument, PDFPage, PDFFont } = await import('pdf-lib');
  const { rgb } = await import('pdf-lib');

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]); // Letter size
  let yPosition = 750;

  const helvetica = await pdfDoc.embedFont((await import('pdf-lib')).StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont((await import('pdf-lib')).StandardFonts.HelveticaBold);

  const drawText = (text, size, bold = false, y = null) => {
    const font = bold ? helveticaBold : helvetica;
    const width = page.getWidth();
    const maxWidth = width - 40;

    if (y !== null) yPosition = y;

    const lines = text.split('\n');
    lines.forEach(line => {
      if (yPosition < 50) {
        page = pdfDoc.addPage([612, 792]);
        yPosition = 750;
      }
      page.drawText(line, {
        x: 20,
        y: yPosition,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= size + 5;
    });
  };

  // Header
  drawText(cvData.personal?.fullName || 'CV', 24, true);
  yPosition -= 5;

  const contactInfo = [
    cvData.personal?.email,
    cvData.personal?.phone,
    cvData.personal?.location,
  ].filter(Boolean).join(' | ');

  if (contactInfo) {
    drawText(contactInfo, 10);
  }

  if (cvData.personal?.linkedin) {
    drawText(`LinkedIn: ${cvData.personal.linkedin}`, 10);
  }

  yPosition -= 10;

  // Professional Summary
  if (cvData.personal?.summary) {
    drawText('PROFESSIONAL SUMMARY', 12, true);
    yPosition -= 3;
    drawText(cvData.personal.summary, 10);
    yPosition -= 10;
  }

  // Experience
  if (cvData.experience?.length > 0 && cvData.experience.some(exp => exp.company || exp.position)) {
    drawText('EXPERIENCE', 12, true);
    yPosition -= 3;

    cvData.experience.forEach(exp => {
      if (exp.company || exp.position) {
        drawText(exp.position || 'Position', 11, true);
        const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
        const endDate = exp.isCurrentRole ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
        drawText(`${exp.company || ''} | ${startDate} - ${endDate}`, 10);
        if (exp.description) {
          drawText(exp.description, 10);
        }
        yPosition -= 5;
      }
    });

    yPosition -= 5;
  }

  // Education
  if (cvData.education?.length > 0 && cvData.education.some(edu => edu.institution || edu.degree)) {
    drawText('EDUCATION', 12, true);
    yPosition -= 3;

    cvData.education.forEach(edu => {
      if (edu.institution || edu.degree) {
        drawText(`${edu.degree || 'Degree'} ${edu.field ? `in ${edu.field}` : ''}`, 11, true);
        const startDate = edu.startDate ? new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
        const endDate = edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
        drawText(`${edu.institution || ''} | ${startDate} - ${endDate} ${edu.gpa ? `| GPA: ${edu.gpa}` : ''}`, 10);
        if (edu.description) {
          drawText(edu.description, 10);
        }
        yPosition -= 5;
      }
    });

    yPosition -= 5;
  }

  // Skills
  if (cvData.skills?.length > 0 && cvData.skills.some(s => (s.skills || []).length > 0)) {
    drawText('SKILLS', 12, true);
    yPosition -= 3;

    cvData.skills.forEach(skillGroup => {
      if ((skillGroup.skills || []).length > 0) {
        drawText(`${skillGroup.categoryName || skillGroup.name || 'Skills'}: ${(skillGroup.skills || []).join(', ')}`, 10);
      }
    });

    yPosition -= 5;
  }

  // Projects
  if (cvData.projects?.length > 0 && cvData.projects.some(proj => proj.name)) {
    drawText('PROJECTS', 12, true);
    yPosition -= 3;

    cvData.projects.forEach(proj => {
      if (proj.name) {
        drawText(proj.name, 11, true);
        if (proj.technologies) {
          drawText(`Technologies: ${proj.technologies}`, 10);
        }
        if (proj.description) {
          drawText(proj.description, 10);
        }
        yPosition -= 5;
      }
    });

    yPosition -= 5;
  }

  // Achievements
  if (cvData.achievements?.length > 0 && cvData.achievements.some(ach => ach.title)) {
    drawText('ACHIEVEMENTS', 12, true);
    yPosition -= 3;

    cvData.achievements.forEach(ach => {
      if (ach.title) {
        drawText(ach.title, 11, true);
        if (ach.organization) {
          drawText(`${ach.organization} ${ach.date ? `| ${ach.date}` : ''}`, 10);
        }
        if (ach.description) {
          drawText(ach.description, 10);
        }
        yPosition -= 5;
      }
    });

    yPosition -= 5;
  }

  // Volunteer
  if (cvData.volunteer?.length > 0 && cvData.volunteer.some(vol => vol.organization || vol.role)) {
    drawText('VOLUNTEER EXPERIENCE', 12, true);
    yPosition -= 3;

    cvData.volunteer.forEach(vol => {
      if (vol.organization || vol.role) {
        drawText(vol.role || 'Volunteer', 11, true);
        drawText(`${vol.organization || ''} ${vol.location ? `| ${vol.location}` : ''}`, 10);
        if (vol.description) {
          drawText(vol.description, 10);
        }
        if (vol.impact) {
          drawText(`Impact: ${vol.impact}`, 10);
        }
        yPosition -= 5;
      }
    });
  }

  return await pdfDoc.save();
}