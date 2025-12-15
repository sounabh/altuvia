// src/app/api/generate-timeline/route.js

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY_SECOND);

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
 * ✅ FIX 4: Enhanced essay completion logic (98% word count = complete) - Stricter check
 */
function calculateEssayCompletion(essays) {
  return essays.map(essay => {
    const wordCountPercentage = essay.wordLimit > 0 
      ? (essay.wordCount / essay.wordLimit) * 100 
      : 0;
    
    // ✅ FIX: Stricter completion check - must be explicit true or meet criteria
    const isActuallyCompleted = 
      (essay.isCompleted === true) || 
      (essay.status === 'COMPLETED') || 
      (essay.status === 'SUBMITTED') || 
      (wordCountPercentage >= 98); // Must be 98% or more
    
    return {
      ...essay,
      actualCompletionPercentage: Math.min(wordCountPercentage, 100),
      isActuallyCompleted: isActuallyCompleted, // ✅ Boolean
      completionReason: isActuallyCompleted 
        ? (essay.status === 'COMPLETED' || essay.status === 'SUBMITTED' ? 'status' 
           : wordCountPercentage >= 98 ? 'word_count_98_percent' 
           : 'database_flag') 
        : 'not_complete'
    };
  });
}

/**
 * Fetch fresh metadata for an existing timeline
 * This ensures essay counts, test status, and calendar events are always up-to-date
 */
