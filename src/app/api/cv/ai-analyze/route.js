// app/api/cv/ai-analyze/route.js - ENHANCED WITH STRUCTURED IMPROVEMENTS
import { NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "google/gemini-2.5-flash-lite";

async function callOpenRouter(messages, maxTokens = 3000, temperature = 0.6) {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "CV Analysis System",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: temperature,
        top_p: 0.9,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from AI service");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenRouter:", error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const { cvData, analysisType, targetRole, targetCompany } = await request.json();

    if (!cvData) {
      return NextResponse.json(
        { error: "CV data is required" },
        { status: 400 }
      );
    }

    // Build comprehensive CV text for analysis
    const cvText = buildComprehensiveCVText(cvData);

    // Analyze each section individually
    const sectionAnalyses = await analyzeAllSections(cvData, targetRole, targetCompany);

    // Get comprehensive overall analysis
    const overallAnalysis = await getOverallAnalysis(cvText, sectionAnalyses, targetRole, targetCompany);

    // Calculate ATS score
    const atsAnalysis = await analyzeATS(cvText);

    // NEW: Generate structured improvements
    const structuredContent = generateStructuredImprovements(sectionAnalyses, cvData);

    return NextResponse.json({
      overallAnalysis: overallAnalysis,
      sectionAnalyses: sectionAnalyses,
      overallScore: overallAnalysis.overallScore,
      atsScore: atsAnalysis.score,
      strengths: overallAnalysis.strengths,
      improvements: overallAnalysis.improvements,
      recommendations: overallAnalysis.recommendations,
      criticalIssues: overallAnalysis.criticalIssues,
      structuredContent: structuredContent, // NEW
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to analyze CV",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// NEW: Generate structured improvements from analysis
function generateStructuredImprovements(sectionAnalyses, cvData) {
  const improvements = {};
  
  Object.entries(sectionAnalyses).forEach(([section, analysis]) => {
    if (analysis.suggestions && analysis.suggestions.length > 0) {
      // Convert suggestions to structured form data
      const suggestion = analysis.suggestions[0];
      
      if (section === 'personal' && typeof suggestion === 'string') {
        improvements.personal = { summary: suggestion };
      } else if (section === 'experience' && typeof suggestion === 'string') {
        improvements.experience = [{ description: suggestion }];
      } else if (section === 'education' && typeof suggestion === 'string') {
        improvements.education = [{ description: suggestion }];
      } else if (section === 'projects' && typeof suggestion === 'string') {
        improvements.projects = [{ description: suggestion }];
      } else if (section === 'achievements' && typeof suggestion === 'string') {
        improvements.achievements = [{ description: suggestion }];
      } else if (section === 'volunteer' && typeof suggestion === 'string') {
        improvements.volunteer = [{ description: suggestion }];
      }
      // Add more section mappings as needed
    }
  });
  
  return Object.keys(improvements).length > 0 ? improvements : null;
}

async function analyzeAllSections(cvData, targetRole, targetCompany) {
  const sections = ['personal', 'education', 'experience', 'projects', 'skills', 'achievements', 'volunteer'];
  const analyses = {};

  for (const section of sections) {
    if (!cvData[section] || (Array.isArray(cvData[section]) && cvData[section].length === 0)) {
      analyses[section] = {
        name: section,
        score: 0,
        status: 'missing',
        feedback: 'This section is not filled out',
        strengths: [],
        improvements: ['Add content to this section'],
        suggestions: []
      };
      continue;
    }

    const prompt = createSectionAnalysisPrompt(section, cvData[section], targetRole, targetCompany);

    try {
      const response = await callOpenRouter([
        { role: "user", content: prompt }
      ], 3000, 0.6);
      
      analyses[section] = parseSectionAnalysis(response, section);
    } catch (error) {
      console.error(`Error analyzing ${section}:`, error);
      analyses[section] = {
        name: section,
        score: 50,
        status: 'error',
        feedback: 'Unable to analyze this section',
        strengths: [],
        improvements: ['Could not analyze - please try again'],
        suggestions: []
      };
    }
  }

  return analyses;
}

function createSectionAnalysisPrompt(section, data, targetRole, targetCompany) {
  const baseContext = `
You are a senior CV/Resume expert analyzing specific CV sections.
${targetRole ? `Target Role: ${targetRole}` : ''}
${targetCompany ? `Target Company: ${targetCompany}` : ''}

Analyze the following ${section.toUpperCase()} section CRITICALLY and REALISTICALLY:

${JSON.stringify(data, null, 2)}

Provide a DETAILED, HONEST analysis in this exact JSON format:
{
  "name": "${section}",
  "score": <number 0-100 - be realistic and strict>,
  "status": "good|average|weak|missing",
  "feedback": "Brief overall feedback",
  "strengths": [<array of 2-3 specific strengths>],
  "improvements": [<array of 3-5 specific, actionable improvements>],
  "suggestions": [<array of 2-3 concrete suggestions with examples>],
  "missingElements": [<what critical elements are missing for this section>],
  "atsOptimization": {
    "keywordScore": <0-100>,
    "keywords": [<array of 5-10 important keywords that should be present>],
    "missingKeywords": [<array of keywords to add>]
  }
}

BE CRITICAL: Don't give high scores unless content is truly excellent. If content is generic or weak, reflect that in the score.`;

  return baseContext;
}

function parseSectionAnalysis(response, section) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: section,
        score: Math.max(0, Math.min(100, parsed.score || 50)),
        status: parsed.status || 'average',
        feedback: parsed.feedback || 'No feedback available',
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        suggestions: parsed.suggestions || [],
        missingElements: parsed.missingElements || [],
        atsOptimization: parsed.atsOptimization || { keywordScore: 0, keywords: [], missingKeywords: [] }
      };
    }
  } catch (error) {
    console.error(`Error parsing ${section} analysis:`, error);
  }

  return {
    name: section,
    score: 50,
    status: 'average',
    feedback: 'Analysis completed',
    strengths: [],
    improvements: [],
    suggestions: [],
    missingElements: [],
    atsOptimization: { keywordScore: 0, keywords: [], missingKeywords: [] }
  };
}

