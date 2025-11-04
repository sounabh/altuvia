// src/app/api/essay/independent/route.js - WITH SESSION AUTHENTICATION

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// ==========================================
// AUTHENTICATION HELPER
// ==========================================
async function authenticateUser(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.userId) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    };
  }
  
  return {
    authenticated: true,
    userId: session.userId,
    userEmail: session.user?.email,
    userName: session.user?.name
  };
}

// Helper function to get or create independent program placeholder
async function getOrCreateIndependentProgram() {
  try {
    let independentProgram = await prisma.program.findFirst({
      where: {
        programSlug: "independent-essay-workspace",
      },
    });

    if (!independentProgram) {
      let placeholderUniversity = await prisma.university.findFirst({
        where: {
          slug: "independent-workspace",
        },
      });

      if (!placeholderUniversity) {
        placeholderUniversity = await prisma.university.create({
          data: {
            universityName: "Independent Workspace",
            slug: "independent-workspace",
            city: "Global",
            country: "International",
            shortDescription: "Personal essay workspace for independent writing",
            isActive: true,
            isFeatured: false,
          },
        });
      }

      independentProgram = await prisma.program.create({
        data: {
          universityId: placeholderUniversity.id,
          programName: "Independent Essays",
          programSlug: "independent-essay-workspace",
          degreeType: "Independent",
          programDescription: "Personal workspace for managing independent essays",
          isActive: true,
        },
      });
    }

    return independentProgram;
  } catch (error) {
    console.error("Error in getOrCreateIndependentProgram:", error);
    throw error;
  }
}

