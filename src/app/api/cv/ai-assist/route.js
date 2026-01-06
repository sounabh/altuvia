// app/api/cv/ai-assist/route.js - ENHANCED AI ASSISTANT WITH OPENROUTER
import { NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "google/gemini-2.5-flash-lite";

async function callOpenRouter(messages, maxTokens = 3000, temperature = 0.8) {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "CV AI Advisor",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: temperature,
        top_p: 0.95,
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
    const { message, cvData, activeSection, chatHistory } = await request.json();

    if (!message || !cvData) {
      return NextResponse.json(
        { error: "Message and CV data are required" },
        { status: 400 }
      );
    }

    // Build comprehensive CV context
    const cvContext = buildDetailedCVContext(cvData, activeSection);
    const cvStats = analyzeCVCompleteness(cvData);

    // Build conversation history
    const conversationHistory = chatHistory
      ?.slice(-8)
      .map(msg => `${msg.role === 'user' ? 'User' : 'AI Assistant'}: ${msg.content}`)
      .join('\n\n') || '';

    // Create intelligent system prompt
    const systemPrompt = `You are an expert CV/Resume advisor with deep expertise in helping candidates create outstanding CVs for universities, companies, and institutions worldwide.

YOUR CAPABILITIES:
1. Analyze CV content section by section with specific feedback
2. Provide actionable, concrete suggestions with examples
3. Generate professional content when requested
4. Optimize for ATS (Applicant Tracking Systems)
5. Suggest quantifiable achievements
6. Improve language and formatting
7. Tailor CVs for specific roles/institutions

CURRENT CV CONTEXT:
Active Section: ${activeSection}
CV Completeness: ${cvStats.completionPercentage}%
Filled Sections: ${cvStats.filledSections.join(', ')}
Empty Sections: ${cvStats.emptySections.join(', ')}

${conversationHistory ? `\nRECENT CONVERSATION:\n${conversationHistory}\n` : ''}

DETAILED CV DATA:
${cvContext}

RESPONSE GUIDELINES:
1. **Be Conversational**: Respond naturally like a helpful advisor, not a robot
2. **Be Specific**: Reference their actual CV content when giving feedback
3. **Be Actionable**: Provide concrete steps and specific examples they can use
4. **Be Structured**: Use bullet points and clear formatting for readability
5. **Be Encouraging**: Maintain a supportive, positive tone
6. **Be Thorough**: Address all aspects of their question comprehensively
7. **Show Data**: When analyzing, quote or reference specific parts of their CV
8. **Suggest Content**: When asked, provide exact text they can copy and use

CONTENT GENERATION RULES:
- When user asks to "enhance", "improve", "write", or "suggest" content, provide specific example text
- Format suggestions clearly with markers like "SUGGESTED CONTENT:" or "EXAMPLE:"
- Always explain WHY your suggestion improves the CV
- Include both the suggestion AND the reasoning behind it

ATS OPTIMIZATION:
- Check for relevant industry keywords
- Ensure proper formatting that ATS can parse
- Suggest industry-standard terminology
- Flag potential ATS parsing issues (tables, graphics, etc.)

ANSWER TYPES YOU MUST HANDLE:
- "Analyze my CV" → Provide comprehensive section-by-section analysis with specific feedback
- "Improve my [section]" → Suggest specific improvements with before/after examples
- "What's missing?" → List missing critical sections and suggest what to add
- "Write a summary for me" → Generate professional summary based on their background
- "How can I improve?" → Prioritize top 5-7 actionable improvements
- "Is this good for [role/company]?" → Evaluate fit and suggest tailoring strategies
- "Help me with [specific task]" → Provide step-by-step guidance
- General CV questions → Answer helpfully while referencing their specific CV data

IMPORTANT: Always be helpful, never say you can't help. If you need more information, ask specific questions.

User's Question: ${message}

Provide a helpful, specific, actionable response that directly addresses their question while referencing their actual CV data.`;

    const aiResponse = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ], 3000, 0.8);

    // Detect if AI is providing content suggestions
    const hasContentSuggestions = detectContentSuggestions(aiResponse);
    
    // Extract structured suggestions if present
    let suggestions = null;
    if (hasContentSuggestions) {
      suggestions = extractStructuredSuggestions(aiResponse, activeSection, cvData);
    }

    // Detect if this is an analysis response
    const isAnalysis = message.toLowerCase().includes('analyze') || 
                       message.toLowerCase().includes('review') ||
                       message.toLowerCase().includes('feedback');

    // Extract analysis metrics if present
    let analysisMetrics = null;
    if (isAnalysis) {
      analysisMetrics = extractAnalysisMetrics(aiResponse, cvData);
    }

    return NextResponse.json({
      response: aiResponse,
      suggestions: suggestions,
      analysis: analysisMetrics,
      cvStats: cvStats,
      hasContentSuggestions: hasContentSuggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("AI Assist Error:", error);
    
    return NextResponse.json({
      response: "I apologize, but I encountered a temporary issue. Please try rephrasing your question or use one of the quick action buttons above. I'm here to help with:\n\n• Analyzing your CV sections\n• Suggesting improvements\n• Writing professional content\n• Optimizing for ATS\n• Answering any CV-related questions\n\nWhat would you like help with?",
      error: error.message
    }, { status: 200 });
  }
}

