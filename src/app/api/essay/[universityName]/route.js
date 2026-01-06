// src/app/api/essay/[universityName]/route.js - OPENROUTER VERSION

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================
// OPENROUTER CONFIGURATION - REPLACED GOOGLE GENERATIVE AI
// ============================================================
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const GEMINI_MODEL = "google/gemini-2.5-flash-lite"; // Flash Lite model

// ============================================================
// OPENROUTER HELPER FUNCTION
// ============================================================
async function callGeminiViaOpenRouter(prompt, maxTokens = 4096) {
  try {
    console.log(`🔌 Calling OpenRouter with Gemini model: ${GEMINI_MODEL}`);
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "University Essay Analysis System",
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenRouter API error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      } else if (response.status === 401) {
        throw new Error("Invalid API key. Please check your OpenRouter configuration.");
      } else {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message) {
      throw new Error("Invalid response format from AI service");
    }

    return {
      text: data.choices[0].message.content,
      finishReason: data.choices[0].finish_reason,
      usage: data.usage,
      model: data.model,
    };
  } catch (error) {
    console.error("❌ Error calling OpenRouter:", error);
    throw error;
  }
}

export async function GET(request, { params }) {
  try {
    const { universityName } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log("Essay API - University Name:", universityName);
    console.log("Essay API - User ID:", userId);

    const decodedUniversityName = decodeURIComponent(universityName);
    console.log("Essay API - Decoded University Name:", decodedUniversityName);

    // Fetch user's study level preference
    let userStudyLevel = null;
    if (userId) {
      try {
        const userProfile = await prisma.userProfile.findUnique({
          where: { userId: userId },
          select: { studyLevel: true },
        });
        userStudyLevel = userProfile?.studyLevel?.toLowerCase();
        console.log("User's Study Level:", userStudyLevel);
      } catch (profileError) {
        console.warn("Could not fetch user profile:", profileError.message);
      }
    }

    // Build program filter conditions
    const programWhereConditions = {
      isActive: true,
    };

    // Add study level filter if available
    if (userStudyLevel) {
      programWhereConditions.degreeType = {
        equals: userStudyLevel,
        mode: "insensitive",
      };
    }

    // Fetch university with programs - NO DEPARTMENT RELATION
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
          where: programWhereConditions,
          include: {
            // REMOVED: departments relation that was causing the error
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
                      where: { essayVersionId: null },
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

    // Build workspace data - NO DEPARTMENT REFERENCE
    const workspaceData = {
      university: {
        id: university.id,
        name: university.universityName,
        slug: university.slug,
        description: university.shortDescription || university.overview,
        website: university.websiteUrl,
        city: university.city,
        country: university.country,
        color: university.brandColor || "#002147",
      },
      programs: university.programs.map((program) => ({
        id: program.id,
        name: program.programName,
        slug: program.programSlug,
        // REMOVED: departmentName - no longer referencing departments
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
              programId: program.id,
              programName: program.programName,
              universityName: university.universityName,
              userEssay: userEssay
                ? {
                    id: userEssay.id,
                    content: userEssay.content,
                    wordCount: userEssay.wordCount,
                    title: userEssay.title,
                    priority: userEssay.priority,
                    status: userEssay.status,
                    isCompleted: userEssay.isCompleted,
                    completionPercentage: userEssay.completionPercentage,
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
                        aiAnalysis: v.aiResults?.[0] || null,
                      })) || [],
                    aiResults: userEssay.aiResults || [],
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
              return essay && (essay.isCompleted || essay.wordCount >= prompt.wordLimit * 0.8);
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
      studyLevel: userStudyLevel,
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

    if (!essayId) {
      return NextResponse.json(
        { error: "Essay ID is required" },
        { status: 400 }
      );
    }

    const completionResult = await checkEssayCompletion(
      essayId,
      wordCount || 0,
      content
    );

    if (!completionResult.success) {
      console.warn("Completion check failed, proceeding with regular update");
    }

    let updatedEssay = completionResult.success ? completionResult.essay : null;

    if (!updatedEssay) {
      const updateData = {
        lastModified: new Date(),
      };

      if (content !== undefined) updateData.content = content;
      if (wordCount !== undefined) updateData.wordCount = wordCount;
      if (title !== undefined) updateData.title = title;
      if (priority !== undefined) updateData.priority = priority;

      if (isAutoSave) {
        updateData.lastAutoSaved = new Date();
      }

      updatedEssay = await prisma.essay.update({
        where: { id: essayId },
        data: updateData,
        include: {
          versions: { orderBy: { timestamp: "desc" }, take: 10 },
          aiResults: {
            where: { essayVersionId: null },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
          essayPrompt: true,
        },
      });
    } else {
      const additionalUpdates = {};
      if (title !== undefined) additionalUpdates.title = title;
      if (priority !== undefined) additionalUpdates.priority = priority;
      if (isAutoSave) additionalUpdates.lastAutoSaved = new Date();

      if (Object.keys(additionalUpdates).length > 0) {
        updatedEssay = await prisma.essay.update({
          where: { id: essayId },
          data: additionalUpdates,
          include: {
            versions: { orderBy: { timestamp: "desc" }, take: 10 },
            aiResults: {
              where: { essayVersionId: null },
              orderBy: { createdAt: "desc" },
              take: 3,
            },
            essayPrompt: true,
          },
        });
      }
    }

    if (isAutoSave && content && wordCount > 0) {
      const lastVersion = updatedEssay.versions[0];
      const shouldCreateAutoSave =
        !lastVersion ||
        (wordCount > 0 &&
          (Math.abs(wordCount - lastVersion.wordCount) >= 50 ||
            new Date() - new Date(lastVersion.timestamp) > 15 * 60 * 1000));

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
              : "Initial content",
          },
        });
      }
    }

    return NextResponse.json({
      essay: updatedEssay,
    });
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

async function createEssay(data) {
  const { userId, programId, essayPromptId, applicationId } = data;

  console.log("Creating essay with:", { userId, programId, essayPromptId });

  if (!userId || !programId || !essayPromptId) {
    return NextResponse.json(
      {
        error: "Missing required fields: userId, programId, essayPromptId",
      },
      { status: 400 }
    );
  }

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

async function updateEssay(data) {
  const { essayId, content, wordCount, title, priority, status } = data;

  if (!essayId) {
    return NextResponse.json(
      { error: "Essay ID is required" },
      { status: 400 }
    );
  }

  const result = await checkEssayCompletion(essayId, wordCount || 0, content);

  if (result.success) {
    const additionalUpdates = {};
    if (title !== undefined) additionalUpdates.title = title;
    if (priority !== undefined) additionalUpdates.priority = priority;
    if (status !== undefined) additionalUpdates.status = status;

    if (Object.keys(additionalUpdates).length > 0) {
      const finalEssay = await prisma.essay.update({
        where: { id: essayId },
        data: additionalUpdates,
        include: {
          versions: { orderBy: { timestamp: "desc" }, take: 10 },
          aiResults: {
            where: { essayVersionId: null },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      });
      return NextResponse.json({ essay: finalEssay });
    }

    return NextResponse.json({ essay: result.essay });
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

async function saveVersion(data) {
  const {
    essayId,
    content,
    wordCount,
    label,
    isAutoSave = false,
    changeDescription,
    performAiAnalysis = false,
    prompt,
  } = data;

  if (!essayId) {
    return NextResponse.json(
      { error: "Essay ID is required" },
      { status: 400 }
    );
  }

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

  const lastVersion = await prisma.essayVersion.findFirst({
    where: { essayId },
    orderBy: { timestamp: "desc" },
  });

  const changesSinceLastVersion = lastVersion
    ? `${wordCount - lastVersion.wordCount > 0 ? "+" : ""}${
        wordCount - lastVersion.wordCount
      } words`
    : "Initial version";

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

  await prisma.essay.update({
    where: { id: essayId },
    data: { lastModified: new Date() },
  });

  let aiAnalysis = null;

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
    }
  }

  return NextResponse.json({
    version: {
      ...version,
      aiAnalysis,
    },
    aiAnalysis,
  });
}

async function autoSave(data) {
  const { essayId, content, wordCount } = data;

  if (!essayId) {
    return NextResponse.json(
      { error: "Essay ID is required" },
      { status: 400 }
    );
  }

  const result = await checkEssayCompletion(essayId, wordCount || 0, content);

  if (result.success) {
    const finalEssay = await prisma.essay.update({
      where: { id: essayId },
      data: { lastAutoSaved: new Date() },
    });

    const lastVersion = await prisma.essayVersion.findFirst({
      where: { essayId },
      orderBy: { timestamp: "desc" },
    });

    const shouldCreateAutoSave =
      !lastVersion ||
      (wordCount > 0 &&
        (Math.abs(wordCount - lastVersion.wordCount) >= 50 ||
          new Date() - new Date(lastVersion.timestamp) > 15 * 60 * 1000));

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

    return NextResponse.json({ success: true, essay: result.essay });
  }

  const updatedEssay = await prisma.essay.update({
    where: { id: essayId },
    data: {
      content: content || "",
      wordCount: wordCount || 0,
      lastAutoSaved: new Date(),
      lastModified: new Date(),
    },
  });

  return NextResponse.json({ success: true, essay: updatedEssay });
}

async function getEssayAnalytics(data) {
  const { essayId, userId } = data;

  try {
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

    if (!essay.essayPrompt) {
      console.warn(`Essay ${essayId} has null essayPrompt`);
      return NextResponse.json(
        {
          error: "Essay prompt data is missing",
          essayId,
          suggestion:
            "This essay may be orphaned. Consider reassigning it to a valid prompt.",
        },
        { status: 400 }
      );
    }

    // FIXED: Corrected the NOT clause structure
    const allUserEssays = userId
      ? await prisma.essay.findMany({
          where: {
            userId,
            essayPromptId: {
              not: null, // This is the correct syntax for NOT NULL
            },
          },
          include: {
            essayPrompt: true,
          },
        })
      : [];

    // Filter out any essays that still have null essayPrompt after the query
    const validUserEssays = allUserEssays.filter((e) => e.essayPrompt !== null);

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
        readingTime: Math.ceil(essay.wordCount / 200),
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
                  Math.max(
                    1,
                    essay.content
                      .split(/[.!?]+/)
                      .filter((s) => s.trim().length > 0).length
                  )
              )
            : 0,
      },
      versions: {
        total: essay.versions.length,
        autoSaves: essay.versions.filter((v) => v.isAutoSave).length,
        manualSaves: essay.versions.filter((v) => !v.isAutoSave).length,
        latestVersion: essay.versions[0] || null,
        analyzedVersions: essay.versions.filter(
          (v) => v.aiResults && v.aiResults.length > 0
        ).length,
      },
      progress: {
        overall:
          validUserEssays.length > 0
            ? validUserEssays.reduce(
                (acc, e) =>
                  acc +
                  Math.min(100, (e.wordCount / e.essayPrompt.wordLimit) * 100),
                0
              ) / validUserEssays.length
            : 0,
        completed: validUserEssays.filter(
          (e) => e.wordCount >= e.essayPrompt.wordLimit * 0.8
        ).length,
        total: validUserEssays.length,
        orphaned: allUserEssays.length - validUserEssays.length,
      },
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error("Error getting analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to get analytics",
        details: error.message,
        essayId,
      },
      { status: 500 }
    );
  }
}

async function deleteVersion(data) {
  const { versionId, essayId } = data;

  if (!versionId || !essayId) {
    return NextResponse.json(
      { error: "Version ID and Essay ID are required" },
      { status: 400 }
    );
  }

  try {
    const versionCount = await prisma.essayVersion.count({
      where: { essayId },
    });

    if (versionCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the only version" },
        { status: 400 }
      );
    }

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

async function getVersionAnalyses(data) {
  const { essayId } = data;

  try {
    const analyses = await prisma.aIResult.findMany({
      where: {
        essayId,
        essayVersionId: { not: null },
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

async function performAIAnalysis(data) {
  const {
    essayId,
    versionId = null,
    content,
    prompt,
    analysisTypes = ["comprehensive"],
  } = data;

  console.log(
    "Starting AI analysis for essay:",
    essayId,
    "version:",
    versionId
  );

  if (!essayId || !content) {
    return NextResponse.json(
      { error: "Essay ID and content are required" },
      { status: 400 }
    );
  }

  if (content.length < 50) {
    return NextResponse.json(
      { error: "Content too short for analysis (minimum 50 characters)" },
      { status: 400 }
    );
  }

  // ============================================================
  // UPDATED: CHECK OPENROUTER API KEY INSTEAD OF GOOGLE GEMINI
  // ============================================================
  if (!OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY not configured");
    const storedAnalysis = await getStoredAnalysis(essayId, versionId);
    if (storedAnalysis) {
      return NextResponse.json({
        success: true,
        analysis: storedAnalysis,
        cached: true,
        message: "Using stored analysis - AI service unavailable",
      });
    }
    return NextResponse.json(
      { error: "AI service not configured and no stored analysis available" },
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

    // Check for recent analysis
    const recentAnalysis = await prisma.aIResult.findFirst({
      where: {
        essayId,
        essayVersionId: versionId,
        status: "completed",
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentAnalysis) {
      const transformedAnalysis =
        transformStoredAnalysisToComponentFormat(recentAnalysis);
      return NextResponse.json({
        success: true,
        analysis: transformedAnalysis,
        aiResult: recentAnalysis,
        cached: true,
        processingTime: Date.now() - startTime,
      });
    }

    // Calculate essay metrics for context
    const wordCount = content
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const paragraphs = content
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 0);
    const completionRatio =
      essay.essayPrompt.wordLimit > 0
        ? wordCount / essay.essayPrompt.wordLimit
        : 0;

    // Get university tier and competitiveness
    const universityTier = getUniversityTier(
      essay.program.university.universityName
    );
    const programType = essay.program.degreeType.toLowerCase();

    // ENHANCED ANALYSIS PROMPT - Much more sophisticated and context-aware
    const analysisPrompt = `
You are a Senior Admissions Officer at ${
      essay.program.university.universityName
    } with 15+ years of experience evaluating ${
      essay.program.degreeType
    } applications. You have read thousands of essays and understand exactly what makes candidates stand out in this highly competitive process.

INSTITUTIONAL CONTEXT:
- Institution: ${
      essay.program.university.universityName
    } (${universityTier} tier university)
- Program: ${essay.program.programName} (${essay.program.degreeType})
- Competition Level: ${getCompetitionLevel(universityTier, programType)}
- Admission Rate: ~${getAdmissionRate(universityTier, programType)}%
- Essay Prompt: "${prompt || essay.essayPrompt.promptText}"
- Word Limit: ${essay.essayPrompt.wordLimit}
- Current Word Count: ${wordCount}

APPLICANT'S ESSAY:
${content}

EVALUATION FRAMEWORK:

As an admissions officer, I need to assess this essay against these specific criteria for ${
      essay.program.degreeType
    } programs at ${universityTier}-tier institutions:

1. PROMPT ADHERENCE: Does this directly answer what we asked? Many applicants fail here.
2. NARRATIVE SOPHISTICATION: Is this a compelling story or generic statements?
3. LEADERSHIP EVIDENCE: Can I see concrete examples of impact and initiative?
4. INTELLECTUAL CURIOSITY: Does this show deep thinking and genuine interest?
5. PROGRAM FIT: Why specifically our program? Generic essays are rejected.
6. DIFFERENTIATION: What makes this applicant unique among thousands?
7. MATURITY & SELF-AWARENESS: Does this show genuine reflection and growth?
8. COMMUNICATION SKILLS: Can they articulate complex ideas clearly?

SCORING PHILOSOPHY:
- 85-100: Exceptional essays I'd champion in committee meetings
- 75-84: Strong essays that advance to final rounds
- 65-74: Good essays that need refinement to be competitive
- 55-64: Average essays that struggle in our applicant pool
- 45-54: Weak essays with significant issues
- Below 45: Essays with fundamental problems

ANALYSIS REQUIREMENTS:

1. Read the ENTIRE essay carefully, noting specific phrases, examples, and arguments
2. Evaluate against the exact prompt requirements
3. Compare to typical ${programType} essays at ${universityTier}-tier schools
4. Identify specific sections that work/don't work with exact quotes
5. Consider the applicant's career goals and program alignment
6. Assess narrative arc and storytelling effectiveness
7. Look for red flags that would concern admissions committees
8. Evaluate authenticity vs. generic business school speak

Return ONLY valid JSON in this exact format:

{
  "overallScore": [Realistic score 25-95 based on actual essay quality and competition level],
  "structureScore": [25-95: logical flow, transitions, essay organization],
  "contentRelevance": [25-95: how directly and completely this answers the prompt],
  "narrativeFlow": [25-95: storytelling quality, engagement, coherence],
  "leadershipEmphasis": [25-95: concrete leadership examples with measurable impact],
  "specificityScore": [25-95: specific examples vs. vague generalizations],
  "readabilityScore": [25-95: clarity, grammar, sentence variety, word choice],
  "sentenceCount": ${sentences.length},
  "paragraphCount": ${Math.max(paragraphs.length, 1)},
  "avgSentenceLength": ${
    sentences.length > 0
      ? Math.round((wordCount / sentences.length) * 10) / 10
      : 0
  },
  "complexWordCount": [count sophisticated vocabulary words],
  "passiveVoiceCount": [estimate passive voice instances],
  "grammarIssues": [count grammar/style issues 0-15],
  "suggestions": [
    {
      "id": "1",
      "type": "critical|warning|improvement|strength",
      "priority": "high|medium|low",
      "title": "Specific issue title (max 60 chars)",
      "description": "Detailed explanation with specific quotes/examples from the essay (150-250 chars)",
      "action": "Concrete, actionable steps with examples of how to improve (100-200 chars)"
    }
    // REQUIREMENTS:
    // - Include 6-10 suggestions minimum
    // - Reference specific phrases/sentences from the essay
    // - At least 1-2 critical issues if essay quality is poor
    // - At least 2-3 warnings for common problems
    // - 3-4 improvement opportunities with specific examples
    // - 1-2 genuine strengths (if any exist)
    // - Mix priorities: 2-3 high, 3-4 medium, 1-2 low
    // - Be brutally honest but constructive
    // - Focus on what would actually matter in admissions
  ]
}

CRITICAL INSTRUCTIONS:
- Quote specific phrases from the essay in your suggestions
- Be as specific as a real admissions officer reviewing this application
- Consider this essay against thousands of others you've seen
- Don't inflate scores - be realistic about admission chances
- Focus on issues that would actually impact admission decisions
- Identify both surface-level and deep structural problems
- Recognize when content is generic vs. authentic and personal
- Consider cultural fit and program-specific requirements
- Point out missed opportunities to demonstrate key qualities
- Be constructive but honest about significant weaknesses`;

    let result;
    try {
      // ============================================================
      // UPDATED: CALL OPENROUTER INSTEAD OF GOOGLE GEMINI DIRECTLY
      // ============================================================
      result = await callGeminiViaOpenRouter(analysisPrompt, 4096);
    } catch (apiError) {
      console.error("OpenRouter API error:", apiError);
      const storedAnalysis = await getStoredAnalysis(essayId, versionId);
      if (storedAnalysis) {
        return NextResponse.json({
          success: true,
          analysis: storedAnalysis,
          cached: true,
          message: "Using stored analysis - API request failed",
        });
      }
      const fallbackAnalysis = generateRealisticFallbackAnalysis(
        content,
        wordCount,
        essay.essayPrompt.wordLimit,
        prompt,
        essay.program.degreeType,
        completionRatio
      );
      await saveAnalysisToDatabase(
        essayId,
        versionId,
        fallbackAnalysis,
        Date.now() - startTime,
        "fallback",
        apiError.message
      );
      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis,
        processingTime: Date.now() - startTime,
        usedFallback: true,
      });
    }

    const processingTime = Date.now() - startTime;
    const responseText = result.text; // Changed from result.response.text()

    let analysisData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in AI response");
      }
    } catch (parseError) {
      console.warn("JSON parsing failed:", parseError);
      const storedAnalysis = await getStoredAnalysis(essayId, versionId);
      if (storedAnalysis) {
        return NextResponse.json({
          success: true,
          analysis: storedAnalysis,
          cached: true,
          message: "Using stored analysis - AI response parsing failed",
        });
      }
      analysisData = generateRealisticFallbackAnalysis(
        content,
        wordCount,
        essay.essayPrompt.wordLimit,
        prompt,
        essay.program.degreeType,
        completionRatio
      );
    }

    // Validate and normalize the analysis
    analysisData = validateAndNormalizeAnalysis(
      analysisData,
      content,
      essay.essayPrompt.wordLimit
    );

    const aiResult = await saveAnalysisToDatabase(
      essayId,
      versionId,
      analysisData,
      processingTime,
      "gemini-via-openrouter" // Updated provider name
    );

    return NextResponse.json({
      success: true,
      analysis: analysisData,
      aiResult,
      processingTime,
      versionId,
    });
  } catch (error) {
    console.error("Error performing AI analysis:", error);
    return NextResponse.json(
      { error: "Analysis failed and no stored analysis available" },
      { status: 500 }
    );
  }
}

// Helper functions to add context about university tiers and competition levels
function getUniversityTier(universityName) {
  const universityLower = universityName.toLowerCase();

  // Ivy League and equivalent
  if (
    [
      "harvard",
      "stanford",
      "mit",
      "yale",
      "princeton",
      "columbia",
      "wharton",
      "booth",
      "kellogg",
      "sloan",
    ].some((school) => universityLower.includes(school))
  ) {
    return "Elite";
  }

  // Top tier
  if (
    [
      "berkeley",
      "michigan",
      "ucla",
      "nyu",
      "duke",
      "northwestern",
      "chicago",
      "cornell",
      "dartmouth",
      "brown",
    ].some((school) => universityLower.includes(school))
  ) {
    return "Top";
  }

  // High tier
  if (
    [
      "texas",
      "virginia",
      "washington",
      "georgia tech",
      "carnegie mellon",
      "johns hopkins",
    ].some((school) => universityLower.includes(school))
  ) {
    return "High";
  }

  return "Competitive";
}

function getCompetitionLevel(tier, programType) {
  const competitionMatrix = {
    Elite: {
      mba: "Extremely High (Top 1% of global applicants)",
      masters: "Extremely High (Top 2% of applicants)",
      phd: "Extremely High (Top 1% with research excellence)",
      undergraduate: "Extremely High (Top 3% of high school students)",
    },
    Top: {
      mba: "Very High (Top 5% of applicants)",
      masters: "Very High (Top 8% of applicants)",
      phd: "Very High (Top 3% with strong research)",
      undergraduate: "Very High (Top 10% of high school students)",
    },
    High: {
      mba: "High (Top 15% of applicants)",
      masters: "High (Top 20% of applicants)",
      phd: "High (Top 10% with research potential)",
      undergraduate: "High (Top 20% of high school students)",
    },
    Competitive: {
      mba: "Moderate to High (Top 30% of applicants)",
      masters: "Moderate (Top 40% of applicants)",
      phd: "Moderate to High (Top 25% with research interest)",
      undergraduate: "Moderate (Top 40% of high school students)",
    },
  };

  return competitionMatrix[tier]?.[programType] || "High Competition";
}

function getAdmissionRate(tier, programType) {
  const admissionMatrix = {
    Elite: { mba: "6-12", masters: "5-15", phd: "3-8", undergraduate: "3-8" },
    Top: { mba: "12-25", masters: "15-30", phd: "8-15", undergraduate: "8-20" },
    High: {
      mba: "25-40",
      masters: "30-50",
      phd: "15-25",
      undergraduate: "20-35",
    },
    Competitive: {
      mba: "40-60",
      masters: "50-70",
      phd: "25-40",
      undergraduate: "35-55",
    },
  };

  return admissionMatrix[tier]?.[programType] || "30-50";
}

// Improved fallback analysis with realistic scoring
function generateRealisticFallbackAnalysis(
  content,
  wordCount,
  wordLimit,
  prompt,
  degreeType = "Unknown",
  completionRatio = 0
) {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = content
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0);
  const words = content.split(/\s+/).filter((w) => w.length > 0);

  const sentenceCount = sentences.length;
  const paragraphCount = Math.max(1, paragraphs.length);
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  // More realistic base scoring
  let baseScore = 45; // Start lower

  // Word count impact (more nuanced)
  if (completionRatio >= 0.8 && completionRatio <= 1.0) baseScore += 15;
  else if (completionRatio >= 0.6) baseScore += 8;
  else if (completionRatio < 0.3) baseScore -= 10;

  // Structure impact
  if (paragraphCount >= 4) baseScore += 8;
  else if (paragraphCount >= 3) baseScore += 5;
  else if (paragraphCount < 2) baseScore -= 8;

  // Sentence variety
  if (avgSentenceLength >= 15 && avgSentenceLength <= 25) baseScore += 5;
  else if (avgSentenceLength < 10 || avgSentenceLength > 30) baseScore -= 5;

  // Content depth indicators
  const hasSpecificExamples =
    /\b(specifically|for example|in particular|such as)\b/i.test(content);
  const hasNumbers =
    /\b\d+(%|dollars?|years?|months?|people|students?|percent)\b/i.test(
      content
    );
  const hasActionVerbs =
    /(led|managed|created|developed|implemented|achieved|improved)/gi.test(
      content
    );

  if (hasSpecificExamples) baseScore += 8;
  if (hasNumbers) baseScore += 6;
  if (hasActionVerbs) baseScore += 5;

  const overallScore = Math.max(
    25,
    Math.min(85, baseScore + Math.floor(Math.random() * 10 - 5))
  );

  const suggestions = [];
  let suggestionId = 1;

  // Generate realistic suggestions based on analysis
  if (completionRatio < 0.7) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "critical",
      priority: "high",
      title: "Essay significantly under word limit",
      description: `At ${Math.round(
        completionRatio * 100
      )}% of target length, your essay appears incomplete to admissions readers.`,
      action:
        "Expand with specific examples, deeper analysis, and more detailed storytelling.",
    });
  }

  if (paragraphCount < 3) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "warning",
      priority: "medium",
      title: "Poor paragraph structure",
      description:
        "Essays need clear organization with distinct paragraphs for different ideas.",
      action:
        "Break content into 4-5 focused paragraphs with clear topic sentences.",
    });
  }

  if (!hasSpecificExamples) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "improvement",
      priority: "high",
      title: "Add concrete examples",
      description:
        "Generic statements weaken your narrative impact and memorability.",
      action:
        "Include specific situations, numbers, names, and measurable outcomes.",
    });
  }

  if (degreeType?.toLowerCase().includes("mba") && !hasActionVerbs) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "improvement",
      priority: "high",
      title: "Strengthen leadership language",
      description:
        "MBA essays must demonstrate leadership through action-oriented language.",
      action:
        "Use strong verbs like 'led,' 'implemented,' 'achieved' with specific results.",
    });
  }

  // Always include at least one strength if possible
  if (overallScore >= 50) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "strength",
      priority: "medium",
      title: "Clear writing foundation",
      description:
        "Your essay demonstrates good basic writing skills and stays on topic.",
      action:
        "Build on this foundation by adding more specific details and personal insights.",
    });
  }

  return {
    overallScore,
    suggestions,
    structureScore: Math.max(
      20,
      Math.min(90, baseScore + (paragraphCount >= 4 ? 10 : -10))
    ),
    contentRelevance: Math.max(
      30,
      Math.min(85, baseScore + (hasSpecificExamples ? 8 : -12))
    ),
    narrativeFlow: Math.max(
      25,
      Math.min(80, baseScore + (avgSentenceLength > 12 ? 5 : -8))
    ),
    leadershipEmphasis: degreeType?.toLowerCase().includes("mba")
      ? Math.max(20, Math.min(85, baseScore + (hasActionVerbs ? 10 : -15)))
      : Math.max(40, Math.min(80, baseScore)),
    specificityScore: Math.max(
      20,
      Math.min(85, baseScore + (hasNumbers ? 15 : -15))
    ),
    readabilityScore: Math.max(40, Math.min(90, baseScore + 5)),
    sentenceCount,
    paragraphCount,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    complexWordCount: words.filter((w) => w.length > 7).length,
    passiveVoiceCount: sentences.filter((s) =>
      /(was|were|been|being)\s+\w+ed\b/i.test(s)
    ).length,
    grammarIssues:
      Math.floor(sentenceCount * 0.05) + Math.floor(Math.random() * 3),
  };
}

