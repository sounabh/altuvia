// app/api/cv/ai-chat/route.js - ENHANCED AI CHATBOT WITH OPENROUTER
import { NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "google/gemini-2.0-flash-exp:free";

async function callOpenRouter(messages, maxTokens = 4000, temperature = 0.9) {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "CV AI Assistant Chat",
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
    const cvContext = buildDetailedCVContext(cvData);
    const cvStats = analyzeCVCompleteness(cvData);

    // Build conversation history
    const conversationHistory = chatHistory
      ?.slice(-10)
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n') || '';

    // Create intelligent system prompt
    const systemPrompt = `You are an expert AI CV/Resume Assistant chatbot. You help users create outstanding CVs for universities, companies, and institutions worldwide.

YOUR CORE IDENTITY:
- You are helpful, friendly, and conversational
- You understand context from the entire conversation
- You can answer ANY question about CVs, careers, job search, or professional development
- You provide specific, actionable advice based on the user's actual CV data
- When asked to generate or improve content, you provide EXACT text that can be directly used

CURRENT USER'S CV STATUS:
Active Section: ${activeSection}
Overall Completion: ${cvStats.completionPercentage}%
Filled Sections: ${cvStats.filledSections.join(', ') || 'None'}
Empty Sections: ${cvStats.emptySections.join(', ') || 'None'}

DETAILED CV DATA:
${cvContext}

${conversationHistory ? `\nRECENT CONVERSATION HISTORY:\n${conversationHistory}\n` : ''}

USER'S CURRENT MESSAGE: "${message}"

---

RESPONSE GUIDELINES:

1. **Be Conversational & Natural**
   - Respond like a helpful human advisor, not a robotic assistant
   - Use friendly, encouraging tone
   - Ask follow-up questions when needed

2. **Handle ANY Question**
   - General CV questions: Answer based on best practices
   - Specific content requests: Generate exact text they can use
   - Career advice: Provide thoughtful guidance
   - Job search tips: Share practical strategies
   - Industry insights: Give relevant information
   - Random questions: Answer helpfully and relate back to their CV if relevant

3. **Provide Actionable Content**
   When user asks to:
   - "Write/Generate/Create" → Provide exact text formatted with clear markers
   - "Improve/Enhance/Fix" → Show before/after with explanations
   - "Analyze/Review" → Give specific feedback on their actual content
   - "Suggest/Recommend" → Provide concrete examples
   - "What should I..." → Give step-by-step guidance

4. **Content Generation Format**
   When generating content, use this structure:
   
   [Brief explanation of what you're providing]
   
   ✍️ **SUGGESTED CONTENT** (ready to copy):
   ---
   [Exact text here that user can copy-paste]
   ---
   
   💡 **Why This Works**:
   • [Reason 1]
   • [Reason 2]

5. **Reference Their Actual Data**
   - Quote specific parts of their CV when giving feedback
   - Use their background/experience in suggestions
   - Personalize advice based on their career level

6. **Be Comprehensive**
   - Don't give one-word answers
   - Provide context and reasoning
   - Include examples when helpful
   - Suggest related improvements

CRITICAL RULES:
✓ NEVER say "I can't help with that" - always find a way to be helpful
✓ ALWAYS reference their actual CV data when relevant
✓ When generating content, provide EXACT text in clearly marked sections
✓ Be encouraging and positive
✓ Ask clarifying questions if needed
✓ Make responses scannable (use bullets, bold, sections)
✓ End with a helpful follow-up question or suggestion when appropriate

Now respond to the user's message naturally and helpfully, taking into account their entire CV context and conversation history.`;

    const aiResponse = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ], 4000, 0.9);

    // Detect if AI provided content that can be auto-applied
    const autoApplyContent = extractAutoApplyContent(aiResponse, activeSection, cvData);
    
    // Extract analysis if present
    const analysis = detectAnalysis(aiResponse, cvData);

    return NextResponse.json({
      response: aiResponse,
      autoApplyContent: autoApplyContent,
      analysis: analysis,
      cvStats: cvStats,
      canAutoApply: autoApplyContent !== null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    
    return NextResponse.json({
      response: "I apologize, but I encountered a temporary issue. Please try again! I'm here to help with:\n\n• Writing professional summaries\n• Improving bullet points\n• Analyzing your CV\n• Career advice\n• Job search strategies\n• Any CV-related questions\n\nWhat would you like help with?",
      error: error.message
    }, { status: 200 });
  }
}