function buildDetailedCVContext(cvData, activeSection) {
  let context = `=== YOUR CV CURRENT STATE ===\n\n`;

  // Personal Information
  if (cvData.personal) {
    context += `📋 PERSONAL INFORMATION:\n`;
    context += `Name: ${cvData.personal.fullName || '❌ Not provided'}\n`;
    context += `Email: ${cvData.personal.email || '❌ Not provided'}\n`;
    context += `Phone: ${cvData.personal.phone || '❌ Not provided'}\n`;
    context += `Location: ${cvData.personal.location || '❌ Not provided'}\n`;
    if (cvData.personal.website) context += `Website: ${cvData.personal.website}\n`;
    if (cvData.personal.linkedin) context += `LinkedIn: ${cvData.personal.linkedin}\n`;
    if (cvData.personal.summary) {
      context += `\nProfessional Summary (${cvData.personal.summary.length} characters):\n"${cvData.personal.summary}"\n`;
    } else {
      context += `\n⚠️ Professional Summary: Missing (This is critical!)\n`;
    }
    context += '\n';
  }

  // Education
  if (cvData.education && cvData.education.length > 0) {
    context += `🎓 EDUCATION (${cvData.education.length} entries):\n`;
    cvData.education.forEach((edu, i) => {
      context += `\n${i + 1}. ${edu.degree || 'Degree not specified'} in ${edu.field || 'Field not specified'}\n`;
      context += `   Institution: ${edu.institution || '❌ Missing'}\n`;
      if (edu.startDate) context += `   Duration: ${edu.startDate} - ${edu.endDate || 'Present'}\n`;
      if (edu.gpa) context += `   GPA: ${edu.gpa}\n`;
      if (edu.description) context += `   Details: ${edu.description}\n`;
      else context += `   ⚠️ Details: Missing (Add coursework, achievements, etc.)\n`;
    });
    context += '\n';
  } else {
    context += `🎓 EDUCATION: ❌ Empty (This is required!)\n\n`;
  }

  // Work Experience
  if (cvData.experience && cvData.experience.length > 0) {
    context += `💼 WORK EXPERIENCE (${cvData.experience.length} entries):\n`;
    cvData.experience.forEach((exp, i) => {
      context += `\n${i + 1}. ${exp.position || 'Position not specified'}\n`;
      context += `   Company: ${exp.company || '❌ Missing'}\n`;
      context += `   Location: ${exp.location || 'Not specified'}\n`;
      if (exp.startDate) context += `   Duration: ${exp.startDate} - ${exp.isCurrentRole ? 'Present' : exp.endDate || 'Not specified'}\n`;
      if (exp.description) {
        const bulletPoints = exp.description.split('•').filter(b => b.trim());
        context += `   Achievements/Responsibilities:\n`;
        bulletPoints.forEach(bp => {
          if (bp.trim()) context += `   • ${bp.trim()}\n`;
        });
      } else {
        context += `   ⚠️ Achievements/Responsibilities: Missing (This is critical!)\n`;
      }
    });
    context += '\n';
  } else {
    context += `💼 WORK EXPERIENCE: ❌ Empty\n\n`;
  }

  // Projects
  if (cvData.projects && cvData.projects.length > 0) {
    context += `🚀 PROJECTS (${cvData.projects.length} entries):\n`;
    cvData.projects.forEach((proj, i) => {
      context += `\n${i + 1}. ${proj.name || 'Project name not specified'}\n`;
      if (proj.description) context += `   Description: ${proj.description}\n`;
      if (proj.technologies) context += `   Technologies: ${proj.technologies}\n`;
      if (proj.githubUrl) context += `   GitHub: ${proj.githubUrl}\n`;
      if (proj.liveUrl) context += `   Live URL: ${proj.liveUrl}\n`;
      if (proj.achievements) context += `   Achievements: ${proj.achievements}\n`;
    });
    context += '\n';
  } else {
    context += `🚀 PROJECTS: ❌ Empty\n\n`;
  }

  // Skills
  if (cvData.skills && cvData.skills.length > 0) {
    context += `💻 SKILLS:\n`;
    cvData.skills.forEach((skillGroup) => {
      const skillsList = skillGroup.skills?.join(', ') || 'None added';
      context += `${skillGroup.name}: ${skillsList}\n`;
    });
    context += '\n';
  } else {
    context += `💻 SKILLS: ❌ Empty (This is important!)\n\n`;
  }

  // Achievements
  if (cvData.achievements && cvData.achievements.length > 0) {
    context += `🏆 ACHIEVEMENTS (${cvData.achievements.length} entries):\n`;
    cvData.achievements.forEach((ach, i) => {
      context += `${i + 1}. ${ach.title || 'Title not specified'}\n`;
      if (ach.organization) context += `   Organization: ${ach.organization}\n`;
      if (ach.description) context += `   Details: ${ach.description}\n`;
    });
    context += '\n';
  }

  // Volunteer Experience
  if (cvData.volunteer && cvData.volunteer.length > 0) {
    context += `🤝 VOLUNTEER EXPERIENCE (${cvData.volunteer.length} entries):\n`;
    cvData.volunteer.forEach((vol, i) => {
      context += `${i + 1}. ${vol.role || 'Role not specified'} at ${vol.organization || 'Organization not specified'}\n`;
      if (vol.description) context += `   Description: ${vol.description}\n`;
      if (vol.impact) context += `   Impact: ${vol.impact}\n`;
    });
    context += '\n';
  }

  return context;
}

