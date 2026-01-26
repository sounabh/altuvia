// ================================================================================
// FILE: app/api/cv/versions/[versionId]/route.js
// PURPOSE: Delete a specific CV version and its independent data
// LOGIC: Each version (including V1) is independent. Deleting last version = delete entire CV
// ================================================================================

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
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