async function fetchFreshMetadata(userId, universityId) {
  try {
    // Get fresh user profile
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
    
    // Get fresh programs with essay prompts
    const freshPrograms = await prisma.program.findMany({
      where: {
        universityId: universityId,
        isActive: true,
        ...(userStudyLevel && {
          degreeType: {
            equals: userStudyLevel,
            mode: "insensitive",
          },
        }),
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
    
    // Get fresh user essays
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
    
    // Calculate fresh essay counts using 98% completion logic
    const allEssayPrompts = freshPrograms.flatMap(p => p.essayPrompts || []);
    const totalEssayPromptsCount = allEssayPrompts.length;
    
    const enhancedEssays = calculateEssayCompletion(freshEssays);
    const completedEssaysCount = enhancedEssays.filter(e => e.isActuallyCompleted === true).length;
    const notStartedEssaysCount = totalEssayPromptsCount - freshEssays.length;
    
    // Get fresh calendar events
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
    
    // Parse fresh test scores
    const testScores = parseTestScores(freshUserProfile?.testScores);
    
    // Get acceptance rate from programs
    const acceptanceRate = freshPrograms[0]?.admissions?.[0]?.acceptanceRate || null;
    
    return {
      // Essay stats (FRESH)
      essaysRequired: totalEssayPromptsCount,
      essaysCompleted: completedEssaysCount,
      essaysRemaining: Math.max(0, totalEssayPromptsCount - completedEssaysCount),
      essaysNotStarted: notStartedEssaysCount,
      essayCompletionRate: totalEssayPromptsCount > 0 
        ? Math.round((completedEssaysCount / totalEssayPromptsCount) * 100) 
        : 0,
      
      // Calendar stats (FRESH)
      calendarEventsTotal: freshCalendarEvents.length,
      calendarEventsCompleted: completedEvents,
      calendarEventsPending: pendingEvents,
      calendarEventsOverdue: overdueEvents,
      
      // Test scores (FRESH)
      userHasGMAT: testScores.hasGMAT,
      userHasGRE: testScores.hasGRE,
      userHasIELTS: testScores.hasIELTS,
      userHasTOEFL: testScores.hasTOEFL,
      gmatScore: testScores.gmatScore,
      greScore: testScores.greScore,
      ieltsScore: testScores.ieltsScore,
      toeflScore: testScores.toeflScore,
      
      // User profile (FRESH)
      userGPA: freshUserProfile?.gpa,
      userStudyLevel: userStudyLevel,
      userHasWorkExperience: !!freshUserProfile?.workExperience,
      
      // Program info
      programsFound: freshPrograms.length,
      acceptanceRate: acceptanceRate,
      
      // Enhanced essays for task matching
      enhancedEssays: enhancedEssays,
      allEssayPrompts: allEssayPrompts
    };
  } catch (error) {
    console.error("Error fetching fresh metadata:", error);
    return null;
  }
}

/**
 * ✅ FIX 3: Match essay task to user's essay using database relationship (essayPromptId)
 * Added detailed logging for debugging
 */
function matchEssayTaskToUserEssay(taskTitle, allEssayPrompts, enhancedEssays) {
  const taskTitleLower = (taskTitle || '').toLowerCase();
  
  // Check if this is an essay-related task
  if (!taskTitleLower.includes('essay') && !taskTitleLower.includes('writing') && !taskTitleLower.includes('prompt')) {
    return { isTaskComplete: false, relatedEssayId: null, matchType: 'not_essay_task' };
  }
  
  // ✅ ADD LOGGING
  console.log(`🔍 Matching essay task: "${taskTitle}"`);
  
  // Strategy 1: Extract essay number from task title (e.g., "Essay #1", "Essay 2", "1st Essay")
  const essayNumberMatch = taskTitleLower.match(/essay\s*#?(\d+)/i) || 
                            taskTitleLower.match(/(\d+)(?:st|nd|rd|th)?\s*essay/i) ||
                            taskTitleLower.match(/prompt\s*#?(\d+)/i);
  
  if (essayNumberMatch) {
    const essayNumber = parseInt(essayNumberMatch[1]);
    
    if (essayNumber > 0 && essayNumber <= allEssayPrompts.length) {
      const promptIndex = essayNumber - 1;
      const targetPrompt = allEssayPrompts[promptIndex];
      
      // Find user's essay by essayPromptId (DATABASE RELATIONSHIP)
      const matchingEssay = enhancedEssays.find(essay => 
        essay.essayPromptId === targetPrompt.id || 
        essay.essayPrompt?.id === targetPrompt.id
      );
      
      if (matchingEssay) {
        // ✅ ADD DETAILED LOGGING
        console.log(`  ✅ Found Essay #${essayNumber}:`, {
          promptId: targetPrompt.id,
          promptTitle: targetPrompt.promptTitle?.substring(0, 40),
          essayId: matchingEssay.id,
          isActuallyComplete: matchingEssay.isActuallyCompleted,
          wordCount: matchingEssay.wordCount,
          wordLimit: matchingEssay.wordLimit || targetPrompt.wordLimit,
          completionPercentage: matchingEssay.actualCompletionPercentage
        });
        
        return {
          isTaskComplete: matchingEssay.isActuallyCompleted === true, // ✅ Explicit check
          relatedEssayId: matchingEssay.id,
          matchType: 'essay_number_db_match'
        };
      } else {
        console.log(`  ⚠️ Essay #${essayNumber} not started (prompt exists, no user essay)`);
        return {
          isTaskComplete: false,
          relatedEssayId: null,
          matchType: 'essay_not_started'
        };
      }
    }
  }
  
  // Strategy 2: Check if it's a general "complete all essays" task
  if (taskTitleLower.includes('all essay') || taskTitleLower.includes('essay drafts') || taskTitleLower.includes('finalize essays')) {
    const completedCount = enhancedEssays.filter(e => e.isActuallyCompleted === true).length;
    const totalCount = allEssayPrompts.length;
    const allComplete = completedCount === totalCount && totalCount > 0;
    
    console.log(`  📊 All essays check: ${completedCount}/${totalCount} complete`);
    
    return {
      isTaskComplete: allComplete,
      relatedEssayId: null,
      matchType: 'all_essays_check'
    };
  }
  
  // Strategy 3: Try to match by prompt title keywords
  for (let i = 0; i < allEssayPrompts.length; i++) {
    const prompt = allEssayPrompts[i];
    const promptTitleLower = (prompt.promptTitle || '').toLowerCase();
    
    // Check if task title contains key words from prompt title
    const promptWords = promptTitleLower.split(/\s+/).filter(w => w.length > 4);
    const matchingWords = promptWords.filter(word => taskTitleLower.includes(word));
    
    if (matchingWords.length >= 2 || (promptTitleLower.length > 10 && taskTitleLower.includes(promptTitleLower.substring(0, 15)))) {
      const matchingEssay = enhancedEssays.find(essay => 
        essay.essayPromptId === prompt.id || 
        essay.essayPrompt?.id === prompt.id
      );
      
      if (matchingEssay) {
        console.log(`  ✅ Keyword match for Essay #${i + 1}:`, {
          promptTitle: prompt.promptTitle?.substring(0, 40),
          isComplete: matchingEssay.isActuallyCompleted
        });
        
        return {
          isTaskComplete: matchingEssay.isActuallyCompleted === true,
          relatedEssayId: matchingEssay.id,
          matchType: 'keyword_match'
        };
      }
    }
  }
  
  console.log(`  ❌ No match found for task: "${taskTitle}"`);
  return { isTaskComplete: false, relatedEssayId: null, matchType: 'no_match' };
}

/**
 * ✅ FIX 2: Check if timeline already exists in database - WITH FRESH METADATA AND DB SYNC
 */
async function getExistingTimeline(userId, universityId, programId) {
  try {
    const existingTimeline = await prisma.aITimeline.findFirst({
      where: {
        userId: userId,
        universityId: universityId,
        ...(programId ? { programId: programId } : {}),
        isActive: true
      },
      include: {
        phases: {
          orderBy: { displayOrder: 'asc' },
          include: {
            tasks: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    if (existingTimeline) {
      console.log(`Found existing timeline for user ${userId}, university ${universityId}`);
      
      // ALWAYS FETCH FRESH METADATA
      const freshMetadata = await fetchFreshMetadata(userId, universityId);
      
      if (!freshMetadata) {
        console.log("Could not fetch fresh metadata, returning null to regenerate");
        return null;
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
      
      // Get test requirements from university data
      const requiresGMAT = universityData.requiresGMAT || false;
      const requiresGRE = universityData.requiresGRE || false;
      const requiresIELTS = universityData.requiresIELTS || false;
      const requiresTOEFL = universityData.requiresTOEFL || false;
      
      // Calculate which tests are still needed
      const testsNeeded = [];
      if (requiresGMAT && !freshMetadata.userHasGMAT) testsNeeded.push("GMAT");
      if (requiresGRE && !freshMetadata.userHasGRE) testsNeeded.push("GRE");
      if (requiresIELTS && !freshMetadata.userHasIELTS) testsNeeded.push("IELTS");
      if (requiresTOEFL && !freshMetadata.userHasTOEFL) testsNeeded.push("TOEFL");
      
      // ========== BUILD TIMELINE WITH FRESH COMPLETION STATUS ==========
      // Track tasks that need database updates
      const taskUpdates = [];
      
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
            // ✅ FIX: Start with database value - DON'T override without reason
            let isTaskComplete = task.isCompleted; // Get from database
            const originalStatus = task.isCompleted;
            let matchReason = 'database_value';
            
            // ✅ FIX: Only check test completion if task explicitly requires test
            if (task.requiresGMAT === true && freshMetadata.userHasGMAT) {
              isTaskComplete = true;
              matchReason = 'gmat_complete';
            }
            if (task.requiresGRE === true && freshMetadata.userHasGRE) {
              isTaskComplete = true;
              matchReason = 'gre_complete';
            }
            if (task.requiresIELTS === true && freshMetadata.userHasIELTS) {
              isTaskComplete = true;
              matchReason = 'ielts_complete';
            }
            if (task.requiresTOEFL === true && freshMetadata.userHasTOEFL) {
              isTaskComplete = true;
              matchReason = 'toefl_complete';
            }
            
            // ✅ FIX: Check essay completion using DB relationships
            const essayMatch = matchEssayTaskToUserEssay(
              task.title,
              freshMetadata.allEssayPrompts || [],
              freshMetadata.enhancedEssays || []
            );
            
            // ✅ CRITICAL FIX: Only mark complete if essay is ACTUALLY complete
            if (essayMatch.matchType !== 'not_essay_task' && essayMatch.matchType !== 'no_match') {
              if (essayMatch.isTaskComplete === true) {
                isTaskComplete = true;
                matchReason = essayMatch.matchType;
              } else {
                // ✅ FIX: If essay exists but NOT complete, mark as incomplete
                isTaskComplete = false;
                matchReason = 'essay_not_complete';
              }
            }
            
            // ✅ FIX: Track changes for database update
            if (originalStatus !== isTaskComplete) {
              taskUpdates.push({
                id: task.id,
                title: task.title,
                wasComplete: originalStatus,
                nowComplete: isTaskComplete,
                reason: matchReason
              });
            }
            
            return {
              ...task,
              id: task.id, // ✅ CRITICAL: Include database ID for task completion persistence
              taskNumber: task.taskNumber,
              title: task.title,
              description: task.description || task.detailedGuide,
              estimatedTime: task.estimatedTime,
              priority: task.priority,
              completed: isTaskComplete, // ✅ Use computed value
              status: isTaskComplete ? 'completed' : task.status,
              actionSteps: task.actionSteps || [],
              tips: task.tips || [],
              resources: task.resources || [],
              requiresGMAT: task.requiresGMAT || false,
              requiresGRE: task.requiresGRE || false,
              requiresIELTS: task.requiresIELTS || false,
              requiresTOEFL: task.requiresTOEFL || false,
              relatedCalendarEventId: task.relatedEventId,
              relatedEssayId: essayMatch.relatedEssayId || task.relatedEssayId
            };
          })
        }))
      };

      // ========== ✅ FIX 6: SYNC TASK COMPLETION TO DATABASE WITH LOGGING ==========
      if (taskUpdates.length > 0) {
        console.log(`\n🔄 SYNCING ${taskUpdates.length} TASK UPDATES TO DATABASE:`);
        console.log(`   University ID: ${universityId}`);
        console.log(`   Timeline ID: ${existingTimeline.id}`);
        
        try {
          await Promise.all(
            taskUpdates.map(async (update) => {
              try {
                await prisma.timelineTask.update({
                  where: { id: update.id },
                  data: { 
                    isCompleted: update.nowComplete,
                    status: update.nowComplete ? 'completed' : 'pending',
                    completedAt: update.nowComplete ? new Date() : null
                  }
                });
                console.log(`  ✅ "${update.title.substring(0, 50)}": ${update.wasComplete ? 'completed' : 'pending'} → ${update.nowComplete ? 'COMPLETED' : 'PENDING'} (${update.reason})`);
              } catch (updateErr) {
                console.error(`  ❌ Failed to update task ${update.id}:`, updateErr.message);
              }
            })
          );
          
          // Also update the timeline's overall progress
          const totalTasks = timeline.phases.reduce((sum, p) => sum + p.tasks.length, 0);
          const completedTasks = timeline.phases.reduce(
            (sum, p) => sum + p.tasks.filter(t => t.completed === true).length, 0
          );
          const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          
          await prisma.aITimeline.update({
            where: { id: existingTimeline.id },
            data: {
              overallProgress: newProgress,
              lastRegeneratedAt: new Date()
            }
          });
          
          console.log(`  📊 Updated timeline progress: ${newProgress}%`);
          console.log(`✅ Database sync complete\n`);
          
        } catch (syncError) {
          console.error('⚠️ Database sync error:', syncError.message);
          // Don't throw - still return the correct timeline to frontend
        }
      } else {
        console.log('ℹ️ No task completion changes to sync');
      }

      // Calculate overall progress based on fresh data
      const essayProgress = freshMetadata.essayCompletionRate;
      const eventProgress = freshMetadata.calendarEventsTotal > 0 
        ? Math.round((freshMetadata.calendarEventsCompleted / freshMetadata.calendarEventsTotal) * 100) 
        : 0;
      const testProgress = testsNeeded.length === 0 ? 100 : 
        Math.round((4 - testsNeeded.length) / 4 * 100);
      const overallProgress = Math.round((essayProgress + eventProgress + testProgress) / 3);

      // Update timeline progress value
      timeline.currentProgress = overallProgress;

      return {
        timeline,
        metadata: {
          timelineId: existingTimeline.id,
          fromDatabase: true,
          tasksSynced: taskUpdates.length,
          lastGenerated: existingTimeline.lastRegeneratedAt,
          generatedAt: existingTimeline.generatedAt,
          universityName: universityData.universityName || existingTimeline.timelineName,
          location: universityData.location,
          deadline: universityData.deadline,
          daysUntilDeadline: universityData.deadline 
            ? Math.ceil((new Date(universityData.deadline) - new Date()) / (1000 * 60 * 60 * 24))
            : null,
          
          acceptanceRate: freshMetadata.acceptanceRate || universityData.acceptanceRate,
          
          // Essay stats (FRESH)
          essaysRequired: freshMetadata.essaysRequired,
          essaysCompleted: freshMetadata.essaysCompleted,
          essaysRemaining: freshMetadata.essaysRemaining,
          essaysNotStarted: freshMetadata.essaysNotStarted,
          essayCompletionRate: freshMetadata.essayCompletionRate,
          
          // Calendar stats (FRESH)
          calendarEventsTotal: freshMetadata.calendarEventsTotal,
          calendarEventsCompleted: freshMetadata.calendarEventsCompleted,
          calendarEventsPending: freshMetadata.calendarEventsPending,
          calendarEventsOverdue: freshMetadata.calendarEventsOverdue,
          
          // Test requirements
          requiresGMAT: requiresGMAT,
          requiresGRE: requiresGRE,
          requiresIELTS: requiresIELTS,
          requiresTOEFL: requiresTOEFL,
          
          // Test scores (FRESH)
          userHasGMAT: freshMetadata.userHasGMAT,
          userHasGRE: freshMetadata.userHasGRE,
          userHasIELTS: freshMetadata.userHasIELTS,
          userHasTOEFL: freshMetadata.userHasTOEFL,
          testsNeeded: testsNeeded,
          allTestsComplete: testsNeeded.length === 0,
          
          // Progress (FRESH)
          currentProgress: overallProgress,
          essayProgress: essayProgress,
          eventProgress: eventProgress,
          testProgress: testProgress,
          
          // User profile (FRESH)
          userGPA: freshMetadata.userGPA,
          userStudyLevel: freshMetadata.userStudyLevel,
          programsFound: freshMetadata.programsFound
        }
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching existing timeline:", error);
    return null;
  }
}

/**
 * Save timeline to database with optimized batching
 */
async function saveTimelineToDatabase(userId, universityId, programId, timeline, metadata) {
  try {
    console.log(`Saving timeline to database for user ${userId}, university ${universityId}`);

    const existingTimeline = await prisma.aITimeline.findFirst({
      where: {
        userId: userId,
        universityId: universityId,
        ...(programId ? { programId: programId } : {})
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
          aiModel: metadata.model || "gemini-2.5-flash-lite",
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
                  taskNumber: task.id || taskIndex + 1,
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

  // Strategy 1: Direct parse
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

  // Strategy 2: Find complete JSON by brace matching
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

  // Strategy 3: Extract phases and rebuild
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
          // Skip invalid phase
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

/**
 * Build essay status string for AI prompt
 */
function buildEssayStatusForPrompt(allEssayPrompts, enhancedEssays) {
  return allEssayPrompts.map((prompt, i) => {
    const essay = enhancedEssays.find(e => 
      e.essayPromptId === prompt.id || e.essayPrompt?.id === prompt.id
    );
    
    const essayNumber = i + 1;
    const isComplete = essay?.isActuallyCompleted === true;
    const status = isComplete ? '✅ COMPLETED' : 
                   essay ? `🔄 IN PROGRESS (${essay.wordCount}/${essay.wordLimit || prompt.wordLimit} words)` : 
                   '⚪ NOT STARTED';
    
    return `Essay #${essayNumber}: "${prompt.promptTitle}" - ${status}${isComplete ? ' ← SET completed: true' : ' ← SET completed: false'}`;
  }).join('\n');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { university, userProfile, userId, forceRegenerate = false } = body;

    // ✅ FIX 1: Add validation at the start
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

    // ====== STEP 1: FETCH COMPREHENSIVE USER DATA ======
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

    // ====== STEP 2: FETCH UNIVERSITY-SPECIFIC PROGRAMS ======
    const universityPrograms = await prisma.program.findMany({
      where: {
        universityId: university.id,
        isActive: true,
        ...(userStudyLevel && {
          degreeType: {
            equals: userStudyLevel,
            mode: "insensitive",
          },
        }),
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

    // ====== STEP 3: FETCH ALL USER'S ESSAYS ======
    const programIds = universityPrograms.map(p => p.id);
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

    // Apply enhanced essay completion logic (98% = complete)
    const enhancedEssays = calculateEssayCompletion(userEssays);
    
    // Get ALL essay prompts from programs
    const allEssayPrompts = universityPrograms.flatMap(p => p.essayPrompts || []);
    const totalEssayPromptsCount = allEssayPrompts.length;
    const completedEssaysCount = enhancedEssays.filter(e => e.isActuallyCompleted === true).length;
    const notStartedEssaysCount = totalEssayPromptsCount - userEssays.length;

    console.log(`Essay completion: ${completedEssaysCount}/${totalEssayPromptsCount} (using 98% logic)`);
    console.log(`Essays not started: ${notStartedEssaysCount}`);

    // Debug: Log essay prompt to essay mapping
    console.log('\n=== ESSAY PROMPT TO USER ESSAY MAPPING ===');
    allEssayPrompts.forEach((prompt, i) => {
      const essay = enhancedEssays.find(e => 
        e.essayPromptId === prompt.id || e.essayPrompt?.id === prompt.id
      );
      console.log(`Essay #${i + 1}:`, {
        promptId: prompt.id,
        promptTitle: prompt.promptTitle?.substring(0, 40),
        hasUserEssay: !!essay,
        essayId: essay?.id || null,
        isComplete: essay?.isActuallyCompleted === true
      });
    });
    console.log('=== END MAPPING ===\n');

    // ====== STEP 4: FETCH ALL USER'S CALENDAR EVENTS ======
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

    // Use university object data for requirements
    const requiresGMAT = university.requiresGMAT || false;
    const requiresGRE = university.requiresGRE || false;
    const requiresIELTS = university.requiresIELTS || false;
    const requiresTOEFL = university.requiresTOEFL || false;
    const acceptanceRate = university.acceptanceRate || 
                          universityPrograms[0]?.admissions?.[0]?.acceptanceRate || null;

    // ====== STEP 5: CHECK FOR EXISTING TIMELINE ======
    if (!forceRegenerate) {
      const existingData = await getExistingTimeline(
        userId, 
        university.id, 
        universityPrograms[0]?.id
      );

      if (existingData) {
        console.log("Returning existing timeline from database (with fresh data sync)");
        const processingTime = Date.now() - startTime;
        
        return NextResponse.json({
          success: true,
          timeline: existingData.timeline,
          metadata: {
            ...existingData.metadata,
            universityName: existingData.metadata.universityName || university.universityName || university.name,
            location: existingData.metadata.location || university.location,
            deadline: existingData.metadata.deadline,
            acceptanceRate: acceptanceRate,
            fromDatabase: true,
            processingTime: processingTime,
            essaysRequired: totalEssayPromptsCount,
            essaysCompleted: completedEssaysCount,
            essaysRemaining: Math.max(0, totalEssayPromptsCount - completedEssaysCount),
            essaysNotStarted: notStartedEssaysCount,
            essayCompletionRate: totalEssayPromptsCount > 0 
              ? Math.round((completedEssaysCount / totalEssayPromptsCount) * 100) 
              : 0,
            calendarEventsTotal: userCalendarEvents.length,
            calendarEventsCompleted: completedEvents,
            requiresGMAT: requiresGMAT,
            requiresGRE: requiresGRE,
            requiresIELTS: requiresIELTS,
            requiresTOEFL: requiresTOEFL,
            userHasGMAT: userTestScores.hasGMAT,
            userHasGRE: userTestScores.hasGRE,
            userHasIELTS: userTestScores.hasIELTS,
            userHasTOEFL: userTestScores.hasTOEFL
          }
        });
      }
    }

    // ====== STEP 6: PREPARE DATA FOR AI PROMPT ======
    const universityName = university.universityName || university.name || "Your University";
    const location = university.location || `${university.city || ''}, ${university.country || ''}`.replace(/^, |, $/g, '') || "Location not specified";
    
    // Collect ALL deadlines
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

    // Format deadlines for prompt
    const deadlinesList = allDeadlines.slice(0, 10).map((d, i) => 
      `${i + 1}. ${d.title} (${d.source}): ${new Date(d.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} [${d.priority || 'normal'} priority]`
    ).join('\n');

    // Format ALL calendar events
    const allCalendarEventsList = userCalendarEvents
      .slice(0, 15)
      .map((e, i) => {
        const status = e.completionStatus === 'completed' ? '✅' :
                      new Date(e.startDate) < now ? '⚠️ OVERDUE' : '📅';
        return `${i + 1}. [${status}] ${e.title} - ${e.eventType} - ${new Date(e.startDate).toLocaleDateString()} (${e.priority} priority)${e.description ? ' - ' + e.description.substring(0, 50) : ''}`;
      }).join('\n');

    // Essay status for AI prompt (with completion markers)
    const essayStatusForPrompt = buildEssayStatusForPrompt(allEssayPrompts, enhancedEssays);

    // All essay prompts with full details
    const essayPromptsList = allEssayPrompts.map((p, i) => 
      `${i + 1}. "${p.promptTitle}" - ${p.wordLimit} words - ${p.isMandatory ? 'REQUIRED' : 'Optional'}\n   Prompt: ${p.promptText?.substring(0, 150)}...`
    ).join('\n\n');

    // Test status
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

    // Calculate overall progress
    const essayProgress = totalEssayPromptsCount > 0 
      ? Math.round((completedEssaysCount / totalEssayPromptsCount) * 100) 
      : 0;
    const eventProgress = userCalendarEvents.length > 0 
      ? Math.round((completedEvents / userCalendarEvents.length) * 100) 
      : 0;
    const testProgress = testNeeded.length === 0 ? 100 : 
      Math.round(((testStatus.length / (testStatus.length + testNeeded.length)) * 100));
    const overallProgress = Math.round((essayProgress + eventProgress + testProgress) / 3);

    // Admission requirements
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
        maxOutputTokens: 16384,
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

📝 ESSAY COMPLETION STATUS (${completedEssaysCount}/${totalEssayPromptsCount} completed):
${essayStatusForPrompt || '❌ No essays available'}

📋 ALL ESSAY PROMPTS FOR ${universityName}:
${essayPromptsList || 'No essay prompts available'}

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
🎯 YOUR TASK: Generate a 5-phase timeline with SPECIFIC, ACTIONABLE tasks
═══════════════════════════════════════════════════════════════════

PHASE 1: Research & Strategic Planning (4-6 weeks)
- Deep research on ${universityName} (faculty, culture, alumni network)
- Connect with current students and alumni
- Understand program fit and career outcomes
- 5-8 tasks with specific action steps

PHASE 2: Standardized Testing (8-12 weeks)
${testNeeded.length > 0 ? `- MUST COMPLETE: ${testNeeded.join(', ')}` : '- Tests already done - focus on score submission'}
- Diagnostic test → Study plan → Practice → Official test → Score sending
- 5-8 tasks with specific preparation steps

PHASE 3: Essay Writing (6-8 weeks) 
⚠️ CRITICAL REQUIREMENT: You MUST create exactly ${totalEssayPromptsCount} essay tasks, one for each essay prompt.

MANDATORY ESSAY TASK NAMING FORMAT:
- Each essay task title MUST start with "Essay #N:" where N is the essay number (1, 2, 3, etc.)
- Example: "Essay #1: Draft Career Goals Statement"
- Example: "Essay #2: Write Leadership Experience Essay"

ESSAY COMPLETION STATUS - USE THESE TO SET completed:true or completed:false:
${essayStatusForPrompt}

PHASE 4: Recommendations & Documents (4-6 weeks)
- Select and brief 2-3 recommenders
- Request official transcripts from all universities
- Prepare tailored resume/CV for ${universityName}
- Gather passport, financial docs, language certificates
- 5-8 tasks with specific documents needed

PHASE 5: Application Assembly & Submission (2-3 weeks)
- Complete online application forms
- Upload all documents (essays, transcripts, test scores, resume, recommendations)
- Pay application fee (${applicationFee ? applicationFee + ' ' + currency : 'amount TBD'})
- Triple-check everything
- Submit 5-7 days BEFORE deadline
- 5-8 tasks with specific submission checklist

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
          "completed": ${allEssayPrompts.length > 0 && enhancedEssays.find(e => e.essayPromptId === allEssayPrompts[0]?.id)?.isActuallyCompleted === true ? 'true' : 'false'},
          "description": "Write the first essay about...",
          "priority": "high"
        },
        {
          "id": 2,
          "title": "Essay #2: [Topic from second prompt]",
          "completed": ${allEssayPrompts.length > 1 && enhancedEssays.find(e => e.essayPromptId === allEssayPrompts[1]?.id)?.isActuallyCompleted === true ? 'true' : 'false'},
          "description": "Write the second essay about...",
          "priority": "high"
        }
      ]
    }
  ]
}

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL RULES:
═══════════════════════════════════════════════════════════════════
1. ✅ Include EXACTLY 5-8 tasks per phase
2. ✅ Phase 3 MUST have ${totalEssayPromptsCount} essay tasks with titles like "Essay #1:", "Essay #2:", etc.
3. ✅ Check the ESSAY COMPLETION STATUS above and set completed:true for essays marked "COMPLETED"
4. ✅ Set completed:false for essays marked "NOT STARTED" or "IN PROGRESS"
5. ✅ All content must be ${universityName}-specific
6. ✅ Return ONLY valid JSON - NO markdown, NO code blocks
7. ✅ Each task needs 6-8 actionSteps, 4-5 tips, 4-5 resources

Generate the complete timeline JSON now:`;

    // ====== STEP 8: CALL AI API ======
    let result;
    let timelineData;

    try {
      result = await generateWithRetry(model, prompt, 2);
      const responseText = result.response.text();
      console.log("AI Response length:", responseText.length);
      
      try {
        timelineData = parseAIResponse(responseText);
        console.log("✅ AI timeline parsed successfully");
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
    if (!timelineData.phases || !Array.isArray(timelineData.phases) || timelineData.phases.length === 0) {
      console.error("❌ Invalid timeline structure");
      return NextResponse.json(
        {
          error: "Invalid timeline generated",
          message: "AI generated invalid timeline structure. Please try again."
        },
        { status: 500 }
      );
    }

    // ====== STEP 10: ENHANCE TIMELINE WITH REAL USER DATA ======
    timelineData.phases = timelineData.phases.map((phase, phaseIndex) => {
      return {
        ...phase,
        id: phase.id || phaseIndex + 1,
        phaseNumber: phaseIndex + 1,
        status: phase.status || (phaseIndex === 0 ? 'in-progress' : 'upcoming'),
        tasks: (phase.tasks || []).map((task, taskIndex) => {
          let isTaskComplete = task.completed === true; // ✅ Explicit check
          let relatedEssayId = null;
          let relatedCalendarEventId = null;
          
          // Check test completion
          if (task.requiresGMAT === true && userTestScores.hasGMAT) isTaskComplete = true;
          if (task.requiresGRE === true && userTestScores.hasGRE) isTaskComplete = true;
          if (task.requiresIELTS === true && userTestScores.hasIELTS) isTaskComplete = true;
          if (task.requiresTOEFL === true && userTestScores.hasTOEFL) isTaskComplete = true;
          
          // Check essay completion using DB relationships
          const essayMatch = matchEssayTaskToUserEssay(
            task.title,
            allEssayPrompts,
            enhancedEssays
          );
          
          if (essayMatch.matchType !== 'not_essay_task' && essayMatch.matchType !== 'no_match') {
            isTaskComplete = essayMatch.isTaskComplete === true;
            relatedEssayId = essayMatch.relatedEssayId;
          }
          
          // Check calendar event completion
          const relatedEvent = userCalendarEvents.find(e => {
            const eventTitleLower = (e.title || '').toLowerCase();
            const taskTitleLower = (task.title || '').toLowerCase();
            const taskTitleShort = taskTitleLower.substring(0, 15);
            const eventTitleShort = eventTitleLower.substring(0, 15);
            return eventTitleLower.includes(taskTitleShort) ||
                   taskTitleLower.includes(eventTitleShort);
          });
          
          if (relatedEvent) {
            if (relatedEvent.completionStatus === 'completed') {
              isTaskComplete = true;
            }
            relatedCalendarEventId = relatedEvent.id;
          }
          
          return {
            ...task,
            id: task.id || taskIndex + 1,
            taskNumber: taskIndex + 1,
            completed: isTaskComplete,
            status: isTaskComplete ? 'completed' : 'pending',
            actionSteps: task.actionSteps || [],
            tips: task.tips || [],
            resources: task.resources || [],
            requiresGMAT: task.requiresGMAT || false,
            requiresGRE: task.requiresGRE || false,
            requiresIELTS: task.requiresIELTS || false,
            requiresTOEFL: task.requiresTOEFL || false,
            relatedEssayId: relatedEssayId,
            relatedCalendarEventId: relatedCalendarEventId
          };
        }),
        objectives: phase.objectives || [],
        milestones: phase.milestones || [],
        proTips: phase.proTips || [],
        commonMistakes: phase.commonMistakes || []
      };
    });

    // Debug: Log essay task matching results
    console.log('\n=== ESSAY TASK MATCHING DEBUG ===');
    const phase3 = timelineData.phases.find(p => 
      p.name?.toLowerCase().includes('essay') || p.id === 3
    );
    if (phase3) {
      console.log('Phase 3 (Essay Writing) Tasks:');
      phase3.tasks.forEach((task, i) => {
        console.log(`  Task ${i + 1}: "${task.title?.substring(0, 50)}" - completed: ${task.completed}`);
      });
      const completedTaskCount = phase3.tasks.filter(t => t.completed === true).length;
      console.log(`\n✅ Essay tasks completed: ${completedTaskCount}/${phase3.tasks.length}`);
      console.log(`Expected based on data: ${completedEssaysCount}/${totalEssayPromptsCount}`);
    }
    console.log('=== END DEBUG ===\n');

    const processingTime = Date.now() - startTime;

    // ====== STEP 11: BUILD COMPREHENSIVE METADATA ======
    const metadata = {
      universityName: universityName,
      location: location,
      deadline: mainDeadline,
      daysUntilDeadline: daysUntilDeadline,
      acceptanceRate: acceptanceRate,
      applicationFee: applicationFee,
      
      // Essay stats
      essaysRequired: totalEssayPromptsCount,
      essaysCompleted: completedEssaysCount,
      essaysRemaining: Math.max(0, totalEssayPromptsCount - completedEssaysCount),
      essaysNotStarted: notStartedEssaysCount,
      essayCompletionRate: totalEssayPromptsCount > 0 
        ? Math.round((completedEssaysCount / totalEssayPromptsCount) * 100) 
        : 0,
      
      // Test stats
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
      
      // Calendar stats
      totalCalendarEvents: userCalendarEvents.length,
      completedCalendarEvents: completedEvents,
      pendingCalendarEvents: pendingEvents,
      overdueCalendarEvents: overdueEvents,
      
      // User profile
      userGPA: userGPA,
      userStudyLevel: userStudyLevel,
      userHasWorkExperience: hasWorkExp,
      workExperienceRequired: needsWorkExp,
      
      // Timeline metadata
      processingTime: processingTime,
      model: "gemini-2.5-flash-lite",
      generatedAt: new Date().toISOString(),
      fromDatabase: false,
      
      // Progress tracking
      overallProgress: overallProgress,
      essayProgress: essayProgress,
      eventProgress: eventProgress,
      testProgress: testProgress,
      
      // Program info
      programsFound: universityPrograms.length,
      filteredByStudyLevel: userStudyLevel
    };

    // ====== STEP 12: SAVE TO DATABASE ======
    try {
      const timelineId = await saveTimelineToDatabase(
        userId,
        university.id,
        universityPrograms[0]?.id,
        timelineData,
        metadata
      );
      metadata.timelineId = timelineId;
      metadata.savedToDatabase = true;
      console.log(`✅ Timeline saved to database with ID: ${timelineId}`);
    } catch (dbError) {
      console.error("❌ Failed to save timeline to database:", dbError);
      metadata.savedToDatabase = false;
      metadata.dbError = dbError.message;
    }

    // ====== ✅ FIX 5: STEP 13: VALIDATE AND RETURN SUCCESS RESPONSE ======
    // Validate timeline data before sending
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
      essaysTotal: metadata.essaysRequired
    });

    return NextResponse.json({
      success: true,
      timeline: timelineData,
      metadata: metadata,
      debug: {
        universityId: university.id,
        universityName: universityName,
        totalEssayPrompts: totalEssayPromptsCount,
        completedEssays: completedEssaysCount,
        notStartedEssays: notStartedEssaysCount,
        totalCalendarEvents: userCalendarEvents.length,
        completedEvents: completedEvents,
        programsFound: universityPrograms.length,
        studyLevelFilter: userStudyLevel,
        enhancedEssayLogicUsed: true,
        databaseSaved: metadata.savedToDatabase,
        acceptanceRate: acceptanceRate,
        requiresGMAT: requiresGMAT,
        requiresGRE: requiresGRE,
        requiresIELTS: requiresIELTS,
        requiresTOEFL: requiresTOEFL
      }
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