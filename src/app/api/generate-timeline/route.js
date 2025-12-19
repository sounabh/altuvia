// src/app/api/generate-timeline/route.js

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY_SECOND);

/**
 * ✅ FIX 1: Add database retry logic with exponential backoff
 */
async function saveTimelineWithRetry(userId, universityId, programId, timeline, metadata, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`💾 Database save attempt ${attempt}/${maxRetries}...`);
      
      const result = await saveTimelineToDatabase(userId, universityId, programId, timeline, metadata);
      
      console.log(`✅ Database save successful on attempt ${attempt}`);
      return result;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Database save attempt ${attempt} failed:`, error.message);
      
      const isConnectionError = 
        error.message.includes("Can't reach database") ||
        error.message.includes("connection") ||
        error.message.includes("timeout");
      
      if (!isConnectionError || attempt === maxRetries) {
        break;
      }
      
      const delayMs = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error(`Database save failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * ✅ FIX 2: Levenshtein distance algorithm for string similarity
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * ✅ FIX 2: Stricter calendar event matching
 */
function matchCalendarEventToTask(task, calendarEvents) {
  if (!task?.title || !calendarEvents || calendarEvents.length === 0) {
    return null;
  }
  
  const taskTitleLower = task.title.toLowerCase().trim();
  
  const matchedEvent = calendarEvents.find(event => {
    const eventTitleLower = (event.title || '').toLowerCase().trim();
    
    if (eventTitleLower.length < 10 || taskTitleLower.length < 10) {
      return false;
    }
    
    const similarity = calculateStringSimilarity(taskTitleLower, eventTitleLower);
    
    if (similarity >= 0.8) {
      console.log(`✅ Calendar match (${Math.round(similarity * 100)}%): "${event.title}" → "${task.title}"`);
      return true;
    }
    
    return false;
  });
  
  return matchedEvent || null;
}

/**
 * Parse test scores from JSON string
 */
function parseTestScores(testScoresString) {
  const scores = {
    hasGMAT: false,
    hasGRE: false,
    hasIELTS: false,
    hasTOEFL: false,
    gmatScore: null,
    greScore: null,
    ieltsScore: null,
    toeflScore: null
  };

  if (!testScoresString) return scores;

  try {
    const parsed = typeof testScoresString === 'string' 
      ? JSON.parse(testScoresString) 
      : testScoresString;
    
    scores.hasGMAT = !!parsed.gmat && parsed.gmat > 0;
    scores.hasGRE = !!parsed.gre && parsed.gre > 0;
    scores.hasIELTS = !!parsed.ielts && parsed.ielts > 0;
    scores.hasTOEFL = !!parsed.toefl && parsed.toefl > 0;
    scores.gmatScore = parsed.gmat || null;
    scores.greScore = parsed.gre || null;
    scores.ieltsScore = parsed.ielts || null;
    scores.toeflScore = parsed.toefl || null;
  } catch (e) {
    console.error("Error parsing test scores:", e);
  }

  return scores;
}

/**
 * ✅ FIX 4: Enhanced essay completion logic
 */
function calculateEssayCompletion(essays) {
  return essays.map(essay => {
    const wordCountPercentage = essay.wordLimit > 0 
      ? (essay.wordCount / essay.wordLimit) * 100 
      : 0;
    
    const isActuallyCompleted = 
      (essay.isCompleted === true) || 
      (essay.status === 'COMPLETED') || 
      (essay.status === 'SUBMITTED') || 
      (wordCountPercentage >= 98);
    
    return {
      ...essay,
      actualCompletionPercentage: Math.min(wordCountPercentage, 100),
      isActuallyCompleted: isActuallyCompleted,
      completionReason: isActuallyCompleted 
        ? (essay.status === 'COMPLETED' || essay.status === 'SUBMITTED' ? 'status' 
           : wordCountPercentage >= 98 ? 'word_count_98_percent' 
           : 'database_flag') 
        : 'not_complete'
    };
  });
}

/**
 * ✅ FIXED: Fetch fresh metadata - Always filter programs by user's studyLevel
 */
async function fetchFreshMetadata(userId, universityId) {
  try {
    const freshUserProfile = await prisma.userProfile.findUnique({
      where: { userId: userId },
      select: { 
        studyLevel: true,
        gpa: true,
        testScores: true,
        workExperience: true
      }
    });
    
    const userStudyLevel = freshUserProfile?.studyLevel?.toLowerCase();
    
    // ✅ FIXED: Always filter programs by user's studyLevel to get correct essays
    console.log(`📚 Fetching programs for studyLevel: ${userStudyLevel}`);
    
    const freshPrograms = await prisma.program.findMany({
      where: {
        universityId: universityId,
        isActive: true,
        degreeType: userStudyLevel ? {
          equals: userStudyLevel,
          mode: "insensitive"
        } : undefined
      },
      include: {
        essayPrompts: {
          where: { isActive: true },
          select: {
            id: true,
            promptTitle: true,
            wordLimit: true,
            isMandatory: true
          }
        },
        admissions: {
          where: { isActive: true },
          select: {
            acceptanceRate: true
          }
        }
      }
    });
    
    const programIds = freshPrograms.map(p => p.id);
    const freshEssays = await prisma.essay.findMany({
      where: {
        userId: userId,
        programId: { in: programIds }
      },
      include: {
        essayPrompt: {
          select: {
            id: true,
            promptTitle: true,
            wordLimit: true
          }
        }
      }
    });
    
    const allEssayPrompts = freshPrograms.flatMap(p => p.essayPrompts || []);
    const totalEssayPromptsCount = allEssayPrompts.length;
    
    const enhancedEssays = calculateEssayCompletion(freshEssays);
    const completedEssaysCount = enhancedEssays.filter(e => e.isActuallyCompleted === true).length;
    const notStartedEssaysCount = totalEssayPromptsCount - freshEssays.length;
    
    const freshCalendarEvents = await prisma.calendarEvent.findMany({
      where: {
        userId: userId,
        universityId: universityId,
        isVisible: true
      }
    });
    
    const completedEvents = freshCalendarEvents.filter(e => e.completionStatus === 'completed').length;
    const pendingEvents = freshCalendarEvents.filter(e => e.completionStatus === 'pending').length;
    const now = new Date();
    const overdueEvents = freshCalendarEvents.filter(e => {
      const eventDate = new Date(e.startDate);
      return eventDate < now && e.completionStatus === 'pending';
    }).length;
    
    const testScores = parseTestScores(freshUserProfile?.testScores);
    const acceptanceRate = freshPrograms[0]?.admissions?.[0]?.acceptanceRate || null;
    
    return {
      essaysRequired: totalEssayPromptsCount,
      essaysCompleted: completedEssaysCount,
      essaysRemaining: Math.max(0, totalEssayPromptsCount - completedEssaysCount),
      essaysNotStarted: notStartedEssaysCount,
      essayCompletionRate: totalEssayPromptsCount > 0 
        ? Math.round((completedEssaysCount / totalEssayPromptsCount) * 100) 
        : 0,
      
      calendarEventsTotal: freshCalendarEvents.length,
      calendarEventsCompleted: completedEvents,
      calendarEventsPending: pendingEvents,
      calendarEventsOverdue: overdueEvents,
      
      userHasGMAT: testScores.hasGMAT,
      userHasGRE: testScores.hasGRE,
      userHasIELTS: testScores.hasIELTS,
      userHasTOEFL: testScores.hasTOEFL,
      gmatScore: testScores.gmatScore,
      greScore: testScores.greScore,
      ieltsScore: testScores.ieltsScore,
      toeflScore: testScores.toeflScore,
      
      userGPA: freshUserProfile?.gpa,
      userStudyLevel: userStudyLevel,
      userHasWorkExperience: !!freshUserProfile?.workExperience,
      
      programsFound: freshPrograms.length,
      acceptanceRate: acceptanceRate,
      
      enhancedEssays: enhancedEssays,
      allEssayPrompts: allEssayPrompts
    };
  } catch (error) {
    console.error("⚠️ Error fetching fresh metadata:", error);
    // ✅ Throw error so caller can handle it properly
    throw error;
  }
}

/**
 * ✅ FIX 5: Match essay task to user's essay
 */
