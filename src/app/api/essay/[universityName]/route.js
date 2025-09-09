///api/essay/[universityName]/route.js

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

// SECURITY FIX: Use environment variable instead of hardcoded API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// GET - Fetch university workspace data with all essays
export async function GET(request, { params }) {
  try {
    const { universityName } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log("Essay API - University Name:", universityName);
    console.log("Essay API - User ID:", userId);

    // Decode university name from URL
    const decodedUniversityName = decodeURIComponent(universityName);
    console.log("Essay API - Decoded University Name:", decodedUniversityName);

    // Find university by name or slug - made more flexible
    const university = await prisma.university.findFirst({
      where: {
        OR: [
          {
            universityName: {
              equals: decodedUniversityName,
              mode: "insensitive",
            },
          },
          {
            slug: {
              equals: decodedUniversityName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-"),
            },
          },
          // Additional matching patterns
          {
            universityName: {
              contains: decodedUniversityName,
              mode: "insensitive",
            },
          },
          {
            slug: {
              contains: decodedUniversityName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-"),
            },
          },
        ],
        isActive: true,
      },
      include: {
        programs: {
          where: { isActive: true },
          include: {
            department: true,
            essayPrompts: {
              where: { isActive: true },
              include: {
                essays: {
                  where: userId ? { userId } : {},
                  include: {
                    versions: {
                      orderBy: { timestamp: "desc" },
                      take: 20,
                      include: {
                        aiResults: {
                          orderBy: { createdAt: "desc" },
                          take: 1,
                        },
                      },
                    },
                    aiResults: {
                      where: { essayVersionId: null }, // Keep legacy analyses
                      orderBy: { createdAt: "desc" },
                      take: 5,
                    },
                  },
                },
              },
            },
            admissions: {
              where: { isActive: true },
              include: {
                deadlines: {
                  where: {
                    isActive: true,
                    deadlineDate: { gte: new Date() },
                  },
                  orderBy: { deadlineDate: "asc" },
                },
                intakes: {
                  where: { isActive: true },
                  orderBy: { intakeYear: "desc" },
                },
              },
            },
          },
        },
      },
    });

    console.log("Essay API - University found:", !!university);
    console.log(
      "Essay API - Programs count:",
      university?.programs?.length || 0
    );

    if (!university) {
      // Try a broader search to help with debugging
      const allUniversities = await prisma.university.findMany({
        select: { universityName: true, slug: true, isActive: true },
        take: 10,
      });

      console.log("Available universities:", allUniversities);

      return NextResponse.json(
        {
          error: "University not found",
          searchedFor: decodedUniversityName,
          availableUniversities: allUniversities.map((u) => ({
            name: u.universityName,
            slug: u.slug,
          })),
        },
        { status: 404 }
      );
    }

    // Check if university has programs
    if (!university.programs || university.programs.length === 0) {
      console.log("Essay API - No programs found for university");
      return NextResponse.json({
        error: "No programs found",
        university: {
          id: university.id,
          name: university.universityName,
          slug: university.slug,
        },
        programs: [],
        stats: {
          totalPrograms: 0,
          totalEssayPrompts: 0,
          completedEssays: 0,
          totalWords: 0,
          averageProgress: 0,
        },
      });
    }

    // Transform data for frontend with enhanced analytics
    const workspaceData = {
      university: {
        id: university.id,
        name: university.universityName,
        slug: university.slug,
        description: university.shortDescription || university.overview,
        website: university.websiteUrl,
        city: university.city,
        country: university.country,
        color: university.brandColor || "#002147", // Default color
      },
      programs: university.programs.map((program) => ({
        id: program.id,
        name: program.programName,
        slug: program.programSlug,
        departmentName: program.department?.name || "Unknown Department",
        degreeType: program.degreeType,
        description: program.programDescription,
        deadlines:
          program.admissions?.flatMap(
            (admission) =>
              admission.deadlines?.map((deadline) => ({
                id: deadline.id,
                type: deadline.deadlineType,
                date: deadline.deadlineDate,
                title: deadline.title,
                priority: deadline.priority,
              })) || []
          ) || [],
        essays:
          program.essayPrompts?.map((prompt) => {
            const userEssay = prompt.essays?.[0] || null;
            return {
              promptId: prompt.id,
              promptTitle: prompt.promptTitle,
              promptText: prompt.promptText,
              wordLimit: prompt.wordLimit,
              minWordCount: prompt.minWordCount,
              isMandatory: prompt.isMandatory,
              userEssay: userEssay
                ? {
                    id: userEssay.id,
                    content: userEssay.content,
                    wordCount: userEssay.wordCount,
                    title: userEssay.title,
                    priority: userEssay.priority,
                    status: userEssay.status,
                    lastModified: userEssay.lastModified,
                    lastAutoSaved: userEssay.lastAutoSaved,
                    createdAt: userEssay.createdAt,
                    versions:
                      userEssay.versions?.map((v) => ({
                        id: v.id,
                        label: v.label,
                        content: v.content,
                        wordCount: v.wordCount,
                        timestamp: v.timestamp,
                        isAutoSave: v.isAutoSave,
                        changesSinceLastVersion: v.changesSinceLastVersion,
                        aiAnalysis: v.aiResults?.[0] || null, // Latest AI analysis for this version
                      })) || [],
                    aiResults: userEssay.aiResults || [], // Legacy analyses
                  }
                : null,
            };
          }) || [],
      })),
      stats: {
        totalPrograms: university.programs.length,
        totalEssayPrompts: university.programs.reduce(
          (acc, p) => acc + (p.essayPrompts?.length || 0),
          0
        ),
        completedEssays: university.programs.reduce(
          (acc, p) =>
            acc +
            (p.essayPrompts?.filter((prompt) => {
              const essay = prompt.essays?.[0];
              return essay && essay.wordCount >= prompt.wordLimit * 0.8;
            }).length || 0),
          0
        ),
        totalWords: university.programs.reduce(
          (acc, p) =>
            acc +
            (p.essayPrompts?.reduce(
              (promptAcc, prompt) =>
                promptAcc + (prompt.essays?.[0]?.wordCount || 0),
              0
            ) || 0),
          0
        ),
        averageProgress: (() => {
          const totalPrompts = university.programs.reduce(
            (acc, p) => acc + (p.essayPrompts?.length || 0),
            0
          );
          if (totalPrompts === 0) return 0;

          const totalProgress = university.programs.reduce((acc, p) => {
            return (
              acc +
              (p.essayPrompts?.reduce((essayAcc, prompt) => {
                const essay = prompt.essays?.[0];
                return (
                  essayAcc +
                  (essay
                    ? Math.min(100, (essay.wordCount / prompt.wordLimit) * 100)
                    : 0)
                );
              }, 0) || 0)
            );
          }, 0);

          return totalProgress / totalPrompts;
        })(),
      },
    };

    console.log(
      "Essay API - Returning data with programs:",
      workspaceData.programs.length
    );
    return NextResponse.json(workspaceData);
  } catch (error) {
    console.error("Essay API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch workspace data",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// POST - Handle essay operations (create, update, save version, AI analysis)
export async function POST(request, { params }) {
  try {
    const { universityName } = params;
    const body = await request.json();
    const { action } = body;

    console.log("Essay API POST - Action:", action);
    console.log("Essay API POST - Body:", body);

    switch (action) {
      case "create_essay":
        return await createEssay(body);
      case "update_essay":
        return await updateEssay(body);
      case "save_version":
        return await saveVersion(body);
      case "ai_analysis":
        return await performAIAnalysis(body);
      case "auto_save":
        return await autoSave(body);
      case "get_analytics":
        return await getEssayAnalytics(body);
      case "delete_version":
        return await deleteVersion(body);
      case "restore_version":
        return await restoreVersion(body);
      case "get_version_analyses":
        return await getVersionAnalyses(body);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update essay content with auto-save support
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const {
      essayId,
      content,
      wordCount,
      title,
      priority,
      isAutoSave = false,
    } = body;

    console.log("Essay API PUT - Essay ID:", essayId);
    console.log("Essay API PUT - Content length:", content?.length || 0);

    // Validate required fields
    if (!essayId) {
      return NextResponse.json(
        { error: "Essay ID is required" },
        { status: 400 }
      );
    }

    const updateData = {
      lastModified: new Date(),
    };

    // Add fields only if they're provided
    if (content !== undefined) updateData.content = content;
    if (wordCount !== undefined) updateData.wordCount = wordCount;
    if (title !== undefined) updateData.title = title;
    if (priority !== undefined) updateData.priority = priority;

    // Update auto-save timestamp if this is an auto-save
    if (isAutoSave) {
      updateData.lastAutoSaved = new Date();
    }

    const updatedEssay = await prisma.essay.update({
      where: { id: essayId },
      data: updateData,
      include: {
        versions: {
          orderBy: { timestamp: "desc" },
          take: 10,
        },
        aiResults: {
          where: { essayVersionId: null },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        essayPrompt: true,
        program: {
          include: {
            university: true,
          },
        },
      },
    });

    // Auto-save version every 50 words or every 5 minutes
    if (isAutoSave && content && wordCount > 0) {
      const lastVersion = updatedEssay.versions[0];
      const shouldCreateAutoSave =
        !lastVersion ||
        (wordCount > 0 &&
          (Math.abs(wordCount - lastVersion.wordCount) >= 50 || // Every 50 words
            new Date() - new Date(lastVersion.timestamp) > 15 * 60 * 1000)); // Every 15 minutes

      if (shouldCreateAutoSave) {
        await prisma.essayVersion.create({
          data: {
            essayId,
            content,
            wordCount,
            label: `Auto-save ${new Date().toLocaleTimeString()}`,
            isAutoSave: true,
            changesSinceLastVersion: lastVersion
              ? `+${wordCount - lastVersion.wordCount} words`
              : "Initial content",
          },
        });
      }
    }

    return NextResponse.json({ essay: updatedEssay });
  } catch (error) {
    console.error("Error updating essay:", error);
    return NextResponse.json(
      {
        error: "Failed to update essay",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper: Create new essay
async function createEssay(data) {
  const { userId, programId, essayPromptId, applicationId } = data;

  console.log("Creating essay with:", { userId, programId, essayPromptId });

  // Validate required fields
  if (!userId || !programId || !essayPromptId) {
    return NextResponse.json(
      {
        error: "Missing required fields: userId, programId, essayPromptId",
      },
      { status: 400 }
    );
  }

  // Check if essay already exists
  const existingEssay = await prisma.essay.findFirst({
    where: {
      userId,
      programId,
      essayPromptId,
    },
  });

  if (existingEssay) {
    console.log("Essay already exists:", existingEssay.id);
    return NextResponse.json({
      essay: existingEssay,
      message: "Essay already exists",
    });
  }

  // Get prompt details
  const essayPrompt = await prisma.essayPrompt.findUnique({
    where: { id: essayPromptId },
    include: {
      program: {
        include: { university: true },
      },
    },
  });

  if (!essayPrompt) {
    return NextResponse.json(
      { error: "Essay prompt not found" },
      { status: 404 }
    );
  }

  // Create new essay
  const essay = await prisma.essay.create({
    data: {
      userId,
      programId,
      essayPromptId,
      applicationId: applicationId || null,
      title: `Essay for ${essayPrompt.promptTitle}`,
      content: "",
      wordCount: 0,
      priority: "medium",
      status: "DRAFT",
      autoSaveEnabled: true,
    },
    include: {
      versions: {
        include: {
          aiResults: true,
        },
      },
      aiResults: true,
      essayPrompt: true,
      program: {
        include: { university: true },
      },
    },
  });

  console.log("Essay created successfully:", essay.id);
  return NextResponse.json({ essay });
}

// Helper: Update essay
async function updateEssay(data) {
  const { essayId, content, wordCount, title, priority, status } = data;

  if (!essayId) {
    return NextResponse.json(
      { error: "Essay ID is required" },
      { status: 400 }
    );
  }

  const updatedEssay = await prisma.essay.update({
    where: { id: essayId },
    data: {
      ...(content !== undefined && { content }),
      ...(wordCount !== undefined && { wordCount }),
      ...(title !== undefined && { title }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && { status }),
      lastModified: new Date(),
    },
    include: {
      versions: {
        orderBy: { timestamp: "desc" },
        take: 10,
        include: {
          aiResults: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      aiResults: {
        where: { essayVersionId: null },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });

  return NextResponse.json({ essay: updatedEssay });
}

// Helper: Save essay version (manual save) - WITH OPTIONAL AI ANALYSIS
async function saveVersion(data) {
  const {
    essayId,
    content,
    wordCount,
    label,
    isAutoSave = false,
    changeDescription,
    performAiAnalysis = false, // NEW: Option to trigger AI analysis on save
    prompt,
  } = data;

  if (!essayId) {
    return NextResponse.json(
      { error: "Essay ID is required" },
      { status: 400 }
    );
  }

  // Get essay details for AI analysis
  const essay = await prisma.essay.findUnique({
    where: { id: essayId },
    include: {
      essayPrompt: true,
      program: {
        include: { university: true },
      },
    },
  });

  if (!essay) {
    return NextResponse.json({ error: "Essay not found" }, { status: 404 });
  }

  // Get previous version for comparison
  const lastVersion = await prisma.essayVersion.findFirst({
    where: { essayId },
    orderBy: { timestamp: "desc" },
  });

  const changesSinceLastVersion = lastVersion
    ? `${wordCount - lastVersion.wordCount > 0 ? "+" : ""}${
        wordCount - lastVersion.wordCount
      } words`
    : "Initial version";

  // Create version
  const version = await prisma.essayVersion.create({
    data: {
      essayId,
      content: content || "",
      wordCount: wordCount || 0,
      label: label || `Version ${new Date().toLocaleString()}`,
      isAutoSave,
      changesSinceLastVersion: changeDescription || changesSinceLastVersion,
    },
  });

  // Update essay's last modified time
  await prisma.essay.update({
    where: { id: essayId },
    data: { lastModified: new Date() },
  });

  let aiAnalysis = null;

  // Perform AI analysis if requested and content is sufficient
  if (performAiAnalysis && content && content.length >= 50) {
    try {
      const analysisResult = await performVersionAIAnalysis({
        versionId: version.id,
        essayId,
        content,
        prompt: prompt || essay.essayPrompt.promptText,
        essay,
      });

      if (analysisResult.success) {
        aiAnalysis = analysisResult.analysis;
      }
    } catch (error) {
      console.warn("AI analysis failed during version save:", error);
      // Don't fail version save if AI analysis fails
    }
  }

  return NextResponse.json({ 
    version: {
      ...version,
      aiAnalysis
    },
    aiAnalysis 
  });
}

// Helper: Auto-save essay with intelligent versioning
async function autoSave(data) {
  const { essayId, content, wordCount } = data;

  if (!essayId) {
    return NextResponse.json(
      { error: "Essay ID is required" },
      { status: 400 }
    );
  }

  // Update essay content
  const updatedEssay = await prisma.essay.update({
    where: { id: essayId },
    data: {
      content: content || "",
      wordCount: wordCount || 0,
      lastAutoSaved: new Date(),
      lastModified: new Date(),
    },
  });

  // Check if we should create an auto-save version
  const lastVersion = await prisma.essayVersion.findFirst({
    where: { essayId },
    orderBy: { timestamp: "desc" },
  });

  const shouldCreateAutoSave =
    !lastVersion ||
    (wordCount > 0 &&
      (Math.abs(wordCount - lastVersion.wordCount) >= 50 || // Every 50 words
        new Date() - new Date(lastVersion.timestamp) > 15 * 60 * 1000)); // Every 15 minutes

  if (shouldCreateAutoSave) {
    await prisma.essayVersion.create({
      data: {
        essayId,
        content: content || "",
        wordCount: wordCount || 0,
        label: `Auto-save ${new Date().toLocaleTimeString()}`,
        isAutoSave: true,
        changesSinceLastVersion: lastVersion
          ? `${wordCount - lastVersion.wordCount > 0 ? "+" : ""}${
              wordCount - lastVersion.wordCount
            } words`
          : "Initial auto-save",
      },
    });
  }

  return NextResponse.json({ success: true, essay: updatedEssay });
}

// Helper: Get essay analytics data
async function getEssayAnalytics(data) {
  const { essayId, userId } = data;

  try {
    // Get essay with related data
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
      include: {
        versions: {
          orderBy: { timestamp: "desc" },
          take: 20,
          include: {
            aiResults: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        aiResults: {
          where: { essayVersionId: null },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        essayPrompt: true,
      },
    });

    if (!essay) {
      return NextResponse.json({ error: "Essay not found" }, { status: 404 });
    }

    // Get all essays for user for comparative analytics
    const allUserEssays = userId
      ? await prisma.essay.findMany({
          where: { userId },
          include: {
            essayPrompt: true,
          },
        })
      : [];

    // Calculate analytics
    const analytics = {
      completion: {
        percentage: Math.min(
          100,
          (essay.wordCount / essay.essayPrompt.wordLimit) * 100
        ),
        wordCount: essay.wordCount,
        wordLimit: essay.essayPrompt.wordLimit,
        wordsRemaining: Math.max(
          0,
          essay.essayPrompt.wordLimit - essay.wordCount
        ),
      },
      timing: {
        readingTime: Math.ceil(essay.wordCount / 200), // 200 WPM
        daysSinceStart: Math.max(
          1,
          Math.ceil((new Date() - essay.createdAt) / (1000 * 60 * 60 * 24))
        ),
        writingVelocity: Math.round(
          essay.wordCount /
            Math.max(
              1,
              Math.ceil((new Date() - essay.createdAt) / (1000 * 60 * 60 * 24))
            )
        ),
        lastModified: essay.lastModified,
        lastAutoSaved: essay.lastAutoSaved,
      },
      structure: {
        sentences: essay.content
          .split(/[.!?]+/)
          .filter((s) => s.trim().length > 0).length,
        paragraphs: essay.content.split("\n").filter((p) => p.trim().length > 0)
          .length,
        avgSentenceLength:
          essay.content.length > 0
            ? Math.round(
                essay.wordCount /
                  essay.content
                    .split(/[.!?]+/)
                    .filter((s) => s.trim().length > 0).length
              )
            : 0,
      },
      versions: {
        total: essay.versions.length,
        autoSaves: essay.versions.filter((v) => v.isAutoSave).length,
        manualSaves: essay.versions.filter((v) => !v.isAutoSave).length,
        latestVersion: essay.versions[0] || null,
        analyzedVersions: essay.versions.filter((v) => v.aiResults && v.aiResults.length > 0).length,
      },
      progress: {
        overall:
          allUserEssays.length > 0
            ? allUserEssays.reduce(
                (acc, e) =>
                  acc +
                  Math.min(100, (e.wordCount / e.essayPrompt.wordLimit) * 100),
                0
              ) / allUserEssays.length
            : 0,
        completed: allUserEssays.filter(
          (e) => e.wordCount >= e.essayPrompt.wordLimit * 0.8
        ).length,
        total: allUserEssays.length,
      },
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error("Error getting analytics:", error);
    return NextResponse.json(
      { error: "Failed to get analytics" },
      { status: 500 }
    );
  }
}

// Helper: Delete version
async function deleteVersion(data) {
  const { versionId, essayId } = data;

  if (!versionId || !essayId) {
    return NextResponse.json(
      { error: "Version ID and Essay ID are required" },
      { status: 400 }
    );
  }

  try {
    // Don't allow deletion of the only version
    const versionCount = await prisma.essayVersion.count({
      where: { essayId },
    });

    if (versionCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the only version" },
        { status: 400 }
      );
    }

    // Delete version and its AI analyses
    await prisma.aIResult.deleteMany({
      where: { essayVersionId: versionId },
    });

    await prisma.essayVersion.delete({
      where: { id: versionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting version:", error);
    return NextResponse.json(
      { error: "Failed to delete version" },
      { status: 500 }
    );
  }
}

// Helper: Restore version
async function restoreVersion(data) {
  const { essayId, versionId } = data;

  if (!essayId || !versionId) {
    return NextResponse.json(
      { error: "Essay ID and Version ID are required" },
      { status: 400 }
    );
  }

  try {
    const version = await prisma.essayVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Update essay with version content
    const updatedEssay = await prisma.essay.update({
      where: { id: essayId },
      data: {
        content: version.content,
        wordCount: version.wordCount,
        lastModified: new Date(),
      },
      include: {
        versions: {
          orderBy: { timestamp: "desc" },
          take: 10,
          include: {
            aiResults: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    // Create a new version marking this as a restoration
    await prisma.essayVersion.create({
      data: {
        essayId,
        content: version.content,
        wordCount: version.wordCount,
        label: `Restored from ${version.label}`,
        isAutoSave: false,
        changesSinceLastVersion: `Restored to ${version.wordCount} words`,
      },
    });

    return NextResponse.json({ success: true, essay: updatedEssay });
  } catch (error) {
    console.error("Error restoring version:", error);
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 500 }
    );
  }
}

// Helper: Get version analyses
async function getVersionAnalyses(data) {
  const { essayId } = data;

  try {
    const analyses = await prisma.aIResult.findMany({
      where: {
        essayId,
        essayVersionId: { not: null }, // Only version-specific analyses
      },
      include: {
        essayVersion: {
          select: {
            id: true,
            label: true,
            timestamp: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, analyses });
  } catch (error) {
    console.error("Error getting version analyses:", error);
    return NextResponse.json(
      { error: "Failed to get version analyses" },
      { status: 500 }
    );
  }
}

// UPDATED AI Analysis Function - Now for specific versions
async function performAIAnalysis(data) {
  const { 
    essayId, 
    versionId = null, // NEW: Specific version to analyze
    content, 
    prompt, 
    analysisTypes = ["comprehensive"] 
  } = data;

  console.log("Starting AI analysis for essay:", essayId, "version:", versionId);
  console.log("Content length:", content?.length || 0);
  console.log("Has API key:", !!process.env.GOOGLE_GEMINI_API_KEY);

  if (!essayId || !content) {
    return NextResponse.json(
      { error: "Essay ID and content are required" },
      { status: 400 }
    );
  }

  // Check if API key is configured
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.error("GOOGLE_GEMINI_API_KEY environment variable is not set");
    return NextResponse.json(
      { error: "AI service not configured. Please set GOOGLE_GEMINI_API_KEY environment variable." },
      { status: 500 }
    );
  }

  const startTime = Date.now();

  try {
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
      include: {
        essayPrompt: true,
        program: {
          include: { university: true },
        },
      },
    });

    if (!essay) {
      return NextResponse.json({ error: "Essay not found" }, { status: 404 });
    }

    // If analyzing a specific version, get version details
    let version = null;
    if (versionId) {
      version = await prisma.essayVersion.findUnique({
        where: { id: versionId },
      });
      
      if (!version) {
        return NextResponse.json({ error: "Version not found" }, { status: 404 });
      }
    }

    // Check if analysis already exists for this version
    if (versionId) {
      const existingAnalysis = await prisma.aIResult.findFirst({
        where: {
          essayId,
          essayVersionId: versionId,
        },
        orderBy: { createdAt: "desc" },
      });

      if (existingAnalysis) {
        // Return existing analysis
        const analysisData = {
          overallScore: existingAnalysis.overallScore,
          suggestions: JSON.parse(existingAnalysis.suggestions || "[]"),
          strengths: JSON.parse(existingAnalysis.strengths || "[]"),
          improvements: JSON.parse(existingAnalysis.improvements || "[]"),
          warnings: JSON.parse(existingAnalysis.warnings || "[]"),
          readabilityScore: existingAnalysis.readabilityScore,
          sentenceCount: existingAnalysis.sentenceCount,
          paragraphCount: existingAnalysis.paragraphCount,
          avgSentenceLength: existingAnalysis.avgSentenceLength,
          complexWordCount: existingAnalysis.complexWordCount,
          passiveVoiceCount: existingAnalysis.passiveVoiceCount,
          structureScore: existingAnalysis.structureScore || 50,
          contentRelevance: existingAnalysis.contentRelevance || 50,
          narrativeFlow: existingAnalysis.narrativeFlow || 50,
          leadershipEmphasis: existingAnalysis.leadershipEmphasis || 50,
          specificityScore: existingAnalysis.specificityScore || 50,
          grammarIssues: existingAnalysis.grammarIssues || 0,
        };

        return NextResponse.json({
          success: true,
          analysis: analysisData,
          aiResult: existingAnalysis,
          processingTime: Date.now() - startTime,
          cached: true,
        });
      }
    }

    // Initialize Gemini model with error handling
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } catch (initError) {
      console.error("Failed to initialize Gemini model:", initError);
      return NextResponse.json(
        { error: "Failed to initialize AI model. Please check API key." },
        { status: 500 }
      );
    }

    // Enhanced AI prompt for all types of educational essays
    const analysisPrompt = `
You are an expert educational consultant specializing in admissions essays for universities, graduate schools, MBA programs, and all academic programs. Analyze this essay and provide comprehensive feedback.

ESSAY CONTEXT:
- Institution: ${essay.program.university.universityName}
- Program: ${essay.program.programName} (${essay.program.degreeType})
- Essay Prompt: ${prompt || essay.essayPrompt.promptText}
- Word Limit: ${essay.essayPrompt.wordLimit}
- Current Word Count: ${essay.wordCount}
- Analysis Target: ${versionId ? `Version: ${version.label}` : 'Current Draft'}

ESSAY CONTENT TO ANALYZE:
${content}

ANALYSIS REQUIREMENTS:
Provide detailed feedback in this exact JSON structure. Tailor your analysis to the specific program type (MBA, undergraduate, graduate, professional school, etc.):

{
  "overallScore": 85,
  "suggestions": [
    {
      "id": "1",
      "type": "critical|warning|improvement|strength",
      "priority": "high|medium|low",
      "title": "Brief descriptive title (max 60 chars)",
      "description": "Detailed explanation of the issue or strength (100-200 words)",
      "action": "Specific, actionable recommendation the student should implement",
      "impact": "high|medium|low"
    }
  ],
  "strengths": [
    "Specific strength with examples from the essay",
    "Another strength with concrete details"
  ],
  "improvements": [
    "Specific area needing improvement with actionable guidance",
    "Another improvement area with clear next steps"
  ],
  "warnings": [
    "Critical issues that must be addressed",
    "Urgent concerns about content or approach"
  ],
  "readabilityScore": 78,
  "sentenceCount": 25,
  "paragraphCount": 5,
  "avgSentenceLength": 18.5,
  "complexWordCount": 12,
  "passiveVoiceCount": 3,
  "structureScore": 82,
  "contentRelevance": 90,
  "narrativeFlow": 75,
  "leadershipEmphasis": 85,
  "specificityScore": 70,
  "grammarIssues": 2
}

FOCUS AREAS FOR ALL EDUCATIONAL ESSAYS:
1. **Content Relevance & Prompt Response**: How well does the essay directly address the specific prompt? Does it stay on topic?

2. **Personal Story & Authenticity**: Is the narrative compelling, genuine, and uniquely personal? Does it reveal character and values?

3. **Academic/Professional Fit**: Does the essay demonstrate strong fit with the institution and program? Clear career goals?

4. **Structure & Flow**: Logical organization, smooth transitions, engaging opening and strong conclusion?

5. **Specific Examples & Evidence**: Concrete details, quantifiable achievements, specific anecdotes rather than generic statements?

6. **Voice & Writing Quality**: Appropriate tone, grammar, word choice, sentence variety, readability?

7. **Differentiation**: What makes this applicant unique? Clear value proposition?

8. **Growth & Reflection**: Evidence of self-awareness, learning from experiences, personal development?

PROGRAM-SPECIFIC CONSIDERATIONS:
- MBA: Leadership examples, quantifiable impact, career progression, teamwork, innovation
- Undergraduate: Intellectual curiosity, extracurricular engagement, future potential, character development
- Graduate/PhD: Research interests, academic preparation, contribution to field, faculty fit
- Professional Schools (Law, Medicine, etc.): Service orientation, relevant experience, ethical foundation
- International Programs: Cultural awareness, global perspective, language considerations

SCORING CRITERIA (0-100):
- 90-100: Exceptional, admission-ready essay with compelling narrative and perfect execution
- 80-89: Strong essay with minor areas for improvement
- 70-79: Good foundation but needs significant enhancement
- 60-69: Adequate content but requires substantial revision
- Below 60: Major issues requiring complete restructuring

Provide constructive, specific, and actionable feedback that helps the student create an outstanding essay for their target program.
`;

    let result;
    try {
      console.log("Sending request to Gemini API...");
      result = await model.generateContent(analysisPrompt);
      console.log("Received response from Gemini API");
    } catch (apiError) {
      console.error("Gemini API error:", apiError);
      
      // Use fallback analysis
      console.log("Using fallback analysis due to API error");
      const fallbackAnalysis = generateAdvancedFallbackAnalysis(
        content,
        essay.wordCount,
        essay.essayPrompt.wordLimit,
        prompt,
        essay.program.degreeType
      );
      
      // Save fallback result to database
      const aiResult = await prisma.aIResult.create({
        data: {
          essayId,
          essayVersionId: versionId,
          analysisType: analysisTypes.join(","),
          overallScore: fallbackAnalysis.overallScore,
          suggestions: JSON.stringify(fallbackAnalysis.suggestions),
          strengths: JSON.stringify(fallbackAnalysis.strengths),
          improvements: JSON.stringify(fallbackAnalysis.improvements),
          warnings: JSON.stringify(fallbackAnalysis.warnings),
          aiProvider: "fallback",
          modelUsed: "local-analysis",
          promptVersion: "2.0",
          status: "completed",
          processingTime: Date.now() - startTime,
          readabilityScore: fallbackAnalysis.readabilityScore,
          sentenceCount: fallbackAnalysis.sentenceCount,
          paragraphCount: fallbackAnalysis.paragraphCount,
          avgSentenceLength: fallbackAnalysis.avgSentenceLength,
          complexWordCount: fallbackAnalysis.complexWordCount,
          passiveVoiceCount: fallbackAnalysis.passiveVoiceCount,
          structureScore: fallbackAnalysis.structureScore,
          contentRelevance: fallbackAnalysis.contentRelevance,
          narrativeFlow: fallbackAnalysis.narrativeFlow,
          leadershipEmphasis: fallbackAnalysis.leadershipEmphasis,
          specificityScore: fallbackAnalysis.specificityScore,
          grammarIssues: fallbackAnalysis.grammarIssues,
          errorMessage: `API Error: ${apiError.message}`,
        },
      });

      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis,
        aiResult,
        processingTime: Date.now() - startTime,
        usedFallback: true,
      });
    }

    const processingTime = Date.now() - startTime;
    const responseText = result.response.text();

    console.log("Raw AI response length:", responseText.length);

    let analysisData;
    try {
      // Clean the response text to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
        console.log("Successfully parsed JSON from AI response");
      } else {
        throw new Error("No valid JSON found in AI response");
      }
    } catch (parseError) {
      console.warn("JSON parsing failed, using fallback analysis:", parseError);
      analysisData = generateAdvancedFallbackAnalysis(
        content,
        essay.wordCount,
        essay.essayPrompt.wordLimit,
        prompt,
        essay.program.degreeType
      );
    }

    // Ensure all required fields exist with defaults
    analysisData = {
      overallScore: analysisData.overallScore || 50,
      suggestions: analysisData.suggestions || [],
      strengths: analysisData.strengths || [],
      improvements: analysisData.improvements || [],
      warnings: analysisData.warnings || [],
      readabilityScore: analysisData.readabilityScore || 50,
      sentenceCount: analysisData.sentenceCount || 0,
      paragraphCount: analysisData.paragraphCount || 0,
      avgSentenceLength: analysisData.avgSentenceLength || 0,
      complexWordCount: analysisData.complexWordCount || 0,
      passiveVoiceCount: analysisData.passiveVoiceCount || 0,
      structureScore: analysisData.structureScore || 50,
      contentRelevance: analysisData.contentRelevance || 50,
      narrativeFlow: analysisData.narrativeFlow || 50,
      leadershipEmphasis: analysisData.leadershipEmphasis || 50,
      specificityScore: analysisData.specificityScore || 50,
      grammarIssues: analysisData.grammarIssues || 0,
    };

    // Save comprehensive AI result to database
    const aiResult = await prisma.aIResult.create({
      data: {
        essayId,
        essayVersionId: versionId, // NEW: Link to specific version
        analysisType: analysisTypes.join(","),
        overallScore: analysisData.overallScore,
        suggestions: JSON.stringify(analysisData.suggestions),
        strengths: JSON.stringify(analysisData.strengths),
        improvements: JSON.stringify(analysisData.improvements),
        warnings: JSON.stringify(analysisData.warnings),
        aiProvider: "gemini",
        modelUsed: "gemini-1.5-flash",
        promptVersion: "2.0",
        status: "completed",
        processingTime,
        readabilityScore: analysisData.readabilityScore,
        sentenceCount: analysisData.sentenceCount,
        paragraphCount: analysisData.paragraphCount,
        avgSentenceLength: analysisData.avgSentenceLength,
        complexWordCount: analysisData.complexWordCount,
        passiveVoiceCount: analysisData.passiveVoiceCount,
        structureScore: analysisData.structureScore,
        contentRelevance: analysisData.contentRelevance,
        narrativeFlow: analysisData.narrativeFlow,
        leadershipEmphasis: analysisData.leadershipEmphasis,
        specificityScore: analysisData.specificityScore,
        grammarIssues: analysisData.grammarIssues,
      },
    });

    console.log("AI analysis completed successfully for version:", versionId);

    return NextResponse.json({
      success: true,
      analysis: analysisData,
      aiResult,
      processingTime,
      versionId,
    });
  } catch (error) {
    console.error("Error performing AI analysis:", error);

    // Log failed analysis
    try {
      await prisma.aIResult.create({
        data: {
          essayId,
          essayVersionId: versionId,
          analysisType: "comprehensive",
          status: "failed",
          errorMessage: error.message,
          aiProvider: "gemini",
        },
      });
    } catch (dbError) {
      console.error("Failed to log error to database:", dbError);
    }

    // Return fallback analysis instead of complete failure
    const fallbackAnalysis = generateAdvancedFallbackAnalysis(
      content,
      essay?.wordCount || content.split(' ').length,
      essay?.essayPrompt?.wordLimit || 500,
      prompt,
      essay?.program?.degreeType || "Unknown"
    );

    return NextResponse.json({
      success: true,
      analysis: fallbackAnalysis,
      processingTime: Date.now() - startTime,
      usedFallback: true,
      error: "AI service unavailable, using local analysis",
      versionId,
    });
  }
}

// Helper function for version-specific AI analysis
async function performVersionAIAnalysis(data) {
  return await performAIAnalysis(data);
}

// Enhanced fallback analysis function
function generateAdvancedFallbackAnalysis(content, wordCount, wordLimit, prompt, degreeType = "Unknown") {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  
  // Basic metrics
  const sentenceCount = sentences.length;
  const paragraphCount = Math.max(1, paragraphs.length);
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  
  // Word completion ratio
  const completionRatio = wordLimit > 0 ? wordCount / wordLimit : 0;
  
  // Generate suggestions based on content analysis
  const suggestions = [];
  let suggestionId = 1;
  
  // Word count analysis
  if (completionRatio < 0.7) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "warning",
      priority: "high",
      title: "Essay Length Below Target",
      description: `Your essay is currently ${Math.round(completionRatio * 100)}% of the recommended length. Admissions officers expect essays that fully utilize the word limit to demonstrate thoroughness and attention to detail.`,
      action: "Expand your examples with specific details, add more supporting evidence, or include additional relevant experiences that strengthen your narrative.",
      impact: "high"
    });
  } else if (completionRatio > 1.05) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "critical",
      priority: "high", 
      title: "Essay Exceeds Word Limit",
      description: "Your essay exceeds the word limit, which may result in automatic rejection or negative impression with admissions committees.",
      action: "Edit ruthlessly to remove redundant phrases, combine similar ideas, and focus on your strongest examples while staying within the limit.",
      impact: "high"
    });
  }
  
  // Structure analysis
  if (paragraphCount < 3) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "improvement",
      priority: "medium",
      title: "Consider Better Paragraph Structure",
      description: "Your essay would benefit from clearer paragraph breaks to improve readability and logical flow.",
      action: "Organize your ideas into distinct paragraphs with clear topic sentences and supporting details.",
      impact: "medium"
    });
  }
  
  // Sentence variety
  if (avgSentenceLength < 12) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "improvement",
      priority: "low",
      title: "Enhance Sentence Variety",
      description: "Your sentences tend to be quite short. Varying sentence length can improve flow and engagement.",
      action: "Combine some shorter sentences and add more complex sentence structures to create better rhythm.",
      impact: "low"
    });
  }
  
  // Program-specific suggestions
  if (degreeType?.toLowerCase().includes('mba')) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "improvement",
      priority: "high",
      title: "Strengthen Leadership Examples",
      description: "MBA essays should prominently feature specific leadership experiences with quantifiable results.",
      action: "Include concrete examples of times you led teams, managed projects, or drove organizational change with measurable outcomes.",
      impact: "high"
    });
  }
  
  // Add a strength
  suggestions.push({
    id: (suggestionId++).toString(),
    type: "strength",
    priority: "medium",
    title: "Good Essay Foundation",
    description: "Your essay demonstrates a solid understanding of the prompt and maintains focus on relevant topics.",
    action: "Continue building on this strong foundation by adding more specific details and personal insights.",
    impact: "medium"
  });
  
  // Calculate scores
  const baseScore = Math.min(90, Math.max(40, 
    (completionRatio * 30) + // 30 points for length
    (Math.min(paragraphCount, 5) * 8) + // Up to 40 points for structure  
    (sentenceCount > 0 ? 20 : 0) + // 20 points for having content
    10 // Base points
  ));
  
  const overallScore = Math.round(baseScore);
  
  return {
    overallScore,
    suggestions,
    strengths: [
      "Essay addresses the prompt directly",
      "Content is focused and relevant",
      completionRatio > 0.8 ? "Good use of available word count" : "Room to expand on key themes"
    ].filter(Boolean),
    improvements: [
      completionRatio < 0.9 ? "Add more specific examples and details" : null,
      paragraphCount < 4 ? "Improve paragraph structure and transitions" : null,
      "Consider adding more quantifiable achievements"
    ].filter(Boolean),
    warnings: completionRatio > 1.05 ? ["Essay exceeds word limit - immediate editing required"] : [],
    readabilityScore: Math.round(Math.max(50, 100 - (avgSentenceLength > 25 ? 20 : 0) - (paragraphCount < 3 ? 15 : 0))),
    sentenceCount,
    paragraphCount,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    complexWordCount: Math.round(words.filter(w => w.length > 6).length),
    passiveVoiceCount: Math.round(sentences.filter(s => s.includes(' was ') || s.includes(' were ') || s.includes(' been ')).length),
    structureScore: Math.round(Math.min(100, (paragraphCount * 20) + (sentenceCount > 10 ? 20 : sentenceCount * 2))),
    contentRelevance: Math.round(baseScore + 10), // Assume relevance is slightly higher than overall
    narrativeFlow: Math.round(Math.max(40, baseScore - 5)),
    leadershipEmphasis: degreeType?.toLowerCase().includes('mba') ? Math.round(baseScore - 15) : Math.round(baseScore),
    specificityScore: Math.round(Math.max(30, baseScore - 20)), // Usually lower for specificity
    grammarIssues: Math.round(sentenceCount * 0.1), // Estimate based on length
  };
}