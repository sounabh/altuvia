// ================================================================================
// FILE: app/api/cv/save/route.js
// PURPOSE: Handle CV creation, loading, and updates with version management
// FIXED: Optional fields handling and proper data validation
// ================================================================================

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

// ================================================================================
// CONSTANTS - Define allowed options for select fields
// ================================================================================

const ALLOWED_OPTIONS = {
  degree: [
    "High School",
    "Associate",
    "Bachelor's",
    "Master's",
    "PhD",
    "Doctorate",
    "Diploma",
    "Certificate",
    "Other",
  ],
  proficiencyLevel: ["Beginner", "Intermediate", "Advanced", "Expert"],
  achievementType: [
    "academic",
    "certification",
    "competition",
    "scholarship",
    "publication",
    "award",
    "other",
  ],
  templateId: ["modern", "classic", "minimal", "professional", "creative"],
  gpaScale: ["4.0", "5.0", "10.0", "100", "Other"],
};

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

/**
 * Safely parse date string to Date object
 * @param {string|Date|null|undefined} dateValue - Date to parse
 * @returns {Date|null} Parsed date or null
 */
function parseDate(dateValue) {
  if (!dateValue || dateValue === "" || dateValue === "undefined") return null;
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  try {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Safely parse array from various input formats
 * @param {string|Array|null|undefined} value - Value to parse as array
 * @param {string} delimiter - Delimiter for string splitting
 * @returns {string[]} Parsed array (never null, always returns array)
 */
function parseArray(value, delimiter = ",") {
  if (!value || value === "" || value === "undefined") return [];
  
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") return item.name || item.value || item.toString();
        return "";
      })
      .filter((item) => item !== "" && item !== null && item !== undefined);
  }
  
  if (typeof value === "string") {
    return value
      .split(delimiter)
      .map((item) => item.trim())
      .filter((item) => item !== "");
  }
  
  return [];
}

/**
 * Safely get string value or null (for optional String? fields)
 * @param {any} value - Value to process
 * @returns {string|null} Trimmed string or null
 */
function optionalString(value) {
  if (value === null || value === undefined || value === "" || value === "undefined") {
    return null;
  }
  const str = String(value).trim();
  return str === "" ? null : str;
}

/**
 * Safely get string value or empty string (for required String fields)
 * @param {any} value - Value to process
 * @returns {string} Trimmed string or empty string
 */
function requiredString(value) {
  if (value === null || value === undefined || value === "undefined") {
    return "";
  }
  return String(value).trim();
}

/**
 * Safely get boolean value
 * @param {any} value - Value to process
 * @param {boolean} defaultValue - Default value if undefined
 * @returns {boolean} Boolean value
 */
function safeBoolean(value, defaultValue = false) {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return defaultValue;
}

/**
 * Safely get float value
 * @param {any} value - Value to process
 * @param {number|null} defaultValue - Default value if undefined
 * @returns {number|null} Float value or null
 */
