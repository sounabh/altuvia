// src/app/api/generate-timeline/route.js

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY_SECOND);

/**
 * Parse test scores from string format to extract individual scores
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

  if (!testScoresString || typeof testScoresString !== 'string') {
    return scores;
  }

  const text = testScoresString.toLowerCase();

  // Extract GMAT score (look for "gmat" followed by numbers)
  const gmatMatch = text.match(/gmat[:\s]*(\d+)/i);
  if (gmatMatch) {
    const gmatScore = parseInt(gmatMatch[1]);
    if (gmatScore > 200 && gmatScore <= 800) {
      scores.hasGMAT = true;
      scores.gmatScore = gmatScore;
    }
  }

  // Extract GRE score (look for "gre" followed by numbers)
  const greMatch = text.match(/gre[:\s]*(\d+)/i);
  if (greMatch) {
    const greScore = parseInt(greMatch[1]);
    if (greScore > 260 && greScore <= 340) {
      scores.hasGRE = true;
      scores.greScore = greScore;
    }
  }

  // Extract IELTS score (look for "ielts" followed by decimal or number)
  const ieltsMatch = text.match(/ielts[:\s]*([\d.]+)/i);
  if (ieltsMatch) {
    const ieltsScore = parseFloat(ieltsMatch[1]);
    if (ieltsScore >= 0 && ieltsScore <= 9) {
      scores.hasIELTS = true;
      scores.ieltsScore = ieltsScore;
    }
  }

  // Extract TOEFL score (look for "toefl" followed by numbers)
  const toeflMatch = text.match(/toefl[:\s]*(\d+)/i);
  if (toeflMatch) {
    const toeflScore = parseInt(toeflMatch[1]);
    if (toeflScore >= 0 && toeflScore <= 120) {
      scores.hasTOEFL = true;
      scores.toeflScore = toeflScore;
    }
  }

  return scores;
}

/**
 * Check if timeline already exists in database
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
      
      // Parse stored JSON data safely
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
      
      // Transform database timeline to match expected format
      const timeline = {
        overview: userProfileData.overview || `Application timeline for ${existingTimeline.timelineName}`,
        totalDuration: existingTimeline.totalDuration || "4-6 months",
        currentProgress: existingTimeline.overallProgress || 0,
        phases: existingTimeline.phases.map(phase => ({
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
          tasks: phase.tasks.map(task => ({
            id: task.taskNumber,
            taskNumber: task.taskNumber,
            title: task.title,
            description: task.description || task.detailedGuide,
            estimatedTime: task.estimatedTime,
            priority: task.priority,
            completed: task.isCompleted,
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

      return {
        timeline,
        metadata: {
          timelineId: existingTimeline.id,
          fromDatabase: true,
          lastGenerated: existingTimeline.lastRegeneratedAt,
          generatedAt: existingTimeline.generatedAt,
          universityName: universityData.universityName || existingTimeline.timelineName,
          location: universityData.location,
          deadline: universityData.deadline
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
 * Save timeline to database
 */