function matchEssayTaskToUserEssay(taskTitle, allEssayPrompts, enhancedEssays) {
  const taskTitleLower = (taskTitle || '').toLowerCase();
  
  if (!taskTitleLower.includes('essay') && !taskTitleLower.includes('writing') && !taskTitleLower.includes('prompt')) {
    return { isTaskComplete: false, relatedEssayId: null, matchType: 'not_essay_task' };
  }
  
  if (!allEssayPrompts || allEssayPrompts.length === 0) {
    return { isTaskComplete: false, relatedEssayId: null, matchType: 'no_prompts' };
  }
  
  if (!enhancedEssays || enhancedEssays.length === 0) {
    return { isTaskComplete: false, relatedEssayId: null, matchType: 'no_user_essays' };
  }
  
  const essayNumberMatch = taskTitleLower.match(/essay\s*#?(\d+)/i) || 
                            taskTitleLower.match(/(\d+)(?:st|nd|rd|th)?\s*essay/i) ||
                            taskTitleLower.match(/prompt\s*#?(\d+)/i);
  
  if (essayNumberMatch) {
    const essayNumber = parseInt(essayNumberMatch[1]);
    
    if (essayNumber > 0 && essayNumber <= allEssayPrompts.length) {
      const promptIndex = essayNumber - 1;
      const targetPrompt = allEssayPrompts[promptIndex];
      
      const matchingEssay = enhancedEssays.find(essay => 
        essay.essayPromptId === targetPrompt.id || 
        essay.essayPrompt?.id === targetPrompt.id
      );
      
      if (matchingEssay) {
        return {
          isTaskComplete: matchingEssay.isActuallyCompleted === true,
          relatedEssayId: matchingEssay.id,
          matchType: 'essay_number_db_match'
        };
      } else {
        return {
          isTaskComplete: false,
          relatedEssayId: null,
          matchType: 'essay_not_started'
        };
      }
    }
  }
  
  if (taskTitleLower.includes('all essay') || taskTitleLower.includes('essay drafts') || taskTitleLower.includes('finalize essays')) {
    const completedCount = enhancedEssays.filter(e => e.isActuallyCompleted === true).length;
    const totalCount = allEssayPrompts.length;
    const allComplete = completedCount === totalCount && totalCount > 0;
    
    return {
      isTaskComplete: allComplete,
      relatedEssayId: null,
      matchType: 'all_essays_check'
    };
  }
  
  for (let i = 0; i < allEssayPrompts.length; i++) {
    const prompt = allEssayPrompts[i];
    const promptTitleLower = (prompt.promptTitle || '').toLowerCase();
    
    const promptWords = promptTitleLower.split(/\s+/).filter(w => w.length > 4);
    const matchingWords = promptWords.filter(word => taskTitleLower.includes(word));
    
    if (matchingWords.length >= 2 || (promptTitleLower.length > 10 && taskTitleLower.includes(promptTitleLower.substring(0, 15)))) {
      const matchingEssay = enhancedEssays.find(essay => 
        essay.essayPromptId === prompt.id || 
        essay.essayPrompt?.id === prompt.id
      );
      
      if (matchingEssay) {
        return {
          isTaskComplete: matchingEssay.isActuallyCompleted === true,
          relatedEssayId: matchingEssay.id,
          matchType: 'keyword_match'
        };
      }
    }
  }
  
  return { isTaskComplete: false, relatedEssayId: null, matchType: 'no_match' };
}

/**
 * ✅ FIXED: Check if timeline exists in database - Simplified to use ONLY userId + universityId
 */
async function getExistingTimeline(userId, universityId) {
  try {
    console.log('\n🔍 ========== TIMELINE SEARCH DEBUG ==========');
    console.log(`📋 Search Parameters:`, {
      userId,
      universityId
    });
    
    // ✅ FIXED: Search for timeline using ONLY userId + universityId
    console.log(`\n🎯 Searching for timeline with userId=${userId}, universityId=${universityId}`);
    
    const existingTimeline = await prisma.aITimeline.findFirst({
      where: {
        userId: userId,
        universityId: universityId,
        isActive: true
      },
      include: {
        phases: {
          orderBy: { displayOrder: 'asc' },
          include: {
            tasks: {
              orderBy: { displayOrder: 'asc' },
              select: {
                id: true,
                taskNumber: true,
                title: true,
                description: true,
                estimatedTime: true,
                priority: true,
                status: true,
                isCompleted: true,
                completedAt: true,
                actionSteps: true,
                tips: true,
                resources: true,
                requiresGMAT: true,
                requiresGRE: true,
                requiresIELTS: true,
                requiresTOEFL: true,
                relatedEventId: true,
                relatedEssayId: true,
                displayOrder: true
              }
            }
          }
        }
      }
    });

    if (!existingTimeline) {
      console.log(`\n❌ ========== TIMELINE NOT FOUND ==========\n`);
      return null;
    }

    console.log(`\n✅ ========== TIMELINE FOUND ==========`);
    console.log(`Timeline Details:`, {
      id: existingTimeline.id,
      timelineName: existingTimeline.timelineName,
      programId: existingTimeline.programId,
      totalPhases: existingTimeline.phases?.length || 0,
      totalTasks: existingTimeline.phases?.reduce((sum, p) => sum + (p.tasks?.length || 0), 0) || 0,
      generatedAt: existingTimeline.generatedAt,
      lastRegenerated: existingTimeline.lastRegeneratedAt
    });
    
    // ✅ Fetch fresh metadata with proper error handling
    let freshMetadata;
    try {
      console.log(`\n📊 Fetching fresh metadata...`);
      freshMetadata = await fetchFreshMetadata(userId, universityId);
      console.log('✅ Fresh metadata fetched successfully:', {
        essays: `${freshMetadata.essaysCompleted}/${freshMetadata.essaysRequired}`,
        calendar: `${freshMetadata.calendarEventsCompleted}/${freshMetadata.calendarEventsTotal}`,
        tests: `GMAT:${freshMetadata.userHasGMAT}, GRE:${freshMetadata.userHasGRE}`
      });
    } catch (metaError) {
      console.error('⚠️ Error fetching fresh metadata:', metaError.message);
      // Extract metadata from database snapshots as fallback
      try {
        const userSnap = typeof existingTimeline.userProfileSnapshot === 'string' 
          ? JSON.parse(existingTimeline.userProfileSnapshot) 
          : existingTimeline.userProfileSnapshot;
        const uniSnap = typeof existingTimeline.universitySnapshot === 'string'
          ? JSON.parse(existingTimeline.universitySnapshot)
          : existingTimeline.universitySnapshot;
        
        freshMetadata = userSnap?.metadata || {
          essaysRequired: 0,
          essaysCompleted: 0,
          essaysRemaining: 0,
          essaysNotStarted: 0,
          essayCompletionRate: 0,
          calendarEventsTotal: 0,
          calendarEventsCompleted: 0,
          calendarEventsPending: 0,
          calendarEventsOverdue: 0,
          userHasGMAT: false,
          userHasGRE: false,
          userHasIELTS: false,
          userHasTOEFL: false,
          gmatScore: null,
          greScore: null,
          ieltsScore: null,
          toeflScore: null,
          userGPA: null,
          userStudyLevel: null,
          userHasWorkExperience: false,
          programsFound: 0,
          acceptanceRate: uniSnap?.acceptanceRate || null,
          enhancedEssays: [],
          allEssayPrompts: []
        };
        console.log('⚠️ Using metadata from database snapshot as fallback');
      } catch (snapError) {
        console.error('❌ Could not extract metadata from snapshots:', snapError.message);
        freshMetadata = null;
      }
    }
    
    // If still no metadata, use zeros
    if (!freshMetadata) {
      console.warn("⚠️ No metadata available, using zero defaults");
      freshMetadata = {
        essaysRequired: 0,
        essaysCompleted: 0,
        essaysRemaining: 0,
        essaysNotStarted: 0,
        essayCompletionRate: 0,
        calendarEventsTotal: 0,
        calendarEventsCompleted: 0,
        calendarEventsPending: 0,
        calendarEventsOverdue: 0,
        userHasGMAT: false,
        userHasGRE: false,
        userHasIELTS: false,
        userHasTOEFL: false,
        gmatScore: null,
        greScore: null,
        ieltsScore: null,
        toeflScore: null,
        userGPA: null,
        userStudyLevel: null,
        userHasWorkExperience: false,
        programsFound: 0,
        acceptanceRate: null,
        enhancedEssays: [],
        allEssayPrompts: []
      };
    }
    
    let userProfileData = {};
    let universityData = {};
    
    try {
      if (existingTimeline.userProfileSnapshot) {
        userProfileData = typeof existingTimeline.userProfileSnapshot === 'string' 
          ? JSON.parse(existingTimeline.userProfileSnapshot) 
          : existingTimeline.userProfileSnapshot;
      }
    } catch (e) {
      console.log("Could not parse userProfileSnapshot");
    }
    
    try {
      if (existingTimeline.universitySnapshot) {
        universityData = typeof existingTimeline.universitySnapshot === 'string'
          ? JSON.parse(existingTimeline.universitySnapshot)
          : existingTimeline.universitySnapshot;
      }
    } catch (e) {
      console.log("Could not parse universitySnapshot");
    }
    
    const requiresGMAT = universityData.requiresGMAT || false;
    const requiresGRE = universityData.requiresGRE || false;
    const requiresIELTS = universityData.requiresIELTS || false;
    const requiresTOEFL = universityData.requiresTOEFL || false;
    
    const testsNeeded = [];
    if (requiresGMAT && !freshMetadata.userHasGMAT) testsNeeded.push("GMAT");
    if (requiresGRE && !freshMetadata.userHasGRE) testsNeeded.push("GRE");
    if (requiresIELTS && !freshMetadata.userHasIELTS) testsNeeded.push("IELTS");
    if (requiresTOEFL && !freshMetadata.userHasTOEFL) testsNeeded.push("TOEFL");
    
    // Build timeline using database task completion as SOURCE OF TRUTH
    const timeline = {
      overview: userProfileData.overview || `Application timeline for ${existingTimeline.timelineName}`,
      totalDuration: existingTimeline.totalDuration || "4-6 months",
      currentProgress: existingTimeline.overallProgress || 0,
      phases: existingTimeline.phases.map((phase, phaseIdx) => ({
        id: phase.phaseNumber,
        phaseNumber: phase.phaseNumber,
        name: phase.phaseName,
        description: phase.description || phase.overview,
        duration: phase.duration,
        timeframe: phase.timeframe,
        status: phase.status,
        objectives: phase.objectives || [],
        milestones: phase.milestones || [],
        proTips: phase.proTips || [],
        commonMistakes: phase.commonMistakes || [],
        tasks: phase.tasks.map((task, taskIdx) => {
          const dbIsCompleted = task.isCompleted === true;
          
          console.log(`📝 Task loaded from DB: "${task.title?.substring(0, 40)}" | DB Status: ${dbIsCompleted} | ID: ${task.id}`);
          
          return {
            id: task.id,
            taskNumber: task.taskNumber,
            title: task.title,
            description: task.description,
            estimatedTime: task.estimatedTime,
            priority: task.priority,
            completed: dbIsCompleted,
            status: task.status,
            actionSteps: task.actionSteps || [],
            tips: task.tips || [],
            resources: task.resources || [],
            requiresGMAT: task.requiresGMAT || false,
            requiresGRE: task.requiresGRE || false,
            requiresIELTS: task.requiresIELTS || false,
            requiresTOEFL: task.requiresTOEFL || false,
            relatedCalendarEventId: task.relatedEventId,
            relatedEssayId: task.relatedEssayId
          };
        })
      }))
    };

    // Calculate progress from database task completion
    const totalTasks = timeline.phases.reduce((sum, p) => sum + p.tasks.length, 0);
    const completedTasks = timeline.phases.reduce(
      (sum, p) => sum + p.tasks.filter(t => t.completed === true).length, 0
    );
    const currentProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    console.log(`\n✅ Timeline loaded from DB: ${completedTasks}/${totalTasks} tasks completed (${currentProgress}%)`);
    console.log(`========== END TIMELINE SEARCH ==========\n`);

    return {
      timeline,
      metadata: {
        timelineId: existingTimeline.id,
        fromDatabase: true,
        tasksCompletedFromDb: completedTasks,
        totalTasksFromDb: totalTasks,
        lastGenerated: existingTimeline.lastRegeneratedAt,
        generatedAt: existingTimeline.generatedAt,
        universityName: universityData.universityName || existingTimeline.timelineName,
        location: universityData.location,
        deadline: universityData.deadline,
        daysUntilDeadline: universityData.deadline 
          ? Math.ceil((new Date(universityData.deadline) - new Date()) / (1000 * 60 * 60 * 24))
          : null,
        acceptanceRate: freshMetadata.acceptanceRate || universityData.acceptanceRate,
        essaysRequired: freshMetadata.essaysRequired,
        essaysCompleted: freshMetadata.essaysCompleted,
        essaysRemaining: freshMetadata.essaysRemaining,
        essaysNotStarted: freshMetadata.essaysNotStarted,
        essayCompletionRate: freshMetadata.essayCompletionRate,
        calendarEventsTotal: freshMetadata.calendarEventsTotal,
        calendarEventsCompleted: freshMetadata.calendarEventsCompleted,
        calendarEventsPending: freshMetadata.calendarEventsPending,
        calendarEventsOverdue: freshMetadata.calendarEventsOverdue,
        requiresGMAT: requiresGMAT,
        requiresGRE: requiresGRE,
        requiresIELTS: requiresIELTS,
        requiresTOEFL: requiresTOEFL,
        userHasGMAT: freshMetadata.userHasGMAT,
        userHasGRE: freshMetadata.userHasGRE,
        userHasIELTS: freshMetadata.userHasIELTS,
        userHasTOEFL: freshMetadata.userHasTOEFL,
        testsNeeded: testsNeeded,
        allTestsComplete: testsNeeded.length === 0,
        currentProgress: currentProgress,
        overallProgress: currentProgress,
        userGPA: freshMetadata.userGPA,
        userStudyLevel: freshMetadata.userStudyLevel,
        programsFound: freshMetadata.programsFound
      }
    };
  } catch (error) {
    console.error("\n❌ ========== ERROR IN TIMELINE SEARCH ==========");
    console.error("Error details:", error);
    console.error("========== END ERROR ==========\n");
    return null;
  }
}

/**
 * Save timeline to database with optimized batching
 */
async function saveTimelineToDatabase(userId, universityId, programId, timeline, metadata) {
  try {
    console.log(`Saving timeline to database for user ${userId}, university ${universityId}, program ${programId || 'NULL'}`);

    // ✅ FIXED: Find existing timeline by userId + universityId only (ignore programId)
    const existingTimeline = await prisma.aITimeline.findFirst({
      where: {
        userId: userId,
        universityId: universityId,
        isActive: true
      }
    });

    let savedTimeline;

    if (existingTimeline) {
      savedTimeline = await prisma.aITimeline.update({
        where: { id: existingTimeline.id },
        data: {
          lastRegeneratedAt: new Date(),
          overallProgress: timeline.currentProgress || 0,
          totalPhases: timeline.phases?.length || 0,
          totalTasks: timeline.phases?.reduce((sum, p) => sum + (p.tasks?.length || 0), 0) || 0,
          generationTime: metadata.processingTime,
          isActive: true,
          userProfileSnapshot: JSON.stringify({
            overview: timeline.overview,
            metadata: metadata
          }),
          universitySnapshot: JSON.stringify({
            universityName: metadata.universityName,
            location: metadata.location,
            deadline: metadata.deadline,
            acceptanceRate: metadata.acceptanceRate,
            requiresGMAT: metadata.requiresGMAT,
            requiresGRE: metadata.requiresGRE,
            requiresIELTS: metadata.requiresIELTS,
            requiresTOEFL: metadata.requiresTOEFL
          })
        }
      });

      await prisma.timelineTask.deleteMany({
        where: { timelineId: savedTimeline.id }
      });
      await prisma.timelinePhase.deleteMany({
        where: { timelineId: savedTimeline.id }
      });
    } else {
      savedTimeline = await prisma.aITimeline.create({
        data: {
          userId: userId,
          universityId: universityId,
          programId: programId || null,
          timelineName: metadata.universityName || "University Timeline",
          isActive: true,
          completionStatus: 'in_progress',
          overallProgress: timeline.currentProgress || 0,
          totalDuration: timeline.totalDuration || "4-6 months",
          totalPhases: timeline.phases?.length || 0,
          totalTasks: timeline.phases?.reduce((sum, p) => sum + (p.tasks?.length || 0), 0) || 0,
          aiModel: metadata.model || "gemini-1.5-pro",
          promptVersion: "2.0",
          generationTime: metadata.processingTime,
          userProfileSnapshot: JSON.stringify({
            overview: timeline.overview,
            metadata: metadata
          }),
          universitySnapshot: JSON.stringify({
            universityName: metadata.universityName,
            location: metadata.location,
            deadline: metadata.deadline,
            acceptanceRate: metadata.acceptanceRate,
            requiresGMAT: metadata.requiresGMAT,
            requiresGRE: metadata.requiresGRE,
            requiresIELTS: metadata.requiresIELTS,
            requiresTOEFL: metadata.requiresTOEFL
          })
        }
      });
    }

    // Save phases and tasks
    for (let phaseIndex = 0; phaseIndex < timeline.phases.length; phaseIndex++) {
      const phase = timeline.phases[phaseIndex];
      
      const savedPhase = await prisma.timelinePhase.create({
        data: {
          timelineId: savedTimeline.id,
          phaseNumber: phase.id || phaseIndex + 1,
          phaseName: phase.name,
          description: phase.description?.substring(0, 2000) || "",
          duration: phase.duration,
          timeframe: phase.timeframe,
          status: phase.status || 'upcoming',
          completionPercentage: phase.status === 'completed' ? 100 : phase.status === 'in-progress' ? 50 : 0,
          overview: phase.description?.substring(0, 1000) || "",
          objectives: (phase.objectives || []).slice(0, 10),
          milestones: (phase.milestones || []).slice(0, 10),
          proTips: (phase.proTips || []).slice(0, 10),
          commonMistakes: (phase.commonMistakes || []).slice(0, 10),
          resources: [],
          displayOrder: phaseIndex,
          isVisible: true
        }
      });

      if (phase.tasks && phase.tasks.length > 0) {
        const batchSize = 5;
        for (let i = 0; i < phase.tasks.length; i += batchSize) {
          const taskBatch = phase.tasks.slice(i, i + batchSize);
          
          await Promise.all(taskBatch.map(async (task, batchIndex) => {
            const taskIndex = i + batchIndex;
            
            try {
              await prisma.timelineTask.create({
                data: {
                  timelineId: savedTimeline.id,
                  phaseId: savedPhase.id,
                  taskNumber: task.taskNumber || taskIndex + 1,
                  title: task.title?.substring(0, 200) || `Task ${taskIndex + 1}`,
                  description: task.description?.substring(0, 1000) || "",
                  estimatedTime: task.estimatedTime || "1-2 hours",
                  priority: task.priority || 'medium',
                  category: 'general',
                  status: task.completed === true ? 'completed' : 'pending',
                  isCompleted: task.completed === true,
                  detailedGuide: task.description?.substring(0, 2000) || "",
                  actionSteps: (task.actionSteps || []).slice(0, 8),
                  tips: (task.tips || []).slice(0, 6),
                  resources: (task.resources || []).slice(0, 6),
                  commonPitfalls: [],
                  successCriteria: [],
                  requiresGMAT: task.requiresGMAT || false,
                  requiresGRE: task.requiresGRE || false,
                  requiresIELTS: task.requiresIELTS || false,
                  requiresTOEFL: task.requiresTOEFL || false,
                  isUniversitySpecific: true,
                  isProgramSpecific: !!programId,
                  displayOrder: taskIndex,
                  isVisible: true,
                  isOptional: false,
                  relatedEventId: task.relatedCalendarEventId || null,
                  relatedEssayId: task.relatedEssayId || null
                }
              });
            } catch (taskError) {
              console.error(`Error creating task ${taskIndex}:`, taskError.message);
            }
          }));
          
          if (i + batchSize < phase.tasks.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
    }

    console.log(`✅ Timeline saved successfully with ID: ${savedTimeline.id}`);
    return savedTimeline.id;
  } catch (error) {
    console.error("❌ Error saving timeline to database:", error);
    throw error;
  }
}

/**
 * ✅ CRITICAL FIX: Reload timeline from database after saving to get proper database IDs
 */
async function reloadTimelineFromDatabase(timelineId) {
  try {
    console.log(`🔄 Reloading timeline ${timelineId} from database...`);
    
    const savedTimeline = await prisma.aITimeline.findUnique({
      where: { id: timelineId },
      include: {
        phases: {
          orderBy: { displayOrder: 'asc' },
          include: {
            tasks: {
              orderBy: { displayOrder: 'asc' },
              select: {
                id: true,
                taskNumber: true,
                title: true,
                description: true,
                estimatedTime: true,
                priority: true,
                status: true,
                isCompleted: true,
                completedAt: true,
                actionSteps: true,
                tips: true,
                resources: true,
                requiresGMAT: true,
                requiresGRE: true,
                requiresIELTS: true,
                requiresTOEFL: true,
                relatedEventId: true,
                relatedEssayId: true
              }
            }
          }
        }
      }
    });

    if (!savedTimeline) {
      console.warn(`⚠️ Could not find timeline with ID: ${timelineId}`);
      return null;
    }

    // Build timeline object with database values
    const timeline = {
      overview: savedTimeline.timelineName || "University Timeline",
      totalDuration: savedTimeline.totalDuration || "4-6 months",
      currentProgress: savedTimeline.overallProgress || 0,
      phases: savedTimeline.phases.map(phase => ({
        id: phase.phaseNumber,
        phaseNumber: phase.phaseNumber,
        name: phase.phaseName,
        description: phase.description,
        duration: phase.duration,
        timeframe: phase.timeframe,
        status: phase.status,
        objectives: phase.objectives || [],
        milestones: phase.milestones || [],
        proTips: phase.proTips || [],
        commonMistakes: phase.commonMistakes || [],
        tasks: phase.tasks.map(task => ({
          // ✅ CRITICAL: Use database ID and completion status
          id: task.id,
          taskNumber: task.taskNumber,
          title: task.title,
          description: task.description,
          estimatedTime: task.estimatedTime,
          priority: task.priority,
          // ✅ CRITICAL: Use database isCompleted value
          completed: task.isCompleted === true,
          status: task.status,
          actionSteps: task.actionSteps || [],
          tips: task.tips || [],
          resources: task.resources || [],
          requiresGMAT: task.requiresGMAT || false,
          requiresGRE: task.requiresGRE || false,
          requiresIELTS: task.requiresIELTS || false,
          requiresTOEFL: task.requiresTOEFL || false,
          relatedCalendarEventId: task.relatedEventId,
          relatedEssayId: task.relatedEssayId
        }))
      }))
    };

    console.log(`✅ Timeline reloaded: ${timeline.phases.reduce((sum, p) => sum + p.tasks.length, 0)} tasks with database IDs`);
    return timeline;
  } catch (error) {
    console.error('Error reloading timeline from database:', error);
    return null;
  }
}

/**
 * ✅ FIX 4: Validate task completion in timeline BEFORE returning to frontend
 */
function validateAndFixTaskCompletion(timeline, essayCompletionFlags, testStatus, calendarEvents) {
  console.log('\n🔍 VALIDATING TASK COMPLETION AGAINST DATABASE...\n');
  
  let fixedCount = 0;
  let totalTasks = 0;
  
  timeline.phases?.forEach((phase, phaseIdx) => {
    phase.tasks?.forEach((task, taskIdx) => {
      totalTasks++;
      
      let shouldBeCompleted = false;
      let reason = 'not_started';
      
      if (task.requiresGMAT === true && testStatus.hasGMAT) {
        shouldBeCompleted = true;
        reason = 'gmat_completed';
      } else if (task.requiresGRE === true && testStatus.hasGRE) {
        shouldBeCompleted = true;
        reason = 'gre_completed';
      } else if (task.requiresIELTS === true && testStatus.hasIELTS) {
        shouldBeCompleted = true;
        reason = 'ielts_completed';
      } else if (task.requiresTOEFL === true && testStatus.hasTOEFL) {
        shouldBeCompleted = true;
        reason = 'toefl_completed';
      }
      
      const essayMatch = task.title?.match(/essay\s*#?(\d+)/i);
      if (essayMatch) {
        const essayNum = parseInt(essayMatch[1]);
        if (essayNum > 0 && essayNum <= essayCompletionFlags.length) {
          const isEssayComplete = essayCompletionFlags[essayNum - 1] === 'true';
          if (isEssayComplete) {
            shouldBeCompleted = true;
            reason = `essay_${essayNum}_completed`;
          } else {
            shouldBeCompleted = false;
            reason = `essay_${essayNum}_not_started`;
          }
        }
      }
      
      if (!shouldBeCompleted) {
        const matchedEvent = matchCalendarEventToTask(task, calendarEvents);
        if (matchedEvent?.completionStatus === 'completed') {
          shouldBeCompleted = true;
          reason = 'calendar_event_completed';
        }
      }
      
      if (task.completed === true && shouldBeCompleted === false) {
        console.log(`🔧 FIXING: "${task.title}" - AI said complete, but NO DATABASE PROOF`);
        task.completed = false;
        task.status = 'pending';
        fixedCount++;
      } else if (task.completed === false && shouldBeCompleted === true) {
        console.log(`✅ ENABLING: "${task.title}" - Database proof: ${reason}`);
        task.completed = true;
        task.status = 'completed';
      }
      
      task.completionReason = reason;
    });
  });
  
  console.log(`\n📊 VALIDATION COMPLETE:`);
  console.log(`   Total tasks: ${totalTasks}`);
  console.log(`   Fixed incorrect completions: ${fixedCount}`);
  console.log(`   Final completed count: ${timeline.phases.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0)}\n`);
  
  return timeline;
}

/**
 * Robust JSON parser with optimized fallback strategies
 */
function parseAIResponse(responseText) {
  console.log("Attempting to parse response of length:", responseText.length);
  
  let cleanText = responseText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .replace(/^\s*[\r\n]+/, '')
    .replace(/[\r\n]+\s*$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleanText);
    console.log("✅ Strategy 1 (direct parse) succeeded");
    return parsed;
  } catch (e) {
    console.log("Strategy 1 failed:", e.message);
  }

  const jsonStart = cleanText.indexOf('{');
  if (jsonStart === -1) {
    throw new Error("No JSON object found in response");
  }
  cleanText = cleanText.substring(jsonStart);

  try {
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            const jsonStr = cleanText.substring(0, i + 1);
            const parsed = JSON.parse(jsonStr);
            console.log("✅ Strategy 2 (brace matching) succeeded");
            return parsed;
          }
        }
      }
    }
  } catch (e) {
    console.log("Strategy 2 failed:", e.message);
  }

  try {
    const phases = [];
    const phaseRegex = /\{\s*"id"\s*:\s*\d+\s*,\s*"name"\s*:/g;
    let match;
    
    while ((match = phaseRegex.exec(cleanText)) !== null) {
      const phaseStart = match.index;
      let depth = 0;
      let inStr = false;
      let esc = false;
      let phaseEnd = -1;
      
      for (let i = phaseStart; i < cleanText.length; i++) {
        const c = cleanText[i];
        
        if (esc) { esc = false; continue; }
        if (c === '\\') { esc = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        
        if (!inStr) {
          if (c === '{') depth++;
          if (c === '}') {
            depth--;
            if (depth === 0) {
              phaseEnd = i + 1;
              break;
            }
          }
        }
      }
      
      if (phaseEnd > phaseStart) {
        try {
          const phase = JSON.parse(cleanText.substring(phaseStart, phaseEnd));
          phases.push(phase);
        } catch (e) {
        }
      }
    }
    
    if (phases.length > 0) {
      console.log(`✅ Strategy 3 (extract phases) found ${phases.length} complete phases`);
      
      let overview = "Timeline recovered from partial response";
      const overviewMatch = cleanText.match(/"overview"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (overviewMatch) {
        overview = overviewMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ');
      }
      
      return {
        overview: overview,
        totalDuration: "4-6 months",
        currentProgress: 0,
        phases: phases
      };
    }
  } catch (e) {
    console.log("Strategy 3 failed:", e.message);
  }

  throw new Error("Could not parse JSON response after all strategies");
}

/**
 * ✅ NEW: Check if AI response contains all 5 phases
 */
function isResponseComplete(text) {
  try {
    const phase1 = /"id"\s*:\s*1\s*,\s*"name"\s*:\s*"Research/i.test(text);
    const phase2 = /"id"\s*:\s*2\s*,\s*"name"\s*:\s*"Standardized/i.test(text);
    const phase3 = /"id"\s*:\s*3\s*,\s*"name"\s*:\s*"Essay/i.test(text);
    const phase4 = /"id"\s*:\s*4\s*,\s*"name"\s*:\s*"Recommendation/i.test(text);
    const phase5 = /"id"\s*:\s*5\s*,\s*"name"\s*:\s*"Application/i.test(text);
    
    const hasAllPhases = phase1 && phase2 && phase3 && phase4 && phase5;
    
    if (!hasAllPhases) {
      console.log(`Phase check: 1=${phase1}, 2=${phase2}, 3=${phase3}, 4=${phase4}, 5=${phase5}`);
      return false;
    }
    
    const trimmed = text.trim();
    const hasProperEnding = /\}\s*\]\s*\}$/.test(trimmed);
    
    if (!hasProperEnding) {
      console.log(`Response doesn't have proper JSON ending. Last 50 chars: ${trimmed.substring(trimmed.length - 50)}`);
      return false;
    }
    
    return true;
  } catch (e) {
    console.log("Error checking response completeness:", e.message);
    return false;
  }
}

/**
 * ✅ NEW: Generate continuation prompt to get remaining phases
 */
function buildContinuationPrompt(partialResponse, missingPhases) {
  const lastContent = partialResponse.substring(partialResponse.length - 300);
  
  return `You were generating a JSON timeline and got cut off. Continue EXACTLY from where you stopped.

The response ended with:
"""
${lastContent}
"""

MISSING PHASES NEEDED: ${missingPhases.join(', ')}

CRITICAL RULES:
1. Continue the JSON exactly - do NOT start fresh
2. Do NOT include \`\`\`json or any markdown
3. Complete the remaining phases with the SAME structure as before
4. Each phase needs: id, name, description, duration, timeframe, status, objectives, milestones, proTips, commonMistakes, tasks
5. End with the proper closing: }]} to close the phases array and root object
6. Output ONLY the continuation JSON, nothing else

Continue now:`;
}

/**
 * ✅ NEW: Merge partial responses into complete JSON
 */
function mergeResponses(original, continuation) {
  let cleanOriginal = original
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
    
  let cleanContinuation = continuation
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
  
  let cutPoint = cleanOriginal.length;
  
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;
  let lastBalancedPos = 0;
  
  for (let i = 0; i < cleanOriginal.length; i++) {
    const char = cleanOriginal[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
      
      if (char === '}' || char === ']') {
        lastBalancedPos = i + 1;
      }
    }
  }
  
  if (braceCount !== 0 || bracketCount !== 0) {
    const lastComma = cleanOriginal.lastIndexOf(',\n');
    const lastBrace = cleanOriginal.lastIndexOf('},');
    const lastBracket = cleanOriginal.lastIndexOf('],');
    
    cutPoint = Math.max(lastComma, lastBrace + 1, lastBracket + 1, lastBalancedPos);
    cleanOriginal = cleanOriginal.substring(0, cutPoint);
  }
  
  let contStart = 0;
  
  while (contStart < cleanContinuation.length && 
         (cleanContinuation[contStart] === ' ' || 
          cleanContinuation[contStart] === '\n' || 
          cleanContinuation[contStart] === ',')) {
    contStart++;
  }
  
  cleanContinuation = cleanContinuation.substring(contStart);
  
  let merged;
  const originalEndsWithComma = cleanOriginal.trim().endsWith(',');
  const continuationStartsWithBrace = cleanContinuation.trim().startsWith('{');
  
  if (originalEndsWithComma && continuationStartsWithBrace) {
    merged = cleanOriginal + '\n' + cleanContinuation;
  } else if (!originalEndsWithComma && continuationStartsWithBrace) {
    merged = cleanOriginal + ',\n' + cleanContinuation;
  } else {
    merged = cleanOriginal + cleanContinuation;
  }
  
  return merged;
}

/**
 * ✅ NEW: Identify which phases are missing from the response
 */
function getMissingPhases(text) {
  const missing = [];
  
  if (!/"id"\s*:\s*1\s*,\s*"name"\s*:\s*"Research/i.test(text)) {
    missing.push("Phase 1: Research & Strategic Planning");
  }
  if (!/"id"\s*:\s*2\s*,\s*"name"\s*:\s*"Standardized/i.test(text)) {
    missing.push("Phase 2: Standardized Testing");
  }
  if (!/"id"\s*:\s*3\s*,\s*"name"\s*:\s*"Essay/i.test(text)) {
    missing.push("Phase 3: Essay Writing");
  }
  if (!/"id"\s*:\s*4\s*,\s*"name"\s*:\s*"Recommendation/i.test(text)) {
    missing.push("Phase 4: Recommendations & Documents");
  }
  if (!/"id"\s*:\s*5\s*,\s*"name"\s*:\s*"Application/i.test(text)) {
    missing.push("Phase 5: Application Assembly & Submission");
  }
  
  return missing;
}

/**
 * ✅ NEW: Create fallback phase when missing
 */
function createFallbackPhase(phaseNumber) {
  const phaseNames = [
    "Research & Strategic Planning",
    "Standardized Testing", 
    "Essay Writing",
    "Recommendations & Documents",
    "Application Assembly & Submission"
  ];
  
  return {
    id: phaseNumber,
    name: phaseNames[phaseNumber - 1] || `Phase ${phaseNumber}`,
    description: `Phase ${phaseNumber} content`,
    duration: "4-6 weeks",
    timeframe: "TBD",
    status: "upcoming",
    objectives: ["Complete research", "Prepare documents", "Meet deadlines"],
    milestones: ["Research done", "Documents ready", "Submission complete"],
    proTips: ["Start early", "Stay organized", "Double-check everything"],
    commonMistakes: ["Procrastination", "Incomplete documents", "Missing deadlines"],
    tasks: Array.from({length: 6}, (_, i) => ({
      taskNumber: i + 1,
      title: `Task ${i + 1}`,
      description: "Complete this task",
      estimatedTime: "1-2 days",
      priority: "medium",
      completed: false,
      actionSteps: ["Step 1", "Step 2"],
      tips: ["Be thorough", "Check requirements"],
      resources: ["University website", "Application portal"]
    }))
  };
}

/**
 * ✅ NEW: Generate complete timeline with continuation support
 */
async function generateCompleteTimeline(model, prompt, maxRetries = 2, maxContinuations = 2) {
  let fullResponse = "";
  let continuationCount = 0;
  
  console.log("Starting initial AI generation...");
  const result = await generateWithRetry(model, prompt, maxRetries);
  fullResponse = result.response.text();
  console.log(`Initial response length: ${fullResponse.length}`);
  
  while (!isResponseComplete(fullResponse) && continuationCount < maxContinuations) {
    continuationCount++;
    const missingPhases = getMissingPhases(fullResponse);
    
    if (missingPhases.length === 0) {
      break;
    }
    
    console.log(`⚠️ Response incomplete. Missing ${missingPhases.length} phases. Requesting continuation ${continuationCount}...`);
    console.log(`Missing: ${missingPhases.join(', ')}`);
    
    const continuationPrompt = buildContinuationPrompt(fullResponse, missingPhases);
    
    try {
      const continuationResult = await generateWithRetry(model, continuationPrompt, maxRetries);
      const continuationText = continuationResult.response.text();
      console.log(`Continuation ${continuationCount} length: ${continuationText.length}`);
      
      fullResponse = mergeResponses(fullResponse, continuationText);
      console.log(`Merged response length: ${fullResponse.length}`);
      
    } catch (contError) {
      console.error(`Continuation ${continuationCount} failed:`, contError.message);
      break;
    }
  }
  
  if (continuationCount > 0) {
    console.log(`✅ Timeline generation completed with ${continuationCount} continuation(s)`);
  }
  
  return fullResponse;
}

/**
 * Retry wrapper for AI calls
 */
async function generateWithRetry(model, prompt, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`AI generation attempt ${attempt}/${maxRetries}`);
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { university, userProfile, userId, forceRegenerate = false } = body;

    if (!university || !university.id) {
      console.error("❌ Invalid university data received");
      return NextResponse.json(
        { error: "Invalid university data" },
        { status: 400 }
      );
    }

    console.log(`🎯 API Request for University: ${university.id} - ${university.universityName || university.name}`);

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    const startTime = Date.now();

    // ====== STEP 1: CHECK FOR EXISTING TIMELINE FIRST ======
    // ✅ FIXED: Check for existing timeline using ONLY userId + universityId
    if (!forceRegenerate) {
      const existingData = await getExistingTimeline(userId, university.id);

      if (existingData) {
        console.log("✅ Returning existing timeline with database completion state");
        const processingTime = Date.now() - startTime;
        
        return NextResponse.json({
          success: true,
          timeline: existingData.timeline,
          metadata: {
            ...existingData.metadata,
            processingTime: processingTime,
            fromDatabase: true
          }
        });
      }
    }

    // ====== STEP 2: FETCH COMPREHENSIVE USER DATA ======
    let userStudyLevel = null;
    let userTestScores = {
      hasGMAT: false,
      hasGRE: false,
      hasIELTS: false,
      hasTOEFL: false,
      gmatScore: null,
      greScore: null,
      ieltsScore: null,
      toeflScore: null
    };

    const fullUserProfile = await prisma.userProfile.findUnique({
      where: { userId: userId },
      select: { 
        studyLevel: true,
        gpa: true,
        testScores: true,
        workExperience: true,
        countries: true,
        courses: true
      }
    });

    if (fullUserProfile) {
      userStudyLevel = fullUserProfile.studyLevel?.toLowerCase();
      console.log("User's Study Level:", userStudyLevel);

      if (fullUserProfile.testScores) {
        userTestScores = parseTestScores(fullUserProfile.testScores);
        console.log("Parsed Test Scores:", userTestScores);
      }
    }

    // ====== STEP 3: FETCH PROGRAMS FILTERED BY USER'S STUDY LEVEL ======
    // ✅ FIXED: Always filter by studyLevel to get correct essay prompts
    console.log(`📚 Fetching programs for user's studyLevel: ${userStudyLevel || 'NOT SET'}`);
    
    const universityPrograms = await prisma.program.findMany({
      where: {
        universityId: university.id,
        isActive: true,
        degreeType: userStudyLevel ? {
          equals: userStudyLevel,
          mode: "insensitive"
        } : undefined
      },
      include: {
        essayPrompts: {
          where: { isActive: true },
          select: {
            id: true,
            promptTitle: true,
            promptText: true,
            wordLimit: true,
            minWordCount: true,
            isMandatory: true
          }
        },
        admissions: {
          where: { isActive: true },
          select: {
            minimumGpa: true,
            gmatMinScore: true,
            greMinScore: true,
            ieltsMinScore: true,
            toeflMinScore: true,
            workExperienceRequired: true,
            acceptanceRate: true,
            applicationFee: true,
            currency: true,
            deadlines: {
              where: { isActive: true },
              orderBy: { deadlineDate: 'asc' }
            },
            intakes: {
              where: { isActive: true },
              orderBy: { intakeYear: 'desc' }
            }
          }
        }
      }
    });

    console.log(`Found ${universityPrograms.length} programs for study level: ${userStudyLevel}`);
    
    // ✅ FIXED: Validate we have programs before fetching essays
    if (universityPrograms.length === 0) {
      console.warn(`⚠️ No programs found for studyLevel: ${userStudyLevel} at university ${university.id}`);
      console.warn(`⚠️ User may have wrong studyLevel set or programs not configured`);
    }

    // ====== STEP 4: FETCH ALL USER'S ESSAYS ======
    const programIds = universityPrograms.map(p => p.id);
    console.log(`📝 Fetching essays for ${programIds.length} program(s):`, programIds);
    
    const userEssays = await prisma.essay.findMany({
      where: {
        userId: userId,
        programId: { in: programIds }
      },
      include: {
        essayPrompt: {
          select: {
            id: true,
            promptTitle: true,
            promptText: true,
            wordLimit: true,
            isMandatory: true
          }
        }
      }
    });

    console.log(`Found ${userEssays.length} user essays for this university`);

    const enhancedEssays = calculateEssayCompletion(userEssays);
    
    const allEssayPrompts = universityPrograms.flatMap(p => p.essayPrompts || []);
    const totalEssayPromptsCount = allEssayPrompts.length;
    const completedEssaysCount = enhancedEssays.filter(e => e.isActuallyCompleted === true).length;
    const notStartedEssaysCount = totalEssayPromptsCount - userEssays.length;

    console.log(`Essay completion: ${completedEssaysCount}/${totalEssayPromptsCount} (using 98% logic)`);
    console.log(`Essays not started: ${notStartedEssaysCount}`);

    const essayCompletionFlags = allEssayPrompts.map((prompt, idx) => {
      const essay = enhancedEssays.find(e => 
        e.essayPromptId === prompt.id || e.essayPrompt?.id === prompt.id
      );
      const isComplete = essay?.isActuallyCompleted === true;
      return isComplete ? 'true' : 'false';
    });

    console.log('📝 Essay Completion Flags for AI Prompt:', essayCompletionFlags);

    // ====== STEP 5: FETCH ALL USER'S CALENDAR EVENTS ======
    const userCalendarEvents = await prisma.calendarEvent.findMany({
      where: {
        userId: userId,
        universityId: university.id,
        isVisible: true
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    console.log(`Found ${userCalendarEvents.length} calendar events for this university`);

    const completedEvents = userCalendarEvents.filter(e => e.completionStatus === 'completed').length;
    const pendingEvents = userCalendarEvents.filter(e => e.completionStatus === 'pending').length;
    const now = new Date();
    const overdueEvents = userCalendarEvents.filter(e => {
      const eventDate = new Date(e.startDate);
      return eventDate < now && e.completionStatus === 'pending';
    }).length;

    const requiresGMAT = university.requiresGMAT || false;
    const requiresGRE = university.requiresGRE || false;
    const requiresIELTS = university.requiresIELTS || false;
    const requiresTOEFL = university.requiresTOEFL || false;
    const acceptanceRate = university.acceptanceRate || 
                          universityPrograms[0]?.admissions?.[0]?.acceptanceRate || null;

    // ====== STEP 6: PREPARE DATA FOR AI PROMPT ======
    const universityName = university.universityName || university.name || "Your University";
    const location = university.location || `${university.city || ''}, ${university.country || ''}`.replace(/^, |, $/g, '') || "Location not specified";
    
    const allDeadlinesFromDB = [];
    universityPrograms.forEach(program => {
      program.admissions?.forEach(adm => {
        adm.deadlines?.forEach(d => {
          allDeadlinesFromDB.push({
            date: d.deadlineDate,
            title: d.title || d.deadlineType,
            type: d.deadlineType,
            source: 'university_database',
            priority: d.priority
          });
        });
      });
    });

    const calendarDeadlines = userCalendarEvents
      .filter(e => e.eventType === 'deadline' || e.priority === 'high')
      .map(e => ({
        date: e.startDate,
        title: e.title,
        type: e.eventType,
        source: 'user_calendar',
        priority: e.priority
      }));

    const allDeadlines = [...allDeadlinesFromDB, ...calendarDeadlines]
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const mainDeadline = allDeadlines[0]?.date || null;
    const daysUntilDeadline = mainDeadline 
      ? Math.ceil((new Date(mainDeadline) - now) / (1000 * 60 * 60 * 24))
      : null;

    const deadlinesList = allDeadlines.slice(0, 10).map((d, i) => 
      `${i + 1}. ${d.title} (${d.source}): ${new Date(d.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} [${d.priority || 'normal'} priority]`
    ).join('\n');

    const allCalendarEventsList = userCalendarEvents
      .slice(0, 15)
      .map((e, i) => {
        const status = e.completionStatus === 'completed' ? '✅' :
                      new Date(e.startDate) < now ? '⚠️ OVERDUE' : '📅';
        return `${i + 1}. [${status}] ${e.title} - ${e.eventType} - ${new Date(e.startDate).toLocaleDateString()} (${e.priority} priority)${e.description ? ' - ' + e.description.substring(0, 50) : ''}`;
      }).join('\n');

    const testStatus = [];
    const testNeeded = [];
    
    if (userTestScores.hasGMAT) {
      testStatus.push(`✅ GMAT: ${userTestScores.gmatScore}/800`);
    } else if (requiresGMAT) {
      testNeeded.push("GMAT");
    }
    
    if (userTestScores.hasGRE) {
      testStatus.push(`✅ GRE: ${userTestScores.greScore}/340`);
    } else if (requiresGRE) {
      testNeeded.push("GRE");
    }
    
    if (userTestScores.hasIELTS) {
      testStatus.push(`✅ IELTS: ${userTestScores.ieltsScore}/9.0`);
    } else if (requiresIELTS) {
      testNeeded.push("IELTS");
    }
    
    if (userTestScores.hasTOEFL) {
      testStatus.push(`✅ TOEFL: ${userTestScores.toeflScore}/120`);
    } else if (requiresTOEFL) {
      testNeeded.push("TOEFL");
    }

    const essayProgress = totalEssayPromptsCount > 0 
      ? Math.round((completedEssaysCount / totalEssayPromptsCount) * 100) 
      : 0;
    const eventProgress = userCalendarEvents.length > 0 
      ? Math.round((completedEvents / userCalendarEvents.length) * 100) 
      : 0;
    const testProgress = testNeeded.length === 0 ? 100 : 
      Math.round(((testStatus.length / (testStatus.length + testNeeded.length)) * 100));
    const overallProgress = Math.round((essayProgress + eventProgress + testProgress) / 3);

    const admissionReqs = university.admissionRequirements || 
                          universityPrograms[0]?.admissions?.[0] || {};
    const applicationFee = admissionReqs.applicationFee;
    const currency = admissionReqs.currency || '';
    const hasWorkExp = fullUserProfile?.workExperience || false;
    const needsWorkExp = admissionReqs.workExperienceRequired || false;
    const userGPA = fullUserProfile?.gpa;

    // ====== STEP 7: GENERATE AI PROMPT ======
    if (!process.env.GOOGLE_GEMINI_API_KEY_SECOND) {
      console.error("Missing GOOGLE_GEMINI_API_KEY_SECOND");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 65536,
      },
    });

    const prompt = `You are an expert MBA/Masters admissions consultant. Create a hyper-personalized application timeline for a student applying to ${universityName}.

═══════════════════════════════════════════════════════════════════
🎓 UNIVERSITY: ${universityName}
📍 Location: ${location}
🗓️ Main Deadline: ${mainDeadline ? new Date(mainDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ` (${daysUntilDeadline} days away)` : 'TBD'}
📊 Acceptance Rate: ${acceptanceRate ? acceptanceRate + '%' : 'N/A'}
💰 Application Fee: ${applicationFee ? applicationFee + ' ' + currency : 'Check website'}
📝 Essays Required: ${totalEssayPromptsCount} total (${completedEssaysCount} completed, ${notStartedEssaysCount} not started)
═══════════════════════════════════════════════════════════════════

👤 STUDENT PROFILE:
• Study Level: ${userStudyLevel || 'Masters'}
• GPA: ${userGPA || 'Not provided'}
• Work Experience: ${hasWorkExp ? 'Yes' : 'No'}${needsWorkExp ? ' (REQUIRED by program)' : ''}
• Current Progress: ${overallProgress}% overall

📊 TEST SCORES STATUS:
${testStatus.length > 0 ? testStatus.join('\n') : '❌ No tests completed yet'}
${testNeeded.length > 0 ? `\n🎯 STILL NEEDED: ${testNeeded.join(', ')}` : '\n✅ All required tests DONE'}

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL TASK COMPLETION RULES - READ CAREFULLY:
═══════════════════════════════════════════════════════════════════

1. ✅ **NEVER mark tasks as completed unless EXPLICITLY stated below**
2. ✅ **Default ALL tasks to completed: false**
3. ✅ **Only set completed: true if you see "✅ USER COMPLETED THIS" marker**

📝 ESSAY COMPLETION STATUS - FOLLOW EXACTLY:
${essayCompletionFlags.map((flag, idx) => 
  `Essay #${idx + 1}: completed: ${flag} ${flag === 'true' ? '← ✅ USER COMPLETED THIS' : '← ❌ NOT STARTED - SET completed: false'}`
).join('\n')}

