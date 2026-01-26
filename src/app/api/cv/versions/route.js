// ================================================================================
// FILE: app/api/cv/versions/route.js
// PURPOSE: Fetch all CV versions for a user across all their CVs
// ================================================================================

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

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
          email: userEmail,
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
    // 3. FETCH ALL VERSIONS WITH SNAPSHOTS
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
        
        // ✅ ADD THESE SNAPSHOT FIELDS
        personalInfoSnapshot: true,
        educationSnapshot: true,
        experienceSnapshot: true,
        projectsSnapshot: true,
        skillsSnapshot: true,
        achievementsSnapshot: true,
        volunteerSnapshot: true,
        
        // Fetch only needed CV fields
        cv: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { isBookmarked: 'desc' },
        { createdAt: 'desc' },
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
      isCurrentCV: version.cvId === cvId,
      
      // ✅ INCLUDE SNAPSHOTS IN RESPONSE
      personalInfoSnapshot: version.personalInfoSnapshot,
      educationSnapshot: version.educationSnapshot,
      experienceSnapshot: version.experienceSnapshot,
      projectsSnapshot: version.projectsSnapshot,
      skillsSnapshot: version.skillsSnapshot,
      achievementsSnapshot: version.achievementsSnapshot,
      volunteerSnapshot: version.volunteerSnapshot,
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