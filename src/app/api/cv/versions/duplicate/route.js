// app/api/cv/versions/duplicate/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { versionId } = await request.json();

    if (!versionId) {
      return NextResponse.json(
        { error: "Version ID is required" },
        { status: 400 }
      );
    }

    const originalVersion = await prisma.cVVersion.findUnique({
      where: { id: versionId },
    });

    if (!originalVersion) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    const lastVersion = await prisma.cVVersion.findFirst({
      where: { cvId: originalVersion.cvId },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    const duplicatedVersion = await prisma.cVVersion.create({
      data: {
        cvId: originalVersion.cvId,
        versionNumber: nextVersionNumber,
        versionLabel: `${originalVersion.versionLabel} (Copy)`,
        changeDescription: `Duplicated from v${originalVersion.versionNumber}`,
        personalInfoSnapshot: originalVersion.personalInfoSnapshot,
        educationSnapshot: originalVersion.educationSnapshot,
        experienceSnapshot: originalVersion.experienceSnapshot,
        projectsSnapshot: originalVersion.projectsSnapshot,
        skillsSnapshot: originalVersion.skillsSnapshot,
        achievementsSnapshot: originalVersion.achievementsSnapshot,
        volunteerSnapshot: originalVersion.volunteerSnapshot,
        templateId: originalVersion.templateId,
        colorScheme: originalVersion.colorScheme,
        isBookmarked: false,
      },
    });

    return NextResponse.json({
      success: true,
      version: duplicatedVersion,
    });
  } catch (error) {
    console.error("Duplicate version error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate version" },
      { status: 500 }
    );
  }
}