async function getOverallAnalysis(cvText, sectionAnalyses, targetRole, targetCompany) {
  const sectionSummary = Object.values(sectionAnalyses)
    .map(s => `${s.name}: ${s.score}/100 - ${s.feedback}`)
    .join('\n');

  const prompt = `As a senior CV expert, provide OVERALL analysis for this CV:

${cvText}

SECTION SCORES:
${sectionSummary}

${targetRole ? `Target Role: ${targetRole}` : ''}
${targetCompany ? `Target Company: ${targetCompany}` : ''}

Provide analysis in this JSON format:
{
  "overallScore": <0-100 average score>,
  "summary": "Comprehensive summary of CV quality",
  "strengths": [<3-5 major strengths>],
  "improvements": [<5-7 critical improvements>],
  "criticalIssues": [<most urgent issues to fix>],
  "recommendations": [<3-5 top recommendations>],
  "topPriorities": [<what to fix first>]
}

BE STRICT: If the CV is weak, reflect that. Don't inflate scores. Average generic CVs should score 50-65, good CVs 70-80, excellent 85+.`;

  try {
    const response = await callOpenRouter([
      { role: "user", content: prompt }
    ], 2500, 0.5);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        overallScore: Math.max(0, Math.min(100, parsed.overallScore || 60)),
        summary: parsed.summary || '',
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        criticalIssues: parsed.criticalIssues || [],
        recommendations: parsed.recommendations || [],
        topPriorities: parsed.topPriorities || []
      };
    }
  } catch (error) {
    console.error("Error in overall analysis:", error);
  }

  return {
    overallScore: 60,
    summary: 'CV analysis completed',
    strengths: [],
    improvements: [],
    criticalIssues: [],
    recommendations: [],
    topPriorities: []
  };
}

async function analyzeATS(cvText) {
  const atsPrompt = `Analyze this CV for ATS (Applicant Tracking System) compatibility:

${cvText}

Provide JSON:
{
  "score": <0-100>,
  "issues": [<formatting and parsing issues>],
  "keywords": [<10-15 important keywords that should be emphasized>],
  "missingElements": [<what's missing>],
  "recommendations": [<3-5 ATS optimization tips>]
}`;

  try {
    const response = await callOpenRouter([
      { role: "user", content: atsPrompt }
    ], 1500, 0.3);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(0, Math.min(100, parsed.score || 70)),
        issues: parsed.issues || [],
        keywords: parsed.keywords || [],
        missingElements: parsed.missingElements || [],
        recommendations: parsed.recommendations || []
      };
    }
  } catch (error) {
    console.error("ATS analysis error:", error);
  }

  return {
    score: 70,
    issues: [],
    keywords: [],
    missingElements: [],
    recommendations: []
  };
}

function buildComprehensiveCVText(cvData) {
  let cvText = '';

  if (cvData.personal) {
    cvText += `PERSONAL INFORMATION\n`;
    cvText += `Name: ${cvData.personal.fullName}\n`;
    cvText += `Email: ${cvData.personal.email}\n`;
    cvText += `Phone: ${cvData.personal.phone}\n`;
    cvText += `Location: ${cvData.personal.location}\n`;
    if (cvData.personal.summary) cvText += `\nSummary:\n${cvData.personal.summary}\n`;
    cvText += '\n---\n\n';
  }

  if (cvData.education && cvData.education.length > 0) {
    cvText += `EDUCATION\n\n`;
    cvData.education.forEach((edu) => {
      cvText += `${edu.degree} in ${edu.field}\n`;
      cvText += `${edu.institution}\n`;
      if (edu.gpa) cvText += `GPA: ${edu.gpa}\n`;
      if (edu.description) cvText += `${edu.description}\n`;
      cvText += '\n';
    });
    cvText += '---\n\n';
  }

  if (cvData.experience && cvData.experience.length > 0) {
    cvText += `WORK EXPERIENCE\n\n`;
    cvData.experience.forEach((exp) => {
      cvText += `${exp.position} at ${exp.company}\n`;
      if (exp.description) cvText += `${exp.description}\n`;
      cvText += '\n';
    });
    cvText += '---\n\n';
  }

  if (cvData.projects && cvData.projects.length > 0) {
    cvText += `PROJECTS\n\n`;
    cvData.projects.forEach((proj) => {
      cvText += `${proj.name}\n`;
      if (proj.description) cvText += `${proj.description}\n`;
      if (proj.technologies) cvText += `Tech: ${proj.technologies}\n`;
      cvText += '\n';
    });
    cvText += '---\n\n';
  }

  if (cvData.skills && cvData.skills.length > 0) {
    cvText += `SKILLS\n\n`;
    cvData.skills.forEach((skillGroup) => {
      cvText += `${skillGroup.name}: ${skillGroup.skills.join(', ')}\n`;
    });
    cvText += '\n---\n\n';
  }

  return cvText;
}