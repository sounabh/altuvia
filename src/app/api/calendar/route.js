// app/api/calendar/route.js
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

// ========================================
// GET ENDPOINT - Fetch Calendar Events
// ========================================

/**
 * GET endpoint for fetching calendar events with filtering capabilities
 * Supports filtering by date range, event type, university, program, and more
 * Returns transformed events with related data for frontend consumption
 * 
 * @param {Request} request - The incoming request object
 * @returns {NextResponse} JSON response with events or error
 */
export async function GET(request) {
  try {
    // Get current user session for authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Extract query parameters from URL for filtering
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || session.user.email;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eventType = searchParams.get('eventType') || 'all';
    const universityId = searchParams.get('universityId');
    const programId = searchParams.get('programId');
    const includeSystemEvents = searchParams.get('includeSystemEvents') !== 'false';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined;
    const offset = parseInt(searchParams.get('offset') || '0');

    // First, get the user by email to get userId for database queries
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Build filter conditions using userId instead of userEmail
    const where = {
      userId: user.id,
      isVisible: true,
      ...(eventType && eventType !== 'all' && { eventType }),
      ...(universityId && { universityId }),
      ...(programId && { programId })
    };

    // Add date range filter to capture events that overlap with the specified range
    if (startDate && endDate) {
      where.OR = [
        // Events that start within the range
        {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        // Events that end within the range
        {
          endDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        // Events that span the entire range
        {
          AND: [
            { startDate: { lte: new Date(startDate) } },
            { endDate: { gte: new Date(endDate) } }
          ]
        }
      ];
    }

    // Filter system events if requested
    if (!includeSystemEvents) {
      where.isSystemGenerated = false;
    }

    // Fetch calendar events from database with all related data
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
            city: true
          }
        },
        program: {
          select: {
            id: true,
            programName: true,
            programSlug: true,
            degreeType: true
          }
        },
        application: {
          select: {
            id: true,
            applicationStatus: true,
            firstName: true,
            lastName: true
          }
        },
        admission: {
          select: {
            id: true,
            acceptanceRate: true,
            applicationFee: true
          }
        },
        intake: {
          select: {
            id: true,
            intakeName: true,
            intakeType: true,
            intakeYear: true
          }
        },
        admissionDeadline: {
          select: {
            id: true,
            deadlineType: true,
            title: true,
            priority: true
          }
        },
        interview: {
          select: {
            id: true,
            interviewType: true,
            interviewStatus: true,
            duration: true,
            location: true,
            meetingLink: true
          }
        },
        scholarship: {
          select: {
            id: true,
            scholarshipName: true,
            amount: true,
            currency: true
          }
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
            reminderMessage: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    /**
     * Transform calendar events for frontend consumption
     * Flattens related data and adds computed properties
     */
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      start: event.startDate.toISOString(),
      end: event.endDate.toISOString(),
      timezone: event.timezone,
      isAllDay: event.isAllDay,
      type: event.eventType,
      eventType: event.eventType, // Keep both for compatibility
      status: event.eventStatus,
      eventStatus: event.eventStatus, // Keep both for compatibility
      priority: event.priority,
      color: event.color || getDefaultColor(event.eventType),
      completionStatus: event.completionStatus,
      completedAt: event.completedAt?.toISOString(),
      completionNotes: event.completionNotes,
      isSystemGenerated: event.isSystemGenerated,
      hasReminders: event.hasReminders,
      
      // Related data
      school: event.university?.universityName || 'General',
      universityId: event.universityId,
      universitySlug: event.university?.slug,
      country: event.university?.country,
      city: event.university?.city,
      program: event.program?.programName,
      programId: event.programId,
      programSlug: event.program?.programSlug,
      degreeType: event.program?.degreeType,
      
      // Application context
      applicationId: event.applicationId,
      applicationStatus: event.application?.applicationStatus,
      applicantName: event.application ? 
        `${event.application.firstName} ${event.application.lastName}` : null,
      
      // Additional context
      deadlineType: event.admissionDeadline?.deadlineType,
      interviewType: event.interview?.interviewType,
      interviewDuration: event.interview?.duration,
      interviewLocation: event.interview?.location || event.interview?.meetingLink,
      scholarshipAmount: event.scholarship?.amount,
      scholarshipCurrency: event.scholarship?.currency,
      
      // Reminders
      reminders: event.reminders,
      reminderCount: event.reminders?.length || 0,
      
      // Metadata
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString()
    }));

    // Return successful response with pagination info
    return NextResponse.json({
      success: true,
      data: transformedEvents,
      count: transformedEvents.length,
      total: transformedEvents.length,
      pagination: {
        offset,
        limit: limit || transformedEvents.length,
        hasMore: limit ? transformedEvents.length === limit : false
      }
    });

  } catch (error) {
    console.error("Calendar API GET error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch calendar events",
        message: error.message,
        data: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

// ========================================
// POST ENDPOINT - Create New Calendar Event
// ========================================

/**
 * POST endpoint for creating new calendar events
 * Supports creating events with optional reminders
 * Validates input data and returns the created event
 * 
 * @param {Request} request - The incoming request object
 * @returns {NextResponse} JSON response with created event or error
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user ID from email for database association
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse request body for event data
    const eventData = await request.json();
    
    const {
      title,
      description,
      location,
      start,
      end,
      timezone = 'UTC',
      isAllDay = false,
      eventType,
      eventStatus = 'pending',
      priority = 'medium',
      color,
      universityId,
      programId,
      applicationId,
      admissionId,
      intakeId,
      admissionDeadlineId,
      interviewId,
      scholarshipId,
      reminders = [],
      completionStatus = 'pending'
    } = eventData;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Validate date order and format
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create the calendar event with reminders in a transaction with increased timeout
    const result = await prisma.$transaction(async (tx) => {
      // Create the main event
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
          color: color || getDefaultColor(eventType),
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
          isVisible: true
        },
        include: {
          university: {
            select: {
              universityName: true,
              slug: true
            }
          },
          program: {
            select: {
              programName: true,
              programSlug: true
            }
          }
        }
      });

      // Create reminders if provided
      if (reminders.length > 0) {
        const reminderData = reminders.map(reminder => {
          const reminderTime = reminder.time || 1440; // Default 24 hours
          const scheduledFor = new Date(startDate.getTime() - (reminderTime * 60 * 1000));
          
          return {
            eventId: event.id,
            userId: user.id,
            reminderType: reminder.type || 'email',
            reminderTime,
            reminderMessage: reminder.message || `Reminder: ${title}`,
            scheduledFor,
            isActive: true
          };
        });

        await tx.eventReminder.createMany({
          data: reminderData
        });
      }

      return event;
    }, {
      timeout: 15000, // Increased timeout to 15 seconds
      maxWait: 5000, // Maximum time to wait for a connection from the pool
    });

    // Transform the result for frontend
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
      completionStatus: result.completionStatus,
      isSystemGenerated: result.isSystemGenerated,
      hasReminders: result.hasReminders,
      school: result.university?.universityName || 'General',
      universityId: result.universityId,
      program: result.program?.programName,
      programId: result.programId,
      reminders: reminders,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      message: "Calendar event created successfully",
      data: transformedResult
    }, { status: 201 });

  } catch (error) {
    console.error("Calendar API POST error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create calendar event",
        message: error.message
      },
      { status: 500 }
    );
  }
}

// ========================================
// PUT ENDPOINT - Update Calendar Event (Optimized)
// ========================================

/**
 * PUT endpoint for updating calendar events
 * SOLUTION 1: Optimized with increased timeout and batch operations
 */
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user ID from email for permission checking
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const updateData = await request.json();
    
    const { id, reminders, ...eventData } = updateData;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if event exists and user has permission
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check permissions (user can only edit their own events)
    if (existingEvent.userId !== user.id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Process the update data with validation
    const processedData = {};
    
    // Handle field mapping and validation
    if (eventData.title !== undefined) {
      if (!eventData.title.trim()) {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
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
          { error: 'Invalid start date' },
          { status: 400 }
        );
      }
      processedData.startDate = startDate;
    }

    if (eventData.end !== undefined) {
      const endDate = new Date(eventData.end);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date' },
          { status: 400 }
        );
      }
      processedData.endDate = endDate;
    }

    // Validate date order if both dates are being updated
    const finalStartDate = processedData.startDate || existingEvent.startDate;
    const finalEndDate = processedData.endDate || existingEvent.endDate;
    
    if (finalStartDate >= finalEndDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Map other fields
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
    
    if (eventData.color !== undefined) {
      processedData.color = eventData.color;
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

    // Update reminders flag
    if (reminders !== undefined) {
      processedData.hasReminders = Array.isArray(reminders) && reminders.length > 0;
    }

    // Set update timestamp
    processedData.updatedAt = new Date();

    // SOLUTION 1: Use transaction with increased timeout and optimized queries
    const result = await prisma.$transaction(async (tx) => {
      // Update the main event with minimal includes for speed
      const updatedEvent = await tx.calendarEvent.update({
        where: { id },
        data: processedData,
        include: {
          university: {
            select: {
              universityName: true,
              slug: true
            }
          },
          program: {
            select: {
              programName: true,
              programSlug: true
            }
          }
        }
      });

      // Handle reminders separately for better performance
      if (reminders && Array.isArray(reminders)) {
        // Use a single delete operation
        await tx.eventReminder.deleteMany({
          where: { eventId: id }
        });

        // Create new reminders in batch
        if (reminders.length > 0) {
          const reminderData = reminders.map(reminder => {
            const reminderTime = reminder.time || 1440;
            const scheduledFor = new Date(
              (processedData.startDate || existingEvent.startDate).getTime() - (reminderTime * 60 * 1000)
            );
            
            return {
              eventId: id,
              userId: user.id,
              reminderType: reminder.type || 'email',
              reminderTime,
              reminderMessage: reminder.message || `Reminder: ${updatedEvent.title}`,
              scheduledFor,
              isActive: true
            };
          });

          // Single batch insert
          await tx.eventReminder.createMany({
            data: reminderData
          });
        }
      }

      return updatedEvent;
    }, {
      timeout: 15000, // Increased timeout to 15 seconds
      maxWait: 5000,  // Maximum time to wait for a connection
    });

    // Fetch reminders separately if needed (outside transaction)
    const finalReminders = reminders && Array.isArray(reminders) ? 
      await prisma.eventReminder.findMany({
        where: { eventId: id, isActive: true }
      }) : [];

    // Transform the result for frontend
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
      completionStatus: result.completionStatus,
      isSystemGenerated: result.isSystemGenerated,
      hasReminders: result.hasReminders,
      school: result.university?.universityName || 'General',
      universityId: result.universityId,
      program: result.program?.programName,
      programId: result.programId,
      reminders: finalReminders,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      message: "Calendar event updated successfully",
      data: transformedResult
    });

  } catch (error) {
    console.error("Calendar API PUT error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update calendar event",
        message: error.message
      },
      { status: 500 }
    );
  }
}

