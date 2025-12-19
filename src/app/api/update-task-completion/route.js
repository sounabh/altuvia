import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { taskId, isCompleted, userId } = body;

    // Validate inputs
    if (!taskId || typeof taskId !== 'string') {
      console.error('❌ Invalid task ID:', { taskId, type: typeof taskId });
      return NextResponse.json(
        { error: "Valid task ID (string CUID) is required" },
        { status: 400 }
      );
    }

    if (typeof isCompleted !== 'boolean') {
      return NextResponse.json(
        { error: "isCompleted must be a boolean" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    console.log('🔄 Updating task:', {
      taskId,
      isCompleted,
      userId
    });

    // ✅ Update task with transaction for consistency
    const updatedTask = await prisma.timelineTask.update({
      where: { id: taskId },
      data: {
        isCompleted: isCompleted,
        status: isCompleted ? 'completed' : 'pending',
        completedAt: isCompleted ? new Date() : null
      }
    });

    console.log('✅ Task updated in database:', {
      id: updatedTask.id,
      title: updatedTask.title?.substring(0, 40),
      isCompleted: updatedTask.isCompleted
    });

    // Get timeline for progress recalculation
    const timeline = await prisma.aITimeline.findUnique({
      where: { id: updatedTask.timelineId },
      include: {
        phases: {
          include: {
            tasks: {
              select: {
                id: true,
                isCompleted: true
              }
            }
          }
        }
      }
    });

    if (timeline) {
      // Calculate new progress
      let totalTasks = 0;
      let completedTasks = 0;

      timeline.phases.forEach(phase => {
        totalTasks += phase.tasks.length;
        completedTasks += phase.tasks.filter(t => t.isCompleted).length;
      });

      const newProgress = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0;

      console.log('📊 Progress update:', {
        completedTasks,
        totalTasks,
        progress: newProgress
      });

      // Update timeline and phase progress
      await prisma.$transaction([
        prisma.aITimeline.update({
          where: { id: timeline.id },
          data: {
            overallProgress: newProgress,
            lastRegeneratedAt: new Date()
          }
        }),
        ...timeline.phases.map(phase => {
          const phaseTotalTasks = phase.tasks.length;
          const phaseCompletedTasks = phase.tasks.filter(t => t.isCompleted).length;
          const phaseProgress = phaseTotalTasks > 0 
            ? (phaseCompletedTasks / phaseTotalTasks) * 100 
            : 0;

          return prisma.timelinePhase.update({
            where: { id: phase.id },
            data: {
              completionPercentage: phaseProgress,
              status: phaseProgress === 100 ? 'completed' : 
                      phaseProgress > 0 ? 'in-progress' : 'upcoming'
            }
          });
        })
      ]);

      return NextResponse.json({
        success: true,
        task: updatedTask,
        newProgress: newProgress,
        message: 'Task completion updated successfully'
      });
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: 'Task updated successfully'
    });

  } catch (error) {
    console.error("❌ Error updating task:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Task not found in database" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Failed to update task completion",
        details: error.message
      },
      { status: 500 }
    );
  }
}