async function saveTimelineToDatabase(userId, universityId, programId, timeline, metadata) {
  try {
    console.log(`Saving timeline to database for user ${userId}, university ${universityId}`);

    // First, try to find existing timeline
    const existingTimeline = await prisma.aITimeline.findFirst({
      where: {
        userId: userId,
        universityId: universityId,
        ...(programId ? { programId: programId } : {})
      }
    });

    let savedTimeline;

    if (existingTimeline) {
      // Update existing timeline
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
            deadline: metadata.deadline
          })
        }
      });

      // Delete existing phases and tasks for update
      await prisma.timelineTask.deleteMany({
        where: { timelineId: savedTimeline.id }
      });
      await prisma.timelinePhase.deleteMany({
        where: { timelineId: savedTimeline.id }
      });
    } else {
      // Create new timeline
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
          aiModel: metadata.model || "gemini-2.0-flash",
          promptVersion: "1.0",
          generationTime: metadata.processingTime,
          userProfileSnapshot: JSON.stringify({
            overview: timeline.overview,
            metadata: metadata
          }),
          universitySnapshot: JSON.stringify({
            universityName: metadata.universityName,
            location: metadata.location,
            deadline: metadata.deadline
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
          description: phase.description,
          duration: phase.duration,
          timeframe: phase.timeframe,
          status: phase.status || 'upcoming',
          completionPercentage: phase.status === 'completed' ? 100 : phase.status === 'in-progress' ? 50 : 0,
          overview: phase.description,
          objectives: phase.objectives || [],
          milestones: phase.milestones || [],
          proTips: phase.proTips || [],
          commonMistakes: phase.commonMistakes || [],
          resources: [],
          displayOrder: phaseIndex,
          isVisible: true
        }
      });

      // Save tasks for this phase
      if (phase.tasks && phase.tasks.length > 0) {
        for (let taskIndex = 0; taskIndex < phase.tasks.length; taskIndex++) {
          const task = phase.tasks[taskIndex];
          
          await prisma.timelineTask.create({
            data: {
              timelineId: savedTimeline.id,
              phaseId: savedPhase.id,
              taskNumber: task.id || taskIndex + 1,
              title: task.title,
              description: task.description,
              estimatedTime: task.estimatedTime,
              priority: task.priority || 'medium',
              category: 'general',
              status: task.completed ? 'completed' : 'pending',
              isCompleted: task.completed || false,
              detailedGuide: task.description,
              actionSteps: task.actionSteps || [],
              tips: task.tips || [],
              resources: task.resources || [],
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
        }
      }
    }

    console.log(`Timeline saved successfully with ID: ${savedTimeline.id}`);
    return savedTimeline.id;
  } catch (error) {
    console.error("Error saving timeline to database:", error);
    throw error;
  }
}

/**
 * Robust JSON parser with multiple fallback strategies
 */
function parseAIResponse(responseText) {
  console.log("Attempting to parse response of length:", responseText.length);
  
  // Strategy 1: Clean and direct parse
  let cleanText = responseText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .replace(/^\s*[\r\n]+/, '')
    .replace(/[\r\n]+\s*$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleanText);
    console.log("Strategy 1 (direct parse) succeeded");
    return parsed;
  } catch (e) {
    console.log("Strategy 1 failed:", e.message);
  }

  // Strategy 2: Find JSON object boundaries with proper string handling
  try {
    const jsonStart = cleanText.indexOf('{');
    if (jsonStart === -1) {
      throw new Error("No JSON object found in response");
    }
    
    cleanText = cleanText.substring(jsonStart);
    
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    let jsonEnd = -1;
    
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
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }

    if (jsonEnd > 0) {
      const jsonStr = cleanText.substring(0, jsonEnd);
      const parsed = JSON.parse(jsonStr);
      console.log("Strategy 2 (brace counting) succeeded");
      return parsed;
    }
  } catch (e) {
    console.log("Strategy 2 failed:", e.message);
  }

  // Strategy 3: Try to fix incomplete JSON
  try {
    let fixedJson = cleanText;
    
    const jsonStart = fixedJson.indexOf('{');
    if (jsonStart > 0) {
      fixedJson = fixedJson.substring(jsonStart);
    }
    
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < fixedJson.length; i++) {
      const char = fixedJson[i];
      
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
      }
    }
    
    // Close any unclosed strings
    if (inString) {
      fixedJson += '"';
    }
    
    // Add missing closing brackets and braces
    while (bracketCount > 0) {
      fixedJson += ']';
      bracketCount--;
    }
    while (braceCount > 0) {
      fixedJson += '}';
      braceCount--;
    }
    
    // Remove trailing commas
    fixedJson = fixedJson
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/,\s*,/g, ',');
    
    const parsed = JSON.parse(fixedJson);
    console.log("Strategy 3 (auto-fix) succeeded");
    return parsed;
  } catch (e) {
    console.log("Strategy 3 failed:", e.message);
  }

  // All strategies failed
  console.log("All parsing strategies failed");
  throw new Error("Could not parse JSON response after all strategies");
}

