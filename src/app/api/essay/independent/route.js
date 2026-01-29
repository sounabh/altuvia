// src/app/api/essay/independent/route.js - FULLY FIXED VERSION

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ============================================================
// OPENROUTER CONFIGURATION
// ============================================================
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const GEMINI_MODEL = "google/gemini-2.5-flash-lite";

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
    userName: session.user?.name,
    token: session.token
  };
}

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
        "X-Title": "Independent Essay Analysis System",
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

// ==========================================
// FETCH SAVED UNIVERSITIES FROM EXTERNAL API
// ==========================================
async function fetchSavedUniversitiesFromExternalAPI(token) {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
    
    const response = await fetch(`${API_BASE_URL}/api/university/saved`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn("Failed to fetch saved universities from external API:", response.status);
      return { success: false, universities: [] };
    }

    const data = await response.json();
    
    let universities = [];
    if (Array.isArray(data)) {
      universities = data;
    } else if (data.savedUniversities) {
      universities = data.savedUniversities;
    } else if (data.universities) {
      universities = data.universities;
    } else if (data.data) {
      universities = Array.isArray(data.data) ? data.data : [data.data];
    }

    console.log(`✅ Fetched ${universities.length} saved universities from external API`);
    return { success: true, universities };
  } catch (error) {
    console.error("Error fetching saved universities from external API:", error);
    return { success: false, universities: [], error: error.message };
  }
}

// ==========================================
// STANDALONE ESSAY HELPERS
// ==========================================

// Get or create "My Custom Essays" program for a university
async function getOrCreateStandaloneProgram(universityId) {
  try {
    // Try to find existing standalone program
    let standaloneProgram = await prisma.program.findFirst({
      where: {
        universityId,
        degreeType: "STANDALONE",
      }
    });

    // If not found, create one
    if (!standaloneProgram) {
      standaloneProgram = await prisma.program.create({
        data: {
          universityId,
          programName: "My Custom Essays",
          programSlug: `${universityId}-custom-essays-${Date.now()}`,
          degreeType: "STANDALONE",
          isActive: true,
          programDescription: "Custom standalone essays for this university",
        }
      });
      console.log(`✅ Created standalone program for university ${universityId}`);
    }

    return standaloneProgram;
  } catch (error) {
    console.error("Error getting/creating standalone program:", error);
    throw error;
  }
}

// Get or create "My Essays" virtual university for untagged essays
async function getOrCreateVirtualUniversity() {
  try {
    // Try to find existing virtual university
    let virtualUni = await prisma.university.findFirst({
      where: { slug: "my-custom-essays" }
    });

    // If not found, create one
    if (!virtualUni) {
      virtualUni = await prisma.university.create({
        data: {
          universityName: "My Essays",
          slug: "my-custom-essays",
          city: "Personal",
          country: "Personal",
          isActive: true,
          shortDescription: "Your personal custom essays",
        }
      });
      console.log(`✅ Created virtual university for custom essays`);
    }

    return virtualUni;
  } catch (error) {
    console.error("Error getting/creating virtual university:", error);
    throw error;
  }
}

