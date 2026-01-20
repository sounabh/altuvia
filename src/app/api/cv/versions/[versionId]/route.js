// app/api/cv/versions/[versionId]/route.js - DELETE
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  try {
    const { versionId } = params;

    // First, get the version to find its CV ID
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

    // Delete the version
    await prisma.cVVersion.delete({
      where: { id: versionId },
    });

    // Check how many versions remain for this CV
    const remainingVersionsCount = await prisma.cVVersion.count({
      where: { cvId: cvId },
    });

    // If no versions remain, delete the CV as well
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

    // Otherwise, just return success for version deletion
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