// ================================================================================
// FILE: app/api/cv/versions/route.js
// PURPOSE: Fetch all CV versions for a user across all their CVs
// ================================================================================

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

/**
 * Retrieves all CV versions belonging to the authenticated user
 * @param {Request} request - Contains userEmail and optional cvId as query params
 * @returns {Response} List of all versions with CV metadata
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Single query to get CV IDs (select only needed fields)
 * - Efficient ordering with compound index support
 */
export async function GET(request) {
  try {
    // ========================================
    // 1. AUTHENTICATE USER
    // ========================================
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail") || session?.user?.email;
    const cvId = searchParams.get("cvId");

    if (!userEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // ========================================
    // 2. OPTIMIZED: Get User's CVs in Single Query
    // ========================================
    const userCVs = await prisma.cV.findMany({
      where: { 
        user: {
          email: userEmail, // Filter by email directly
        }
      },
      select: { 
        id: true, 
        title: true, 
        slug: true 
      },
    });

    if (userCVs.length === 0) {
      return NextResponse.json({
        success: true,
        versions: [],
        totalVersions: 0,
      });
    }

    const cvIds = userCVs.map(cv => cv.id);

    // ========================================
    // 3. FETCH ALL VERSIONS FROM ALL CVs
    // ========================================
    const versions = await prisma.cVVersion.findMany({
      where: {
        cvId: {
          in: cvIds,
        },
      },
      select: {
        id: true,
        cvId: true,
        versionNumber: true,
        versionLabel: true,
        changeDescription: true,
        isBookmarked: true,
        templateId: true,
        colorScheme: true,
        createdAt: true,
        // Fetch only needed CV fields
        cv: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { isBookmarked: 'desc' }, // Bookmarked versions first
        { createdAt: 'desc' },    // Then by most recent
      ],
    });

    // ========================================
    // 4. ENRICH VERSIONS WITH CV INFO
    // ========================================
    const enrichedVersions = versions.map(version => ({
      id: version.id,
      cvId: version.cvId,
      versionNumber: version.versionNumber,
      versionLabel: version.versionLabel,
      changeDescription: version.changeDescription,
      isBookmarked: version.isBookmarked,
      templateId: version.templateId,
      colorScheme: version.colorScheme,
      createdAt: version.createdAt,
      cvTitle: version.cv.title,
      cvSlug: version.cv.slug,
      isCurrentCV: version.cvId === cvId, // Flag if version belongs to current CV
    }));

    // ========================================
    // 5. RETURN VERSIONS LIST
    // ========================================
    return NextResponse.json({
      success: true,
      versions: enrichedVersions,
      totalVersions: enrichedVersions.length,
    });

  } catch (error) {
    console.error("Fetch versions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}