async function getStoredAnalysis(essayId, versionId = null) {
  try {
    const storedResult = await prisma.aIResult.findFirst({
      where: {
        essayId,
        essayVersionId: versionId,
        status: "completed",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!storedResult) return null;
    return transformStoredAnalysisToComponentFormat(storedResult);
  } catch (error) {
    console.error("Error fetching stored analysis:", error);
    return null;
  }
}

function transformStoredAnalysisToComponentFormat(aiResult) {
  try {
    const suggestions = JSON.parse(aiResult.suggestions || "[]");
    const strengths = JSON.parse(aiResult.strengths || "[]");
    const improvements = JSON.parse(aiResult.improvements || "[]");
    const warnings = JSON.parse(aiResult.warnings || "[]");

    let allSuggestions = [];
    if (suggestions.length > 0 && suggestions.some((s) => s.type)) {
      allSuggestions = suggestions;
    } else {
      allSuggestions = [
        ...suggestions.map((s, idx) => ({
          id: s.id || `suggestion_${idx}`,
          type: s.type || "improvement",
          title: typeof s === "string" ? s : s.title || "Suggestion",
          description: typeof s === "string" ? s : s.description || s,
          action: typeof s === "object" ? s.action : undefined,
          priority: "medium",
        })),
        ...strengths.map((s, idx) => ({
          id: `strength_${idx}`,
          type: "strength",
          title: typeof s === "string" ? s : s.title || "Strength",
          description: typeof s === "string" ? s : s.description || s,
          action: typeof s === "object" ? s.action : undefined,
          priority: "medium",
        })),
        ...improvements.map((s, idx) => ({
          id: `improvement_${idx}`,
          type: "improvement",
          title: typeof s === "string" ? s : s.title || "Improvement",
          description: typeof s === "string" ? s : s.description || s,
          action: typeof s === "object" ? s.action : undefined,
          priority: "medium",
        })),
        ...warnings.map((s, idx) => ({
          id: `warning_${idx}`,
          type: s.severity === "critical" ? "critical" : "warning",
          title: typeof s === "string" ? s : s.title || "Warning",
          description: typeof s === "string" ? s : s.description || s,
          action: typeof s === "object" ? s.action : undefined,
          priority: s.severity === "critical" ? "high" : "medium",
        })),
      ];
    }

    return {
      overallScore: aiResult.overallScore || 50,
      suggestions: allSuggestions,
      structureScore: aiResult.structureScore || 50,
      contentRelevance: aiResult.contentRelevance || 50,
      narrativeFlow: aiResult.narrativeFlow || 50,
      leadershipEmphasis: aiResult.leadershipEmphasis || 50,
      specificityScore: aiResult.specificityScore || 50,
      readabilityScore: aiResult.readabilityScore || 50,
      sentenceCount: aiResult.sentenceCount || 0,
      paragraphCount: aiResult.paragraphCount || 0,
      avgSentenceLength: aiResult.avgSentenceLength || 0,
      complexWordCount: aiResult.complexWordCount || 0,
      passiveVoiceCount: aiResult.passiveVoiceCount || 0,
      grammarIssues: aiResult.grammarIssues || 0,
      createdAt: aiResult.createdAt,
      processingTime: aiResult.processingTime,
    };
  } catch (error) {
    console.error("Error transforming stored analysis:", error);
    return null;
  }
}

function validateAndNormalizeAnalysis(analysisData, content, wordLimit) {
  const wordCount = content.split(" ").length;
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = content.split("\n").filter((p) => p.trim().length > 0);

  return {
    overallScore: Math.max(0, Math.min(100, analysisData.overallScore || 50)),
    suggestions: Array.isArray(analysisData.suggestions)
      ? analysisData.suggestions.map((s, idx) => ({
          id: s.id || `suggestion_${idx}`,
          type: ["critical", "warning", "improvement", "strength"].includes(
            s.type
          )
            ? s.type
            : "improvement",
          priority: ["high", "medium", "low"].includes(s.priority)
            ? s.priority
            : "medium",
          title: (s.title || "Suggestion").substring(0, 80),
          description: s.description || "No description provided",
          action: s.action || undefined,
        }))
      : [],
    structureScore: Math.max(
      0,
      Math.min(100, analysisData.structureScore || 50)
    ),
    contentRelevance: Math.max(
      0,
      Math.min(100, analysisData.contentRelevance || 50)
    ),
    narrativeFlow: Math.max(0, Math.min(100, analysisData.narrativeFlow || 50)),
    leadershipEmphasis: Math.max(
      0,
      Math.min(100, analysisData.leadershipEmphasis || 50)
    ),
    specificityScore: Math.max(
      0,
      Math.min(100, analysisData.specificityScore || 50)
    ),
    readabilityScore: Math.max(
      0,
      Math.min(100, analysisData.readabilityScore || 50)
    ),
    sentenceCount: analysisData.sentenceCount || sentences.length,
    paragraphCount:
      analysisData.paragraphCount || Math.max(1, paragraphs.length),
    avgSentenceLength:
      analysisData.avgSentenceLength ||
      (sentences.length > 0
        ? Math.round((wordCount / sentences.length) * 10) / 10
        : 0),
    complexWordCount:
      analysisData.complexWordCount ||
      content.split(" ").filter((w) => w.length > 6).length,
    passiveVoiceCount:
      analysisData.passiveVoiceCount ||
      sentences.filter(
        (s) =>
          s.includes(" was ") || s.includes(" were ") || s.includes(" been ")
      ).length,
    grammarIssues: analysisData.grammarIssues || 0,
  };
}

async function saveAnalysisToDatabase(
  essayId,
  versionId,
  analysisData,
  processingTime,
  provider = "gemini",
  errorMessage = null
) {
  try {
    return await prisma.aIResult.create({
      data: {
        essayId,
        essayVersionId: versionId,
        analysisType: "comprehensive",
        overallScore: analysisData.overallScore,
        suggestions: JSON.stringify(analysisData.suggestions),
        strengths: JSON.stringify(
          analysisData.suggestions.filter((s) => s.type === "strength")
        ),
        improvements: JSON.stringify(
          analysisData.suggestions.filter((s) => s.type === "improvement")
        ),
        warnings: JSON.stringify(
          analysisData.suggestions.filter((s) =>
            ["critical", "warning"].includes(s.type)
          )
        ),
        // ============================================================
        // UPDATED: MODIFIED MODEL NAME TO INDICATE OPENROUTER USAGE
        // ============================================================
        aiProvider: provider,
        modelUsed:
          provider === "gemini" ? "gemini-2.5-flash-lite (via OpenRouter)" : "local-analysis",
        promptVersion: "3.0",
        status: errorMessage ? "failed" : "completed",
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
        errorMessage,
      },
    });
  } catch (error) {
    console.error("Error saving analysis:", error);
    return null;
  }
}

function generateAdvancedFallbackAnalysis(
  content,
  wordCount,
  wordLimit,
  prompt,
  degreeType = "Unknown"
) {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = content.split("\n").filter((p) => p.trim().length > 0);
  const words = content.split(/\s+/).filter((w) => w.length > 0);

  const sentenceCount = sentences.length;
  const paragraphCount = Math.max(1, paragraphs.length);
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  const completionRatio = wordLimit > 0 ? wordCount / wordLimit : 0;

  const suggestions = [];
  let suggestionId = 1;

  if (completionRatio < 0.7) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "warning",
      priority: "high",
      title: "Essay Length Below Target",
      description: `Your essay is currently ${Math.round(
        completionRatio * 100
      )}% of the recommended length. Admissions officers expect essays that fully utilize the word limit to demonstrate thoroughness and attention to detail.`,
      action:
        "Expand your examples with specific details, add more supporting evidence, or include additional relevant experiences that strengthen your narrative.",
      impact: "high",
    });
  } else if (completionRatio > 1.05) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "critical",
      priority: "high",
      title: "Essay Exceeds Word Limit",
      description:
        "Your essay exceeds the word limit, which may result in automatic rejection or negative impression with admissions committees.",
      action:
        "Edit ruthlessly to remove redundant phrases, combine similar ideas, and focus on your strongest examples while staying within the limit.",
      impact: "high",
    });
  }

  if (paragraphCount < 3) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "improvement",
      priority: "medium",
      title: "Consider Better Paragraph Structure",
      description:
        "Your essay would benefit from clearer paragraph breaks to improve readability and logical flow.",
      action:
        "Organize your ideas into distinct paragraphs with clear topic sentences and supporting details.",
      impact: "medium",
    });
  }

  if (avgSentenceLength < 12) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "improvement",
      priority: "low",
      title: "Enhance Sentence Variety",
      description:
        "Your sentences tend to be quite short. Varying sentence length can improve flow and engagement.",
      action:
        "Combine some shorter sentences and add more complex sentence structures to create better rhythm.",
      impact: "low",
    });
  }

  if (degreeType?.toLowerCase().includes("mba")) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "improvement",
      priority: "high",
      title: "Strengthen Leadership Examples",
      description:
        "MBA essays should prominently feature specific leadership experiences with quantifiable results.",
      action:
        "Include concrete examples of times you led teams, managed projects, or drove organizational change with measurable outcomes.",
      impact: "high",
    });
  }

  suggestions.push({
    id: (suggestionId++).toString(),
    type: "strength",
    priority: "medium",
    title: "Good Essay Foundation",
    description:
      "Your essay demonstrates a solid understanding of the prompt and maintains focus on relevant topics.",
    action:
      "Continue building on this strong foundation by adding more specific details and personal insights.",
    impact: "medium",
  });

  const baseScore = Math.min(
    90,
    Math.max(
      40,
      completionRatio * 30 +
        Math.min(paragraphCount, 5) * 8 +
        (sentenceCount > 0 ? 20 : 0) +
        10
    )
  );

  const overallScore = Math.round(baseScore);

  return {
    overallScore,
    suggestions,
    strengths: [
      "Essay addresses the prompt directly",
      "Content is focused and relevant",
      completionRatio > 0.8
        ? "Good use of available word count"
        : "Room to expand on key themes",
    ].filter(Boolean),
    improvements: [
      completionRatio < 0.9 ? "Add more specific examples and details" : null,
      paragraphCount < 4 ? "Improve paragraph structure and transitions" : null,
      "Consider adding more quantifiable achievements",
    ].filter(Boolean),
    warnings:
      completionRatio > 1.05
        ? ["Essay exceeds word limit - immediate editing required"]
        : [],
    readabilityScore: Math.round(
      Math.max(
        50,
        100 - (avgSentenceLength > 25 ? 20 : 0) - (paragraphCount < 3 ? 15 : 0)
      )
    ),
    sentenceCount,
    paragraphCount,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    complexWordCount: Math.round(words.filter((w) => w.length > 6).length),
    passiveVoiceCount: Math.round(
      sentences.filter(
        (s) =>
          s.includes(" was ") || s.includes(" were ") || s.includes(" been ")
      ).length
    ),
    structureScore: Math.round(
      Math.min(
        100,
        paragraphCount * 20 + (sentenceCount > 10 ? 20 : sentenceCount * 2)
      )
    ),
    contentRelevance: Math.round(baseScore + 10),
    narrativeFlow: Math.round(Math.max(40, baseScore - 5)),
    leadershipEmphasis: degreeType?.toLowerCase().includes("mba")
      ? Math.round(baseScore - 15)
      : Math.round(baseScore),
    specificityScore: Math.round(Math.max(30, baseScore - 20)),
    grammarIssues: Math.round(sentenceCount * 0.1),
  };
}

