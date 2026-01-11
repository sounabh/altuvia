// app/api/cv/ai-assist/route.js - COMPLETE FIXED VERSION
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

    // Create intelligent system prompt with better content generation instructions
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

CRITICAL CONTENT GENERATION RULES:
When users ask you to "write", "generate", "improve", "enhance", or "create" content:

1. **For Professional Summary (Personal Section)**:
   - Write a compelling 3-4 sentence summary (150-250 words)
   - Include key skills, experience level, and career focus
   - Use action-oriented language
   - Format: Write the summary directly without extra labels
   - Example: "Experienced software engineer with 5+ years developing scalable web applications..."

2. **For Experience Section**:
   - Provide 3-5 bullet points
   - Start each with strong action verbs (Developed, Led, Implemented, etc.)
   - Include quantifiable achievements when possible
   - Format each bullet clearly with • symbol
   - Example:
     • Developed and deployed 15+ full-stack applications serving 100K+ users
     • Led team of 4 engineers in migration project, reducing load time by 40%

3. **For Education Section**:
   - Suggest relevant coursework or achievements
   - Keep it concise (1-2 sentences)
   - Example: "Relevant Coursework: Data Structures, Algorithms, Machine Learning"

4. **For Projects Section**:
   - Description: 1-2 sentences explaining what the project does
   - Technologies: List specific tech stack
   - Achievements: 1-2 quantifiable outcomes

5. **For Skills Section**:
   - Provide categorized skill lists
   - Be specific and relevant
   - Example: Python, JavaScript, Java, C++, React, Node.js

6. **For Achievements Section**:
   - Write specific, impressive accomplishment
   - Include context and impact

7. **For Volunteer Section**:
   - Description: What you did (1-2 sentences)
   - Impact: Quantifiable outcomes

FORMATTING GUIDELINES:
- Write content that can be directly copied and pasted
- Use bullet points (•) for lists
- Keep language professional and concise
- Avoid phrases like "Here's a suggestion" - just provide the content
- Use clear section headers when providing multiple pieces of content

User's Question: ${message}

Provide a helpful, specific, actionable response that directly addresses their question while referencing their actual CV data.`;

    const aiResponse = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ], 3000, 0.8);

    // Parse AI content for form auto-fill
    const structuredContent = parseAIContentForForms(aiResponse, activeSection, cvData);

    console.log('Structured content extracted:', structuredContent);

    return NextResponse.json({
      response: aiResponse,
      structuredContent: structuredContent,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("AI Assist Error:", error);
    
    return NextResponse.json({
      response: "I apologize, but I encountered a temporary issue. Please try rephrasing your question or use one of the quick action buttons above.",
      error: error.message
    }, { status: 200 });
  }
}

// ============================================
// ENHANCED PARSING FUNCTIONS
// ============================================

function parseAIContentForForms(aiResponse, activeSection, cvData) {
  const formData = {};
  
  // Try to extract JSON-formatted suggestions first
  const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return { section: activeSection, data: parsed, type: 'json' };
    } catch (e) {
      console.log("JSON parsing failed, using text extraction");
    }
  }

  // Enhanced text-based extraction for different sections
  switch (activeSection) {
    case 'personal':
      const personalData = extractPersonalInfoEnhanced(aiResponse, cvData.personal);
      if (personalData) formData.personal = personalData;
      break;
      
    case 'education':
      const educationData = extractEducationInfoEnhanced(aiResponse, cvData.education);
      if (educationData) formData.education = educationData;
      break;
      
    case 'experience':
      const experienceData = extractExperienceInfoEnhanced(aiResponse, cvData.experience);
      if (experienceData) formData.experience = experienceData;
      break;
      
    case 'projects':
      const projectsData = extractProjectsInfoEnhanced(aiResponse, cvData.projects);
      if (projectsData) formData.projects = projectsData;
      break;
      
    case 'skills':
      const skillsData = extractSkillsInfoEnhanced(aiResponse, cvData.skills);
      if (skillsData) formData.skills = skillsData;
      break;
      
    case 'achievements':
      const achievementsData = extractAchievementsInfoEnhanced(aiResponse, cvData.achievements);
      if (achievementsData) formData.achievements = achievementsData;
      break;
      
    case 'volunteer':
      const volunteerData = extractVolunteerInfoEnhanced(aiResponse, cvData.volunteer);
      if (volunteerData) formData.volunteer = volunteerData;
      break;
  }

  return Object.keys(formData).length > 0 
    ? { section: activeSection, data: formData, type: 'text' } 
    : null;
}

function extractPersonalInfoEnhanced(text, currentPersonal) {
  const data = { ...currentPersonal };
  let hasChanges = false;
  
  // Extract professional summary - look for common patterns
  const summaryPatterns = [
    /(?:professional summary|summary|about me)[\s:]*["']?([^"'\n]{100,800})["']?/i,
    /(?:suggested summary|recommended summary)[\s:]*["']?([^"'\n]{100,800})["']?/i,
    /(?:here's a summary|use this summary)[\s:]*["']?([^"'\n]{100,800})["']?/i
  ];
  
  for (const pattern of summaryPatterns) {
    const match = text.match(pattern);
    if (match && match[1].trim().length > 50) {
      data.summary = match[1].trim()
        .replace(/\*\*/g, '')
        .replace(/```/g, '')
        .trim();
      hasChanges = true;
      break;
    }
  }
  
  // If no match, try to find any paragraph that looks like a summary
  if (!hasChanges && !currentPersonal.summary) {
    const paragraphs = text.split('\n\n');
    for (const para of paragraphs) {
      const cleaned = para.trim();
      if (cleaned.length > 100 && cleaned.length < 800 && 
          !cleaned.startsWith('•') && !cleaned.startsWith('-') &&
          !cleaned.includes('?') && !cleaned.toLowerCase().includes('i can help')) {
        data.summary = cleaned.replace(/\*\*/g, '').trim();
        hasChanges = true;
        break;
      }
    }
  }
  
  return hasChanges ? data : null;
}

