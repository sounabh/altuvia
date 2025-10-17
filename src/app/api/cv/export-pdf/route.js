// app/api/cv/export-pdf/route.js - FIXED PDF EXPORT
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import puppeteer from 'puppeteer';

// POST: Export current preview (doesn't require saved CV)
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

    // Generate HTML from current preview data
    const html = generateCVHTML(cvData, templateId || 'modern');

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });
    
    await browser.close();

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=CV-${cvNumber || Date.now()}.pdf`,
      },
    });

  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to export PDF" },
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
    let templateId = "modern";
    let fileName = `CV-${Date.now()}`;

    if (versionId) {
      // Export specific version
      const version = await prisma.cVVersion.findUnique({
        where: { id: versionId },
      });

      if (!version) {
        return NextResponse.json(
          { error: "Version not found" },
          { status: 404 }
        );
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
      templateId = version.templateId;
      fileName = `CV-${version.versionLabel.replace(/\s+/g, '-')}`;

    } else if (cvId) {
      // Export current CV from database
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
        return NextResponse.json(
          { error: "CV not found" },
          { status: 404 }
        );
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
      templateId = cv.templateId;
      fileName = `CV-${cv.cvNumber}`;
    } else {
      return NextResponse.json(
        { error: "CV ID or Version ID is required" },
        { status: 400 }
      );
    }

    // Generate HTML for PDF
    const html = generateCVHTML(cvData, templateId);

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });
    
    await browser.close();

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${fileName}.pdf`,
      },
    });

  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to export PDF" },
      { status: 500 }
    );
  }
}

function generateCVHTML(cvData, templateId) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #333;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .name {
          font-size: 28pt;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
        .contact-info {
          font-size: 10pt;
          color: #666;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 14pt;
          font-weight: bold;
          color: #1e40af;
          border-bottom: 2px solid #93c5fd;
          padding-bottom: 5px;
          margin-bottom: 15px;
          text-transform: uppercase;
        }
        .entry {
          margin-bottom: 15px;
        }
        .entry-title {
          font-weight: bold;
          font-size: 12pt;
          color: #1f2937;
        }
        .entry-subtitle {
          font-style: italic;
          color: #4b5563;
          margin-bottom: 5px;
        }
        .entry-description {
          color: #374151;
          text-align: justify;
          white-space: pre-wrap;
        }
        .skills-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .skill-category {
          font-weight: bold;
          color: #1e40af;
        }
        .skill-list {
          color: #4b5563;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">${cvData.personal?.fullName || 'Your Name'}</div>
        <div class="contact-info">
          ${cvData.personal?.email || ''} ${cvData.personal?.email && (cvData.personal?.phone || cvData.personal?.location) ? '|' : ''} 
          ${cvData.personal?.phone || ''} ${cvData.personal?.phone && cvData.personal?.location ? '|' : ''} 
          ${cvData.personal?.location || ''}
          ${cvData.personal?.linkedin ? `<br>LinkedIn: ${cvData.personal.linkedin}` : ''}
        </div>
      </div>

      ${cvData.personal?.summary ? `
      <div class="section">
        <div class="section-title">Professional Summary</div>
        <div class="entry-description">${cvData.personal.summary}</div>
      </div>
      ` : ''}

      ${cvData.experience?.length > 0 && cvData.experience.some(exp => exp.company || exp.position) ? `
      <div class="section">
        <div class="section-title">Experience</div>
        ${cvData.experience.filter(exp => exp.company || exp.position).map(exp => `
          <div class="entry">
            <div class="entry-title">${exp.position || exp.company || 'Position'}</div>
            <div class="entry-subtitle">
              ${exp.company || ''} ${exp.location ? `| ${exp.location}` : ''} ${exp.startDate || exp.endDate ? '|' : ''} 
              ${exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - 
              ${exp.isCurrentRole ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '')}
            </div>
            ${exp.description ? `<div class="entry-description">${exp.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${cvData.education?.length > 0 && cvData.education.some(edu => edu.institution || edu.degree) ? `
      <div class="section">
        <div class="section-title">Education</div>
        ${cvData.education.filter(edu => edu.institution || edu.degree).map(edu => `
          <div class="entry">
            <div class="entry-title">${edu.degree || 'Degree'} ${edu.field || edu.fieldOfStudy ? `in ${edu.field || edu.fieldOfStudy}` : ''}</div>
            <div class="entry-subtitle">
              ${edu.institution || ''} 
              ${edu.gpa ? `| GPA: ${edu.gpa}` : ''}
              ${edu.startDate || edu.endDate ? '|' : ''}
              ${edu.startDate ? new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - 
              ${edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
            </div>
            ${edu.description ? `<div class="entry-description">${edu.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${cvData.skills?.length > 0 && cvData.skills.some(s => (s.skills || []).length > 0) ? `
      <div class="section">
        <div class="section-title">Skills</div>
        <div class="skills-grid">
          ${cvData.skills.filter(s => (s.skills || []).length > 0).map(skillGroup => `
            <div>
              <span class="skill-category">${skillGroup.categoryName || skillGroup.name || 'Skills'}:</span>
              <span class="skill-list">${(skillGroup.skills || []).join(', ')}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${cvData.projects?.length > 0 && cvData.projects.some(proj => proj.name) ? `
      <div class="section">
        <div class="section-title">Projects</div>
        ${cvData.projects.filter(proj => proj.name).map(proj => `
          <div class="entry">
            <div class="entry-title">${proj.name}</div>
            ${proj.technologies ? `<div class="entry-subtitle">${proj.technologies}</div>` : ''}
            ${proj.description ? `<div class="entry-description">${proj.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${cvData.achievements?.length > 0 && cvData.achievements.some(ach => ach.title) ? `
      <div class="section">
        <div class="section-title">Achievements</div>
        ${cvData.achievements.filter(ach => ach.title).map(ach => `
          <div class="entry">
            <div class="entry-title">${ach.title}</div>
            ${ach.organization ? `<div class="entry-subtitle">${ach.organization} ${ach.date ? `| ${ach.date}` : ''}</div>` : ''}
            ${ach.description ? `<div class="entry-description">${ach.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${cvData.volunteer?.length > 0 && cvData.volunteer.some(vol => vol.organization || vol.role) ? `
      <div class="section">
        <div class="section-title">Volunteer Experience</div>
        ${cvData.volunteer.filter(vol => vol.organization || vol.role).map(vol => `
          <div class="entry">
            <div class="entry-title">${vol.role || 'Volunteer'}</div>
            <div class="entry-subtitle">
              ${vol.organization || ''} ${vol.location ? `| ${vol.location}` : ''}
            </div>
            ${vol.description ? `<div class="entry-description">${vol.description}</div>` : ''}
            ${vol.impact ? `<div class="entry-description"><em>${vol.impact}</em></div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
    </body>
    </html>
  `;
}