⚠️ VERIFICATION CHECKLIST (you MUST follow this):
□ I have set ALL tasks to completed: false by default
□ I have ONLY marked tasks complete that have "✅ USER COMPLETED THIS" marker
□ I have NOT assumed any tasks are complete based on phase status
□ I have NOT marked calendar events as completed tasks
□ I have read the essay completion status and copied values EXACTLY

═══════════════════════════════════════════════════════════════════

📋 ALL ESSAY PROMPTS FOR ${universityName}:
${allEssayPrompts.map((p, i) => 
  `${i + 1}. "${p.promptTitle}" - ${p.wordLimit} words - ${p.isMandatory ? 'REQUIRED' : 'Optional'}\n   Prompt: ${p.promptText?.substring(0, 150)}...`
).join('\n\n') || 'No essay prompts available'}

📅 STUDENT'S CALENDAR EVENTS (${completedEvents}/${userCalendarEvents.length} completed):
${allCalendarEventsList || '❌ No events scheduled yet'}

⏰ ALL IMPORTANT DEADLINES:
${deadlinesList || '❌ No deadlines found - CHECK UNIVERSITY WEBSITE'}

🔍 ADMISSION REQUIREMENTS:
• Min GPA: ${admissionReqs.minimumGpa || 'N/A'}
• GMAT Min: ${admissionReqs.gmatMinScore || 'N/A'}${requiresGMAT ? ' (REQUIRED)' : ''}
• GRE Min: ${admissionReqs.greMinScore || 'N/A'}${requiresGRE ? ' (REQUIRED)' : ''}
• IELTS Min: ${admissionReqs.ieltsMinScore || 'N/A'}${requiresIELTS ? ' (REQUIRED)' : ''}
• TOEFL Min: ${admissionReqs.toeflMinScore || 'N/A'}${requiresTOEFL ? ' (REQUIRED)' : ''}
• Work Exp Required: ${needsWorkExp ? 'YES' : 'No'}

