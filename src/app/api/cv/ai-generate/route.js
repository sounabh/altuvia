// app/api/cv/ai-generate/route.js - AI Content Generation
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { 
      section, 
      context, 
      targetRole, 
      targetCompany,
      existingContent,
      generationType // 'enhance', 'generate', 'summarize', 'bullet_points'
    } = await request.json();

    if (!section) {
      return NextResponse.json(
        { error: "Section is required" },
        { status: 400 }
      );
    }

    let prompt = '';
    
    switch (section) {
      case 'personal':
        prompt = createPersonalSummaryPrompt(context, targetRole, targetCompany, generationType);
        break;
      case 'experience':
        prompt = createExperiencePrompt(context, existingContent, generationType);
        break;
      case 'projects':
        prompt = createProjectPrompt(context, existingContent, generationType);
        break;
      case 'achievements':
        prompt = createAchievementPrompt(context, existingContent, generationType);
        break;
      case 'education':
        prompt = createEducationPrompt(context, existingContent, generationType);
        break;
      default:
        prompt = createGeneralPrompt(section, context, existingContent, generationType);
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1500,
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedContent = response.text();

    // Parse and structure the response
    const structured = structureGeneratedContent(generatedContent, section, generationType);

    return NextResponse.json({
      content: generatedContent,
      structured: structured,
      section: section,
      generationType: generationType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate content",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function createPersonalSummaryPrompt(context, targetRole, targetCompany, type) {
  if (type === 'enhance' && context?.summary) {
    return `Enhance this professional summary for a CV/Resume:

CURRENT SUMMARY:
${context.summary}

${targetRole ? `TARGET ROLE: ${targetRole}` : ''}
${targetCompany ? `TARGET COMPANY: ${targetCompany}` : ''}

Requirements:
- Keep it 2-3 sentences (50-75 words)
- Make it compelling and achievement-focused
- Use strong action words
- Highlight key strengths relevant to target role
- Make it ATS-friendly with relevant keywords
- Professional tone

Provide ONLY the enhanced summary, no explanations.`;
  }

  return `Generate a professional summary for a CV/Resume based on:

BACKGROUND:
${context ? JSON.stringify(context, null, 2) : 'Professional seeking opportunities'}

${targetRole ? `TARGET ROLE: ${targetRole}` : ''}
${targetCompany ? `TARGET COMPANY: ${targetCompany}` : ''}

Create a compelling 2-3 sentence summary (50-75 words) that:
- Highlights key qualifications
- Shows value proposition
- Includes relevant keywords
- Uses active voice
- Sounds professional and confident

Provide ONLY the summary, no explanations.`;
}

function createExperiencePrompt(context, existingContent, type) {
  if (type === 'bullet_points') {
    return `Create impactful bullet points for this work experience:

ROLE: ${context?.position || 'Position'}
COMPANY: ${context?.company || 'Company'}
${existingContent ? `EXISTING DESCRIPTION: ${existingContent}` : ''}
RESPONSIBILITIES: ${context?.responsibilities || 'Standard responsibilities'}

Generate 4-6 bullet points that:
- Start with strong action verbs (Led, Developed, Implemented, Achieved, etc.)
- Include quantifiable achievements (numbers, percentages, metrics)
- Show impact and results
- Use STAR method (Situation, Task, Action, Result)
- Are ATS-friendly
- Each bullet is 1-2 lines maximum

Format: Return ONLY the bullet points, one per line, starting with •`;
  }

  if (type === 'enhance') {
    return `Enhance this work experience description:

${existingContent}

Make it more impactful by:
- Using stronger action verbs
- Adding implied metrics and results
- Making achievements more specific
- Improving clarity and conciseness
- Optimizing for ATS
- Maintaining professional tone

Provide enhanced bullet points only.`;
  }

  return `Generate professional work experience description for:

POSITION: ${context?.position}
COMPANY: ${context?.company}
DURATION: ${context?.duration}
KEY RESPONSIBILITIES: ${context?.description || 'Standard responsibilities'}

Create 4-5 compelling bullet points following best practices.`;
}

function createProjectPrompt(context, existingContent, type) {
  if (type === 'enhance') {
    return `Enhance this project description:

PROJECT: ${context?.name}
${existingContent}

Make it more impressive by:
- Highlighting technical complexity
- Emphasizing impact and results
- Using specific technologies and methodologies
- Showing problem-solving approach
- Making achievements quantifiable
- Keeping it concise (3-4 lines)

Provide enhanced description only.`;
  }

  return `Create a compelling project description:

PROJECT NAME: ${context?.name}
TECHNOLOGIES: ${context?.technologies}
PURPOSE: ${context?.purpose}
${context?.achievements ? `ACHIEVEMENTS: ${context?.achievements}` : ''}

Generate a 3-4 line description that:
- Explains project purpose clearly
- Highlights technical skills
- Shows impact/results
- Mentions key technologies
- Demonstrates problem-solving

Provide ONLY the description.`;
}

function createAchievementPrompt(context, existingContent, type) {
  if (type === 'enhance') {
    return `Enhance this achievement entry:

${existingContent}

Make it more impactful by:
- Adding context and significance
- Quantifying the achievement if possible
- Showing competitive advantage
- Using powerful language
- Being specific about the recognition

Keep it to 2-3 lines. Provide enhanced version only.`;
  }

  return `Create an achievement description:

ACHIEVEMENT: ${context?.title}
ORGANIZATION: ${context?.organization}
TYPE: ${context?.type}
${context?.context ? `CONTEXT: ${context.context}` : ''}

Generate a 2-3 line description that:
- Clearly states the achievement
- Provides context and significance
- Shows competitive nature if applicable
- Includes specific details
- Demonstrates excellence

Provide ONLY the description.`;
}

function createEducationPrompt(context, existingContent, type) {
  if (type === 'enhance') {
    return `Enhance this education entry description:

${existingContent}

Add value by:
- Highlighting relevant coursework
- Mentioning academic achievements
- Including relevant projects
- Adding leadership roles
- Showing academic excellence

Keep it to 2-3 bullet points. Provide enhanced version only.`;
  }

  return `Create education entry details:

DEGREE: ${context?.degree}
FIELD: ${context?.field}
INSTITUTION: ${context?.institution}
GPA: ${context?.gpa}

Generate 2-3 relevant details such as:
- Key coursework relevant to target role
- Academic projects
- Honors and awards
- Leadership positions
- Research experience

Provide ONLY the bullet points.`;
}

function createGeneralPrompt(section, context, existingContent, type) {
  return `${type === 'enhance' ? 'Enhance' : 'Generate'} professional content for CV section: ${section}

${existingContent ? `EXISTING CONTENT:\n${existingContent}\n` : ''}
${context ? `CONTEXT:\n${JSON.stringify(context, null, 2)}\n` : ''}

Provide professional, ATS-optimized content that:
- Uses strong action words
- Shows achievements and impact
- Is clear and concise
- Follows CV best practices
- Includes relevant keywords

Provide ONLY the ${type === 'enhance' ? 'enhanced' : 'new'} content.`;
}

function structureGeneratedContent(content, section, type) {
  // Structure the content based on section type
  const structured = {
    raw: content,
    formatted: content
  };

  // Extract bullet points if present
  const bulletPoints = content.match(/[•\-\*]\s*(.+)/g);
  if (bulletPoints) {
    structured.bulletPoints = bulletPoints.map(bp => 
      bp.replace(/^[•\-\*]\s*/, '').trim()
    );
  }

  // Extract sentences for summaries
  if (section === 'personal' || type === 'summarize') {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    structured.sentences = sentences.map(s => s.trim());
  }

  return structured;
}