// ========================================
// ALTERNATIVE PUT ENDPOINT - Without Transaction
// ========================================

/**
 * SOLUTION 2: Alternative PUT implementation without transactions
 * Use this if you still experience timeout issues
 */
export async function PUT_ALTERNATIVE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const updateData = await request.json();
    const { id, reminders, ...eventData } = updateData;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if event exists and user has permission
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existingEvent.userId !== user.id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Process update data (same validation as before)
    const processedData = {};
    
    if (eventData.title !== undefined) {
      if (!eventData.title.trim()) {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      processedData.title = eventData.title.trim();
    }
    
    // ... (other field processing code same as above)

    // Update reminders flag
    if (reminders !== undefined) {
      processedData.hasReminders = Array.isArray(reminders) && reminders.length > 0;
    }

    processedData.updatedAt = new Date();

    // SOLUTION 2: Update without transaction - separate operations
    try {
      // 1. Update the main event first
      const updatedEvent = await prisma.calendarEvent.update({
        where: { id },
        data: processedData,
        include: {
          university: {
            select: {
              universityName: true,
              slug: true
            }
          },
          program: {
            select: {
              programName: true,
              programSlug: true
            }
          }
        }
      });

      // 2. Handle reminders separately (if provided)
      if (reminders && Array.isArray(reminders)) {
        // Delete existing reminders
        await prisma.eventReminder.deleteMany({
          where: { eventId: id }
        });

        // Create new reminders
        if (reminders.length > 0) {
          const reminderData = reminders.map(reminder => {
            const reminderTime = reminder.time || 1440;
            const scheduledFor = new Date(
              (processedData.startDate || existingEvent.startDate).getTime() - (reminderTime * 60 * 1000)
            );
            
            return {
              eventId: id,
              userId: user.id,
              reminderType: reminder.type || 'email',
              reminderTime,
              reminderMessage: reminder.message || `Reminder: ${updatedEvent.title}`,
              scheduledFor,
              isActive: true
            };
          });

          await prisma.eventReminder.createMany({
            data: reminderData
          });
        }
      }

      // 3. Fetch updated reminders
      const finalReminders = await prisma.eventReminder.findMany({
        where: { eventId: id, isActive: true }
      });

      // Transform and return result
      const transformedResult = {
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        location: updatedEvent.location,
        start: updatedEvent.startDate.toISOString(),
        end: updatedEvent.endDate.toISOString(),
        timezone: updatedEvent.timezone,
        isAllDay: updatedEvent.isAllDay,
        type: updatedEvent.eventType,
        eventType: updatedEvent.eventType,
        status: updatedEvent.eventStatus,
        eventStatus: updatedEvent.eventStatus,
        priority: updatedEvent.priority,
        color: updatedEvent.color,
        completionStatus: updatedEvent.completionStatus,
        isSystemGenerated: updatedEvent.isSystemGenerated,
        hasReminders: updatedEvent.hasReminders,
        school: updatedEvent.university?.universityName || 'General',
        universityId: updatedEvent.universityId,
        program: updatedEvent.program?.programName,
        programId: updatedEvent.programId,
        reminders: finalReminders,
        createdAt: updatedEvent.createdAt.toISOString(),
        updatedAt: updatedEvent.updatedAt.toISOString()
      };

      return NextResponse.json({
        success: true,
        message: "Calendar event updated successfully",
        data: transformedResult
      });

    } catch (updateError) {
      // If something fails during the update process, we might have partial updates
      console.error("Update process error:", updateError);
      throw updateError;
    }

  } catch (error) {
    console.error("Calendar API PUT error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update calendar event",
        message: error.message
      },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE ENDPOINT - Delete Calendar Event
// ========================================

/**
 * DELETE endpoint for deleting calendar events
 * Validates permissions before deletion
 * Uses cascading delete for associated reminders
 * 
 * @param {Request} request - The incoming request object
 * @returns {NextResponse} JSON response with success status or error
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user ID from email for permission checking
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if event exists and user has permission
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check permissions (user can only delete their own events)
    if (existingEvent.userId !== user.id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Delete event (cascade will handle reminders)
    await prisma.calendarEvent.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Calendar event deleted successfully"
    });

  } catch (error) {
    console.error("Calendar API DELETE error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete calendar event",
        message: error.message
      },
      { status: 500 }
    );
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get default color for event types
 * Provides consistent color coding for different event types
 * 
 * @param {string} eventType - The type of event
 * @returns {string} Hex color code for the event type
 */
function getDefaultColor(eventType) {
  const colors = {
    deadline: '#ef4444',    // Red
    interview: '#3b82f6',   // Blue
    task: '#10b981',        // Green
    workshop: '#f59e0b',    // Yellow/Orange
    meeting: '#8b5cf6',     // Purple
    scholarship: '#8b5cf6', // Purple
    reminder: '#6b7280'     // Gray
  };

  return colors[eventType] || colors.task;
}

// ========================================
// PRISMA CLIENT CONFIGURATION (Optional)
// ========================================

/**
 * If you're still experiencing timeout issues, you can also configure
 * your Prisma client with connection pooling settings.
 * Add this to your lib/prisma.js file:
 * 
 * export const prisma = new PrismaClient({
 *   datasources: {
 *     db: {
 *       url: process.env.DATABASE_URL + "?connection_limit=10&pool_timeout=20"
 *     }
 *   }
 * });
 * 
 * Or if using connection string directly:
 * DATABASE_URL="postgresql://user:pass@host:port/db?connection_limit=10&pool_timeout=20"
 */