function extractExperienceInfoEnhanced(text, currentExperience) {
  const experienceData = [...currentExperience];
  const firstExp = experienceData[0] || {
    id: Date.now().toString(),
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrentRole: false,
    description: ''
  };
  
  let hasChanges = false;
  
  // Extract bullet points for experience
  const bulletPatterns = [
    /[•\-\*]\s*([^\n]{20,200})/g,
    /(?:responsibilities|achievements|duties)[\s:]*\n([•\-\*\s\S]{50,1000})/i
  ];
  
  let bullets = [];
  
  // Try each pattern
  for (const pattern of bulletPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      bullets = matches.map(m => m[1].trim().replace(/\*\*/g, ''));
      break;
    }
  }
  
  // Format bullets properly
  if (bullets.length > 0) {
    const validBullets = bullets
      .filter(b => b.length > 20 && b.length < 300)
      .map(b => b.replace(/^[•\-\*]\s*/, '').trim());
    
    if (validBullets.length > 0) {
      firstExp.description = validBullets.map(b => `• ${b}`).join('\n');
      hasChanges = true;
    }
  }
  
  // If no bullets found, try to extract a description block
  if (!hasChanges) {
    const descMatch = text.match(/(?:description|details|experience)[\s:]*\n([^\n]{50,500})/i);
    if (descMatch) {
      firstExp.description = `• ${descMatch[1].trim().replace(/\*\*/g, '')}`;
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    experienceData[0] = firstExp;
    return experienceData;
  }
  
  return null;
}

function extractEducationInfoEnhanced(text, currentEducation) {
  const educationData = [...currentEducation];
  const firstEdu = educationData[0] || {
    id: Date.now().toString(),
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    gpa: '',
    description: ''
  };
  
  let hasChanges = false;
  
  // Extract GPA
  const gpaMatch = text.match(/GPA[\s:]*(\d+\.?\d*)/i);
  if (gpaMatch) {
    firstEdu.gpa = gpaMatch[1];
    hasChanges = true;
  }
  
  // Extract description/coursework
  const descPatterns = [
    /(?:coursework|relevant courses|courses)[\s:]*([^\n]{30,400})/i,
    /(?:description|details|achievements)[\s:]*([^\n]{30,400})/i
  ];
  
  for (const pattern of descPatterns) {
    const match = text.match(pattern);
    if (match) {
      firstEdu.description = match[1].trim().replace(/\*\*/g, '');
      hasChanges = true;
      break;
    }
  }
  
  if (hasChanges) {
    educationData[0] = firstEdu;
    return educationData;
  }
  
  return null;
}

