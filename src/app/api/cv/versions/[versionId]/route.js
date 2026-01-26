// ================================================================================
// FILE: app/api/cv/versions/[versionId]/route.js
// PURPOSE: Delete a specific CV version and CV if no versions remain
// ================================================================================

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Deletes a CV version and optionally the parent CV if no versions remain
 * @param {Request} request - HTTP request
 * @param {Object} params - Route parameters containing versionId
 * @returns {Response} Deletion status and CV deletion flag
 */
export async function DELETE(request, { params }) {
  try {
    // ========================================
    // 1. EXTRACT VERSION ID
    // ========================================
    const { versionId } = params;

    // ========================================
    // 2. FIND VERSION AND GET CV ID
    // ========================================
    const version = await prisma.cVVersion.findUnique({
      where: { id: versionId },
      select: { cvId: true },
    });

    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    const cvId = version.cvId;

    // ========================================
    // 3. DELETE THE VERSION
    // ========================================
    await prisma.cVVersion.delete({
      where: { id: versionId },
    });

    // ========================================
    // 4. CHECK REMAINING VERSIONS
    // ========================================
    const remainingVersionsCount = await prisma.cVVersion.count({
      where: { cvId: cvId },
    });

    // ========================================
    // 5. DELETE CV IF NO VERSIONS REMAIN
    // ========================================
    if (remainingVersionsCount === 0) {
      await prisma.cV.delete({
        where: { id: cvId },
      });

      return NextResponse.json({
        success: true,
        message: "Version and CV deleted (no versions remaining)",
        cvDeleted: true,
      });
    }

    // ========================================
    // 6. RETURN SUCCESS (CV STILL EXISTS)
    // ========================================
    return NextResponse.json({
      success: true,
      message: "Version deleted successfully",
      cvDeleted: false,
      remainingVersions: remainingVersionsCount,
    });

  } catch (error) {
    console.error("Delete version error:", error);
    return NextResponse.json(
      { error: "Failed to delete version" },
      { status: 500 }
    );
  }
}