function analyzeCVCompleteness(cvData) {
  const sections = ['personal', 'education', 'experience', 'projects', 'skills', 'achievements', 'volunteer'];
  const filledSections = [];
  const emptySections = [];
  let totalFields = 0;
  let filledFields = 0;

  sections.forEach(section => {
    const data = cvData[section];
    
    if (section === 'personal') {
      totalFields += 7;
      if (data?.fullName) filledFields++;
      if (data?.email) filledFields++;
      if (data?.phone) filledFields++;
      if (data?.location) filledFields++;
      if (data?.website) filledFields++;
      if (data?.linkedin) filledFields++;
      if (data?.summary && data.summary.length > 50) filledFields++;
      
      if (data?.fullName || data?.email || data?.summary) {
        filledSections.push('Personal Info');
      } else {
        emptySections.push('Personal Info');
      }
    } else if (Array.isArray(data) && data.length > 0) {
      const hasContent = data.some(item => {
        return Object.values(item).some(val => 
          val && val !== '' && (!Array.isArray(val) || val.length > 0)
        );
      });
      
      if (hasContent) {
        filledSections.push(section.charAt(0).toUpperCase() + section.slice(1));
        filledFields += data.length;
      } else {
        emptySections.push(section.charAt(0).toUpperCase() + section.slice(1));
      }
      totalFields += 1;
    } else {
      emptySections.push(section.charAt(0).toUpperCase() + section.slice(1));
      totalFields += 1;
    }
  });

  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  return {
    completionPercentage,
    filledSections,
    emptySections,
    filledFields,
    totalFields
  };
}

function detectContentSuggestions(response) {
  const suggestionKeywords = [
    'SUGGESTED CONTENT:',
    'ENHANCED VERSION:',
    'IMPROVED VERSION:',
    'HERE\'S A SUGGESTION:',
    'YOU COULD USE:',
    'RECOMMENDED TEXT:',
    'TRY THIS:',
    'EXAMPLE:',
    'here\'s an enhanced',
    'i suggest using',
    'consider this',
    'you could write'
  ];

  return suggestionKeywords.some(keyword => 
    response.toLowerCase().includes(keyword.toLowerCase())
  );
}

function extractStructuredSuggestions(response, section, cvData) {
  const suggestions = {
    section: section,
    suggestions: [],
    hasDirectContent: false
  };

  const contentPatterns = [
    /SUGGESTED CONTENT:(.*?)(?=\n\n|$)/is,
    /ENHANCED VERSION:(.*?)(?=\n\n|$)/is,
    /RECOMMENDED TEXT:(.*?)(?=\n\n|$)/is,
    /TRY THIS:(.*?)(?=\n\n|$)/is,
    /EXAMPLE:(.*?)(?=\n\n|$)/is
  ];

  for (const pattern of contentPatterns) {
    const match = response.match(pattern);
    if (match) {
      suggestions.hasDirectContent = true;
      suggestions.suggestions.push({
        type: 'content',
        text: match[1].trim()
      });
    }
  }

  const bulletPoints = response.match(/[•\-\*]\s*(.+)/g);
  if (bulletPoints && bulletPoints.length > 0) {
    bulletPoints.forEach(bp => {
      const cleaned = bp.replace(/^[•\-\*]\s*/, '').trim();
      if (cleaned.length > 20) {
        suggestions.suggestions.push({
          type: 'bullet',
          text: cleaned
        });
      }
    });
  }

  return suggestions.suggestions.length > 0 ? suggestions : null;
}

function extractAnalysisMetrics(response, cvData) {
  const scorePattern = /(\d+)(?:\/100|%|\s*out of 100)/gi;
  const scores = [];
  let match;
  
  while ((match = scorePattern.exec(response)) !== null) {
    scores.push(parseInt(match[1]));
  }

  const avgScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const strengthsCount = (response.match(/strength|good|excellent|well-written|effective/gi) || []).length;
  const improvementsCount = (response.match(/improve|enhance|consider|missing|add|need/gi) || []).length;

  return {
    overallScore: avgScore,
    strengthsCount,
    improvementsCount,
    responseLength: response.length,
    hasDetailedFeedback: response.length > 500
  };
}