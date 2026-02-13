// app/api/calendar/route.js
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";


const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const GEMINI_MODEL = "google/gemini-2.5-flash-lite";


// ========================================
// AI COLOR FETCHER (FIXED)
// ========================================
async function fetchSchoolColorFromAI(universityName) {
  try {
    if (!OPENROUTER_API_KEY) {
      console.warn("OpenRouter API key not configured");
      return null;
    }

    const prompt = `What is the official primary brand color hex code for ${universityName}? 

Return ONLY the hex code in this exact format: #RRGGBB

Do not include any explanation or additional text. Just the hex code.`;

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "University Calendar Color System",
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a university branding expert. You only return official brand color hex codes from university brand guidelines. Return ONLY the hex code with no explanation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 20,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenRouter API error:", response.status, errorText);
      return null;
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from AI service");
    }

    const responseText = data.choices[0].message.content.trim();
    
    console.log(`AI Response for ${universityName}:`, responseText);
    
    // Extract hex code from response
    const hexMatch = responseText.match(/#[0-9A-Fa-f]{6}\b/);
    if (hexMatch) {
      const color = hexMatch[0].toUpperCase();
      console.log(`Extracted color for ${universityName}:`, color);
      return color;
    }

    console.warn(`No valid hex code found for ${universityName}`);
    return null;
  } catch (error) {
    console.error("Error fetching school color from AI:", error);
    return null;
  }
}
// ========================================
// GET ENDPOINT - Fetch Calendar Events
// ========================================
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    
    const finalEmail = userEmail || session?.user?.email;
    
    if (!finalEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const eventType = searchParams.get("eventType") || "all";
    const universityId = searchParams.get("universityId");
    const programId = searchParams.get("programId");
    const includeSystemEvents = searchParams.get("includeSystemEvents") !== "false";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")) : undefined;
    const offset = parseInt(searchParams.get("offset") || "0");

    const user = await prisma.user.findUnique({
      where: { email: finalEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const where = {
      userId: user.id,
      isVisible: true,
      ...(eventType && eventType !== "all" && { eventType }),
      ...(universityId && { universityId }),
      ...(programId && { programId }),
    };

    if (startDate && endDate) {
      where.OR = [
        {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          endDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          AND: [
            { startDate: { lte: new Date(startDate) } },
            { endDate: { gte: new Date(endDate) } },
          ],
        },
      ];
    }

    if (!includeSystemEvents) {
      where.isSystemGenerated = false;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        university: {
          select: {
            id: true,
            universityName: true,
            slug: true,
            country: true,
            city: true,
          },
        },
        program: {
          select: {
            id: true,
            programName: true,
            programSlug: true,
            degreeType: true,
          },
        },
        application: {
          select: {
            id: true,
            applicationStatus: true,
            firstName: true,
            lastName: true,
          },
        },
        admission: {
          select: {
            id: true,
            acceptanceRate: true,
            applicationFee: true,
          },
        },
        intake: {
          select: {
            id: true,
            intakeName: true,
            intakeType: true,
            intakeYear: true,
          },
        },
        admissionDeadline: {
          select: {
            id: true,
            deadlineType: true,
            title: true,
            priority: true,
          },
        },
        interview: {
          select: {
            id: true,
            interviewType: true,
            interviewStatus: true,
            duration: true,
            location: true,
            meetingLink: true,
          },
        },
        scholarship: {
          select: {
            id: true,
            scholarshipName: true,
            amount: true,
            currency: true,
          },
        },
        reminders: {
          where: { isActive: true },
          select: {
            id: true,
            reminderType: true,
            reminderTime: true,
            isActive: true,
            isSent: true,
            scheduledFor: true,
            reminderMessage: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    const transformedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      start: event.startDate.toISOString(),
      end: event.endDate.toISOString(),
      timezone: event.timezone,
      isAllDay: event.isAllDay,
      type: event.eventType,
      eventType: event.eventType,
      status: event.eventStatus,
      eventStatus: event.eventStatus,
      priority: event.priority,
      color: event.color || "#6b7280",
      schoolColor: event.color || "#6b7280",
      completionStatus: event.completionStatus,
      completedAt: event.completedAt?.toISOString(),
      completionNotes: event.completionNotes,
      isSystemGenerated: event.isSystemGenerated,
      hasReminders: event.hasReminders,
      school: event.university?.universityName || "General",
      universityId: event.universityId,
      universitySlug: event.university?.slug,
      country: event.university?.country,
      city: event.university?.city,
      program: event.program?.programName,
      programId: event.programId,
      programSlug: event.program?.programSlug,
      degreeType: event.program?.degreeType,
      applicationId: event.applicationId,
      applicationStatus: event.application?.applicationStatus,
      applicantName: event.application
        ? `${event.application.firstName} ${event.application.lastName}`
        : null,
      deadlineType: event.admissionDeadline?.deadlineType,
      interviewType: event.interview?.interviewType,
      interviewDuration: event.interview?.duration,
      interviewLocation: event.interview?.location || event.interview?.meetingLink,
      scholarshipAmount: event.scholarship?.amount,
      scholarshipCurrency: event.scholarship?.currency,
      reminders: event.reminders,
      reminderCount: event.reminders?.length || 0,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: transformedEvents,
      count: transformedEvents.length,
      total: transformedEvents.length,
      pagination: {
        offset,
        limit: limit || transformedEvents.length,
        hasMore: limit ? transformedEvents.length === limit : false,
      },
    });
  } catch (error) {
    console.error("Calendar API GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch calendar events",
        message: error.message,
        data: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}

// ========================================
// POST ENDPOINT - Create Event & Fetch School Color
// ========================================
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const eventData = await request.json();
    
    const finalEmail = eventData.userEmail || session?.user?.email;
    
    if (!finalEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Handle AI color fetch request
    if (eventData.action === "fetch_school_color") {
      const { universityId } = eventData;
      
      console.log("Fetching school color for university ID:", universityId);
      
      if (!universityId) {
        return NextResponse.json(
          { error: "University ID is required" },
          { status: 400 }
        );
      }

      const university = await prisma.university.findUnique({
        where: { id: universityId },
        select: { universityName: true },
      });

      if (!university) {
        console.log("University not found:", universityId);
        return NextResponse.json(
          { error: "University not found" },
          { status: 404 }
        );
      }

      console.log("University found:", university.universityName);

      // Directly fetch from AI - each university has its own unique brand color
      console.log("Fetching color from AI for:", university.universityName);
      const aiColor = await fetchSchoolColorFromAI(university.universityName);
      
      if (aiColor) {
        console.log("AI returned color:", aiColor);
        return NextResponse.json({
          success: true,
          color: aiColor,
          source: "ai",
          universityName: university.universityName,
        });
      }

      console.log("No color found, returning fallback");
      return NextResponse.json({
        success: true,
        color: "#6b7280",
        source: "fallback",
        universityName: university.universityName,
      });
    }

    // Regular event creation
    const user = await prisma.user.findUnique({
      where: { email: finalEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const {
      title,
      description,
      location,
      start,
      end,
      timezone = "UTC",
      isAllDay = false,
      eventType,
      eventStatus = "pending",
      priority = "medium",
      schoolColor,
      universityId,
      programId,
      applicationId,
      admissionId,
      intakeId,
      admissionDeadlineId,
      interviewId,
      scholarshipId,
      reminders = [],
      completionStatus = "pending",
    } = eventData;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!start || !end) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    if (!eventType) {
      return NextResponse.json(
        { error: "Event type is required" },
        { status: 400 }
      );
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const event = await tx.calendarEvent.create({
          data: {
            userId: user.id,
            title: title.trim(),
            description: description?.trim() || null,
            location: location?.trim() || null,
            startDate,
            endDate,
            timezone,
            isAllDay,
            eventType,
            eventStatus,
            priority,
            color: schoolColor || "#6b7280",
            universityId: universityId || null,
            programId: programId || null,
            applicationId: applicationId || null,
            admissionId: admissionId || null,
            intakeId: intakeId || null,
            admissionDeadlineId: admissionDeadlineId || null,
            interviewId: interviewId || null,
            scholarshipId: scholarshipId || null,
            completionStatus,
            isSystemGenerated: false,
            hasReminders: reminders.length > 0,
            isVisible: true,
          },
          include: {
            university: {
              select: {
                universityName: true,
                slug: true,
              },
            },
            program: {
              select: {
                programName: true,
                programSlug: true,
              },
            },
          },
        });

        if (reminders.length > 0) {
          const reminderData = reminders.map((reminder) => {
            const reminderTime = reminder.time || 1440;
            const scheduledFor = new Date(
              startDate.getTime() - reminderTime * 60 * 1000
            );

            return {
              eventId: event.id,
              userId: user.id,
              reminderType: reminder.type || "email",
              reminderTime,
              reminderMessage: reminder.message || `Reminder: ${title}`,
              scheduledFor,
              isActive: true,
            };
          });

          await tx.eventReminder.createMany({
            data: reminderData,
          });
        }

        return event;
      },
      {
        timeout: 15000,
        maxWait: 5000,
      }
    );

    const transformedResult = {
      id: result.id,
      title: result.title,
      description: result.description,
      location: result.location,
      start: result.startDate.toISOString(),
      end: result.endDate.toISOString(),
      timezone: result.timezone,
      isAllDay: result.isAllDay,
      type: result.eventType,
      eventType: result.eventType,
      status: result.eventStatus,
      eventStatus: result.eventStatus,
      priority: result.priority,
      color: result.color,
      schoolColor: result.color,
      completionStatus: result.completionStatus,
      isSystemGenerated: result.isSystemGenerated,
      hasReminders: result.hasReminders,
      school: result.university?.universityName || "General",
      universityId: result.universityId,
      program: result.program?.programName,
      programId: result.programId,
      reminders: reminders,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Calendar event created successfully",
        data: transformedResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Calendar API POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create calendar event",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// ========================================
// PUT ENDPOINT - Update Calendar Event
// ========================================
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    const updateData = await request.json();
    
    const finalEmail = updateData.userEmail || session?.user?.email;
    
    if (!finalEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: finalEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id, reminders, ...eventData } = updateData;

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existingEvent.userId !== user.id) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const processedData = {};

    if (eventData.title !== undefined) {
      if (!eventData.title.trim()) {
        return NextResponse.json(
          { error: "Title cannot be empty" },
          { status: 400 }
        );
      }
      processedData.title = eventData.title.trim();
    }

    if (eventData.description !== undefined) {
      processedData.description = eventData.description?.trim() || null;
    }

    if (eventData.location !== undefined) {
      processedData.location = eventData.location?.trim() || null;
    }

    if (eventData.start !== undefined) {
      const startDate = new Date(eventData.start);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date" },
          { status: 400 }
        );
      }
      processedData.startDate = startDate;
    }

    if (eventData.end !== undefined) {
      const endDate = new Date(eventData.end);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date" },
          { status: 400 }
        );
      }
      processedData.endDate = endDate;
    }

    const finalStartDate = processedData.startDate || existingEvent.startDate;
    const finalEndDate = processedData.endDate || existingEvent.endDate;

    if (finalStartDate >= finalEndDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    if (eventData.eventType !== undefined) {
      processedData.eventType = eventData.eventType;
    }

    if (eventData.eventStatus !== undefined) {
      processedData.eventStatus = eventData.eventStatus;
    }

    if (eventData.priority !== undefined) {
      processedData.priority = eventData.priority;
    }

    if (eventData.timezone !== undefined) {
      processedData.timezone = eventData.timezone;
    }

    if (eventData.isAllDay !== undefined) {
      processedData.isAllDay = eventData.isAllDay;
    }

    if (eventData.schoolColor !== undefined || eventData.color !== undefined) {
      processedData.color = eventData.schoolColor || eventData.color || "#6b7280";
    }

    if (eventData.universityId !== undefined) {
      processedData.universityId = eventData.universityId || null;
    }

    if (eventData.programId !== undefined) {
      processedData.programId = eventData.programId || null;
    }

    if (eventData.completionStatus !== undefined) {
      processedData.completionStatus = eventData.completionStatus;
    }

    if (reminders !== undefined) {
      processedData.hasReminders =
        Array.isArray(reminders) && reminders.length > 0;
    }

    processedData.updatedAt = new Date();

    const result = await prisma.$transaction(
      async (tx) => {
        const updatedEvent = await tx.calendarEvent.update({
          where: { id },
          data: processedData,
          include: {
            university: {
              select: {
                universityName: true,
                slug: true,
              },
            },
            program: {
              select: {
                programName: true,
                programSlug: true,
              },
            },
          },
        });

        if (reminders && Array.isArray(reminders)) {
          await tx.eventReminder.deleteMany({
            where: { eventId: id },
          });

          if (reminders.length > 0) {
            const reminderData = reminders.map((reminder) => {
              const reminderTime = reminder.time || 1440;
              const scheduledFor = new Date(
                (processedData.startDate || existingEvent.startDate).getTime() -
                  reminderTime * 60 * 1000
              );

              return {
                eventId: id,
                userId: user.id,
                reminderType: reminder.type || "email",
                reminderTime,
                reminderMessage:
                  reminder.message || `Reminder: ${updatedEvent.title}`,
                scheduledFor,
                isActive: true,
              };
            });

            await tx.eventReminder.createMany({
              data: reminderData,
            });
          }
        }

        return updatedEvent;
      },
      {
        timeout: 15000,
        maxWait: 5000,
      }
    );

    const finalReminders =
      reminders && Array.isArray(reminders)
        ? await prisma.eventReminder.findMany({
            where: { eventId: id, isActive: true },
          })
        : [];

    const transformedResult = {
      id: result.id,
      title: result.title,
      description: result.description,
      location: result.location,
      start: result.startDate.toISOString(),
      end: result.endDate.toISOString(),
      timezone: result.timezone,
      isAllDay: result.isAllDay,
      type: result.eventType,
      eventType: result.eventType,
      status: result.eventStatus,
      eventStatus: result.eventStatus,
      priority: result.priority,
      color: result.color,
      schoolColor: result.color,
      completionStatus: result.completionStatus,
      isSystemGenerated: result.isSystemGenerated,
      hasReminders: result.hasReminders,
      school: result.university?.universityName || "General",
      universityId: result.universityId,
      program: result.program?.programName,
      programId: result.programId,
      reminders: finalReminders,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Calendar event updated successfully",
      data: transformedResult,
    });
  } catch (error) {
    console.error("Calendar API PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update calendar event",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE ENDPOINT - Delete Calendar Event
// ========================================
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    
    const finalEmail = userEmail || session?.user?.email;
    
    if (!finalEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: finalEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existingEvent.userId !== user.id) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Calendar event deleted successfully",
    });
  } catch (error) {
    console.error("Calendar API DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete calendar event",
        message: error.message,
      },
      { status: 500 }
    );
  }
}