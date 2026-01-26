// ================================================================================
// FILE: app/api/cv/versions/duplicate/route.js
// PURPOSE: Duplicate an existing CV version with new version number
// ================================================================================

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Creates a duplicate of an existing CV version
 * @param {Request} request - Contains versionId to duplicate
 * @returns {Response} Newly created version data
 */
export async function POST(request) {
  try {
    // ========================================
    // 1. EXTRACT & VALIDATE VERSION ID
    // ========================================
    const { versionId } = await request.json();

    if (!versionId) {
      return NextResponse.json(
        { error: "Version ID is required" },
        { status: 400 }
      );
    }

    // ========================================
    // 2. FETCH ORIGINAL VERSION
    // ========================================
    const originalVersion = await prisma.cVVersion.findUnique({
      where: { id: versionId },
    });

    if (!originalVersion) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    // ========================================
    // 3. GET NEXT VERSION NUMBER
    // ========================================
    const lastVersion = await prisma.cVVersion.findFirst({
      where: { cvId: originalVersion.cvId },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    // ========================================
    // 4. CREATE DUPLICATE VERSION
    // ========================================
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
        isBookmarked: false, // Reset bookmark status
      },
    });

    // ========================================
    // 5. RETURN DUPLICATED VERSION
    // ========================================
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