═══════════════════════════════════════════════════════════════════
🎯 YOUR TASK: Generate EXACTLY 5 PHASES with SPECIFIC, ACTIONABLE tasks
═══════════════════════════════════════════════════════════════════

⚠️ CRITICAL REQUIREMENT: You MUST create EXACTLY 5 phases. Do not skip any phase. Do not combine phases.

PHASE 1: Research & Strategic Planning (4-6 weeks)
- Deep research on ${universityName} (faculty, culture, alumni network)
- Connect with current students and alumni on LinkedIn
- Understand program fit and career outcomes
- Attend virtual information sessions
- Identify potential 2-3 recommenders
- Research scholarship opportunities
- 6-8 tasks with specific action steps

PHASE 2: Standardized Testing (8-12 weeks)
${testNeeded.length > 0 ? `- MUST COMPLETE: ${testNeeded.join(', ')}` : '- Tests already done - focus on score submission'}
- Register for required tests
- Complete diagnostic test to establish baseline
- Create detailed study plan with timeline
- Take regular practice tests
- Schedule official test date
- Take official test
- Send scores to ${universityName}
- 6-8 tasks with specific preparation steps

PHASE 3: Essay Writing (6-8 weeks) 
⚠️ CRITICAL REQUIREMENT: You MUST create exactly ${totalEssayPromptsCount} essay tasks, one for each essay prompt.

