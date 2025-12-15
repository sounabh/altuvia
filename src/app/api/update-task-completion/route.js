// src/app/api/update-task-completion/route.js

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { taskId, isCompleted, userId } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    // Update task completion status
    const updatedTask = await prisma.timelineTask.update({
      where: { 
        id: taskId 
      },
      data: {
        isCompleted: isCompleted,
        status: isCompleted ? 'completed' : 'pending',
        completedAt: isCompleted ? new Date() : null
      }
    });

    // Get timeline to recalculate progress
    const timeline = await prisma.aITimeline.findUnique({
      where: { id: updatedTask.timelineId },
      include: {
        phases: {
          include: {
            tasks: true
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

      // Update timeline progress
      await prisma.aITimeline.update({
        where: { id: timeline.id },
        data: {
          overallProgress: newProgress
        }
      });

      // Update phase completion percentages
      for (const phase of timeline.phases) {
        const phaseTotalTasks = phase.tasks.length;
        const phaseCompletedTasks = phase.tasks.filter(t => t.isCompleted).length;
        const phaseProgress = phaseTotalTasks > 0 
          ? (phaseCompletedTasks / phaseTotalTasks) * 100 
          : 0;

        await prisma.timelinePhase.update({
          where: { id: phase.id },
          data: {
            completionPercentage: phaseProgress,
            status: phaseProgress === 100 ? 'completed' : 
                    phaseProgress > 0 ? 'in-progress' : 'upcoming'
          }
        });
      }

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
    console.error("Error updating task completion:", error);
    return NextResponse.json(
      {
        error: "Failed to update task completion",
        details: error.message
      },
      { status: 500 }
    );
  }
}