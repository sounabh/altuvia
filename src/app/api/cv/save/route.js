// ================================================================================
// FILE: app/api/cv/save/route.js
// PURPOSE: Handle CV creation, loading, and updates with version management
// ================================================================================

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

// ================================================================================
// GET HANDLER - Load CV Data
// ================================================================================
/**
 * Retrieves a specific CV with all related sections
 * @param {Request} request - Contains cvId and userEmail as query params
 * @returns {Response} CV data with all sections ordered by displayOrder
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Single combined query (user + CV) instead of 2 separate queries
 * - Select only required fields to reduce payload size
 */
export async function GET(request) {
  try {
    // ========================================
    // 1. EXTRACT & VALIDATE REQUEST PARAMS
    // ========================================
    const { searchParams } = new URL(request.url);
    const cvId = searchParams.get("cvId");
    const userEmail = searchParams.get("userEmail");

    // Validate authentication
    if (!userEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Validate CV ID
    if (!cvId) {
      return NextResponse.json(
        { error: "CV ID is required" },
        { status: 400 }
      );
    }

    // ========================================
    // 2. OPTIMIZED: SINGLE QUERY FOR USER + CV
    // ========================================
    // Instead of 2 queries (findUser, then findCV), use 1 query with nested where
    const cv = await prisma.cV.findFirst({
      where: {
        id: cvId,
        user: {
          email: userEmail, // Validate user ownership in same query
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        templateId: true,
        colorScheme: true,
        createdAt: true,
        updatedAt: true,
        personalInfo: true,
        educations: {
          orderBy: { displayOrder: 'asc' },
          // Select only necessary fields to reduce payload
          select: {
            id: true,
            institution: true,
            degree: true,
            fieldOfStudy: true,
            location: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
            gpa: true,
            gpaScale: true,
            description: true,
            coursework: true,
            honors: true,
            displayOrder: true,
          },
        },
        experiences: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            company: true,
            position: true,
            location: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
            description: true,
            achievements: true,
            skillsUsed: true,
            displayOrder: true,
          },
        },
        projects: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            technologies: true,
            startDate: true,
            endDate: true,
            githubUrl: true,
            liveUrl: true,
            demoUrl: true,
            achievements: true,
            displayOrder: true,
            isFeatured: true,
          },
        },
        skills: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            categoryName: true,
            skills: true,
            proficiencyLevel: true,
            displayOrder: true,
          },
        },
        achievements: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            title: true,
            organization: true,
            type: true,
            date: true,
            description: true,
            impact: true,
            displayOrder: true,
          },
        },
        volunteers: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            organization: true,
            role: true,
            location: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
            description: true,
            activities: true,
            impact: true,
            displayOrder: true,
          },
        },
      },
    });

    // Validate CV existence and ownership
    if (!cv) {
      return NextResponse.json(
        { 
          success: false,
          error: "CV not found or access denied",
          code: "CV_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // ========================================
    // 3. RETURN FORMATTED CV DATA
    // ========================================
    return NextResponse.json({
      success: true,
      cv: {
        id: cv.id,
        cvNumber: cv.slug,
        title: cv.title,
        templateId: cv.templateId,
        colorScheme: cv.colorScheme,
        personalInfo: cv.personalInfo,
        educations: cv.educations,
        experiences: cv.experiences,
        projects: cv.projects,
        skills: cv.skills,
        achievements: cv.achievements,
        volunteers: cv.volunteers,
        createdAt: cv.createdAt,
        updatedAt: cv.updatedAt,
      },
    });

  } catch (error) {
    console.error("CV Load Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to load CV",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ================================================================================
// POST HANDLER - Save/Update CV
// ================================================================================
/**
 * Creates a new CV or updates an existing one with version tracking
 * @param {Request} request - Contains CV data, template settings, and version info
 * @returns {Response} Created/updated CV with metadata
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Parallel delete operations using Promise.all
 * - Batch inserts with createMany instead of individual creates
 * - Single transaction for version creation
 * - Reduced nested includes (only fetch what's needed)
 */
export async function POST(request) {
  try {
    // ========================================
    // 1. AUTHENTICATE USER
    // ========================================
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const userEmail = body.userEmail || session?.user?.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    // ========================================
    // 2. FIND OR CREATE USER
    // ========================================
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, email: true, name: true }, // Only fetch needed fields
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: body.userName || userEmail.split("@")[0],
        },
        select: { id: true, email: true, name: true },
      });
    }

    // ========================================
    // 3. EXTRACT REQUEST DATA
    // ========================================
    const { 
      cvData, 
      selectedTemplate, 
      themeColor, 
      cvTitle, 
      cvId, 
      versionInfo 
    } = body;
    let { cvNumber } = body;

    let cv;
    let isNewCV = false;
    let shouldCreateNewCV = false;

    // ========================================
    // 4. VALIDATE EXISTING CV (if cvId provided)
    // ========================================
    if (cvId) {
      const existingCV = await prisma.cV.findFirst({
        where: { 
          id: cvId,
          userId: user.id 
        },
        select: { id: true }, // Only need to verify existence
      });

      if (!existingCV) {
        console.log(`CV ${cvId} not found or doesn't belong to user ${user.id}. Creating new CV instead.`);
        shouldCreateNewCV = true;
      }
    }

    // ========================================
    // 5. CREATE NEW CV
    // ========================================
    if (!cvId || shouldCreateNewCV) {
      isNewCV = true;

      // ----------------------------------------
      // 5a. Generate Unique Slug
      // ----------------------------------------
      let cvSlug = cvNumber || `cv-${Date.now()}`;
      let slugAttempt = 0;
      let isSlugUnique = false;

      // Try up to 10 times to find unique slug
      while (!isSlugUnique && slugAttempt < 10) {
        const existingCVWithSlug = await prisma.cV.findUnique({
          where: { slug: cvSlug },
          select: { id: true }, // Only check existence
        });

        if (!existingCVWithSlug) {
          isSlugUnique = true;
        } else {
          slugAttempt++;
          const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
          cvSlug = `${cvNumber || `cv-${Date.now()}`}-${randomSuffix}`;
        }
      }

      // Fallback to timestamp + random string
      if (!isSlugUnique) {
        cvSlug = `cv-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      }

      // ----------------------------------------
      // 5b. OPTIMIZED: Create CV with All Sections
      // ----------------------------------------
      cv = await prisma.cV.create({
        data: {
          userId: user.id,
          title: cvTitle || `CV #${cvSlug}`,
          slug: cvSlug,
          templateId: selectedTemplate || "modern",
          colorScheme: themeColor || "#1e40af",
          isActive: false,
          isPublic: false,

          // Personal Information
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

          // Education Section
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

          // Experience Section
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

          // Projects Section
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

          // Skills Section
          skills: {
            create: cvData.skills?.map((skillGroup, index) => ({
              categoryName: skillGroup.name || "",
              // Extract skill names from objects or strings
              skills: Array.isArray(skillGroup.skills) 
                ? skillGroup.skills.map(skill => 
                    typeof skill === 'string' ? skill : skill.name
                  ).filter(Boolean)
                : [],
              displayOrder: index,
            })) || [],
          },

          // Achievements Section
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

          // Volunteer Section
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
        select: {
          // Only return essential fields, not all relations
          id: true,
          slug: true,
          title: true,
          templateId: true,
          colorScheme: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // ----------------------------------------
      // 5c. Create Initial Version Snapshot
      // ----------------------------------------
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

      // ----------------------------------------
      // 5d. Return Success Response
      // ----------------------------------------
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

    // ========================================
    // 6. UPDATE EXISTING CV
    // ========================================

    // ----------------------------------------
    // 6a. Update CV Metadata
    // ----------------------------------------
    cv = await prisma.cV.update({
      where: { id: cvId },
      data: {
        templateId: selectedTemplate || undefined,
        colorScheme: themeColor || "#1e40af",
        updatedAt: new Date(),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        templateId: true,
        colorScheme: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // ----------------------------------------
    // 6b. OPTIMIZED: Parallel Delete Operations
    // ----------------------------------------
    await Promise.all([
      prisma.cVEducation.deleteMany({ where: { cvId } }),
      prisma.cVExperience.deleteMany({ where: { cvId } }),
      prisma.cVProject.deleteMany({ where: { cvId } }),
      prisma.cVSkill.deleteMany({ where: { cvId } }),
      prisma.cVAchievement.deleteMany({ where: { cvId } }),
      prisma.cVVolunteer.deleteMany({ where: { cvId } }),
    ]);

    // ----------------------------------------
    // 6c. Update Personal Info
    // ----------------------------------------
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

    // ----------------------------------------
    // 6d. OPTIMIZED: Parallel Batch Inserts
    // ----------------------------------------
    const insertOperations = [];

    // Education Section
    if (cvData.education?.length > 0) {
      insertOperations.push(
        prisma.cVEducation.createMany({
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
        })
      );
    }

    // Experience Section
    if (cvData.experience?.length > 0) {
      insertOperations.push(
        prisma.cVExperience.createMany({
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
        })
      );
    }

    // Projects Section
    if (cvData.projects?.length > 0) {
      insertOperations.push(
        prisma.cVProject.createMany({
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
        })
      );
    }

    // Skills Section
    if (cvData.skills?.length > 0) {
      insertOperations.push(
        prisma.cVSkill.createMany({
          data: cvData.skills.map((skillGroup, index) => ({
            cvId,
            categoryName: skillGroup.name || "",
            // Extract skill names from objects or strings
            skills: Array.isArray(skillGroup.skills)
              ? skillGroup.skills.map(skill => 
                  typeof skill === 'string' ? skill : skill.name
                ).filter(Boolean)
              : [],
            displayOrder: index,
          })),
        })
      );
    }

    // Achievements Section
    if (cvData.achievements?.length > 0) {
      insertOperations.push(
        prisma.cVAchievement.createMany({
          data: cvData.achievements.map((ach, index) => ({
            cvId,
            title: ach.title || "",
            organization: ach.organization || "",
            type: ach.type || "academic",
            date: ach.date ? new Date(ach.date) : null,
            description: ach.description || "",
            displayOrder: index,
          })),
        })
      );
    }

    // Volunteer Section
    if (cvData.volunteer?.length > 0) {
      insertOperations.push(
        prisma.cVVolunteer.createMany({
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
        })
      );
    }

    // Execute all inserts in parallel
    await Promise.all(insertOperations);

    // ----------------------------------------
    // 6e. Create Version Snapshot
    // ----------------------------------------
    if (versionInfo) {
      // Get last version number
      const lastVersion = await prisma.cVVersion.findFirst({
        where: { cvId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true }, // Only need version number
      });

      const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

      // Create new version
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

    // ----------------------------------------
    // 6f. Return Success Response
    // ----------------------------------------
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