// ==========================================
// GET: Fetch user's essays from saved universities
// ==========================================
export async function GET(request) {
  try {
    const auth = await authenticateUser(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get("universityId");
    const userId = auth.userId;
    
    console.log(`✅ Fetching essays for user ${userId}, universityId: ${universityId}`);

    // Build query conditions
    const whereConditions = [];
    
    // If universityId is provided, only fetch for that university
    if (universityId) {
      console.log(`🔍 Filtering for specific university: ${universityId}`);
      whereConditions.push({ id: universityId });
    } else {
      // If no universityId, fetch all saved universities
      const savedUnisResult = await fetchSavedUniversitiesFromExternalAPI(auth.token);
      const savedUniversities = savedUnisResult.universities || [];
      
      const universityIdentifiers = savedUniversities.map(uni => ({
        id: uni.id || uni.universityId || uni.university?.id,
        name: uni.universityName || uni.name || uni.university?.universityName || uni.university?.name,
        slug: uni.slug || uni.university?.slug,
      })).filter(u => u.id || u.name || u.slug);

      const ids = universityIdentifiers.map(u => u.id).filter(Boolean);
      const names = universityIdentifiers.map(u => u.name).filter(Boolean);
      const slugs = universityIdentifiers.map(u => u.slug).filter(Boolean);

      if (ids.length > 0) whereConditions.push({ id: { in: ids } });
      if (names.length > 0) whereConditions.push({ universityName: { in: names } });
      if (slugs.length > 0) whereConditions.push({ slug: { in: slugs } });

      // Always include the virtual university for custom essays
      whereConditions.push({ slug: "my-custom-essays" });
    }

    console.log(`📋 Where conditions:`, JSON.stringify(whereConditions));

    // Step 5: Fetch universities with programs
    const universities = await prisma.university.findMany({
      where: {
        OR: whereConditions
      },
      include: {
        programs: {
          where: { isActive: true },
          include: {
            essayPrompts: {
              where: { isActive: true },
              include: {
                essays: {
                  where: { userId },
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

    console.log(`✅ Found ${universities.length} universities in database`);

    // Step 6: Process and format the data
    const allPrograms = [];
    const universitiesData = [];

    for (const university of universities) {
      // For GET requests with universityId, include ALL programs (including STANDALONE)
      // For general requests, filter by study level except for STANDALONE
      const filteredPrograms = university.programs.filter(async program => {
        // Always include STANDALONE programs (custom essays)
        if (program.degreeType === "STANDALONE") {
          return true;
        }
        
        // For regular programs when no universityId specified, filter by study level
        if (!universityId) {
          // Get user's study level preference
          let userStudyLevel = null;
          try {
            const userProfile = await prisma.userProfile.findUnique({
              where: { userId },
              select: { studyLevel: true },
            });
            userStudyLevel = userProfile?.studyLevel?.toLowerCase();
            
            if (userStudyLevel) {
              return program.degreeType?.toLowerCase() === userStudyLevel;
            }
          } catch (profileError) {
            console.warn("Could not fetch user profile:", profileError.message);
          }
        }
        
        return true;
      });

      universitiesData.push({
        id: university.id,
        name: university.universityName,
        slug: university.slug,
        description: university.shortDescription || university.overview,
        website: university.websiteUrl,
        city: university.city,
        country: university.country,
        color: university.brandColor || "#002147",
        programCount: filteredPrograms.length,
      });

      // Map programs with university context
      const programsWithUniversity = filteredPrograms.map(program => ({
        ...program,
        universityName: university.universityName,
        universityId: university.id,
        universitySlug: university.slug,
        universityColor: university.brandColor || "#002147",
      }));

      allPrograms.push(...programsWithUniversity);
    }

    // Format programs data - FIXED VERSION
    const formattedPrograms = allPrograms.map(program => {
      const isStandalone = program.degreeType === "STANDALONE" || program.isCustom;
      
      return {
        id: program.id,
        name: program.programName,
        slug: program.programSlug,
        universityName: program.universityName,
        universityId: program.universityId,
        universitySlug: program.universitySlug,
        universityColor: program.universityColor,
        degreeType: program.degreeType,
        description: program.programDescription,
        
        deadlines: program.admissions?.flatMap(
          admission =>
            admission.deadlines?.map(deadline => ({
              id: deadline.id,
              type: deadline.deadlineType,
              date: deadline.deadlineDate,
              title: deadline.title,
              priority: deadline.priority,
            })) || []
        ) || [],
        
        essays: program.essayPrompts?.map(prompt => {
          const userEssay = prompt.essays?.[0] || null;
          
          // ✅ STANDARDIZED STRUCTURE FOR ALL ESSAYS (custom and regular)
          return {
            promptId: prompt.id,
            promptTitle: prompt.promptTitle,
            promptText: prompt.promptText,
            wordLimit: prompt.wordLimit,
            minWordCount: prompt.minWordCount,
            isMandatory: prompt.isMandatory,
            programId: program.id,
            programName: program.programName,
            universityName: program.universityName,
            
            // ✅ CRITICAL: userEssay must ALWAYS be present (null or object)
            userEssay: userEssay
              ? {
                  id: userEssay.id,
                  content: userEssay.content || "",           // ← Never null
                  wordCount: userEssay.wordCount || 0,        // ← Never null
                  title: userEssay.title,
                  priority: userEssay.priority,
                  status: userEssay.status,
                  isCompleted: userEssay.isCompleted || false,
                  completionPercentage: userEssay.completionPercentage || 0,
                  lastModified: userEssay.lastModified,
                  lastAutoSaved: userEssay.lastAutoSaved,
                  createdAt: userEssay.createdAt,
                  versions: userEssay.versions?.map(v => ({
                    id: v.id,
                    label: v.label,
                    content: v.content,
                    wordCount: v.wordCount,
                    timestamp: v.timestamp,
                    isAutoSave: v.isAutoSave,
                    changesSinceLastVersion: v.changesSinceLastVersion,
                    aiAnalysis: v.aiResults?.[0] || null,
                  })) || [],                                  // ← Never null, always array
                  aiResults: userEssay.aiResults || [],       // ← Never null, always array
                }
              : null,  // ← Can be null if user hasn't started this essay yet
          };
        }) || [],
      };
    });

    // Filter programs: keep only those that have essays or are STANDALONE
    const filteredFormattedPrograms = formattedPrograms.filter(p => 
      (p.essays && p.essays.length > 0) || 
      p.degreeType === "STANDALONE"
    );

    // Step 8: Calculate statistics from filteredFormattedPrograms
    const stats = {
      totalPrograms: filteredFormattedPrograms.length,
      savedUniversitiesCount: universitiesData.length,
      totalEssayPrompts: filteredFormattedPrograms.reduce(
        (acc, p) => acc + (p.essays?.length || 0),
        0
      ),
      completedEssays: filteredFormattedPrograms.reduce(
        (acc, p) =>
          acc +
          (p.essays?.filter(essay => essay.userEssay && essay.userEssay.isCompleted).length || 0),
        0
      ),
      totalWords: filteredFormattedPrograms.reduce(
        (acc, p) =>
          acc +
          (p.essays?.reduce(
            (essayAcc, essay) =>
              essayAcc + (essay.userEssay?.wordCount || 0),
            0
          ) || 0),
        0
      ),
      averageProgress: (() => {
        const totalPrompts = filteredFormattedPrograms.reduce(
          (acc, p) => acc + (p.essays?.length || 0),
          0
        );
        if (totalPrompts === 0) return 0;

        const totalProgress = filteredFormattedPrograms.reduce((acc, p) => {
          return (
            acc +
            (p.essays?.reduce((essayAcc, essay) => {
              const userEssay = essay.userEssay;
              return (
                essayAcc +
                (userEssay
                  ? Math.min(100, (userEssay.wordCount / essay.wordLimit) * 100)
                  : 0)
              );
            }, 0) || 0)
          );
        }, 0);

        return totalProgress / totalPrompts;
      })(),
    };

    // Step 9: Return formatted response
    const workspaceData = {
      universities: universitiesData,
      programs: filteredFormattedPrograms,  // Use the filtered list
      stats,
      query: { universityId },
    };

    return NextResponse.json(workspaceData);
  } catch (error) {
    console.error("Error fetching saved universities essays:", error);
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
    const auth = await authenticateUser(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const body = await request.json();
    const { action } = body;

    const operationData = {
      ...body,
      userId: auth.userId,
      userEmail: auth.userEmail,
      userName: auth.userName
    };

    switch (action) {
      case "create_essay":
        return await createEssay(operationData);
      case "create_standalone_essay":
        return await createStandaloneEssay(operationData);
      case "update_essay":
        return await updateEssay(operationData);
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
      case "auto_save":
        return await autoSave(operationData);
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
// PUT: Update essay content (auto-save) - FIXED VERSION
// ==========================================
export async function PUT(request) {
  try {
    const auth = await authenticateUser(request);
    if (!auth.authenticated) {
      return auth.error;
    }

    const userId = auth.userId;
    const body = await request.json();
    const { essayId, content, wordCount, title, priority, isAutoSave = false, isCompleted } = body;

    if (!essayId) {
      return NextResponse.json(
        { error: "Essay ID is required" },
        { status: 400 }
      );
    }

    console.log(`📝 PUT request - Updating essay ${essayId}, wordCount: ${wordCount}, isAutoSave: ${isAutoSave}`);

    // Verify essay belongs to authenticated user
    const essayOwnership = await prisma.essay.findFirst({
      where: {
        id: essayId,
        userId: userId
      },
      include: {
        essayPrompt: true
      }
    });

    if (!essayOwnership) {
      return NextResponse.json(
        { error: "Essay not found or access denied" },
        { status: 403 }
      );
    }

    // ✅ FIX 1: Build update data with wordLimit to prevent constraint violations
    const updateData = {
      lastModified: new Date(),
      wordLimit: essayOwnership.essayPrompt?.wordLimit || essayOwnership.wordLimit || 500,
    };

    if (content !== undefined) updateData.content = content;
    if (wordCount !== undefined) updateData.wordCount = wordCount;
    if (title !== undefined) updateData.title = title;
    if (priority !== undefined) updateData.priority = priority;
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      updateData.completedAt = isCompleted ? new Date() : null;
    }

    if (isAutoSave) {
      updateData.lastAutoSaved = new Date();
    }

    // Check for auto-completion
    if (wordCount !== undefined && content !== undefined) {
      const wordLimit = essayOwnership.essayPrompt?.wordLimit || essayOwnership.wordLimit || 500;
      const completionResult = await checkEssayCompletion(
        essayId,
        wordCount,
        content,
        wordLimit
      );

      if (completionResult.success && completionResult.completionChanged) {
        Object.assign(updateData, {
          isCompleted: completionResult.isCompleted,
          completedAt: completionResult.isCompleted ? new Date() : null,
          status: completionResult.isCompleted ? 'COMPLETED' : (wordCount > 0 ? 'IN_PROGRESS' : 'DRAFT'),
          completionPercentage: Math.min(100, (wordCount / wordLimit) * 100),
        });
      }
    }

    console.log(`📊 Update data:`, JSON.stringify(updateData, null, 2));

    // ✅ FIX: Updated include structure with program and university data
    const updatedEssay = await prisma.essay.update({
      where: { id: essayId },
      data: updateData,
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
        program: {
          include: {
            university: {
              select: {
                id: true,
                universityName: true,
                slug: true,
                brandColor: true,
              }
            }
          }
        }
      },
    });

    console.log(`✅ Essay updated - wordCount: ${updatedEssay.wordCount}, wordLimit: ${updatedEssay.wordLimit}`);

    // ✅ FIX 2: Enhanced auto-save version creation with better tracking and logging
    if (isAutoSave && content && wordCount > 0) {
      const lastVersion = updatedEssay.versions[0];
      const shouldCreateAutoSave =
        !lastVersion ||
        (wordCount > 0 &&
          (Math.abs(wordCount - lastVersion.wordCount) >= 50 ||
            new Date() - new Date(lastVersion.timestamp) > 15 * 60 * 1000));

      if (shouldCreateAutoSave) {
        const newVersion = await prisma.essayVersion.create({
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
        console.log(`✅ Auto-save version created: ${newVersion.id}`);
      }
    }

    // ✅ FIX: Return formatted response with all needed data
    return NextResponse.json({ 
      essay: updatedEssay,
      success: true,
      message: isAutoSave ? 'Auto-saved' : 'Saved'
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

// ==========================================
// CREATE STANDALONE ESSAY - FIXED WITH COMPLETE DATA
// ==========================================
async function createStandaloneEssay(data) {
  const { 
    userId, 
    customTitle, 
    customPrompt, 
    wordLimit, 
    taggedUniversityId, 
    priority = 'medium' 
  } = data;

  console.log("🚀 Creating standalone essay:", { 
    userId, 
    customTitle, 
    taggedUniversityId,
    wordLimit 
  });

  // Validation
  if (!userId || !customTitle || !customPrompt) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, customTitle, customPrompt' },
      { status: 400 }
    );
  }

  if (!wordLimit || wordLimit < 100 || wordLimit > 5000) {
    return NextResponse.json(
      { error: 'Word limit must be between 100 and 5000' },
      { status: 400 }
    );
  }

  try {
    // Step 1: Determine which university to use
    let targetUniversityId;
    
    if (taggedUniversityId && taggedUniversityId.trim() !== '') {
      // User selected a specific university
      targetUniversityId = taggedUniversityId;
    } else {
      // No university selected - use virtual university
      const virtualUni = await getOrCreateVirtualUniversity();
      targetUniversityId = virtualUni.id;
    }

    console.log(`🎯 Target university ID: ${targetUniversityId}`);

    // Step 2: Get or create standalone program for this university
    const standaloneProgram = await getOrCreateStandaloneProgram(targetUniversityId);
    console.log(`📝 Standalone program ID: ${standaloneProgram.id}`);

    // Step 3: Create custom essay prompt
    const essayPrompt = await prisma.essayPrompt.create({
      data: {
        programId: standaloneProgram.id,
        promptTitle: customTitle,
        promptText: customPrompt,
        wordLimit: wordLimit,
        minWordCount: 0,
        isMandatory: false,
        isActive: true,
      }
    });

    console.log(`✅ Created essay prompt: ${essayPrompt.id}`);

    // Step 4: Create the essay
    const essay = await prisma.essay.create({
      data: {
        userId,
        programId: standaloneProgram.id,
        essayPromptId: essayPrompt.id,
        title: customTitle,
        content: '',
        wordCount: 0,
        wordLimit: wordLimit,
        priority: priority,
        status: 'DRAFT',
        autoSaveEnabled: true,
      },
      include: {
        program: {
          include: { 
            university: {
              select: {
                id: true,
                universityName: true,
                slug: true
              }
            }
          }
        },
        essayPrompt: true,
        versions: true,
        aiResults: true,
      },
    });

    console.log('✅ Created standalone essay:', {
      essayId: essay.id,
      programId: standaloneProgram.id,
      universityId: targetUniversityId,
      title: customTitle,
      wordLimit: essay.wordLimit,
      universityName: essay.program?.university?.universityName
    });

    // ✅ Format response with STANDARDIZED structure
    const formattedEssay = {
      id: essay.id,
      programId: standaloneProgram.id,
      universityId: targetUniversityId,
      universityName: essay.program?.university?.universityName || 'My Essays',
      universitySlug: essay.program?.university?.slug || 'my-custom-essays',
      title: customTitle,
      prompt: customPrompt,
      content: essay.content || '',           // ← Empty string, not null
      wordCount: essay.wordCount || 0,        // ← Zero, not null
      wordLimit: wordLimit,
      priority: priority,
      status: essay.status || 'DRAFT',
      isCompleted: essay.isCompleted || false,
      completedAt: essay.completedAt || null,
      completionPercentage: essay.completionPercentage || 0,
      lastModified: essay.lastModified || essay.createdAt,
      lastAutoSaved: essay.lastAutoSaved || essay.createdAt,
      createdAt: essay.createdAt,
      updatedAt: essay.updatedAt,
      versions: essay.versions || [],         // ← Empty array, not null
      aiResults: essay.aiResults || [],       // ← Empty array, not null
      isCustom: true,
      essayPromptId: essayPrompt.id
    };

    return NextResponse.json({ 
      success: true,
      essay: formattedEssay,
      essayPromptId: essayPrompt.id,
      programId: standaloneProgram.id,
      universityId: targetUniversityId,
      message: 'Custom essay created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating standalone essay:', error);
    return NextResponse.json(
      { error: 'Failed to create custom essay', details: error.message },
      { status: 500 }
    );
  }
}

// ==========================================
// Create essay (EXISTING - unchanged)
// ==========================================
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

  // Fetch essay prompt details
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

  // Create the essay
  const essay = await prisma.essay.create({
    data: {
      userId,
      programId,
      essayPromptId,
      applicationId: applicationId || null,
      title: `Essay for ${essayPrompt.promptTitle}`,
      content: "",
      wordCount: 0,
      wordLimit: essayPrompt.wordLimit,
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

// ==========================================
// REST OF THE FUNCTIONS
// ==========================================

async function updateEssay(data) {
  const { essayId, content, wordCount, title, priority, status, userId } = data;

  if (!essayId) {
    return NextResponse.json(
      { error: "Essay ID is required" },
      { status: 400 }
    );
  }

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

  const result = await checkEssayCompletion(essayId, wordCount || 0, content, essay.wordLimit);

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

async function autoSave(data) {
  const { essayId, content, wordCount, userId } = data;

  if (!essayId) {
    return NextResponse.json(
      { error: "Essay ID is required" },
      { status: 400 }
    );
  }

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

  const result = await checkEssayCompletion(essayId, wordCount || 0, content, essay.wordLimit);

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

async function deleteEssay(data) {
  const { essayId, userId } = data;

  if (!essayId) {
    return NextResponse.json(
      { error: "Essay ID is required" },
      { status: 400 }
    );
  }

  try {
    const essay = await prisma.essay.findFirst({
      where: {
        id: essayId,
        userId: userId
      },
      include: {
        essayPrompt: {
          include: {
            program: true
          }
        },
      }
    });

    if (!essay) {
      return NextResponse.json(
        { error: "Essay not found or access denied" },
        { status: 403 }
      );
    }

    // Check if this is a standalone essay
    const isStandalone = essay.essayPrompt?.program?.degreeType === "STANDALONE";

    console.log(`🗑️ Deleting essay ${essayId}, isStandalone: ${isStandalone}`);

    // Delete related records
    await prisma.aIResult.deleteMany({
      where: { essayId },
    });

    await prisma.essayVersion.deleteMany({
      where: { essayId },
    });

    try {
      await prisma.essayCompletionLog.deleteMany({
        where: { essayId },
      });
    } catch (e) {
      // EssayCompletionLog might not exist
    }

    // Store prompt info before deletion
    const promptId = essay.essayPromptId;
    const programId = essay.essayPrompt?.programId;

    // Delete the essay
    await prisma.essay.delete({
      where: { id: essayId },
    });

    // If standalone, also delete the custom prompt and check program
    if (isStandalone && promptId) {
      console.log(`🗑️ Deleting standalone prompt ${promptId}`);
      
      // Delete the prompt
      await prisma.essayPrompt.delete({
        where: { id: promptId }
      });

      // Check if the program has any other prompts
      if (programId) {
        const remainingPrompts = await prisma.essayPrompt.count({
          where: { programId }
        });

        console.log(`📊 Remaining prompts in program ${programId}: ${remainingPrompts}`);

        // If no other prompts and it's a standalone program, delete the program
        if (remainingPrompts === 0) {
          const program = await prisma.program.findUnique({
            where: { id: programId }
          });
          
          if (program?.degreeType === "STANDALONE") {
            console.log(`🗑️ Deleting empty standalone program ${programId}`);
            await prisma.program.delete({
              where: { id: programId }
            });
          }
        }
      }
    }

    console.log("✅ Essay deleted successfully");
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

// ✅ FIX 3: saveVersion function with complete essay data
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

  const essay = await prisma.essay.findFirst({
    where: {
      id: essayId,
      userId: userId
    },
    include: {
      essayPrompt: true,
      program: {
        include: { university: true }
      }
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
    ? `${wordCount - lastVersion.wordCount > 0 ? "+" : ""}${wordCount - lastVersion.wordCount} words`
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

  // ✅ FIX: Update main essay with version content AND return full essay data
  const updatedEssay = await prisma.essay.update({
    where: { id: essayId },
    data: { 
      content: content || "",
      wordCount: wordCount || 0,
      lastModified: new Date(),
      completionPercentage: essay.essayPrompt?.wordLimit 
        ? Math.min(100, (wordCount / essay.essayPrompt.wordLimit) * 100)
        : 0,
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
      essayPrompt: true,
      program: {
        include: {
          university: {
            select: {
              id: true,
              universityName: true,
              slug: true,
              brandColor: true,
            }
          }
        }
      }
    },
  });

  let aiAnalysis = null;

  if (performAiAnalysis && content && content.length >= 50) {
    try {
      const analysisResult = await performAIAnalysis({
        essayId,
        versionId: version.id,
        content,
        prompt: prompt || essay.essayPrompt?.promptText,
        userId
      });

      if (analysisResult.success) {
        aiAnalysis = analysisResult.analysis;
      }
    } catch (error) {
      console.warn("AI analysis failed during version save:", error);
    }
  }

  // ✅ FIX 3: Return complete essay data in response
  return NextResponse.json({
    success: true,
    version: {
      ...version,
      aiAnalysis,
    },
    essay: updatedEssay,  // ← CRITICAL: Include full essay data
    aiAnalysis,
  });
}

async function restoreVersion(data) {
  const { essayId, versionId, userId } = data;

  if (!essayId || !versionId) {
    return NextResponse.json(
      { error: "Essay ID and Version ID are required" },
      { status: 400 }
    );
  }

  try {
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
        essayPrompt: true,
        program: {
          include: { university: true }
        }
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

async function deleteVersion(data) {
  const { versionId, essayId, userId } = data;

  if (!versionId || !essayId) {
    return NextResponse.json(
      { error: "Version ID and Essay ID are required" },
      { status: 400 }
    );
  }

  try {
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

async function getEssayAnalytics(data) {
  const { essayId, userId } = data;

  try {
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
        essayPrompt: true,
        program: {
          include: { university: true }
        }
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
        essayPromptId: { not: null }
      },
      include: {
        essayPrompt: true
      }
    });

    const validUserEssays = allUserEssays.filter((e) => e.essayPrompt !== null);

    const analytics = {
      completion: {
        percentage: Math.min(
          100,
          essay.essayPrompt 
            ? (essay.wordCount / essay.essayPrompt.wordLimit) * 100
            : (essay.wordCount / essay.wordLimit) * 100
        ),
        wordCount: essay.wordCount,
        wordLimit: essay.essayPrompt?.wordLimit || essay.wordLimit,
        wordsRemaining: Math.max(
          0,
          (essay.essayPrompt?.wordLimit || essay.wordLimit) - essay.wordCount
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
      program: essay.program ? {
        name: essay.program.programName,
        university: essay.program.university.universityName,
        degreeType: essay.program.degreeType,
      } : null,
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
    const essay = await prisma.essay.findFirst({
      where: {
        id: essayId,
        userId: userId
      },
      include: {
        essayPrompt: true,
        program: {
          include: { university: true }
        }
      }
    });

    if (!essay) {
      return NextResponse.json(
        { error: "Essay not found or access denied" },
        { status: 403 }
      );
    }

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

    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const completionRatio = (essay.essayPrompt?.wordLimit || essay.wordLimit) > 0 
      ? wordCount / (essay.essayPrompt?.wordLimit || essay.wordLimit) 
      : 0;

    if (!OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY not configured");
      const fallbackAnalysis = generateRealisticFallbackAnalysis(
        content,
        wordCount,
        essay.essayPrompt?.wordLimit || essay.wordLimit,
        essay.essayPrompt?.promptText || essay.title,
        essay.program?.degreeType,
        completionRatio
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

    const analysisPrompt = `You are a Senior Admissions Officer at ${essay.program?.university?.universityName || "a top university"} with 15+ years of experience evaluating ${essay.program?.degreeType || "graduate"} applications.

INSTITUTIONAL CONTEXT:
- Institution: ${essay.program?.university?.universityName || "University"}
- Program: ${essay.program?.programName || "Graduate Program"} (${essay.program?.degreeType || "Graduate"})
- Essay Prompt: "${essay.essayPrompt?.promptText || essay.title}"
- Word Limit: ${essay.essayPrompt?.wordLimit || essay.wordLimit}
- Current Word Count: ${wordCount}

APPLICANT'S ESSAY:
${content}

EVALUATION FRAMEWORK:
1. PROMPT ADHERENCE: Does this directly answer what we asked?
2. NARRATIVE SOPHISTICATION: Is this a compelling story or generic statements?
3. LEADERSHIP EVIDENCE: Can I see concrete examples of impact and initiative?
4. INTELLECTUAL CURIOSITY: Does this show deep thinking and genuine interest?
5. PROGRAM FIT: Why specifically our program?
6. DIFFERENTIATION: What makes this applicant unique?
7. MATURITY & SELF-AWARENESS: Does this show genuine reflection and growth?
8. COMMUNICATION SKILLS: Can they articulate complex ideas clearly?

Return ONLY valid JSON in this exact format:
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

    let result;
    try {
      result = await callGeminiViaOpenRouter(analysisPrompt, 4096);
    } catch (apiError) {
      console.error("OpenRouter API error:", apiError);
      const fallbackAnalysis = generateRealisticFallbackAnalysis(
        content,
        wordCount,
        essay.essayPrompt?.wordLimit || essay.wordLimit,
        essay.essayPrompt?.promptText || essay.title,
        essay.program?.degreeType,
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
    const responseText = result.text;

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
        essay.essayPrompt?.wordLimit || essay.wordLimit,
        essay.essayPrompt?.promptText || essay.title,
        essay.program?.degreeType,
        completionRatio
      );
    }

    analysisData = validateAndNormalizeAnalysis(
      analysisData,
      content,
      essay.essayPrompt?.wordLimit || essay.wordLimit
    );

    const aiResult = await saveAnalysisToDatabase(
      essayId,
      versionId,
      analysisData,
      processingTime,
      "gemini-via-openrouter"
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

async function checkEssayCompletion(essayId, newWordCount, newContent = null, wordLimit = null) {
  try {
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
      include: {
        user: true,
        essayPrompt: true,
        program: {
          include: { university: true }
        }
      },
    });

    if (!essay) return { success: false };

    const actualWordLimit = wordLimit || essay.essayPrompt?.wordLimit || essay.wordLimit;
    const completionPercentage = (newWordCount / actualWordLimit) * 100;

    const COMPLETION_THRESHOLD = 0.90;
    const shouldBeCompleted = newWordCount >= (actualWordLimit * COMPLETION_THRESHOLD);
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
            wordLimit: actualWordLimit,
            completionMethod: 'AUTO',
            programId: essay.programId,
            universityId: essay.program?.universityId,
            essayPromptTitle: essay.essayPrompt?.promptTitle || essay.title,
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
        essayPrompt: true,
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

// ==========================================
// Helper Functions
// ==========================================

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
          type: ["critical", "warning", "improvement", "strength"].includes(s.type)
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
    structureScore: Math.max(0, Math.min(100, analysisData.structureScore || 50)),
    contentRelevance: Math.max(0, Math.min(100, analysisData.contentRelevance || 50)),
    narrativeFlow: Math.max(0, Math.min(100, analysisData.narrativeFlow || 50)),
    leadershipEmphasis: Math.max(0, Math.min(100, analysisData.leadershipEmphasis || 50)),
    specificityScore: Math.max(0, Math.min(100, analysisData.specificityScore || 50)),
    readabilityScore: Math.max(0, Math.min(100, analysisData.readabilityScore || 50)),
    sentenceCount: analysisData.sentenceCount || sentences.length,
    paragraphCount: analysisData.paragraphCount || Math.max(1, paragraphs.length),
    avgSentenceLength:
      analysisData.avgSentenceLength ||
      (sentences.length > 0 ? Math.round((wordCount / sentences.length) * 10) / 10 : 0),
    complexWordCount:
      analysisData.complexWordCount || content.split(" ").filter((w) => w.length > 6).length,
    passiveVoiceCount:
      analysisData.passiveVoiceCount ||
      sentences.filter((s) => s.includes(" was ") || s.includes(" were ") || s.includes(" been ")).length,
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
        strengths: JSON.stringify(analysisData.suggestions.filter((s) => s.type === "strength")),
        improvements: JSON.stringify(analysisData.suggestions.filter((s) => s.type === "improvement")),
        warnings: JSON.stringify(analysisData.suggestions.filter((s) => ["critical", "warning"].includes(s.type))),
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

function generateRealisticFallbackAnalysis(
  content,
  wordCount,
  wordLimit,
  prompt,
  degreeType = "Unknown",
  completionRatio = 0
) {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const words = content.split(/\s+/).filter((w) => w.length > 0);

  const sentenceCount = sentences.length;
  const paragraphCount = Math.max(1, paragraphs.length);
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  let baseScore = 45;

  if (completionRatio >= 0.8 && completionRatio <= 1.0) baseScore += 15;
  else if (completionRatio >= 0.6) baseScore += 8;
  else if (completionRatio < 0.3) baseScore -= 10;

  if (paragraphCount >= 4) baseScore += 8;
  else if (paragraphCount >= 3) baseScore += 5;
  else if (paragraphCount < 2) baseScore -= 8;

  if (avgSentenceLength >= 15 && avgSentenceLength <= 25) baseScore += 5;
  else if (avgSentenceLength < 10 || avgSentenceLength > 30) baseScore -= 5;

  const hasSpecificExamples = /\b(specifically|for example|in particular|such as)\b/i.test(content);
  const hasNumbers = /\b\d+(%|dollars?|years?|months?|people|students?|percent)\b/i.test(content);
  const hasActionVerbs = /(led|managed|created|developed|implemented|achieved|improved)/gi.test(content);

  if (hasSpecificExamples) baseScore += 8;
  if (hasNumbers) baseScore += 6;
  if (hasActionVerbs) baseScore += 5;

  const overallScore = Math.max(25, Math.min(85, baseScore + Math.floor(Math.random() * 10 - 5)));

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
    passiveVoiceCount: sentences.filter(s => /(was|were|been|being)\s+\w+ed\b/i.test(s)).length,
    grammarIssues: Math.floor(sentenceCount * 0.05) + Math.floor(Math.random() * 3)
  };
}