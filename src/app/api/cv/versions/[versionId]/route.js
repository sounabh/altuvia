// ================================================================================
// FILE: app/api/cv/versions/[versionId]/route.js
// PURPOSE: Fetch or delete a specific CV version
// LOGIC: Each version (including V1) is independent. Deleting last version = delete entire CV
// ================================================================================

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/cv/versions/[versionId]
 * Fetches a specific CV version by its ID
 */
export async function GET(request, { params }) {
  try {
    const { versionId } = params;
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");

    // Validate required parameters
    if (!versionId) {
      return NextResponse.json(
        { success: false, error: "Version ID is required" },
        { status: 400 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "User email is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching version ${versionId} for user ${userEmail}`);

    // Fetch the version with CV data for authorization check
    const version = await prisma.cVVersion.findUnique({
      where: { id: versionId },
      include: {
        cv: {
          include: {
            user: true,
          },
        },
      },
    });

    // Check if version exists
    if (!version) {
      return NextResponse.json(
        { success: false, error: "Version not found" },
        { status: 404 }
      );
    }

    // Verify user owns this CV version
    if (version.cv.user.email !== userEmail) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    console.log(`✅ Version ${version.versionLabel} found and authorized`);

    // Return the version data
    return NextResponse.json({
      success: true,
      version: {
        id: version.id,
        cvId: version.cvId,
        cvSlug: version.cv.slug,
        versionNumber: version.versionNumber,
        versionLabel: version.versionLabel,
        changeDescription: version.changeDescription,
        isBookmarked: version.isBookmarked,
        isCurrentCV: version.isCurrentCV,
        templateId: version.templateId,
        colorScheme: version.colorScheme,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt,
        // Snapshots (these might be JSON strings or objects)
        personalInfoSnapshot: version.personalInfoSnapshot,
        educationSnapshot: version.educationSnapshot,
        experienceSnapshot: version.experienceSnapshot,
        projectsSnapshot: version.projectsSnapshot,
        skillsSnapshot: version.skillsSnapshot,
        achievementsSnapshot: version.achievementsSnapshot,
        volunteerSnapshot: version.volunteerSnapshot,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching version:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch version",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cv/versions/[versionId]
 * Deletes a CV version and its associated data
 * - Each version stores its own data in snapshots (JSON)
 * - Deleting any version removes ONLY that version's data
 * - If it's the LAST version, the entire CV container is deleted
 */
export async function DELETE(request, { params }) {
  try {
    const { versionId } = params;

    // ========================================
    // 1. GET VERSION INFO
    // ========================================
    const version = await prisma.cVVersion.findUnique({
      where: { id: versionId },
      select: { 
        id: true,
        cvId: true,
        versionNumber: true,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    const { cvId, versionNumber } = version;

    // ========================================
    // 2. COUNT TOTAL VERSIONS FOR THIS CV
    // ========================================
    const totalVersions = await prisma.cVVersion.count({
      where: { cvId },
    });

    console.log(`📊 CV ${cvId} has ${totalVersions} version(s). Deleting version ${versionNumber}...`);

    // ========================================
    // 3. DELETE THE VERSION
    // ========================================
    // Since your snapshots store all data as JSON within CVVersion,
    // deleting the CVVersion record automatically removes all that version's data
    
    await prisma.cVVersion.delete({
      where: { id: versionId },
    });

    console.log(`✅ Version ${versionNumber} deleted`);

    // ========================================
    // 4. CHECK IF THIS WAS THE LAST VERSION
    // ========================================
    if (totalVersions === 1) {
      // This was the only version - delete the entire CV container
      console.log(`🗑️ Last version deleted - removing entire CV container ${cvId}`);
      
      await prisma.$transaction([
        // Delete all CV-level metadata
        prisma.cVExport.deleteMany({ where: { cvId } }),
        prisma.cVAIAnalysis.deleteMany({ where: { cvId } }),
        
        // Delete the CV container itself
        prisma.cV.delete({ where: { id: cvId } }),
      ]);

      return NextResponse.json({
        success: true,
        message: `Version ${versionNumber} and entire CV deleted (no versions remaining)`,
        cvDeleted: true,
        deletedVersionNumber: versionNumber,
        remainingVersions: 0,
      });
    }

    // ========================================
    // 5. VERSION DELETED, CV STILL HAS OTHER VERSIONS
    // ========================================
    const remainingVersions = totalVersions - 1;
    
    console.log(`✅ Version ${versionNumber} deleted. ${remainingVersions} version(s) remaining`);

    return NextResponse.json({
      success: true,
      message: `Version ${versionNumber} deleted successfully`,
      cvDeleted: false,
      deletedVersionNumber: versionNumber,
      remainingVersions,
    });

  } catch (error) {
    console.error("❌ Delete version error:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete version",
        details: error.message 
      },
      { status: 500 }
    );
  }
}