function buildDetailedCVContext(cvData) {
  let context = `=== USER'S COMPLETE CV DATA ===\n\n`;

  // Personal Information
  if (cvData.personal) {
    context += `📋 PERSONAL INFORMATION:\n`;
    context += `Full Name: ${cvData.personal.fullName || '❌ Missing'}\n`;
    context += `Email: ${cvData.personal.email || '❌ Missing'}\n`;
    context += `Phone: ${cvData.personal.phone || '❌ Missing'}\n`;
    context += `Location: ${cvData.personal.location || '❌ Missing'}\n`;
    if (cvData.personal.website) context += `Website: ${cvData.personal.website}\n`;
    if (cvData.personal.linkedin) context += `LinkedIn: ${cvData.personal.linkedin}\n`;
    if (cvData.personal.summary) {
      context += `\n📝 Professional Summary (${cvData.personal.summary.length} chars):\n"${cvData.personal.summary}"\n`;
    } else {
      context += `\n⚠️ Professional Summary: MISSING (CRITICAL)\n`;
    }
    context += '\n';
  }

  // Education
  if (cvData.education && cvData.education.length > 0) {
    context += `🎓 EDUCATION (${cvData.education.length} entries):\n`;
    cvData.education.forEach((edu, i) => {
      context += `\n${i + 1}. ${edu.degree || 'Degree missing'} in ${edu.field || 'Field missing'}\n`;
      context += `   Institution: ${edu.institution || '❌ Missing'}\n`;
      if (edu.startDate) context += `   Period: ${edu.startDate} - ${edu.endDate || 'Present'}\n`;
      if (edu.gpa) context += `   GPA: ${edu.gpa}\n`;
      if (edu.description) {
        context += `   Details:\n   ${edu.description}\n`;
      } else {
        context += `   ⚠️ Details: Missing\n`;
      }
    });
    context += '\n';
  } else {
    context += `🎓 EDUCATION: ❌ EMPTY (REQUIRED)\n\n`;
  }

  // Work Experience
  if (cvData.experience && cvData.experience.length > 0) {
    context += `💼 WORK EXPERIENCE (${cvData.experience.length} entries):\n`;
    cvData.experience.forEach((exp, i) => {
      context += `\n${i + 1}. ${exp.position || 'Position missing'}\n`;
      context += `   Company: ${exp.company || '❌ Missing'}\n`;
      context += `   Location: ${exp.location || 'Not specified'}\n`;
      if (exp.startDate) {
        context += `   Duration: ${exp.startDate} - ${exp.isCurrentRole ? 'Present' : (exp.endDate || 'Not specified')}\n`;
      }
      if (exp.description) {
        const bulletPoints = exp.description.split('•').filter(b => b.trim());
        context += `   Achievements (${bulletPoints.length} points):\n`;
        bulletPoints.forEach(bp => {
          if (bp.trim()) context += `   • ${bp.trim()}\n`;
        });
      } else {
        context += `   ⚠️ Description: MISSING (CRITICAL)\n`;
      }
    });
    context += '\n';
  } else {
    context += `💼 WORK EXPERIENCE: ❌ EMPTY\n\n`;
  }

  // Projects
  if (cvData.projects && cvData.projects.length > 0) {
    context += `🚀 PROJECTS (${cvData.projects.length} entries):\n`;
    cvData.projects.forEach((proj, i) => {
      context += `\n${i + 1}. ${proj.name || 'Project name missing'}\n`;
      if (proj.description) context += `   Description: ${proj.description}\n`;
      if (proj.technologies) context += `   Technologies: ${proj.technologies}\n`;
      if (proj.githubUrl) context += `   GitHub: ${proj.githubUrl}\n`;
      if (proj.liveUrl) context += `   Live URL: ${proj.liveUrl}\n`;
      if (proj.achievements) context += `   Achievements: ${proj.achievements}\n`;
    });
    context += '\n';
  } else {
    context += `🚀 PROJECTS: ❌ EMPTY\n\n`;
  }

  // Skills
  if (cvData.skills && cvData.skills.length > 0) {
    context += `💻 SKILLS:\n`;
    cvData.skills.forEach((skillGroup) => {
      const skillsList = skillGroup.skills?.join(', ') || 'None';
      context += `   ${skillGroup.name}: ${skillsList}\n`;
    });
    const totalSkills = cvData.skills.reduce((sum, g) => sum + (g.skills?.length || 0), 0);
    context += `   Total Skills Listed: ${totalSkills}\n\n`;
  } else {
    context += `💻 SKILLS: ❌ EMPTY (IMPORTANT)\n\n`;
  }

  // Achievements
  if (cvData.achievements && cvData.achievements.length > 0) {
    context += `🏆 ACHIEVEMENTS (${cvData.achievements.length} entries):\n`;
    cvData.achievements.forEach((ach, i) => {
      context += `   ${i + 1}. ${ach.title || 'Title missing'}\n`;
      if (ach.organization) context += `      Organization: ${ach.organization}\n`;
      if (ach.date) context += `      Date: ${ach.date}\n`;
      if (ach.description) context += `      Details: ${ach.description}\n`;
    });
    context += '\n';
  } else {
    context += `🏆 ACHIEVEMENTS: Empty\n\n`;
  }

  // Volunteer Experience
  if (cvData.volunteer && cvData.volunteer.length > 0) {
    context += `🤝 VOLUNTEER EXPERIENCE (${cvData.volunteer.length} entries):\n`;
    cvData.volunteer.forEach((vol, i) => {
      context += `   ${i + 1}. ${vol.role || 'Role missing'} at ${vol.organization || 'Organization missing'}\n`;
      if (vol.description) context += `      Description: ${vol.description}\n`;
      if (vol.impact) context += `      Impact: ${vol.impact}\n`;
    });
    context += '\n';
  } else {
    context += `🤝 VOLUNTEER EXPERIENCE: Empty\n\n`;
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

function extractAutoApplyContent(response, section, cvData) {
  const contentMarkers = [
    /✍️\s*\*\*SUGGESTED CONTENT\*\*.*?---\s*([\s\S]*?)\s*---/i,
    /SUGGESTED CONTENT:.*?\n([\s\S]*?)(?=\n\n💡|$)/i,
    /RECOMMENDED TEXT:.*?\n([\s\S]*?)(?=\n\n|$)/i,
    /ENHANCED VERSION:.*?\n([\s\S]*?)(?=\n\n|$)/i,
  ];

  for (const marker of contentMarkers) {
    const match = response.match(marker);
    if (match && match[1]) {
      const content = match[1].trim();
      
      return {
        section: section,
        content: content,
        canApply: true,
        type: detectContentType(content, section)
      };
    }
  }

  const bulletMatches = response.match(/[•\-]\s*(.+)/g);
  if (bulletMatches && bulletMatches.length >= 3) {
    const bullets = bulletMatches.map(b => b.replace(/^[•\-]\s*/, '').trim());
    
    const looksLikeContent = bullets.some(b => 
      b.length > 30 && 
      !b.toLowerCase().includes('why') && 
      !b.toLowerCase().includes('because')
    );
    
    if (looksLikeContent) {
      return {
        section: section,
        content: bullets.join('\n• '),
        canApply: true,
        type: 'bullets'
      };
    }
  }

  return null;
}

function detectContentType(content, section) {
  if (section === 'personal' && content.length < 200) {
    return 'summary';
  }
  
  if (content.includes('•') || content.includes('-')) {
    return 'bullets';
  }
  
  if (section === 'skills') {
    return 'skills_list';
  }
  
  if (section === 'experience' || section === 'projects') {
    return 'description';
  }
  
  return 'text';
}

function detectAnalysis(response, cvData) {
  const hasScoring = /\d+\/100|score.*?\d+%/i.test(response);
  const hasStrengths = /strength|good|excellent|well/i.test(response);
  const hasImprovements = /improve|enhance|consider|missing|add/i.test(response);
  
  if (hasScoring || (hasStrengths && hasImprovements)) {
    const scoreMatch = response.match(/(\d+)(?:\/100|%)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
    
    const strengths = [];
    const strengthSection = response.match(/strength[s]?:?\n([\s\S]*?)(?=\n\n|improve|$)/i);
    if (strengthSection) {
      const bullets = strengthSection[1].match(/[•\-]\s*(.+)/g);
      if (bullets) {
        strengths.push(...bullets.map(b => b.replace(/^[•\-]\s*/, '').trim()).slice(0, 5));
      }
    }
    
    const improvements = [];
    const improvementSection = response.match(/improve[ments]*:?\n([\s\S]*?)(?=\n\n|$)/i);
    if (improvementSection) {
      const bullets = improvementSection[1].match(/[•\-]\s*(.+)/g);
      if (bullets) {
        improvements.push(...bullets.map(b => b.replace(/^[•\-]\s*/, '').trim()).slice(0, 5));
      }
    }
    
    return {
      hasAnalysis: true,
      score: score,
      strengths: strengths,
      improvements: improvements
    };
  }
  
  return null;
}