async function performVersionAIAnalysis(data) {
  return await performAIAnalysis(data);
}

async function checkEssayCompletion(essayId, newWordCount, newContent = null) {
  try {
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
      include: {
        essayPrompt: true,
        user: true,
        program: { include: { university: true } },
      },
    });

    if (!essay?.essayPrompt) return { success: false };

    const wordLimit = essay.essayPrompt.wordLimit;
    const completionPercentage = (newWordCount / wordLimit) * 100;

    const COMPLETION_THRESHOLD = 0.9;
    const shouldBeCompleted = newWordCount >= wordLimit * COMPLETION_THRESHOLD;
    const wasCompleted = essay.isCompleted;

    const updateData = {
      wordCount: newWordCount,
      completionPercentage: Math.min(completionPercentage, 100),
      lastModified: new Date(),
    };

    if (newContent !== null) {
      updateData.content = newContent;
    }

    if (shouldBeCompleted && !wasCompleted) {
      updateData.isCompleted = true;
      updateData.completedAt = new Date();
      updateData.status = "COMPLETED";

      console.log(
        `[SILENT] Essay ${essayId} auto-completed at ${newWordCount}/${wordLimit} words`
      );

      try {
        await prisma.essayCompletionLog.create({
          data: {
            essayId,
            userId: essay.userId,
            wordCountAtCompletion: newWordCount,
            wordLimit,
            completionMethod: "AUTO",
            programId: essay.programId,
            universityId: essay.program?.universityId,
            essayPromptTitle: essay.essayPrompt?.promptTitle,
          },
        });
      } catch (logError) {
        console.warn("Failed to log completion:", logError.message);
      }
    } else if (!shouldBeCompleted && wasCompleted) {
      updateData.isCompleted = false;
      updateData.completedAt = null;
      updateData.status = newWordCount > 0 ? "IN_PROGRESS" : "DRAFT";

      console.log(`[SILENT] Essay ${essayId} unmarked as completed`);
    }

    const updatedEssay = await prisma.essay.update({
      where: { id: essayId },
      data: updateData,
      include: {
        versions: { orderBy: { timestamp: "desc" }, take: 10 },
        aiResults: {
          where: { essayVersionId: null },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        essayPrompt: true,
      },
    });

    return {
      success: true,
      essay: updatedEssay,
      completionChanged: shouldBeCompleted !== wasCompleted,
      isCompleted: shouldBeCompleted,
    };
  } catch (error) {
    console.error("[SILENT] Essay completion check failed:", error);
    return { success: false, error: error.message };
  }
}

async function getCompletionStats(userId = null) {
  const whereClause = userId ? { userId } : {};

  const stats = await prisma.essay.aggregate({
    where: whereClause,
    _count: {
      id: true,
      isCompleted: true,
    },
    _avg: {
      completionPercentage: true,
    },
  });

  const completedCount = await prisma.essay.count({
    where: { ...whereClause, isCompleted: true },
  });

  return {
    totalEssays: stats._count.id,
    completedEssays: completedCount,
    completionRate:
      stats._count.id > 0 ? (completedCount / stats._count.id) * 100 : 0,
    averageCompletion: stats._avg.completionPercentage || 0,
  };
}

async function getRecentCompletions(limit = 10) {
  return await prisma.essayCompletionLog.findMany({
    take: limit,
    orderBy: { completedAt: "desc" },
    include: {
      essay: {
        include: {
          essayPrompt: { select: { promptTitle: true } },
          program: {
            include: {
              university: { select: { universityName: true } },
            },
          },
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
}