function extractProjectsInfoEnhanced(text, currentProjects) {
  const projectsData = [...currentProjects];
  const firstProj = projectsData[0] || {
    id: Date.now().toString(),
    name: '',
    description: '',
    technologies: '',
    startDate: '',
    endDate: '',
    githubUrl: '',
    liveUrl: '',
    achievements: ''
  };
  
  let hasChanges = false;
  
  // Extract description
  const descMatch = text.match(/(?:description|overview|project details)[\s:]*([^\n]{50,500})/i);
  if (descMatch) {
    firstProj.description = descMatch[1].trim().replace(/\*\*/g, '');
    hasChanges = true;
  }
  
  // Extract technologies
  const techMatch = text.match(/(?:technologies|tech stack|tools used)[\s:]*([^\n]{20,200})/i);
  if (techMatch) {
    firstProj.technologies = techMatch[1].trim().replace(/\*\*/g, '');
    hasChanges = true;
  }
  
  // Extract achievements
  const achMatch = text.match(/(?:achievements|results|impact|outcomes)[\s:]*([^\n]{30,300})/i);
  if (achMatch) {
    firstProj.achievements = achMatch[1].trim().replace(/\*\*/g, '');
    hasChanges = true;
  }
  
  if (hasChanges) {
    projectsData[0] = firstProj;
    return projectsData;
  }
  
  return null;
}

function extractSkillsInfoEnhanced(text, currentSkills) {
  const skillsData = [...currentSkills];
  let hasChanges = false;
  
  // Extract skill lists - multiple patterns
  const skillPatterns = [
    /(?:skills|technologies|tools)[\s:]*([^\n]+)/gi,
    /(?:technical skills|programming skills)[\s:]*([^\n]+)/gi
  ];
  
  const allSkills = new Set();
  
  for (const pattern of skillPatterns) {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const skills = match[1]
        .split(/[,;|\n]/)
        .map(s => s.trim().replace(/\*\*/g, '').replace(/^[\-•]\s*/, ''))
        .filter(s => s.length > 1 && s.length < 30 && !s.toLowerCase().includes('skill'));
      
      skills.forEach(skill => allSkills.add(skill));
    });
  }
  
  if (allSkills.size > 0 && skillsData[0]) {
    const existingSkills = new Set(skillsData[0].skills || []);
    const newSkills = [...allSkills];
    
    skillsData[0] = {
      ...skillsData[0],
      skills: [...new Set([...existingSkills, ...newSkills])]
    };
    hasChanges = true;
  }
  
  return hasChanges ? skillsData : null;
}

function extractAchievementsInfoEnhanced(text, currentAchievements) {
  const achievementsData = [...currentAchievements];
  const firstAch = achievementsData[0] || {
    id: Date.now().toString(),
    title: '',
    organization: '',
    date: '',
    type: '',
    description: ''
  };
  
  let hasChanges = false;
  
  // Extract description
  const descMatch = text.match(/(?:description|details|achievement|accomplishment)[\s:]*([^\n]{30,400})/i);
  if (descMatch) {
    firstAch.description = descMatch[1].trim().replace(/\*\*/g, '');
    hasChanges = true;
  }
  
  if (hasChanges) {
    achievementsData[0] = firstAch;
    return achievementsData;
  }
  
  return null;
}

function extractVolunteerInfoEnhanced(text, currentVolunteer) {
  const volunteerData = [...currentVolunteer];
  const firstVol = volunteerData[0] || {
    id: Date.now().toString(),
    organization: '',
    role: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    impact: ''
  };
  
  let hasChanges = false;
  
  // Extract description
  const descMatch = text.match(/(?:description|responsibilities|activities)[\s:]*([^\n]{30,400})/i);
  if (descMatch) {
    firstVol.description = descMatch[1].trim().replace(/\*\*/g, '');
    hasChanges = true;
  }
  
  // Extract impact
  const impactMatch = text.match(/(?:impact|results|achievements|outcomes)[\s:]*([^\n]{30,300})/i);
  if (impactMatch) {
    firstVol.impact = impactMatch[1].trim().replace(/\*\*/g, '');
    hasChanges = true;
  }
  
  if (hasChanges) {
    volunteerData[0] = firstVol;
    return volunteerData;
  }
  
  return null;
}

// ============================================
// HELPER FUNCTIONS (Keep existing)
// ============================================

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