MANDATORY ESSAY TASK NAMING FORMAT:
- Each essay task title MUST start with "Essay #N:" where N is the essay number (1, 2, 3, etc.)
- Example: "Essay #1: Draft Career Goals Statement"
- Example: "Essay #2: Write Leadership Experience Essay"

PHASE 4: Recommendations & Documents (4-6 weeks)
- Brief your 2-3 selected recommenders about ${universityName}
- Provide recommenders with your resume and career goals
- Request official transcripts from ALL universities attended
- Prepare tailored resume/CV specifically for ${universityName}
- Gather passport copies
- Prepare financial documents (bank statements, sponsor letters)
- Get language test certificates ready
- Create document checklist
- 6-8 tasks with specific documents needed

PHASE 5: Application Assembly & Submission (2-3 weeks)
- Complete all online application forms for ${universityName}
- Upload all ${totalEssayPromptsCount} essays
- Upload official transcripts
- Verify test scores have been received
- Upload resume/CV
- Confirm all recommendations have been submitted
- Pay application fee (${applicationFee ? applicationFee + ' ' + currency : 'amount TBD'})
- Triple-check every section for errors
- Submit 5-7 days BEFORE deadline (${mainDeadline ? new Date(mainDeadline).toLocaleDateString() : 'TBD'})
- Save confirmation receipt
- 6-8 tasks with specific submission checklist