// ==========================================
// GET: Fetch user's independent essays
// ==========================================
export async function GET(request) {
  try {
    // Authenticate user from session
    const auth = await authenticateUser(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const userId = auth.userId;
    console.log("✅ Fetching essays for authenticated user:", userId);

    const independentProgram = await getOrCreateIndependentProgram();

    const essays = await prisma.essay.findMany({
      where: {
        userId,
        programId: independentProgram.id,
      },
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
      orderBy: { lastModified: "desc" },
    });

    // Format response EXACTLY like program workspace
    const workspaceData = {
      university: {
        id: independentProgram.universityId,
        name: "Independent Workspace",
        slug: "independent-workspace",
        description: "Personal essay workspace",
        website: null,
        city: "Global",
        country: "International",
        color: "#3598FE",
      },
      programs: [
        {
          id: independentProgram.id,
          name: "My Independent Essays",
          slug: "independent-essay-workspace",
          departmentName: "Personal",
          degreeType: "Independent",
          description: "Independent essay workspace",
          deadlines: [],
          essays: essays.map((essay) => ({
            promptId: essay.id,
            promptTitle: essay.title,
            promptText: `Personal essay: ${essay.title}`,
            wordLimit: essay.wordLimit,
            minWordCount: 0,
            isMandatory: false,
            userEssay: {
              id: essay.id,
              content: essay.content,
              wordCount: essay.wordCount,
              title: essay.title,
              priority: essay.priority,
              status: essay.status,
              isCompleted: essay.isCompleted,
              completionPercentage: essay.completionPercentage,
              lastModified: essay.lastModified,
              lastAutoSaved: essay.lastAutoSaved,
              createdAt: essay.createdAt,
              versions: essay.versions?.map((v) => ({
                id: v.id,
                label: v.label,
                content: v.content,
                wordCount: v.wordCount,
                timestamp: v.timestamp,
                isAutoSave: v.isAutoSave,
                changesSinceLastVersion: v.changesSinceLastVersion,
                aiAnalysis: v.aiResults?.[0] || null,
              })) || [],
              aiResults: essay.aiResults || [],
            },
          })),
        },
      ],
      stats: {
        totalPrograms: 1,
        totalEssayPrompts: essays.length,
        completedEssays: essays.filter((e) => e.isCompleted).length,
        totalWords: essays.reduce((sum, e) => sum + e.wordCount, 0),
        averageProgress:
          essays.length > 0
            ? essays.reduce((sum, e) => sum + (e.completionPercentage || 0), 0) /
              essays.length
            : 0,
      },
    };

    return NextResponse.json(workspaceData);
  } catch (error) {
    console.error("Error fetching independent essays:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch essays",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// ==========================================
// POST: Handle all essay operations
// ==========================================
export async function POST(request) {
  try {
    // Authenticate user from session
    const auth = await authenticateUser(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { action } = body;

    // Pass userId from session to all operations
    const operationData = {
      ...body,
      userId: auth.userId,
      userEmail: auth.userEmail,
      userName: auth.userName
    };

    switch (action) {
      case "create_essay":
        return await createIndependentEssay(operationData);
      case "save_version":
        return await saveVersion(operationData);
      case "restore_version":
        return await restoreVersion(operationData);
      case "delete_version":
        return await deleteVersion(operationData);
      case "ai_analysis":
        return await performAIAnalysis(operationData);
      case "get_analytics":
        return await getEssayAnalytics(operationData);
      case "delete_essay":
        return await deleteEssay(operationData);
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

// ==========================================
// PUT: Update essay content (auto-save)
// ==========================================
export async function PUT(request) {
  try {
    // Authenticate user from session
    const auth = await authenticateUser(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const userId = auth.userId;
    const body = await request.json();
    const { essayId, content, wordCount, title, priority, isAutoSave = false } = body;

    if (!essayId) {
      return NextResponse.json(
        { error: "Essay ID is required" },
        { status: 400 }
      );
    }

    // Verify essay belongs to authenticated user
    const essayOwnership = await prisma.essay.findFirst({
      where: {
        id: essayId,
        userId: userId
      }
    });

    if (!essayOwnership) {
      return NextResponse.json(
        { error: "Essay not found or access denied" },
        { status: 403 }
      );
    }

    const completionResult = await checkEssayCompletion(
      essayId,
      wordCount || 0,
      content
    );

    let updatedEssay;

    if (completionResult.success) {
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
          },
        });
      } else {
        updatedEssay = completionResult.essay;
      }
    } else {
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
        },
      });
    }

    // Auto-save version if significant changes
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

// ==========================================
// Create independent essay
// ==========================================
async function createIndependentEssay(data) {
  const { userId, title, wordLimit = 500, priority = "medium" } = data;

  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  try {
    console.log("✅ Creating essay for user:", userId);
    
    const independentProgram = await getOrCreateIndependentProgram();

    const essay = await prisma.essay.create({
      data: {
        userId,
        programId: independentProgram.id,
        essayPromptId: null,
        applicationId: null,
        title,
        content: "",
        wordCount: 0,
        wordLimit,
        priority,
        status: "DRAFT",
        autoSaveEnabled: true,
        isCompleted: false,
        completionPercentage: 0,
      },
      include: {
        versions: {
          include: {
            aiResults: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        aiResults: true,
      },
    });

    return NextResponse.json({ essay });
  } catch (error) {
    console.error("Error creating independent essay:", error);
    return NextResponse.json(
      {
        error: "Failed to create essay",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// ==========================================
// Delete essay (with ownership verification)
// ==========================================
async function deleteEssay(data) {
  const { essayId, userId } = data;

  if (!essayId) {
    return NextResponse.json(
      { error: "Essay ID is required" },
      { status: 400 }
    );
  }

  try {
    // Verify ownership
    const essay = await prisma.essay.findFirst({
      where: {
        id: essayId,
        userId: userId
      }
    });

    if (!essay) {
      return NextResponse.json(
        { error: "Essay not found or access denied" },
        { status: 403 }
      );
    }

    // Delete related records
    await prisma.aIResult.deleteMany({
      where: { essayId },
    });

    await prisma.essayVersion.deleteMany({
      where: { essayId },
    });

    await prisma.essayCompletionLog.deleteMany({
      where: { essayId },
    });

    await prisma.essay.delete({
      where: { id: essayId },
    });

    console.log("✅ Essay deleted by user:", userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting essay:", error);
    return NextResponse.json(
      {
        error: "Failed to delete essay",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Save version
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
    userId
  } = data;

  if (!essayId) {
    return NextResponse.json(
      { error: "Essay ID is required" },
      { status: 400 }
    );
  }

  // Verify ownership
  const essay = await prisma.essay.findFirst({
    where: {
      id: essayId,
      userId: userId
    }
  });

  if (!essay) {
    return NextResponse.json(
      { error: "Essay not found or access denied" },
      { status: 403 }
    );
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
        prompt: prompt || essay.title,
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

// Restore version
async function restoreVersion(data) {
  const { essayId, versionId, userId } = data;

  if (!essayId || !versionId) {
    return NextResponse.json(
      { error: "Essay ID and Version ID are required" },
      { status: 400 }
    );
  }

  try {
    // Verify ownership
    const essay = await prisma.essay.findFirst({
      where: {
        id: essayId,
        userId: userId
      }
    });

    if (!essay) {
      return NextResponse.json(
        { error: "Essay not found or access denied" },
        { status: 403 }
      );
    }

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

// Delete version
async function deleteVersion(data) {
  const { versionId, essayId, userId } = data;

  if (!versionId || !essayId) {
    return NextResponse.json(
      { error: "Version ID and Essay ID are required" },
      { status: 400 }
    );
  }

  try {
    // Verify ownership
    const essay = await prisma.essay.findFirst({
      where: {
        id: essayId,
        userId: userId
      }
    });

    if (!essay) {
      return NextResponse.json(
        { error: "Essay not found or access denied" },
        { status: 403 }
      );
    }

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

// Get analytics
async function getEssayAnalytics(data) {
  const { essayId, userId } = data;

  try {
    // Verify ownership
    const essay = await prisma.essay.findFirst({
      where: {
        id: essayId,
        userId: userId
      },
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
    });

    if (!essay) {
      return NextResponse.json(
        { error: "Essay not found or access denied" },
        { status: 403 }
      );
    }

    const allUserEssays = await prisma.essay.findMany({
      where: {
        userId,
      },
    });

    const validUserEssays = allUserEssays.filter(e => e.wordLimit > 0);

    const analytics = {
      completion: {
        percentage: Math.min(
          100,
          (essay.wordCount / essay.wordLimit) * 100
        ),
        wordCount: essay.wordCount,
        wordLimit: essay.wordLimit,
        wordsRemaining: Math.max(
          0,
          essay.wordLimit - essay.wordCount
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
                  Math.max(1, essay.content
                    .split(/[.!?]+/)
                    .filter((s) => s.trim().length > 0).length)
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
                  Math.min(100, (e.wordCount / e.wordLimit) * 100),
                0
              ) / validUserEssays.length
            : 0,
        completed: validUserEssays.filter(
          (e) => e.wordCount >= e.wordLimit * 0.8
        ).length,
        total: validUserEssays.length,
      },
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error("Error getting analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to get analytics",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// AI Analysis - Uses same logic as program route with context adaptation
async function performAIAnalysis(data) {
  const {
    essayId,
    versionId = null,
    content,
    analysisTypes = ["comprehensive"],
    userId
  } = data;

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

  const startTime = Date.now();

  try {
    // Verify ownership
    const essay = await prisma.essay.findFirst({
      where: {
        id: essayId,
        userId: userId
      }
    });

    if (!essay) {
      return NextResponse.json(
        { error: "Essay not found or access denied" },
        { status: 403 }
      );
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
      const transformedAnalysis = transformStoredAnalysisToComponentFormat(recentAnalysis);
      return NextResponse.json({
        success: true,
        analysis: transformedAnalysis,
        aiResult: recentAnalysis,
        cached: true,
        processingTime: Date.now() - startTime,
      });
    }

    // Initialize Gemini
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      const fallbackAnalysis = generateRealisticFallbackAnalysis(
        content,
        essay.wordCount,
        essay.wordLimit,
        essay.title,
        "Independent",
        essay.wordCount / essay.wordLimit
      );

      await saveAnalysisToDatabase(
        essayId,
        versionId,
        fallbackAnalysis,
        Date.now() - startTime,
        "fallback"
      );

      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis,
        processingTime: Date.now() - startTime,
        usedFallback: true,
      });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const completionRatio = essay.wordLimit > 0 ? wordCount / essay.wordLimit : 0;

    const analysisPrompt = `You are an expert writing coach analyzing an independent essay.

ESSAY TITLE: ${essay.title}
WORD COUNT: ${wordCount} / ${essay.wordLimit}
CONTEXT: This is a personal essay for general writing improvement and skill development.

ESSAY CONTENT:
${content}

Provide detailed analysis focusing on:
1. Overall writing quality and clarity
2. Narrative structure and flow
3. Use of specific examples and details
4. Grammar, readability, and style
5. Areas for improvement

Return analysis in this JSON format:
{
  "overallScore": [25-95 based on quality],
  "suggestions": [
    {
      "id": "1",
      "type": "critical|warning|improvement|strength",
      "priority": "high|medium|low",
      "title": "Specific issue title (max 60 chars)",
      "description": "Detailed description with quotes from essay (150-250 chars)",
      "action": "Concrete steps to improve (100-200 chars)"
    }
  ],
  "structureScore": [25-95],
  "contentRelevance": [25-95],
  "narrativeFlow": [25-95],
  "leadershipEmphasis": [25-95],
  "specificityScore": [25-95],
  "readabilityScore": [25-95],
  "sentenceCount": ${sentences.length},
  "paragraphCount": ${Math.max(paragraphs.length, 1)},
  "avgSentenceLength": ${sentences.length > 0 ? Math.round((wordCount / sentences.length) * 10) / 10 : 0},
  "complexWordCount": [count sophisticated words],
  "passiveVoiceCount": [count passive voice],
  "grammarIssues": [0-15]
}

REQUIREMENTS:
- Quote specific phrases from the essay
- Be constructive and specific
- Focus on actionable improvements
- Include 6-10 suggestions minimum
- Mix of critical, warning, improvement, and strength suggestions`;

    const result = await model.generateContent(analysisPrompt);
    const processingTime = Date.now() - startTime;
    const responseText = result.response.text();

    let analysisData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in AI response");
      }
    } catch (parseError) {
      analysisData = generateRealisticFallbackAnalysis(
        content,
        wordCount,
        essay.wordLimit,
        essay.title,
        "Independent",
        completionRatio
      );
    }

    analysisData = validateAndNormalizeAnalysis(
      analysisData,
      content,
      essay.wordLimit
    );

    const aiResult = await saveAnalysisToDatabase(
      essayId,
      versionId,
      analysisData,
      processingTime,
      "gemini-2.0-flash-exp"
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
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}

// Helper function for version AI analysis
async function performVersionAIAnalysis(data) {
  return await performAIAnalysis(data);
}

// Essay completion check
async function checkEssayCompletion(essayId, newWordCount, newContent = null) {
  try {
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
      include: {
        user: true,
      },
    });

    if (!essay) return { success: false };

    const wordLimit = essay.wordLimit;
    const completionPercentage = (newWordCount / wordLimit) * 100;

    const COMPLETION_THRESHOLD = 0.90;
    const shouldBeCompleted = newWordCount >= (wordLimit * COMPLETION_THRESHOLD);
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
      updateData.status = 'COMPLETED';

      try {
        await prisma.essayCompletionLog.create({
          data: {
            essayId,
            userId: essay.userId,
            wordCountAtCompletion: newWordCount,
            wordLimit,
            completionMethod: 'AUTO',
            essayPromptTitle: essay.title,
          }
        });
      } catch (logError) {
        console.warn('Failed to log completion:', logError.message);
      }
    } else if (!shouldBeCompleted && wasCompleted) {
      updateData.isCompleted = false;
      updateData.completedAt = null;
      updateData.status = newWordCount > 0 ? 'IN_PROGRESS' : 'DRAFT';
    }

    const updatedEssay = await prisma.essay.update({
      where: { id: essayId },
      data: updateData,
      include: {
        versions: { orderBy: { timestamp: 'desc' }, take: 10 },
        aiResults: {
          where: { essayVersionId: null },
          orderBy: { createdAt: 'desc' },
          take: 3
        },
      }
    });

    return {
      success: true,
      essay: updatedEssay,
      completionChanged: shouldBeCompleted !== wasCompleted,
      isCompleted: shouldBeCompleted
    };

  } catch (error) {
    console.error('Essay completion check failed:', error);
    return { success: false, error: error.message };
  }
}

// Transform stored analysis to component format
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

// Validate and normalize analysis
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

// Save analysis to database
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
        aiProvider: provider,
        modelUsed:
          provider === "gemini" ? "gemini-2.0-flash-exp" : "local-analysis",
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

// Generate realistic fallback analysis
function generateRealisticFallbackAnalysis(
  content,
  wordCount,
  wordLimit,
  prompt,
  degreeType = "Independent",
  completionRatio = 0
) {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const words = content.split(/\s+/).filter((w) => w.length > 0);

  const sentenceCount = sentences.length;
  const paragraphCount = Math.max(1, paragraphs.length);
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  // Calculate base score with realistic expectations
  let baseScore = 45;
  
  // Word count impact
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
  const hasSpecificExamples = /\b(specifically|for example|in particular|such as)\b/i.test(content);
  const hasNumbers = /\b\d+(%|dollars?|years?|months?|people|students?|percent)\b/i.test(content);
  const hasActionVerbs = /(led|managed|created|developed|implemented|achieved|improved)/gi.test(content);
  
  if (hasSpecificExamples) baseScore += 8;
  if (hasNumbers) baseScore += 6;
  if (hasActionVerbs) baseScore += 5;

  const overallScore = Math.max(25, Math.min(85, baseScore + Math.floor(Math.random() * 10 - 5)));

  // Generate contextual suggestions
  const suggestions = [];
  let suggestionId = 1;

  if (completionRatio < 0.7) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "critical",
      priority: "high",
      title: "Essay significantly under word limit",
      description: `At ${Math.round(completionRatio * 100)}% of target length, your essay appears incomplete. Readers expect full development of ideas.`,
      action: "Expand with specific examples, deeper analysis, and more detailed storytelling to meet the word limit."
    });
  }

  if (completionRatio > 1.05) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "critical",
      priority: "high",
      title: "Essay exceeds word limit",
      description: `Your essay is ${Math.round((completionRatio - 1) * 100)}% over the limit. This may negatively impact reader perception.`,
      action: "Edit ruthlessly to remove redundancy, combine similar ideas, and focus on your strongest points."
    });
  }

  if (paragraphCount < 3) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "warning",
      priority: "medium",
      title: "Improve paragraph structure",
      description: "Essays need clear organization with distinct paragraphs for different ideas to enhance readability.",
      action: "Break content into 4-5 focused paragraphs with clear topic sentences and logical transitions."
    });
  }

  if (!hasSpecificExamples) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "improvement",
      priority: "high",
      title: "Add concrete examples",
      description: "Generic statements weaken your narrative impact and memorability. Specific details make your story come alive.",
      action: "Include specific situations, names, numbers, and measurable outcomes to support your points."
    });
  }

  if (!hasNumbers) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "improvement",
      priority: "medium",
      title: "Quantify your achievements",
      description: "Numbers and metrics add credibility and make your accomplishments more tangible and impressive.",
      action: "Add specific numbers, percentages, timeframes, or scale to demonstrate the impact of your experiences."
    });
  }

  if (avgSentenceLength < 12) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "improvement",
      priority: "low",
      title: "Enhance sentence variety",
      description: "Short sentences can make writing feel choppy. Varying sentence length improves flow and engagement.",
      action: "Combine some shorter sentences and add more complex sentence structures to create better rhythm."
    });
  }

  if (avgSentenceLength > 28) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "warning",
      priority: "medium",
      title: "Simplify long sentences",
      description: "Very long sentences can be difficult to follow. Break them up for better clarity and impact.",
      action: "Look for sentences with multiple clauses and consider splitting them into two clearer sentences."
    });
  }

  // Always include at least one strength
  if (overallScore >= 50) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "strength",
      priority: "medium",
      title: "Clear writing foundation",
      description: "Your essay demonstrates good basic writing skills and stays on topic throughout. This is a solid foundation.",
      action: "Build on this strength by adding more specific details, personal insights, and vivid examples."
    });
  }

  if (hasActionVerbs) {
    suggestions.push({
      id: (suggestionId++).toString(),
      type: "strength",
      priority: "medium",
      title: "Strong action-oriented language",
      description: "You effectively use action verbs that convey initiative and accomplishment. This creates an engaging narrative.",
      action: "Continue using active voice and strong verbs throughout your essay to maintain this energy."
    });
  }

  return {
    overallScore,
    suggestions,
    structureScore: Math.max(20, Math.min(90, baseScore + (paragraphCount >= 4 ? 10 : -10))),
    contentRelevance: Math.max(30, Math.min(85, baseScore + (hasSpecificExamples ? 8 : -12))),
    narrativeFlow: Math.max(25, Math.min(80, baseScore + (avgSentenceLength > 12 ? 5 : -8))),
    leadershipEmphasis: Math.max(40, Math.min(80, baseScore)),
    specificityScore: Math.max(20, Math.min(85, baseScore + (hasNumbers ? 15 : -15))),
    readabilityScore: Math.max(40, Math.min(90, baseScore + 5)),
    sentenceCount,
    paragraphCount,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    complexWordCount: words.filter((w) => w.length > 7).length,
    passiveVoiceCount: sentences.filter(s => 
      /(was|were|been|being)\s+\w+ed\b/i.test(s)
    ).length,
    grammarIssues: Math.floor(sentenceCount * 0.05) + Math.floor(Math.random() * 3)
  };
}