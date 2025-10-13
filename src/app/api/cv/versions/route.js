import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request) {
  try {
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

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get all CVs belonging to the user
    const userCVs = await prisma.cV.findMany({
      where: { userId: user.id },
      select: { id: true, title: true, slug: true },
    });

    const cvIds = userCVs.map(cv => cv.id);

    // Get all versions from all user's CVs
    const versions = await prisma.cVVersion.findMany({
      where: {
        cvId: {
          in: cvIds,
        },
      },
      include: {
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

    // Add CV info to each version
    const enrichedVersions = versions.map(version => ({
      ...version,
      cvTitle: version.cv.title,
      cvSlug: version.cv.slug,
      isCurrentCV: version.cvId === cvId,
    }));

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