═══════════════════════════════════════════════════════════════════
📋 REQUIRED JSON FORMAT:
═══════════════════════════════════════════════════════════════════

{
  "overview": "3-4 sentences about applying to ${universityName}. Mention ${overallProgress}% progress, ${completedEssaysCount}/${totalEssayPromptsCount} essays done.",
  "totalDuration": "4-6 months",
  "currentProgress": ${overallProgress},
  "phases": [
    {
      "id": 1,
      "name": "Research & Strategic Planning",
      "description": "Phase description for ${universityName}...",
      "duration": "4-6 weeks",
      "timeframe": "4-5 months before deadline",
      "status": "${overallProgress > 0 ? 'in-progress' : 'upcoming'}",
      "objectives": ["5 specific objectives..."],
      "milestones": ["5 key milestones..."],
      "proTips": ["6 expert tips..."],
      "commonMistakes": ["5 common mistakes..."],
      "tasks": [
        {
          "id": 1,
          "title": "Research ${universityName}'s Programs",
          "description": "Description of the task...",
          "estimatedTime": "3-5 days",
          "priority": "high",
          "completed": false,
          "actionSteps": ["Step 1...", "Step 2..."],
          "tips": ["Tip 1...", "Tip 2..."],
          "resources": ["Resource 1...", "Resource 2..."],
          "requiresGMAT": false,
          "requiresGRE": false,
          "requiresIELTS": false,
          "requiresTOEFL": false
        }
      ]
    },
    {
      "id": 3,
      "name": "Essay Writing",
      "tasks": [
        {
          "id": 1,
          "title": "Essay #1: [Topic from first prompt]",
          "completed": ${essayCompletionFlags[0] || 'false'},
          "description": "Write the first essay about...",
          "priority": "high"
        },
        {
          "id": 2,
          "title": "Essay #2: [Topic from second prompt]",
          "completed": ${essayCompletionFlags[1] || 'false'},
          "description": "Write the second essay about...",
          "priority": "high"
        }
      ]
    }
  ]
}

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL RULES - READ CAREFULLY:
═══════════════════════════════════════════════════════════════════
1. ✅ You MUST generate EXACTLY 5 phases - no more, no less. Count them before responding.
2. ✅ Each phase MUST have MINIMUM 6-8 tasks (not 5, not 4 - at least 6)
3. ✅ Phase 3 MUST have ${totalEssayPromptsCount} essay tasks with titles like "Essay #1:", "Essay #2:", etc.
4. ✅ Check the ESSAY COMPLETION STATUS above and set completed:true for essays marked "COMPLETED"
5. ✅ Set completed:false for essays marked "NOT STARTED" or "IN PROGRESS"
6. ✅ All content must be ${universityName}-specific (mention university name in tasks)
7. ✅ Return ONLY valid JSON - NO markdown, NO code blocks, NO explanation
8. ✅ Each task needs 6-8 actionSteps, 4-5 tips, 4-5 resources
9. ✅ VERIFY: Count your phases before responding. If not exactly 5, add missing phases.
10. ✅ Phase names must be: "Research & Strategic Planning", "Standardized Testing", "Essay Writing", "Recommendations & Documents", "Application Assembly & Submission"

