// app/api/cv/export-pdf/route.js - PDF EXPORT
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import puppeteer from 'puppeteer';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cvId = searchParams.get("cvId");
    const versionId = searchParams.get("versionId");

    let cvData;
    let templateId = "modern";

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

    } else if (cvId) {
      // Export current CV
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
        'Content-Disposition': `attachment; filename=CV-${Date.now()}.pdf`,
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
          ${cvData.personal?.email || ''} | 
          ${cvData.personal?.phone || ''} | 
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

      ${cvData.experience?.length > 0 ? `
      <div class="section">
        <div class="section-title">Experience</div>
        ${cvData.experience.map(exp => `
          <div class="entry">
            <div class="entry-title">${exp.position || exp.company}</div>
            <div class="entry-subtitle">
              ${exp.company} | ${exp.location || ''} | 
              ${exp.startDate ? new Date(exp.startDate).getFullYear() : ''} - 
              ${exp.isCurrent ? 'Present' : (exp.endDate ? new Date(exp.endDate).getFullYear() : '')}
            </div>
            ${exp.description ? `<div class="entry-description">${exp.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${cvData.education?.length > 0 ? `
      <div class="section">
        <div class="section-title">Education</div>
        ${cvData.education.map(edu => `
          <div class="entry">
            <div class="entry-title">${edu.degree || edu.institution}</div>
            <div class="entry-subtitle">
              ${edu.institution} | ${edu.fieldOfStudy || edu.field || ''} 
              ${edu.gpa ? `| GPA: ${edu.gpa}` : ''}
            </div>
            ${edu.description ? `<div class="entry-description">${edu.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${cvData.skills?.length > 0 ? `
      <div class="section">
        <div class="section-title">Skills</div>
        <div class="skills-grid">
          ${cvData.skills.map(skillGroup => `
            <div>
              <span class="skill-category">${skillGroup.categoryName || skillGroup.name}:</span>
              <span class="skill-list">${(skillGroup.skills || []).join(', ')}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${cvData.projects?.length > 0 ? `
      <div class="section">
        <div class="section-title">Projects</div>
        ${cvData.projects.map(proj => `
          <div class="entry">
            <div class="entry-title">${proj.name}</div>
            <div class="entry-subtitle">
              ${(proj.technologies || []).join(', ')}
            </div>
            ${proj.description ? `<div class="entry-description">${proj.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
    </body>
    </html>
  `;
}