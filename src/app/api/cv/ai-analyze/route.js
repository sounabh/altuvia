// app/api/cv/ai-analyze/route.js - ENHANCED DETAILED ANALYSIS
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

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

    return NextResponse.json({
      overallAnalysis: overallAnalysis,
      sectionAnalyses: sectionAnalyses,
      overallScore: overallAnalysis.overallScore,
      atsScore: atsAnalysis.score,
      strengths: overallAnalysis.strengths,
      improvements: overallAnalysis.improvements,
      recommendations: overallAnalysis.recommendations,
      criticalIssues: overallAnalysis.criticalIssues,
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

async function analyzeAllSections(cvData, targetRole, targetCompany) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.6,
      topP: 0.9,
      maxOutputTokens: 3000,
    }
  });

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
      const result = await model.generateContent(prompt);
      const response = result.response.text();
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
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 2500,
    }
  });

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
    const result = await model.generateContent(prompt);
    const response = result.response.text();
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
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1500,
    }
  });

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
    const result = await model.generateContent(atsPrompt);
    const response = result.response.text();
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