⚠️ IMPORTANT: BE CONCISE TO FIT IN TOKEN LIMIT
1. Keep phase descriptions to 2-3 sentences max
2. Each task description: 1-2 sentences max
3. Limit arrays to 3-5 items max:
   - objectives: 3 items
   - milestones: 3 items  
   - proTips: 3 items
   - commonMistakes: 3 items
   - actionSteps: 3 items
   - tips: 2 items
   - resources: 2 items
4. Use abbreviations where possible (e.g., "app" for application)
5. DO NOT include repetitive content

Generate the complete timeline JSON now:`;

    // ====== STEP 8: CALL AI API WITH CONTINUATION SUPPORT ======
    let timelineData;

    try {
      const responseText = await generateCompleteTimeline(model, prompt, 2, 2);
      console.log("Final AI Response length:", responseText.length);
      
      try {
        timelineData = parseAIResponse(responseText);
        console.log(`✅ AI timeline parsed successfully with ${timelineData.phases?.length || 0} phases`);
      } catch (parseError) {
        console.error("❌ JSON parsing failed:", parseError.message);
        return NextResponse.json(
          {
            error: "Failed to parse timeline",
            message: "AI response could not be parsed. Please try again.",
            details: parseError.message
          },
          { status: 500 }
        );
      }
    } catch (apiError) {
      console.error("❌ Gemini API error:", apiError.message);
      return NextResponse.json(
        {
          error: "AI service error",
          message: "Failed to generate timeline. Please try again later.",
          details: apiError.message
        },
        { status: 500 }
      );
    }

    // ====== STEP 9: VALIDATE TIMELINE STRUCTURE ======
    if (!timelineData.phases || !Array.isArray(timelineData.phases)) {
      console.error("❌ Invalid timeline structure - no phases array");
      return NextResponse.json(
        {
          error: "Invalid timeline generated",
          message: "AI generated invalid timeline structure. Please try again."
        },
        { status: 500 }
      );
    }

    if (timelineData.phases.length < 4) {
      console.error(`❌ AI generated only ${timelineData.phases.length} phases`);
      return NextResponse.json(
        {
          error: "Incomplete timeline generated",
          message: `The AI generated only ${timelineData.phases.length} phases. Please click "Regenerate" to try again.`,
          details: `Expected 5 phases but got ${timelineData.phases.length}`,
          phasesReceived: timelineData.phases.map(p => p.name)
        },
        { status: 500 }
      );
    }

    if (timelineData.phases.length === 4) {
      console.log("⚠️ Got 4 phases, checking which one is missing...");
      const phaseNames = timelineData.phases.map(p => p.name?.toLowerCase() || '');
      
      const hasSubmissionPhase = phaseNames.some(n => 
        n.includes('submission') || n.includes('assembly') || n.includes('application')
      );
      
      if (!hasSubmissionPhase) {
        console.log("Adding placeholder Phase 5: Application Assembly & Submission");
        timelineData.phases.push(createFallbackPhase(5));
      }
    }

    console.log(`✅ Validated: Timeline has ${timelineData.phases.length} phases`);

    // ====== STEP 10: ENHANCE TIMELINE WITH REAL USER DATA ======
    timelineData = validateAndFixTaskCompletion(
      timelineData,
      essayCompletionFlags,
      userTestScores,
      userCalendarEvents
    );

    const totalTasks = timelineData.phases.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
    const completedWithProof = timelineData.phases.reduce((sum, p) => 
      sum + (p.tasks?.filter(t => t.completed === true).length || 0), 0
    );

    console.log('\n🔍 TASK COMPLETION VERIFICATION:');
    console.log(`Total tasks: ${totalTasks}`);
    console.log(`Completed with DB proof: ${completedWithProof}`);

    const processingTime = Date.now() - startTime;

    // ====== STEP 11: BUILD COMPREHENSIVE METADATA ======
    const metadata = {
      universityName: universityName,
      location: location,
      deadline: mainDeadline,
      daysUntilDeadline: daysUntilDeadline,
      acceptanceRate: acceptanceRate,
      applicationFee: applicationFee,
      
      essaysRequired: totalEssayPromptsCount,
      essaysCompleted: completedEssaysCount,
      essaysRemaining: Math.max(0, totalEssayPromptsCount - completedEssaysCount),
      essaysNotStarted: notStartedEssaysCount,
      essayCompletionRate: totalEssayPromptsCount > 0 
        ? Math.round((completedEssaysCount / totalEssayPromptsCount) * 100) 
        : 0,
      
      testsCompleted: testStatus,
      testsNeeded: testNeeded,
      allTestsComplete: testNeeded.length === 0,
      requiresGMAT: requiresGMAT,
      requiresGRE: requiresGRE,
      requiresIELTS: requiresIELTS,
      requiresTOEFL: requiresTOEFL,
      userHasGMAT: userTestScores.hasGMAT,
      userHasGRE: userTestScores.hasGRE,
      userHasIELTS: userTestScores.hasIELTS,
      userHasTOEFL: userTestScores.hasTOEFL,
      
      calendarEventsTotal: userCalendarEvents.length,
      calendarEventsCompleted: completedEvents,
      calendarEventsPending: pendingEvents,
      calendarEventsOverdue: overdueEvents,
      totalCalendarEvents: userCalendarEvents.length,
      completedCalendarEvents: completedEvents,
      pendingCalendarEvents: pendingEvents,
      overdueCalendarEvents: overdueEvents,
      
      userGPA: userGPA,
      userStudyLevel: userStudyLevel,
      userHasWorkExperience: hasWorkExp,
      workExperienceRequired: needsWorkExp,
      
      processingTime: processingTime,
      model: "gemini-1.5-pro",
      generatedAt: new Date().toISOString(),
      fromDatabase: false,
      
      overallProgress: overallProgress,
      essayProgress: essayProgress,
      eventProgress: eventProgress,
      testProgress: testProgress,
      
      programsFound: universityPrograms.length,
      filteredByStudyLevel: userStudyLevel
    };

    // ====== STEP 12: SAVE TO DATABASE AND RELOAD FOR DATABASE IDs ======
    let timelineId;
    let savedToDatabase = false;

    try {
      // ✅ Save timeline to database
      timelineId = await saveTimelineWithRetry(
        userId,
        university.id,
        universityPrograms[0]?.id,
        timelineData,
        metadata,
        3
      );
      
      savedToDatabase = true;
      
      console.log(`✅ Timeline saved to database with ID: ${timelineId}`);
      
      // ✅ CRITICAL: Reload timeline from database to get proper database IDs and completion status
      const reloadedTimeline = await reloadTimelineFromDatabase(timelineId);
      
      if (reloadedTimeline) {
        // ✅ Replace the AI-generated timeline with database-loaded timeline
        timelineData = reloadedTimeline;
        console.log('✅ Timeline replaced with database version (has proper IDs and completion status)');
      } else {
        console.warn('⚠️ Could not reload timeline from database, using AI-generated version');
      }
      
    } catch (dbError) {
      console.error("❌ Failed to save timeline to database after retries:", dbError.message);
      savedToDatabase = false;
      metadata.dbError = dbError.message;
      metadata.warningMessage = "Timeline generated but could not be saved to database. Task completion will not persist.";
    }

    // Update metadata with save status
    metadata.timelineId = timelineId;
    metadata.savedToDatabase = savedToDatabase;

    // ====== STEP 13: VALIDATE AND RETURN SUCCESS RESPONSE ======
    if (!timelineData || !timelineData.phases || timelineData.phases.length === 0) {
      console.error('❌ Invalid timeline data generated');
      return NextResponse.json(
        { error: 'Invalid timeline structure generated' },
        { status: 500 }
      );
    }

    // ✅ Log final stats
    console.log('📤 Sending response:', {
      universityId: university.id,
      universityName: universityName,
      phasesCount: timelineData.phases.length,
      totalTasks: timelineData.phases.reduce((sum, p) => sum + (p.tasks?.length || 0), 0),
      completedTasks: timelineData.phases.reduce(
        (sum, p) => sum + (p.tasks?.filter(t => t.completed === true).length || 0), 0
      ),
      essaysCompleted: metadata.essaysCompleted,
      essaysTotal: metadata.essaysRequired,
      tasksWithDatabaseIds: timelineData.phases.reduce(
        (sum, p) => sum + (p.tasks?.filter(t => t.id && typeof t.id === 'string' && t.id.length > 10).length || 0), 0
      ),
      savedToDatabase: savedToDatabase
    });

    return NextResponse.json({
      success: true,
      timeline: timelineData,
      metadata: metadata,
      warnings: savedToDatabase ? [] : [
        "Database connection failed. Timeline displayed but changes won't be saved. Please regenerate."
      ]
    });

  } catch (error) {
    console.error("❌ Timeline API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate timeline",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}