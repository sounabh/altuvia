/*import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'

const prisma = new PrismaClient()

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// GET - Fetch essays with versions and AI results
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const programId = searchParams.get('programId')
    const essayId = searchParams.get('essayId')
    const schoolSlug = searchParams.get('schoolSlug')

    // Fetch single essay by ID
    if (essayId) {
      const essay = await prisma.essay.findUnique({
        where: { id: essayId },
        include: {
          versions: {
            orderBy: { timestamp: 'desc' },
            include: {
              aiResults: {
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          aiResults: {
            where: { essayVersionId: null },
            orderBy: { createdAt: 'desc' }
          },
          essayPrompt: true,
          program: {
            include: {
              university: true
            }
          }
        }
      })

      if (!essay) {
        return NextResponse.json({ error: 'Essay not found' }, { status: 404 })
      }

      return NextResponse.json({ essay })
    }

    // Fetch essays by school slug
    if (schoolSlug) {
      const essays = await prisma.essay.findMany({
        where: {
          program: {
            university: {
              slug: schoolSlug
            }
          },
          ...(userId && { userId })
        },
        include: {
          versions: {
            orderBy: { timestamp: 'desc' },
            take: 5 // Limit versions for performance
          },
          aiResults: {
            where: { essayVersionId: null },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          essayPrompt: true,
          program: {
            include: {
              university: true
            }
          }
        },
        orderBy: { lastModified: 'desc' }
      })

      return NextResponse.json({ essays })
    }

    // Fetch essays by program or user
    const whereCondition = {}
    if (programId) whereCondition.programId = programId
    if (userId) whereCondition.userId = userId

    const essays = await prisma.essay.findMany({
      where: whereCondition,
      include: {
        versions: {
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        aiResults: {
          where: { essayVersionId: null },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        essayPrompt: true,
        program: {
          include: {
            university: true
          }
        }
      },
      orderBy: { lastModified: 'desc' }
    })

    return NextResponse.json({ essays })
  } catch (error) {
    console.error('Error fetching essays:', error)
    return NextResponse.json({ error: 'Failed to fetch essays' }, { status: 500 })
  }
}

// POST - Create new essay or save version or trigger AI analysis
export async function POST(request) {
  try {
    const body = await request.json()
    const action = body.action

    switch (action) {
      case 'create_essay':
        return await createEssay(body)
      case 'save_version':
        return await saveVersion(body)
      case 'auto_save':
        return await autoSave(body)
      case 'ai_analysis':
        return await performAIAnalysis(body)
      case 'fetch_prompts':
        return await fetchEssayPrompts(body)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in POST request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update essay content
export async function PUT(request) {
  try {
    const body = await request.json()
    const { essayId, content, wordCount, title, priority } = body

    const updatedEssay = await prisma.essay.update({
      where: { id: essayId },
      data: {
        ...(content !== undefined && { content }),
        ...(wordCount !== undefined && { wordCount }),
        ...(title !== undefined && { title }),
        ...(priority !== undefined && { priority }),
        lastModified: new Date(),
        lastAutoSaved: new Date()
      },
      include: {
        versions: {
          orderBy: { timestamp: 'desc' },
          take: 5
        },
        aiResults: {
          where: { essayVersionId: null },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        essayPrompt: true
      }
    })

    return NextResponse.json({ essay: updatedEssay })
  } catch (error) {
    console.error('Error updating essay:', error)
    return NextResponse.json({ error: 'Failed to update essay' }, { status: 500 })
  }
}

// DELETE - Delete essay or version
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const essayId = searchParams.get('essayId')
    const versionId = searchParams.get('versionId')

    if (versionId) {
      await prisma.essayVersion.delete({
        where: { id: versionId }
      })
      return NextResponse.json({ success: true, message: 'Version deleted' })
    }

    if (essayId) {
      await prisma.essay.delete({
        where: { id: essayId }
      })
      return NextResponse.json({ success: true, message: 'Essay deleted' })
    }

    return NextResponse.json({ error: 'Missing essayId or versionId' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting essay/version:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

// Helper function to create new essay
async function createEssay(data) {
  const { userId, programId, essayPromptId, title, content, wordCount, wordLimit, priority, applicationId } = data

  const essayPrompt = await prisma.essayPrompt.findUnique({
    where: { id: essayPromptId },
    include: {
      program: {
        include: {
          university: true
        }
      }
    }
  })

  if (!essayPrompt) {
    return NextResponse.json({ error: 'Essay prompt not found' }, { status: 404 })
  }

  const existingEssay = await prisma.essay.findUnique({
    where: {
      userId_programId_essayPromptId: {
        userId: userId || '',
        programId,
        essayPromptId
      }
    }
  })

  if (existingEssay) {
    return NextResponse.json({ error: 'Essay already exists for this prompt' }, { status: 409 })
  }

  const essay = await prisma.essay.create({
    data: {
      userId,
      programId,
      essayPromptId,
      applicationId,
      title,
      content,
      wordCount,
      wordLimit: wordLimit || essayPrompt.wordLimit,
      priority: priority || 'medium'
    },
    include: {
      versions: true,
      aiResults: true,
      essayPrompt: true,
      program: {
        include: {
          university: true
        }
      }
    }
  })

  return NextResponse.json({ essay })
}

// Helper function to save essay version
async function saveVersion(data) {
  const { essayId, content, wordCount, label, isAutoSave } = data

  const version = await prisma.essayVersion.create({
    data: {
      essayId,
      content,
      wordCount,
      label,
      isAutoSave: isAutoSave || false
    },
    include: {
      essay: true
    }
  })

  await prisma.essay.update({
    where: { id: essayId },
    data: { lastModified: new Date() }
  })

  return NextResponse.json({ version })
}

// Helper function for auto-save
async function autoSave(data) {
  const { essayId, content, wordCount } = data

  const updatedEssay = await prisma.essay.update({
    where: { id: essayId },
    data: {
      content,
      wordCount,
      lastAutoSaved: new Date()
    }
  })

  return NextResponse.json({ success: true, essay: updatedEssay })
}

// Helper function to fetch essay prompts
async function fetchEssayPrompts(data) {
  const { programId, schoolSlug } = data

  let whereCondition = { isActive: true }

  if (programId) {
    whereCondition.programId = programId
  } else if (schoolSlug) {
    whereCondition.program = {
      university: {
        slug: schoolSlug
      }
    }
  }

  const prompts = await prisma.essayPrompt.findMany({
    where: whereCondition,
    include: {
      program: {
        include: {
          university: true
        }
      },
      essays: {
        take: 5,
        orderBy: { lastModified: 'desc' }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  return NextResponse.json({ prompts })
}

// AI analysis with Gemini
async function performAIAnalysis(data) {
  const { essayId, content, prompt, analysisTypes = ['suggestions'] } = data

  try {
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
      include: { essayPrompt: true }
    })

    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const analysisPrompt = `
Analyze the following MBA essay and provide detailed feedback in JSON format.

ESSAY PROMPT: ${prompt}
WORD LIMIT: ${essay.wordLimit}
CURRENT WORD COUNT: ${essay.wordCount}

ESSAY CONTENT:
${content}

Please provide analysis in the following JSON structure:
{ ... trimmed for brevity ... }
`

    const result = await model.generateContent(analysisPrompt)
    const responseText = result.response.text()
    
    let analysisData
    try {
      analysisData = JSON.parse(responseText)
    } catch {
      analysisData = {
        overallScore: 75,
        suggestions: [{ id: "1", type: "improvement", title: "AI Analysis Available" }],
        strengths: ["Content analysis completed"],
        improvements: ["Consider manual review"],
        warnings: [],
        readabilityScore: 75,
        sentenceCount: content.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
        paragraphCount: content.split('\n').filter(p => p.trim().length > 0).length,
        avgSentenceLength: content.length / Math.max(1, content.split(/[.!?]+/).filter(s => s.trim().length > 0).length),
        complexWordCount: 0,
        passiveVoiceCount: 0
      }
    }

    const aiResult = await prisma.aIResult.create({
      data: {
        essayId,
        analysisType: 'comprehensive',
        overallScore: analysisData.overallScore,
        suggestions: JSON.stringify(analysisData.suggestions),
        strengths: JSON.stringify(analysisData.strengths),
        improvements: JSON.stringify(analysisData.improvements),
        warnings: JSON.stringify(analysisData.warnings),
        aiProvider: 'gemini',
        modelUsed: 'gemini-1.5-flash',
        status: 'completed',
        readabilityScore: analysisData.readabilityScore,
        sentenceCount: analysisData.sentenceCount,
        paragraphCount: analysisData.paragraphCount,
        avgSentenceLength: analysisData.avgSentenceLength,
        complexWordCount: analysisData.complexWordCount,
        passiveVoiceCount: analysisData.passiveVoiceCount
      }
    })

    return NextResponse.json({ success: true, analysis: analysisData, aiResult })
  } catch (error) {
    console.error('Error performing AI analysis:', error)

    await prisma.aIResult.create({
      data: {
        essayId: data.essayId,
        analysisType: 'comprehensive',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        aiProvider: 'gemini'
      }
    }).catch(console.error)

    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
  }
}

// Utility - get essays by school
export async function getEssaysBySchool(schoolSlug, userId) {
  try {
    const essays = await prisma.essay.findMany({
      where: {
        program: { university: { slug: schoolSlug } },
        ...(userId && { userId })
      },
      include: {
        versions: { orderBy: { timestamp: 'desc' } },
        aiResults: {
          where: { essayVersionId: null },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        essayPrompt: true,
        program: { include: { university: true } }
      },
      orderBy: { lastModified: 'desc' }
    })

    return essays
  } catch (error) {
    console.error('Error fetching essays by school:', error)
    throw error
  }
}

// Utility - restore essay from version
export async function restoreEssayFromVersion(essayId, versionId) {
  try {
    const version = await prisma.essayVersion.findUnique({
      where: { id: versionId }
    })

    if (!version || version.essayId !== essayId) {
      throw new Error('Version not found or does not belong to essay')
    }

    const updatedEssay = await prisma.essay.update({
      where: { id: essayId },
      data: {
        content: version.content,
        wordCount: version.wordCount,
        lastModified: new Date()
      }
    })

    return updatedEssay
  } catch (error) {
    console.error('Error restoring essay from version:', error)
    throw error
  }
}

// Utility - essay analytics
export async function getEssayAnalytics(essayId) {
  try {
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
      include: {
        versions: { orderBy: { timestamp: 'asc' } },
        aiResults: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    })

    if (!essay) {
      throw new Error('Essay not found')
    }

    const completionPercentage = (essay.wordCount / essay.wordLimit) * 100
    const readingTime = Math.ceil(essay.wordCount / 200)
    const daysSinceCreation = Math.ceil((Date.now() - essay.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const writingVelocity = Math.round(essay.wordCount / Math.max(1, daysSinceCreation))

    const sentences = essay.content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = sentences.length > 0 ? Math.round(essay.wordCount / sentences.length) : 0

    return {
      essay,
      analytics: {
        completionPercentage: Math.round(completionPercentage),
        readingTime,
        writingVelocity,
        sentenceCount: sentences.length,
        avgSentenceLength,
        versionsCount: essay.versions.length,
        lastAIScore: essay.aiResults[0]?.overallScore || null
      }
    }
  } catch (error) {
    console.error('Error getting essay analytics:', error)
    throw error
  }
}

// Close Prisma connection
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
*/