/**
 * Retry wrapper for AI calls with exponential backoff
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

    if (!university) {
      return NextResponse.json(
        { error: "University data is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    const startTime = Date.now();

    // Fetch comprehensive user data
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
      },
    });

    if (fullUserProfile) {
      userStudyLevel = fullUserProfile.studyLevel?.toLowerCase();
      console.log("User's Study Level:", userStudyLevel);

      // Parse test scores from string
      if (fullUserProfile.testScores) {
        userTestScores = parseTestScores(fullUserProfile.testScores);
        console.log("Parsed Test Scores:", userTestScores);
      }
    }

    // Fetch all user's essays for this university/program
    const userEssays = await prisma.essay.findMany({
      where: {
        userId: userId,
        programId: university.programs?.[0]?.id || university.id
      },
      include: {
        essayPrompt: {
          select: {
            promptTitle: true,
            wordLimit: true,
            isMandatory: true
          }
        }
      }
    });

    // Fetch all user's calendar events for this university
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

    // Check if timeline exists in database (unless force regenerate)
    if (!forceRegenerate) {
      const existingData = await getExistingTimeline(
        userId, 
        university.id, 
        university.programs?.[0]?.id
      );

      if (existingData) {
        console.log("Returning existing timeline from database");
        const processingTime = Date.now() - startTime;
        
        return NextResponse.json({
          success: true,
          timeline: existingData.timeline,
          metadata: {
            ...existingData.metadata,
            universityName: existingData.metadata.universityName || university.universityName || university.name,
            location: existingData.metadata.location || university.location,
            deadline: existingData.metadata.deadline || university.deadlines?.[0]?.date || university.deadline,
            daysUntilDeadline: existingData.metadata.deadline ? 
              Math.ceil((new Date(existingData.metadata.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null,
            fromDatabase: true,
            processingTime: processingTime
          }
        });
      }
    }

    // Generate new timeline with AI
    if (!process.env.GOOGLE_GEMINI_API_KEY_SECOND) {
      console.error("Missing GOOGLE_GEMINI_API_KEY_SECOND environment variable");
      
      // Don't save to database if AI fails and no existing timeline
      return NextResponse.json(
        { 
          error: "AI service not configured",
          message: "Timeline generation service is currently unavailable. Please try again later."
        },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 16384,
      },
    });

    // BUILD COMPREHENSIVE CONTEXT
    const universityName = university.universityName || university.name || "Your University";
    const location = university.location || `${university.city || ''}, ${university.country || ''}`.replace(/^, |, $/g, '') || "Location not specified";
    
    // Get all deadlines (both from university data and user calendar)
    const universityDeadlines = university.deadlines || [];
    const calendarDeadlines = userCalendarEvents.filter(e => 
      e.eventType === 'deadline' || e.priority === 'high'
    );
    
    const allDeadlines = [
      ...universityDeadlines.map(d => ({ ...d, source: 'university' })),
      ...calendarDeadlines.map(d => ({ 
        date: d.startDate, 
        title: d.title, 
        type: d.eventType,
        source: 'user_calendar' 
      }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const mainDeadline = allDeadlines[0]?.date || university.deadline || null;
    
    const deadlineBreakdown = allDeadlines.slice(0, 10).map(d => 
      `- ${d.title || d.type} (${d.source}): ${new Date(d.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    ).join('\n');

    // Essay comprehensive info
    const totalEssays = university.totalEssays || 0;
    const completedEssays = userEssays.filter(e => e.isCompleted || e.status === 'COMPLETED').length;
    
    const essayDetails = userEssays.map((e, i) => {
      const progress = e.wordLimit > 0 ? Math.round((e.wordCount / e.wordLimit) * 100) : 0;
      const status = e.isCompleted ? '✅ Complete' : 
                     e.status === 'IN_PROGRESS' ? `🔄 ${progress}% (${e.wordCount}/${e.wordLimit} words)` :
                     '⚪ Not Started';
      return `${i + 1}. ${e.title || e.essayPrompt?.promptTitle || 'Essay'} - ${status}`;
    }).join('\n');
    
    const essayPrompts = university.programs?.flatMap(p => p.essayPrompts || []) || [];
    const essayPromptsList = essayPrompts.slice(0, 8).map((p, i) => 
      `${i + 1}. ${p.promptTitle} (${p.wordLimit} words, ${p.isMandatory ? 'Required' : 'Optional'})`
    ).join('\n');
    
    // Test scores with detailed status
    const testStatus = [];
    const testNeeded = [];
    
    if (userTestScores.hasGMAT) {
      testStatus.push(`GMAT: ✅ ${userTestScores.gmatScore}/800`);
    } else if (university.requiresGMAT) {
      testNeeded.push("GMAT");
    }
    
    if (userTestScores.hasGRE) {
      testStatus.push(`GRE: ✅ ${userTestScores.greScore}/340`);
    } else if (university.requiresGRE) {
      testNeeded.push("GRE");
    }
    
    if (userTestScores.hasIELTS) {
      testStatus.push(`IELTS: ✅ ${userTestScores.ieltsScore}/9.0`);
    } else if (university.requiresIELTS) {
      testNeeded.push("IELTS");
    }
    
    if (userTestScores.hasTOEFL) {
      testStatus.push(`TOEFL: ✅ ${userTestScores.toeflScore}/120`);
    } else if (university.requiresTOEFL) {
      testNeeded.push("TOEFL");
    }
    
    // Calendar events breakdown
    const completedEvents = userCalendarEvents.filter(e => e.completionStatus === 'completed').length;
    const pendingEvents = userCalendarEvents.filter(e => e.completionStatus === 'pending').length;
    const overdueEvents = userCalendarEvents.filter(e => {
      const eventDate = new Date(e.startDate);
      return eventDate < new Date() && e.completionStatus === 'pending';
    }).length;
    
    const upcomingEvents = userCalendarEvents
      .filter(e => new Date(e.startDate) > new Date() && e.completionStatus !== 'completed')
      .slice(0, 5)
      .map(e => `- ${e.title}: ${new Date(e.startDate).toLocaleDateString()}`)
      .join('\n');
    
    // Admission requirements
    const admissionReqs = university.admissionRequirements || {};
    const acceptanceRate = university.acceptanceRate || admissionReqs.acceptanceRate;
    const applicationFee = admissionReqs.applicationFee;
    
    // User context
    const hasWorkExp = fullUserProfile?.workExperience || false;
    const needsWorkExp = admissionReqs.workExperienceRequired || false;
    const userGPA = fullUserProfile?.gpa;

    // Calculate current progress based on actual completion
    const essayProgress = totalEssays > 0 ? Math.round((completedEssays / totalEssays) * 100) : 0;
    const eventProgress = userCalendarEvents.length > 0 ? Math.round((completedEvents / userCalendarEvents.length) * 100) : 0;
    const testProgress = testNeeded.length === 0 ? 100 : 
                        Math.round(((testStatus.length / (testStatus.length + testNeeded.length)) * 100));
    
    const overallProgress = Math.round((essayProgress + eventProgress + testProgress) / 3);

    // BUILD AI PROMPT - FIXED: Properly concatenated prompt string
    const prompt = `You are an expert MBA admissions consultant creating a personalized application timeline for ${universityName}.

UNIVERSITY INFORMATION:
- Name: ${universityName}
- Location: ${location}
- Main Application Deadline: ${mainDeadline ? new Date(mainDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD - Check website'}
- Acceptance Rate: ${acceptanceRate ? `${acceptanceRate}%` : 'Not available'}
- Application Fee: ${applicationFee ? `${applicationFee}` : 'Check website'}
- Total Essays Required: ${totalEssays}

USER'S CURRENT STATUS:
- Study Level: ${userStudyLevel || 'Masters'}
- Current GPA: ${userGPA || 'Not provided'}
- Work Experience: ${hasWorkExp ? 'Yes' : 'No'}${needsWorkExp ? ' (Required by this program)' : ''}
- Overall Application Progress: ${overallProgress}%

TEST SCORES STATUS:
${testStatus.length > 0 ? testStatus.join('\n') : 'No standardized tests completed yet'}
${testNeeded.length > 0 ? `\nTests Still Required: ${testNeeded.join(', ')}` : '\n✅ All required standardized tests completed'}

USER'S ESSAY PROGRESS (${completedEssays}/${totalEssays} completed):
${essayDetails || 'No essays started yet'}

Required Essay Prompts for ${universityName}:
${essayPromptsList || 'Essay prompt details not available'}

USER'S CALENDAR & TASKS (${completedEvents}/${userCalendarEvents.length} completed):
- Tasks Completed: ${completedEvents}
- Tasks Pending: ${pendingEvents}
- Tasks Overdue: ${overdueEvents}

Upcoming Scheduled Tasks:
${upcomingEvents || 'No upcoming tasks scheduled'}

ALL IMPORTANT DEADLINES (from ${universityName} + User's Calendar):
${deadlineBreakdown || 'Check university website for specific deadlines'}

INSTRUCTIONS:
Generate a comprehensive 5-phase application timeline with SPECIFIC, ACTIONABLE tasks for ${universityName}.

Phase 1: Research & Strategic Planning (4-6 weeks)
- Research ${universityName} specifically (programs, faculty, culture, outcomes)
- Network with current students and alumni
- Develop application strategy
- 6-8 detailed tasks with specific action steps

Phase 2: Standardized Test Preparation (8-12 weeks)
${testNeeded.length > 0 ? `- Focus on: ${testNeeded.join(', ')} preparation and scheduling` : '- Verify test scores are sent to schools'}
${testNeeded.length > 0 ? '- Diagnostic tests, study plans, practice, official test, score sending' : '- Begin essay brainstorming while scores are processed'}
- 5-7 detailed tasks with specific action steps

Phase 3: Essay Development (6-8 weeks)
- Write ALL ${totalEssays} essays for ${universityName}
- Reference the specific essay prompts provided above
- Brainstorming → Outlining → Drafting → Revision → Feedback → Polishing
- Mark completed essays based on user's progress above
- 8-10 detailed tasks with specific action steps

Phase 4: Recommendations & Documents (4-6 weeks)
- Select and brief 2-3 recommenders
- Request official transcripts
- Prepare professional resume/CV
- Gather all supporting documents
- 6-8 detailed tasks with specific action steps

Phase 5: Application Assembly & Submission (2-3 weeks)
- Complete application forms
- Upload all documents
- Final review
- Submit (5-7 days BEFORE deadline)
- 6-8 detailed tasks with specific action steps

CRITICAL JSON STRUCTURE REQUIREMENTS:

{
  "overview": "Write a compelling 3-4 sentence overview specifically about applying to ${universityName}, mentioning the user's current ${overallProgress}% progress, key upcoming milestones, and realistic timeline to completion.",
  "totalDuration": "4-6 months",
  "currentProgress": ${overallProgress},
  "phases": [
    {
      "id": 1,
      "name": "Research & Strategic Planning",
      "description": "Write 4-5 detailed sentences explaining this phase's importance for ${universityName} specifically, what the user will accomplish, and why it matters for their application success.",
      "duration": "4-6 weeks",
      "timeframe": "4-5 months before deadline",
      "status": "in-progress",
      "objectives": [
        "5 specific, measurable objectives for this phase"
      ],
      "tasks": [
        {
          "id": 1,
          "title": "Specific task title (e.g., 'Research ${universityName} MBA Program Curriculum')",
          "description": "2-3 sentences explaining what to do and why it's important for ${universityName}",
          "estimatedTime": "3-5 days",
          "priority": "high",
          "actionSteps": [
            "6-8 SPECIFIC, ACTIONABLE steps",
            "Each step should be clear and concrete",
            "Include ${universityName}-specific details where relevant"
          ],
          "resources": [
            "${universityName} official website",
            "4-5 specific, helpful resources"
          ],
          "tips": [
            "4-5 practical, specific tips",
            "Include ${universityName}-specific insights"
          ],
          "completed": false,
          "requiresGMAT": false,
          "requiresGRE": false,
          "requiresIELTS": false,
          "requiresTOEFL": false
        }
      ],
      "milestones": [
        "5 key milestones that mark completion of this phase"
      ],
      "proTips": [
        "6 expert tips specifically for ${universityName}",
        "Include insider knowledge about the program",
        "Reference ${universityName}'s unique characteristics"
      ],
      "commonMistakes": [
        "5 common mistakes applicants make in this phase",
        "Specific to ${universityName} where possible"
      ]
    }
  ]
}

MANDATORY REQUIREMENTS:
1. Each phase MUST have 5-8 fully detailed tasks
2. Each task MUST have 6-8 specific actionSteps, 4-5 resources, and 4-5 tips
3. All content must be SPECIFIC to ${universityName}, not generic advice
4. Mark tasks as completed: true if user has already done them (based on progress above)
5. Set requiresGMAT/GRE/IELTS/TOEFL to true appropriately for test prep tasks
6. Include ${totalEssays} essay-related tasks in Phase 3, mark completed ones
7. Reference user's actual calendar events and deadlines in task descriptions
8. Return ONLY valid JSON with NO markdown formatting, NO code blocks
9. Ensure ALL arrays and objects are properly closed
10. Keep all text professional, specific, and actionable

Return ONLY the complete JSON object now.`;

    let result;
    let timelineData;
    let aiError = null;

    try {
      result = await generateWithRetry(model, prompt, 2);
      const responseText = result.response.text();
      console.log("AI Response length:", responseText.length);
      
      try {
        timelineData = parseAIResponse(responseText);
        console.log("AI timeline generated successfully");
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError.message);
        aiError = parseError;
        
        // If parsing fails, don't save anything and return error
        return NextResponse.json(
          {
            error: "Failed to generate timeline",
            message: "AI response could not be parsed. Please try again.",
            details: parseError.message
          },
          { status: 500 }
        );
      }
    } catch (apiError) {
      console.error("Gemini API error:", apiError.message);
      aiError = apiError;
      
      // If AI call fails, don't save anything and return error
      return NextResponse.json(
        {
          error: "AI service error",
          message: "Failed to generate timeline. Please try again later.",
          details: apiError.message
        },
        { status: 500 }
      );
    }

    // Validate timeline structure
    if (!timelineData.phases || !Array.isArray(timelineData.phases) || timelineData.phases.length === 0) {
      console.error("Invalid timeline structure");
      return NextResponse.json(
        {
          error: "Invalid timeline generated",
          message: "AI generated invalid timeline structure. Please try again."
        },
        { status: 500 }
      );
    }

    // Enhance timeline with actual user data
    timelineData.phases = timelineData.phases.map((phase, phaseIndex) => {
      return {
        ...phase,
        id: phase.id || phaseIndex + 1,
        phaseNumber: phaseIndex + 1,
        tasks: (phase.tasks || []).map((task, taskIndex) => {
          let isTaskComplete = false;
          
          // Check test completion
          if (task.requiresGMAT && userTestScores.hasGMAT) isTaskComplete = true;
          if (task.requiresGRE && userTestScores.hasGRE) isTaskComplete = true;
          if (task.requiresIELTS && userTestScores.hasIELTS) isTaskComplete = true;
          if (task.requiresTOEFL && userTestScores.hasTOEFL) isTaskComplete = true;
          
          // Check essay completion
          const taskTitleLower = (task.title || '').toLowerCase();
          if (taskTitleLower.includes('essay')) {
            const relatedEssay = userEssays.find(e => 
              taskTitleLower.includes((e.title || '').toLowerCase()) ||
              taskTitleLower.includes((e.essayPrompt?.promptTitle || '').toLowerCase()) ||
              e.isCompleted
            );
            if (relatedEssay) {
              isTaskComplete = relatedEssay.isCompleted;
              task.relatedEssayId = relatedEssay.id;
            }
          }
          
          // Check calendar event completion
          const relatedEvent = userCalendarEvents.find(e => {
            const eventTitleLower = (e.title || '').toLowerCase();
            return eventTitleLower.includes(taskTitleLower.substring(0, 15)) ||
                   taskTitleLower.includes(eventTitleLower.substring(0, 15));
          });
          
          if (relatedEvent) {
            if (relatedEvent.completionStatus === 'completed') {
              isTaskComplete = true;
            }
            task.relatedCalendarEventId = relatedEvent.id;
          }
          
          return {
            ...task,
            id: task.id || taskIndex + 1,
            taskNumber: taskIndex + 1,
            completed: isTaskComplete,
            actionSteps: task.actionSteps || [],
            tips: task.tips || [],
            resources: task.resources || [],
            requiresGMAT: task.requiresGMAT || false,
            requiresGRE: task.requiresGRE || false,
            requiresIELTS: task.requiresIELTS || false,
            requiresTOEFL: task.requiresTOEFL || false
          };
        }),
        objectives: phase.objectives || [],
        milestones: phase.milestones || [],
        proTips: phase.proTips || [],
        commonMistakes: phase.commonMistakes || []
      };
    });

    const processingTime = Date.now() - startTime;

    const metadata = {
      universityName: universityName,
      location: location,
      deadline: mainDeadline,
      daysUntilDeadline: mainDeadline ? Math.ceil((new Date(mainDeadline) - new Date()) / (1000 * 60 * 60 * 24)) : null,
      acceptanceRate: acceptanceRate,
      applicationFee: applicationFee,
      essaysRequired: totalEssays,
      essaysCompleted: completedEssays,
      essaysRemaining: totalEssays - completedEssays,
      essayCompletionRate: totalEssays > 0 ? Math.round((completedEssays / totalEssays) * 100) : 0,
      testsCompleted: testStatus,
      testsNeeded: testNeeded,
      allTestsComplete: testNeeded.length === 0,
      totalCalendarEvents: userCalendarEvents.length,
      completedCalendarEvents: completedEvents,
      pendingCalendarEvents: pendingEvents,
      overdueCalendarEvents: overdueEvents,
      userGPA: userGPA,
      userStudyLevel: userStudyLevel,
      userHasWorkExperience: hasWorkExp,
      workExperienceRequired: needsWorkExp,
      processingTime: processingTime,
      model: "gemini-2.0-flash",
      generatedAt: new Date().toISOString(),
      fromDatabase: false
    };

    // Save timeline to database (only if AI succeeded)
    try {
      const timelineId = await saveTimelineToDatabase(
        userId,
        university.id,
        university.programs?.[0]?.id,
        timelineData,
        metadata
      );
      metadata.timelineId = timelineId;
      metadata.savedToDatabase = true;
      console.log(`Timeline saved to database with ID: ${timelineId}`);
    } catch (dbError) {
      console.error("Failed to save timeline to database:", dbError);
      metadata.savedToDatabase = false;
      metadata.dbError = dbError.message;
    }

    return NextResponse.json({
      success: true,
      timeline: timelineData,
      metadata: metadata
    });

  } catch (error) {
    console.error("Timeline API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate timeline",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}