function safeFloat(value, defaultValue = null) {
  if (value === null || value === undefined || value === "") return defaultValue;
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safely get integer value
 * @param {any} value - Value to process
 * @param {number} defaultValue - Default value if undefined
 * @returns {number} Integer value
 */
function safeInt(value, defaultValue = 0) {
  if (value === null || value === undefined || value === "") return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Validate option against allowed values
 * @param {string} value - Value to validate
 * @param {string[]} allowedOptions - Array of allowed options
 * @param {string|null} defaultValue - Default if not valid
 * @returns {string|null} Valid option or default
 */
function validateOption(value, allowedOptions, defaultValue = null) {
  if (!value || value === "" || value === "undefined") return defaultValue;
  const trimmed = String(value).trim();
  // Case-insensitive match
  const matched = allowedOptions.find(
    (opt) => opt.toLowerCase() === trimmed.toLowerCase()
  );
  return matched || defaultValue;
}

/**
 * Validate and sanitize personal info data
 * @param {Object|null|undefined} personal - Personal info from request
 * @returns {Object|null} Sanitized personal info or null if empty
 */
function sanitizePersonalInfo(personal) {
  if (!personal || typeof personal !== "object") return null;

  const sanitized = {
    fullName: requiredString(personal.fullName),
    email: requiredString(personal.email),
    phone: optionalString(personal.phone),
    location: optionalString(personal.location),
    website: optionalString(personal.website),
    linkedin: optionalString(personal.linkedin),
    github: optionalString(personal.github),
    portfolio: optionalString(personal.portfolio),
    summary: optionalString(personal.summary),
    headline: optionalString(personal.headline),
    profileImageUrl: optionalString(personal.profileImageUrl),
    showPhoto: safeBoolean(personal.showPhoto, false),
    showLocation: safeBoolean(personal.showLocation, true),
    showPhone: safeBoolean(personal.showPhone, true),
  };

  // Check if at least required fields are filled
  if (!sanitized.fullName && !sanitized.email) {
    return null;
  }

  return sanitized;
}

/**
 * Validate and sanitize education data
 * @param {Array|null|undefined} educations - Education array from request
 * @returns {Array} Sanitized education array (never null)
 */
function sanitizeEducations(educations) {
  if (!educations || !Array.isArray(educations)) return [];

  return educations
    .map((edu, index) => {
      if (!edu || typeof edu !== "object") return null;

      const startDate = parseDate(edu.startDate);
      const isCurrent = safeBoolean(edu.isCurrent, false);

      return {
        institution: requiredString(edu.institution),
        degree: validateOption(edu.degree, ALLOWED_OPTIONS.degree, "Other") || requiredString(edu.degree),
        fieldOfStudy: requiredString(edu.fieldOfStudy || edu.field),
        location: optionalString(edu.location),
        startDate: startDate || new Date(),
        endDate: isCurrent ? null : parseDate(edu.endDate),
        isCurrent: isCurrent,
        gpa: optionalString(edu.gpa),
        gpaScale: optionalString(edu.gpaScale),
        description: optionalString(edu.description),
        coursework: parseArray(edu.coursework),
        honors: parseArray(edu.honors),
        showGpa: safeBoolean(edu.showGpa, true),
        displayOrder: safeInt(edu.displayOrder, index),
      };
    })
    .filter((edu) => edu !== null && edu.institution !== "");
}

/**
 * Validate and sanitize experience data
 * @param {Array|null|undefined} experiences - Experience array from request
 * @returns {Array} Sanitized experience array (never null)
 */
function sanitizeExperiences(experiences) {
  if (!experiences || !Array.isArray(experiences)) return [];

  return experiences
    .map((exp, index) => {
      if (!exp || typeof exp !== "object") return null;

      const startDate = parseDate(exp.startDate);
      const isCurrent = safeBoolean(exp.isCurrent || exp.isCurrentRole, false);

      return {
        company: requiredString(exp.company),
        position: requiredString(exp.position),
        location: optionalString(exp.location),
        startDate: startDate || new Date(),
        endDate: isCurrent ? null : parseDate(exp.endDate),
        isCurrent: isCurrent,
        description: optionalString(exp.description),
        achievements: parseArray(exp.achievements),
        skillsUsed: parseArray(exp.skillsUsed || exp.skills || exp.technologies),
        displayOrder: safeInt(exp.displayOrder, index),
      };
    })
    .filter((exp) => exp !== null && (exp.company !== "" || exp.position !== ""));
}

/**
 * Validate and sanitize project data
 * @param {Array|null|undefined} projects - Project array from request
 * @returns {Array} Sanitized project array (never null)
 */
function sanitizeProjects(projects) {
  if (!projects || !Array.isArray(projects)) return [];

  return projects
    .map((proj, index) => {
      if (!proj || typeof proj !== "object") return null;

      return {
        name: requiredString(proj.name),
        description: requiredString(proj.description),
        technologies: parseArray(proj.technologies),
        startDate: parseDate(proj.startDate),
        endDate: parseDate(proj.endDate),
        githubUrl: optionalString(proj.githubUrl || proj.github),
        liveUrl: optionalString(proj.liveUrl || proj.live || proj.url),
        demoUrl: optionalString(proj.demoUrl || proj.demo),
        achievements: parseArray(proj.achievements),
        displayOrder: safeInt(proj.displayOrder, index),
        isFeatured: safeBoolean(proj.isFeatured, false),
      };
    })
    .filter((proj) => proj !== null && proj.name !== "");
}

/**
 * Validate and sanitize skill data
 * @param {Array|null|undefined} skills - Skill array from request
 * @returns {Array} Sanitized skill array (never null)
 */
function sanitizeSkills(skills) {
  if (!skills || !Array.isArray(skills)) return [];

  return skills
    .map((skillGroup, index) => {
      if (!skillGroup || typeof skillGroup !== "object") return null;

      const categoryName = requiredString(
        skillGroup.categoryName || skillGroup.name || skillGroup.category
      );
      const skillsArray = parseArray(skillGroup.skills);

      // Skip if no category name and no skills
      if (!categoryName && skillsArray.length === 0) return null;

      return {
        categoryName: categoryName || "General",
        skills: skillsArray,
        proficiencyLevel: validateOption(
          skillGroup.proficiencyLevel,
          ALLOWED_OPTIONS.proficiencyLevel,
          null
        ),
        displayOrder: safeInt(skillGroup.displayOrder, index),
      };
    })
    .filter((skill) => skill !== null && skill.skills.length > 0);
}

/**
 * Validate and sanitize achievement data
 * @param {Array|null|undefined} achievements - Achievement array from request
 * @returns {Array} Sanitized achievement array (never null)
 */
function sanitizeAchievements(achievements) {
  if (!achievements || !Array.isArray(achievements)) return [];

  return achievements
    .map((ach, index) => {
      if (!ach || typeof ach !== "object") return null;

      return {
        title: requiredString(ach.title),
        organization: optionalString(ach.organization),
        type: validateOption(ach.type, ALLOWED_OPTIONS.achievementType, "other"),
        date: parseDate(ach.date),
        description: optionalString(ach.description),
        impact: optionalString(ach.impact),
        displayOrder: safeInt(ach.displayOrder, index),
      };
    })
    .filter((ach) => ach !== null && ach.title !== "");
}

/**
 * Validate and sanitize volunteer data
 * @param {Array|null|undefined} volunteers - Volunteer array from request
 * @returns {Array} Sanitized volunteer array (never null)
 */
function sanitizeVolunteers(volunteers) {
  if (!volunteers || !Array.isArray(volunteers)) return [];

  return volunteers
    .map((vol, index) => {
      if (!vol || typeof vol !== "object") return null;

      const startDate = parseDate(vol.startDate);
      const isCurrent = safeBoolean(vol.isCurrent, false);

      return {
        organization: requiredString(vol.organization),
        role: optionalString(vol.role),
        location: optionalString(vol.location),
        startDate: startDate || new Date(),
        endDate: isCurrent ? null : parseDate(vol.endDate),
        isCurrent: isCurrent,
        description: optionalString(vol.description),
        activities: parseArray(vol.activities),
        impact: optionalString(vol.impact),
        displayOrder: safeInt(vol.displayOrder, index),
      };
    })
    .filter((vol) => vol !== null && vol.organization !== "");
}

// ================================================================================
// GET HANDLER - Load CV Data with Options
// ================================================================================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cvId = searchParams.get("cvId");
    const userEmail = searchParams.get("userEmail");
    const includeOptions = searchParams.get("includeOptions") === "true";

    if (!userEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!cvId) {
      return NextResponse.json(
        { error: "CV ID is required" },
        { status: 400 }
      );
    }

    const cv = await prisma.cV.findFirst({
      where: {
        id: cvId,
        user: {
          email: userEmail,
        },
      },
      include: {
        personalInfo: true,
        educations: {
          orderBy: { displayOrder: "asc" },
        },
        experiences: {
          orderBy: { displayOrder: "asc" },
        },
        projects: {
          orderBy: { displayOrder: "asc" },
        },
        skills: {
          orderBy: { displayOrder: "asc" },
        },
        achievements: {
          orderBy: { displayOrder: "asc" },
        },
        volunteers: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!cv) {
      return NextResponse.json(
        {
          success: false,
          error: "CV not found or access denied",
          code: "CV_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const response = {
      success: true,
      cv: {
        id: cv.id,
        cvNumber: cv.slug,
        title: cv.title,
        slug: cv.slug,
        templateId: cv.templateId,
        colorScheme: cv.colorScheme,
        fontSize: cv.fontSize,
        isActive: cv.isActive,
        isPublic: cv.isPublic,
        completionPercentage: cv.completionPercentage,
        sectionsCompleted: cv.sectionsCompleted,
        atsScore: cv.atsScore,
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
    };

    // Include dropdown options if requested
    if (includeOptions) {
      response.options = ALLOWED_OPTIONS;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("CV Load Error:", error);
    return NextResponse.json(
      {
        error: "Failed to load CV",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ================================================================================
// GET OPTIONS ENDPOINT - Get dropdown options
// ================================================================================
export async function OPTIONS(request) {
  // Return allowed options for dropdowns
  return NextResponse.json({
    success: true,
    options: ALLOWED_OPTIONS,
  });
}

// ================================================================================
// POST HANDLER - Save/Update CV
// ================================================================================
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
      select: { id: true, email: true, name: true },
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
    // 3. EXTRACT & VALIDATE REQUEST DATA
    // ========================================
    const {
      cvData = {},
      selectedTemplate,
      themeColor,
      cvTitle,
      cvId,
      versionInfo,
      fontSize,
    } = body;
    let { cvNumber } = body;

    // Validate template option
    const validatedTemplate = validateOption(
      selectedTemplate,
      ALLOWED_OPTIONS.templateId,
      "modern"
    );

    // Sanitize all CV data - handles empty/missing fields automatically
    const sanitizedData = {
      personal: sanitizePersonalInfo(cvData.personal),
      educations: sanitizeEducations(cvData.education || cvData.educations),
      experiences: sanitizeExperiences(cvData.experience || cvData.experiences),
      projects: sanitizeProjects(cvData.projects),
      skills: sanitizeSkills(cvData.skills),
      achievements: sanitizeAchievements(cvData.achievements),
      volunteers: sanitizeVolunteers(cvData.volunteer || cvData.volunteers),
    };

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
          userId: user.id,
        },
        select: { id: true },
      });

      if (!existingCV) {
        console.log(
          `CV ${cvId} not found or doesn't belong to user ${user.id}. Creating new CV instead.`
        );
        shouldCreateNewCV = true;
      }
    }

    // ========================================
    // 5. CREATE NEW CV
    // ========================================
    if (!cvId || shouldCreateNewCV) {
      isNewCV = true;

      // Generate Unique Slug
      let cvSlug = cvNumber || `cv-${Date.now()}`;
      let slugAttempt = 0;
      let isSlugUnique = false;

      while (!isSlugUnique && slugAttempt < 10) {
        const existingCVWithSlug = await prisma.cV.findUnique({
          where: { slug: cvSlug },
          select: { id: true },
        });

        if (!existingCVWithSlug) {
          isSlugUnique = true;
        } else {
          slugAttempt++;
          const randomSuffix = Math.floor(Math.random() * 9999)
            .toString()
            .padStart(4, "0");
          cvSlug = `${cvNumber || `cv-${Date.now()}`}-${randomSuffix}`;
        }
      }

      if (!isSlugUnique) {
        cvSlug = `cv-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      }

      // Calculate completion before creating
      const completionPercentage = calculateCompletionPercentage(sanitizedData);
      const sectionsCompleted = getSectionsCompleted(sanitizedData);

      // Build create data object
      const createData = {
        userId: user.id,
        title: requiredString(cvTitle) || `CV #${cvSlug}`,
        slug: cvSlug,
        templateId: validatedTemplate,
        colorScheme: optionalString(themeColor) || "#1e40af",
        fontSize: safeInt(fontSize, 11),
        isActive: false,
        isPublic: false,
        completionPercentage: completionPercentage,
        sectionsCompleted: sectionsCompleted,
      };

      // Only add relations if data exists
      if (sanitizedData.personal) {
        createData.personalInfo = {
          create: sanitizedData.personal,
        };
      }

      if (sanitizedData.educations.length > 0) {
        createData.educations = {
          create: sanitizedData.educations,
        };
      }

      if (sanitizedData.experiences.length > 0) {
        createData.experiences = {
          create: sanitizedData.experiences,
        };
      }

      if (sanitizedData.projects.length > 0) {
        createData.projects = {
          create: sanitizedData.projects,
        };
      }

      if (sanitizedData.skills.length > 0) {
        createData.skills = {
          create: sanitizedData.skills,
        };
      }

      if (sanitizedData.achievements.length > 0) {
        createData.achievements = {
          create: sanitizedData.achievements,
        };
      }

      if (sanitizedData.volunteers.length > 0) {
        createData.volunteers = {
          create: sanitizedData.volunteers,
        };
      }

      // Create CV with all sections
      cv = await prisma.cV.create({
        data: createData,
        include: {
          personalInfo: true,
          educations: { orderBy: { displayOrder: "asc" } },
          experiences: { orderBy: { displayOrder: "asc" } },
          projects: { orderBy: { displayOrder: "asc" } },
          skills: { orderBy: { displayOrder: "asc" } },
          achievements: { orderBy: { displayOrder: "asc" } },
          volunteers: { orderBy: { displayOrder: "asc" } },
        },
      });

      // Create Initial Version Snapshot if versionInfo provided
      if (versionInfo && versionInfo.versionName) {
        await prisma.cVVersion.create({
          data: {
            cvId: cv.id,
            versionNumber: 1,
            versionLabel: requiredString(versionInfo.versionName) || "Version 1",
            changeDescription: optionalString(versionInfo.description) || "Initial version",
            isBookmarked: safeBoolean(versionInfo.isBookmarked, false),
            isAutoSave: safeBoolean(versionInfo.isAutoSave, false),
            personalInfoSnapshot: sanitizedData.personal
              ? JSON.stringify(sanitizedData.personal)
              : null,
            educationSnapshot:
              sanitizedData.educations.length > 0
                ? JSON.stringify(sanitizedData.educations)
                : null,
            experienceSnapshot:
              sanitizedData.experiences.length > 0
                ? JSON.stringify(sanitizedData.experiences)
                : null,
            projectsSnapshot:
              sanitizedData.projects.length > 0
                ? JSON.stringify(sanitizedData.projects)
                : null,
            skillsSnapshot:
              sanitizedData.skills.length > 0
                ? JSON.stringify(sanitizedData.skills)
                : null,
            achievementsSnapshot:
              sanitizedData.achievements.length > 0
                ? JSON.stringify(sanitizedData.achievements)
                : null,
            volunteerSnapshot:
              sanitizedData.volunteers.length > 0
                ? JSON.stringify(sanitizedData.volunteers)
                : null,
            templateId: validatedTemplate,
            colorScheme: optionalString(themeColor) || "#1e40af",
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          message: "CV created successfully",
          isNewCV: true,
          cv: formatCVResponse(cv),
          options: ALLOWED_OPTIONS,
        },
        { status: 201 }
      );
    }

    // ========================================
    // 6. UPDATE EXISTING CV
    // ========================================

    // Calculate completion before updating
    const completionPercentage = calculateCompletionPercentage(sanitizedData);
    const sectionsCompleted = getSectionsCompleted(sanitizedData);

    // Update CV Metadata
    cv = await prisma.cV.update({
      where: { id: cvId },
      data: {
        ...(cvTitle && { title: requiredString(cvTitle) }),
        templateId: validatedTemplate,
        colorScheme: optionalString(themeColor) || "#1e40af",
        fontSize: safeInt(fontSize, 11),
        completionPercentage: completionPercentage,
        sectionsCompleted: sectionsCompleted,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        templateId: true,
        colorScheme: true,
        fontSize: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Parallel Delete Operations
    await Promise.all([
      prisma.cVEducation.deleteMany({ where: { cvId } }),
      prisma.cVExperience.deleteMany({ where: { cvId } }),
      prisma.cVProject.deleteMany({ where: { cvId } }),
      prisma.cVSkill.deleteMany({ where: { cvId } }),
      prisma.cVAchievement.deleteMany({ where: { cvId } }),
      prisma.cVVolunteer.deleteMany({ where: { cvId } }),
    ]);

    // Update or Create Personal Info
    if (sanitizedData.personal) {
      await prisma.cVPersonalInfo.upsert({
        where: { cvId },
        create: {
          cvId,
          ...sanitizedData.personal,
        },
        update: sanitizedData.personal,
      });
    } else {
      // Delete personal info if cleared
      await prisma.cVPersonalInfo.deleteMany({ where: { cvId } });
    }

    // Parallel Batch Inserts - only insert if data exists
    const insertOperations = [];

    if (sanitizedData.educations.length > 0) {
      insertOperations.push(
        prisma.cVEducation.createMany({
          data: sanitizedData.educations.map((edu) => ({ cvId, ...edu })),
        })
      );
    }

    if (sanitizedData.experiences.length > 0) {
      insertOperations.push(
        prisma.cVExperience.createMany({
          data: sanitizedData.experiences.map((exp) => ({ cvId, ...exp })),
        })
      );
    }

    if (sanitizedData.projects.length > 0) {
      insertOperations.push(
        prisma.cVProject.createMany({
          data: sanitizedData.projects.map((proj) => ({ cvId, ...proj })),
        })
      );
    }

    if (sanitizedData.skills.length > 0) {
      insertOperations.push(
        prisma.cVSkill.createMany({
          data: sanitizedData.skills.map((skill) => ({ cvId, ...skill })),
        })
      );
    }

    if (sanitizedData.achievements.length > 0) {
      insertOperations.push(
        prisma.cVAchievement.createMany({
          data: sanitizedData.achievements.map((ach) => ({ cvId, ...ach })),
        })
      );
    }

    if (sanitizedData.volunteers.length > 0) {
      insertOperations.push(
        prisma.cVVolunteer.createMany({
          data: sanitizedData.volunteers.map((vol) => ({ cvId, ...vol })),
        })
      );
    }

    if (insertOperations.length > 0) {
      await Promise.all(insertOperations);
    }

    // Create Version Snapshot if versionInfo provided
    if (versionInfo && versionInfo.versionName) {
      const lastVersion = await prisma.cVVersion.findFirst({
        where: { cvId },
        orderBy: { versionNumber: "desc" },
        select: { versionNumber: true },
      });

      const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

      await prisma.cVVersion.create({
        data: {
          cvId,
          versionNumber: nextVersionNumber,
          versionLabel: requiredString(versionInfo.versionName) || `Version ${nextVersionNumber}`,
          changeDescription: optionalString(versionInfo.description),
          isBookmarked: safeBoolean(versionInfo.isBookmarked, false),
          isAutoSave: safeBoolean(versionInfo.isAutoSave, false),
          personalInfoSnapshot: sanitizedData.personal
            ? JSON.stringify(sanitizedData.personal)
            : null,
          educationSnapshot:
            sanitizedData.educations.length > 0
              ? JSON.stringify(sanitizedData.educations)
              : null,
          experienceSnapshot:
            sanitizedData.experiences.length > 0
              ? JSON.stringify(sanitizedData.experiences)
              : null,
          projectsSnapshot:
            sanitizedData.projects.length > 0
              ? JSON.stringify(sanitizedData.projects)
              : null,
          skillsSnapshot:
            sanitizedData.skills.length > 0
              ? JSON.stringify(sanitizedData.skills)
              : null,
          achievementsSnapshot:
            sanitizedData.achievements.length > 0
              ? JSON.stringify(sanitizedData.achievements)
              : null,
          volunteerSnapshot:
            sanitizedData.volunteers.length > 0
              ? JSON.stringify(sanitizedData.volunteers)
              : null,
          templateId: validatedTemplate,
          colorScheme: optionalString(themeColor) || "#1e40af",
        },
      });
    }

    // Fetch updated CV with all relations
    const updatedCV = await prisma.cV.findUnique({
      where: { id: cvId },
      include: {
        personalInfo: true,
        educations: { orderBy: { displayOrder: "asc" } },
        experiences: { orderBy: { displayOrder: "asc" } },
        projects: { orderBy: { displayOrder: "asc" } },
        skills: { orderBy: { displayOrder: "asc" } },
        achievements: { orderBy: { displayOrder: "asc" } },
        volunteers: { orderBy: { displayOrder: "asc" } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "CV updated successfully",
        isNewCV: false,
        cv: formatCVResponse(updatedCV),
        options: ALLOWED_OPTIONS,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CV Save Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to save CV",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

/**
 * Format CV response for consistent output
 * @param {Object} cv - CV from database
 * @returns {Object} Formatted CV response
 */
function formatCVResponse(cv) {
  return {
    id: cv.id,
    cvNumber: cv.slug,
    title: cv.title,
    slug: cv.slug,
    templateId: cv.templateId,
    colorScheme: cv.colorScheme,
    fontSize: cv.fontSize,
    isActive: cv.isActive,
    isPublic: cv.isPublic,
    completionPercentage: cv.completionPercentage,
    sectionsCompleted: cv.sectionsCompleted,
    atsScore: cv.atsScore,
    personalInfo: cv.personalInfo,
    educations: cv.educations || [],
    experiences: cv.experiences || [],
    projects: cv.projects || [],
    skills: cv.skills || [],
    achievements: cv.achievements || [],
    volunteers: cv.volunteers || [],
    createdAt: cv.createdAt,
    updatedAt: cv.updatedAt,
  };
}

/**
 * Calculate CV completion percentage
 * @param {Object} data - Sanitized CV data
 * @returns {number} Completion percentage (0-100)
 */
function calculateCompletionPercentage(data) {
  const weights = {
    personal: 20,
    educations: 20,
    experiences: 25,
    projects: 15,
    skills: 10,
    achievements: 5,
    volunteers: 5,
  };

  let score = 0;

  // Personal info - check required fields
  if (data.personal) {
    const requiredFields = ["fullName", "email"];
    const optionalFields = ["phone", "location", "summary", "linkedin"];
    
    let personalScore = 0;
    const filledRequired = requiredFields.filter(
      (field) => data.personal[field] && data.personal[field].trim()
    ).length;
    const filledOptional = optionalFields.filter(
      (field) => data.personal[field] && data.personal[field].trim()
    ).length;

    // Required fields are worth 60%, optional worth 40%
    personalScore = (filledRequired / requiredFields.length) * 0.6;
    personalScore += (filledOptional / optionalFields.length) * 0.4;
    
    score += personalScore * weights.personal;
  }

  // Other sections - presence based
  if (data.educations && data.educations.length > 0) {
    score += weights.educations;
  }
  if (data.experiences && data.experiences.length > 0) {
    score += weights.experiences;
  }
  if (data.projects && data.projects.length > 0) {
    score += weights.projects;
  }
  if (data.skills && data.skills.length > 0) {
    score += weights.skills;
  }
  if (data.achievements && data.achievements.length > 0) {
    score += weights.achievements;
  }
  if (data.volunteers && data.volunteers.length > 0) {
    score += weights.volunteers;
  }

  return Math.round(score * 100) / 100;
}

/**
 * Get list of completed section IDs
 * @param {Object} data - Sanitized CV data
 * @returns {string[]} Array of completed section IDs
 */
function getSectionsCompleted(data) {
  const completed = [];

  if (data.personal && data.personal.fullName && data.personal.email) {
    completed.push("personal");
  }
  if (data.educations && data.educations.length > 0) {
    completed.push("education");
  }
  if (data.experiences && data.experiences.length > 0) {
    completed.push("experience");
  }
  if (data.projects && data.projects.length > 0) {
    completed.push("projects");
  }
  if (data.skills && data.skills.length > 0) {
    completed.push("skills");
  }
  if (data.achievements && data.achievements.length > 0) {
    completed.push("achievements");
  }
  if (data.volunteers && data.volunteers.length > 0) {
    completed.push("volunteer");
  }

  return completed;
}