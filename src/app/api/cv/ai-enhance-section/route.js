// app/api/cv/ai-enhance-section/route.js - Section Enhancement WITH OPENROUTER
import { NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "google/gemini-2.5-flash-lite";

async function callOpenRouter(messages, maxTokens = 2048, temperature = 0.7) {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "CV Section Enhancer",
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
    const { 
      section, 
      sectionData, 
      targetRole,
      targetCompany,
      enhancementType // 'language', 'structure', 'ats', 'quantify', 'complete'
    } = await request.json();

    if (!section || !sectionData) {
      return NextResponse.json(
        { error: "Section and section data are required" },
        { status: 400 }
      );
    }

    const prompt = createEnhancementPrompt(
      section, 
      sectionData, 
      enhancementType,
      targetRole,
      targetCompany
    );

    const enhancedContent = await callOpenRouter([
      { role: "user", content: prompt }
    ], 2048, 0.7);

    // Parse the enhanced content into structured format
    const structured = parseEnhancedSection(enhancedContent, section);

    return NextResponse.json({
      original: sectionData,
      enhanced: structured,
      enhancementType: enhancementType,
      suggestions: extractSuggestions(enhancedContent),
      improvements: extractImprovements(enhancedContent),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Section Enhancement Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to enhance section",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function createEnhancementPrompt(section, sectionData, enhancementType, targetRole, targetCompany) {
  const baseContext = `
${targetRole ? `TARGET ROLE: ${targetRole}` : ''}
${targetCompany ? `TARGET COMPANY/INSTITUTION: ${targetCompany}` : ''}
`;

  if (section === 'personal') {
    return createPersonalEnhancement(sectionData, enhancementType, baseContext);
  } else if (section === 'experience') {
    return createExperienceEnhancement(sectionData, enhancementType, baseContext);
  } else if (section === 'education') {
    return createEducationEnhancement(sectionData, enhancementType, baseContext);
  } else if (section === 'projects') {
    return createProjectsEnhancement(sectionData, enhancementType, baseContext);
  } else if (section === 'skills') {
    return createSkillsEnhancement(sectionData, enhancementType, baseContext);
  } else if (section === 'achievements') {
    return createAchievementsEnhancement(sectionData, enhancementType, baseContext);
  }

  return createGenericEnhancement(section, sectionData, enhancementType, baseContext);
}

function createPersonalEnhancement(data, type, context) {
  return `You are enhancing the PERSONAL INFORMATION section of a CV/Resume.

CURRENT DATA:
${JSON.stringify(data, null, 2)}

${context}

ENHANCEMENT TYPE: ${type}

${type === 'language' ? `
Improve the professional summary by:
- Using more powerful and concise language
- Highlighting key achievements
- Adding relevant keywords for ATS
- Making it more engaging
- Keeping it to 50-75 words
` : ''}

${type === 'ats' ? `
Optimize for ATS by:
- Including relevant keywords for the target role
- Using industry-standard terminology
- Ensuring proper formatting
- Adding missing elements (if any)
` : ''}

${type === 'complete' ? `
Complete and enhance by:
- Improving summary with achievements
- Suggesting professional headline
- Optimizing all fields for impact
- Adding missing elements that would strengthen the profile
` : ''}

Provide the enhanced version in this JSON format:
{
  "fullName": "...",
  "email": "...",
  "phone": "...",
  "location": "...",
  "website": "...",
  "linkedin": "...",
  "summary": "Enhanced professional summary here",
  "headline": "Professional headline (optional)",
  "improvements": ["List of improvements made"],
  "reasoning": "Brief explanation of changes"
}`;
}

function createExperienceEnhancement(data, type, context) {
  return `You are enhancing the WORK EXPERIENCE section of a CV/Resume.

CURRENT EXPERIENCE ENTRIES:
${JSON.stringify(data, null, 2)}

${context}

ENHANCEMENT TYPE: ${type}

${type === 'language' ? `
Enhance each experience entry by:
- Starting bullet points with strong action verbs
- Using more impactful language
- Improving clarity and conciseness
- Making achievements more prominent
` : ''}

${type === 'quantify' ? `
Add quantifiable metrics to achievements:
- Estimate numbers, percentages, or scale where possible
- Show scope of work (team size, budget, users, etc.)
- Demonstrate impact with metrics
- Use comparative data when relevant
` : ''}

${type === 'structure' ? `
Improve structure by:
- Reorganizing bullet points for impact (most impressive first)
- Grouping similar responsibilities
- Ensuring consistent formatting
- Using parallel structure
- Limiting to 4-6 bullets per role
` : ''}

${type === 'ats' ? `
Optimize for ATS by:
- Including relevant keywords from target role
- Using standard job titles and terms
- Ensuring proper date formatting
- Adding industry-specific terminology
` : ''}

Provide enhanced version as JSON array maintaining the same structure but with improved content.
Include an "improvements" field explaining key changes.`;
}

function createEducationEnhancement(data, type, context) {
  return `You are enhancing the EDUCATION section of a CV/Resume.

CURRENT EDUCATION ENTRIES:
${JSON.stringify(data, null, 2)}

${context}

ENHANCEMENT TYPE: ${type}

Enhance by:
- Adding relevant coursework if missing
- Highlighting academic achievements
- Including honors, awards, or scholarships
- Mentioning thesis/capstone projects if relevant
- Adding leadership positions or activities
- Ensuring GPA is displayed advantageously (if 3.5+)

${type === 'complete' ? `
Complete missing information with common additions:
- Relevant coursework for target role
- Academic projects related to field
- Honors and distinctions
- Research experience
- Teaching assistant roles
` : ''}

Provide enhanced version as JSON array with improvements field.`;
}

function createProjectsEnhancement(data, type, context) {
  return `You are enhancing the PROJECTS section of a CV/Resume.

CURRENT PROJECT ENTRIES:
${JSON.stringify(data, null, 2)}

${context}

ENHANCEMENT TYPE: ${type}

Enhance each project by:
- Writing clear, impactful descriptions
- Highlighting technical complexity
- Showing problem-solving approach
- Emphasizing results and impact
- Listing relevant technologies prominently
- Keeping descriptions concise but comprehensive

${type === 'quantify' ? `
Add metrics and scale:
- User numbers or traffic
- Performance improvements
- Time saved or efficiency gained
- Team size if collaborative
- Lines of code, features built, etc.
` : ''}

Provide enhanced version as JSON array with improvements field.`;
}

function createSkillsEnhancement(data, type, context) {
  return `You are enhancing the SKILLS section of a CV/Resume.

CURRENT SKILLS:
${JSON.stringify(data, null, 2)}

${context}

Enhancement requirements:
- Organize skills into logical categories
- Prioritize most relevant skills for target role
- Use industry-standard terminology
- Add proficiency levels if appropriate
- Include both technical and soft skills
- Remove outdated or irrelevant skills
- Add missing skills commonly required for target role

${type === 'ats' ? `
Optimize for ATS by:
- Including exact keyword matches from job descriptions
- Using full names and acronyms (e.g., "JavaScript (JS)")
- Adding trending technologies in the field
- Ensuring comprehensive coverage of required skills
` : ''}

Provide enhanced version as JSON array with suggestions for additions/removals.`;
}

function createAchievementsEnhancement(data, type, context) {
  return `You are enhancing the ACHIEVEMENTS section of a CV/Resume.

CURRENT ACHIEVEMENTS:
${JSON.stringify(data, null, 2)}

${context}

Enhance each achievement by:
- Making the accomplishment clear and specific
- Adding context and significance
- Quantifying impact where possible
- Showing competitive advantage (if applicable)
- Using powerful language
- Keeping it concise but impactful

Provide enhanced version as JSON array with improvements field.`;
}

function createGenericEnhancement(section, data, type, context) {
  return `Enhance the ${section.toUpperCase()} section of a CV/Resume.

CURRENT DATA:
${JSON.stringify(data, null, 2)}

${context}

ENHANCEMENT TYPE: ${type}

Provide professional enhancements following CV best practices.
Return as properly structured JSON with an improvements field.`;
}

function parseEnhancedSection(content, section) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      content: content,
      parsed: false
    };
  } catch (error) {
    console.error("Error parsing enhanced content:", error);
    return {
      content: content,
      parsed: false,
      error: error.message
    };
  }
}

function extractSuggestions(content) {
  const suggestions = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.includes('•') || line.includes('-') || line.match(/^\d+\./)) {
      const cleaned = line.replace(/^[•\-\d.]\s*/, '').trim();
      if (cleaned && cleaned.length > 15) {
        suggestions.push(cleaned);
      }
    }
  }
  
  return suggestions.slice(0, 10);
}

function extractImprovements(content) {
  const improvements = [];
  const improvementMatch = content.match(/improvements?[:\s]+(.*?)(?=\n\n|$)/is);
  
  if (improvementMatch) {
    const lines = improvementMatch[1].match(/[-•]\s*(.+)/g);
    if (lines) {
      improvements.push(...lines.map(line => 
        line.replace(/^[-•]\s*/, '').trim()
      ).slice(0, 5));
    }
  }
  
  return improvements;
}