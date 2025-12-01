// app/api/cv/save/route.js - FIXED VERSION WITH VALIDATION
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const userEmail = body.userEmail || session?.user?.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: body.userName || userEmail.split("@")[0],
        },
      });
    }

    const { cvData, selectedTemplate, themeColor, cvTitle, cvId, versionInfo } = body;

    let cv;
    let isNewCV = false;
    let shouldCreateNewCV = false;

    if (cvId) {
      // VALIDATE CV EXISTS AND BELONGS TO USER
      const existingCV = await prisma.cV.findFirst({
        where: { 
          id: cvId,
          userId: user.id 
        },
      });

      if (!existingCV) {
        console.log(`CV ${cvId} not found or doesn't belong to user ${user.id}. Creating new CV instead.`);
        shouldCreateNewCV = true;
      }
    }

    // If cvId is provided but CV doesn't exist, OR if no cvId provided - create new CV
    if (!cvId || shouldCreateNewCV) {
      // CREATE NEW CV
      isNewCV = true;

      // Use the unique CV number from frontend
      const cvSlug = body.cvNumber || `cv-${Date.now()}`;

      cv = await prisma.cV.create({
        data: {
          userId: user.id,
          title: cvTitle || `CV #${cvSlug}`,
          slug: cvSlug,
          templateId: selectedTemplate || "modern",
          colorScheme: themeColor || "#1e40af",
          isActive: false,
          isPublic: false,

          personalInfo: {
            create: {
              fullName: cvData.personal?.fullName || "",
              email: cvData.personal?.email || "",
              phone: cvData.personal?.phone || "",
              location: cvData.personal?.location || "",
              website: cvData.personal?.website || "",
              linkedin: cvData.personal?.linkedin || "",
              summary: cvData.personal?.summary || "",
            },
          },

          educations: {
            create: cvData.education?.map((edu, index) => ({
              institution: edu.institution || "",
              degree: edu.degree || "",
              fieldOfStudy: edu.field || "",
              startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
              endDate: edu.endDate ? new Date(edu.endDate) : null,
              gpa: edu.gpa || null,
              description: edu.description || "",
              displayOrder: index,
            })) || [],
          },

          experiences: {
            create: cvData.experience?.map((exp, index) => ({
              company: exp.company || "",
              position: exp.position || "",
              location: exp.location || "",
              startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
              endDate: exp.endDate ? new Date(exp.endDate) : null,
              isCurrent: exp.isCurrentRole || false,
              description: exp.description || "",
              achievements: exp.description ? [exp.description] : [],
              displayOrder: index,
            })) || [],
          },

          projects: {
            create: cvData.projects?.map((proj, index) => ({
              name: proj.name || "",
              description: proj.description || "",
              technologies: proj.technologies?.split(",").map(t => t.trim()) || [],
              startDate: proj.startDate ? new Date(proj.startDate) : null,
              endDate: proj.endDate ? new Date(proj.endDate) : null,
              githubUrl: proj.githubUrl || null,
              liveUrl: proj.liveUrl || null,
              achievements: proj.achievements ? [proj.achievements] : [],
              displayOrder: index,
            })) || [],
          },

          skills: {
            create: cvData.skills?.map((skillGroup, index) => ({
              categoryName: skillGroup.name || "",
              skills: skillGroup.skills || [],
              displayOrder: index,
            })) || [],
          },

          achievements: {
            create: cvData.achievements?.map((ach, index) => ({
              title: ach.title || "",
              organization: ach.organization || "",
              type: ach.type || "academic",
              date: ach.date ? new Date(ach.date) : null,
              description: ach.description || "",
              displayOrder: index,
            })) || [],
          },

          volunteers: {
            create: cvData.volunteer?.map((vol, index) => ({
              organization: vol.organization || "",
              role: vol.role || "",
              location: vol.location || "",
              startDate: vol.startDate ? new Date(vol.startDate) : new Date(),
              endDate: vol.endDate ? new Date(vol.endDate) : null,
              description: vol.description || "",
              impact: vol.impact || null,
              displayOrder: index,
            })) || [],
          },
        },
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

      // Create initial version if versionInfo provided
      if (versionInfo) {
        await prisma.cVVersion.create({
          data: {
            cvId: cv.id,
            versionNumber: 1,
            versionLabel: versionInfo.versionName,
            changeDescription: versionInfo.description || "Initial version",
            isBookmarked: versionInfo.isBookmarked || false,
            personalInfoSnapshot: JSON.stringify(cvData.personal),
            educationSnapshot: JSON.stringify(cvData.education),
            experienceSnapshot: JSON.stringify(cvData.experience),
            projectsSnapshot: JSON.stringify(cvData.projects),
            skillsSnapshot: JSON.stringify(cvData.skills),
            achievementsSnapshot: JSON.stringify(cvData.achievements),
            volunteerSnapshot: JSON.stringify(cvData.volunteer),
            templateId: selectedTemplate,
            colorScheme: themeColor || "#1e40af",
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          message: "CV created successfully",
          isNewCV: true,
          cv: {
            id: cv.id,
            cvNumber: cv.slug,
            title: cv.title,
            slug: cv.slug,
            templateId: cv.templateId,
            colorScheme: cv.colorScheme,
            createdAt: cv.createdAt,
            updatedAt: cv.updatedAt,
          },
        },
        { status: 201 }
      );
    }

    // UPDATE EXISTING CV (only reached if CV exists and belongs to user)
    cv = await prisma.cV.update({
      where: { id: cvId },
      data: {
        templateId: selectedTemplate || undefined,
        colorScheme: themeColor || "#1e40af",
        updatedAt: new Date(),
      },
    });

    // Delete old sections
    await Promise.all([
      prisma.cVEducation.deleteMany({ where: { cvId } }),
      prisma.cVExperience.deleteMany({ where: { cvId } }),
      prisma.cVProject.deleteMany({ where: { cvId } }),
      prisma.cVSkill.deleteMany({ where: { cvId } }),
      prisma.cVAchievement.deleteMany({ where: { cvId } }),
      prisma.cVVolunteer.deleteMany({ where: { cvId } }),
    ]);

    // Update personal info
    if (cvData.personal) {
      await prisma.cVPersonalInfo.upsert({
        where: { cvId },
        create: {
          cvId,
          fullName: cvData.personal.fullName || "",
          email: cvData.personal.email || "",
          phone: cvData.personal.phone || "",
          location: cvData.personal.location || "",
          website: cvData.personal.website || "",
          linkedin: cvData.personal.linkedin || "",
          summary: cvData.personal.summary || "",
        },
        update: {
          fullName: cvData.personal.fullName || "",
          email: cvData.personal.email || "",
          phone: cvData.personal.phone || "",
          location: cvData.personal.location || "",
          website: cvData.personal.website || "",
          linkedin: cvData.personal.linkedin || "",
          summary: cvData.personal.summary || "",
        },
      });
    }

    // Recreate all sections with new data
    if (cvData.education?.length > 0) {
      await prisma.cVEducation.createMany({
        data: cvData.education.map((edu, index) => ({
          cvId,
          institution: edu.institution || "",
          degree: edu.degree || "",
          fieldOfStudy: edu.field || "",
          startDate: edu.startDate ? new Date(edu.startDate) : new Date(),
          endDate: edu.endDate ? new Date(edu.endDate) : null,
          gpa: edu.gpa || null,
          description: edu.description || "",
          displayOrder: index,
        })),
      });
    }

    if (cvData.experience?.length > 0) {
      await prisma.cVExperience.createMany({
        data: cvData.experience.map((exp, index) => ({
          cvId,
          company: exp.company || "",
          position: exp.position || "",
          location: exp.location || "",
          startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
          endDate: exp.endDate ? new Date(exp.endDate) : null,
          isCurrent: exp.isCurrentRole || false,
          description: exp.description || "",
          achievements: exp.description ? [exp.description] : [],
          displayOrder: index,
        })),
      });
    }

    if (cvData.projects?.length > 0) {
      await prisma.cVProject.createMany({
        data: cvData.projects.map((proj, index) => ({
          cvId,
          name: proj.name || "",
          description: proj.description || "",
          technologies: proj.technologies?.split(",").map(t => t.trim()) || [],
          startDate: proj.startDate ? new Date(proj.startDate) : null,
          endDate: proj.endDate ? new Date(proj.endDate) : null,
          githubUrl: proj.githubUrl || null,
          liveUrl: proj.liveUrl || null,
          achievements: proj.achievements ? [proj.achievements] : [],
          displayOrder: index,
        })),
      });
    }

    if (cvData.skills?.length > 0) {
      await prisma.cVSkill.createMany({
        data: cvData.skills.map((skillGroup, index) => ({
          cvId,
          categoryName: skillGroup.name || "",
          skills: skillGroup.skills || [],
          displayOrder: index,
        })),
      });
    }

    if (cvData.achievements?.length > 0) {
      await prisma.cVAchievement.createMany({
        data: cvData.achievements.map((ach, index) => ({
          cvId,
          title: ach.title || "",
          organization: ach.organization || "",
          type: ach.type || "academic",
          date: ach.date ? new Date(ach.date) : null,
          description: ach.description || "",
          displayOrder: index,
        })),
      });
    }

    if (cvData.volunteer?.length > 0) {
      await prisma.cVVolunteer.createMany({
        data: cvData.volunteer.map((vol, index) => ({
          cvId,
          organization: vol.organization || "",
          role: vol.role || "",
          location: vol.location || "",
          startDate: vol.startDate ? new Date(vol.startDate) : new Date(),
          endDate: vol.endDate ? new Date(vol.endDate) : null,
          description: vol.description || "",
          impact: vol.impact || null,
          displayOrder: index,
        })),
      });
    }

    // CREATE VERSION SNAPSHOT if versionInfo provided
    if (versionInfo) {
      const lastVersion = await prisma.cVVersion.findFirst({
        where: { cvId },
        orderBy: { versionNumber: 'desc' },
      });

      const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

      await prisma.cVVersion.create({
        data: {
          cvId,
          versionNumber: nextVersionNumber,
          versionLabel: versionInfo.versionName,
          changeDescription: versionInfo.description || null,
          isBookmarked: versionInfo.isBookmarked || false,
          personalInfoSnapshot: JSON.stringify(cvData.personal),
          educationSnapshot: JSON.stringify(cvData.education),
          experienceSnapshot: JSON.stringify(cvData.experience),
          projectsSnapshot: JSON.stringify(cvData.projects),
          skillsSnapshot: JSON.stringify(cvData.skills),
          achievementsSnapshot: JSON.stringify(cvData.achievements),
          volunteerSnapshot: JSON.stringify(cvData.volunteer),
          templateId: selectedTemplate,
          colorScheme: themeColor || "#1e40af",
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "CV updated successfully",
        isNewCV: false,
        cv: {
          id: cv.id,
          cvNumber: cv.slug,
          title: cv.title,
          slug: cv.slug,
          templateId: cv.templateId,
          colorScheme: cv.colorScheme,
          createdAt: cv.createdAt,
          updatedAt: cv.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CV Save Error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to save CV",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}