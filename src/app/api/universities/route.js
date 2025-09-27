import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

/**
 * GET /api/universities
 *
 * Fetches a filtered and paginated list of universities with search, GMAT, and ranking filters.
 * Includes primary image and saved state for the current user.
 *
 * Query Parameters:
 * - search: string - Search term for university name, city, or country
 * - gmat: string - GMAT filter (all, 700+, 650-699, 600-649, below-600)
 * - ranking: string - Ranking filter (all, top-10, top-50, top-100, 100+)
 * - email: string - User email for saved universities
 * - page: number - Page number (default: 1)
 * - limit: number - Items per page (default: 12, max: 50)
 *
 * @param {Request} request - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with university list and pagination info
 */
export async function GET(request) {
  const session = await getServerSession(authOptions);

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const gmat = searchParams.get("gmat") || "all";
    const ranking = searchParams.get("ranking") || "all";
    const email = searchParams.get("email"); // Get email from query params
    
    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "6")));
    const skip = (page - 1) * limit;

    // Build optimized WHERE clause - filter at DB level
    const whereClause = { AND: [] };

    /**
     * Search filter
     * Matches against university name, city, or country (case-insensitive)
     */
    if (search) {
      whereClause.AND.push({
        OR: [
          { universityName: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { country: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    /**
     * GMAT filter
     * Applies range-based filtering on gmatAverageScore
     */
    if (gmat !== "all") {
      const gmatFilter = {};
      switch (gmat) {
        case "700+":
          gmatFilter.gmatAverageScore = { gte: 700 };
          break;
        case "650-699":
          gmatFilter.gmatAverageScore = { gte: 650, lte: 699 };
          break;
        case "600-649":
          gmatFilter.gmatAverageScore = { gte: 600, lte: 649 };
          break;
        case "below-600":
          gmatFilter.gmatAverageScore = { lt: 600, not: null };
          break;
      }
      if (Object.keys(gmatFilter).length > 0) {
        whereClause.AND.push(gmatFilter);
      }
    }

    /**
     * Ranking filter
     * Filters by FT Global Ranking ranges
     */
    if (ranking !== "all") {
      const rankFilter = {};
      switch (ranking) {
        case "top-10":
          rankFilter.ftGlobalRanking = { lte: 10, not: null };
          break;
        case "top-50":
          rankFilter.ftGlobalRanking = { lte: 50, not: null };
          break;
        case "top-100":
          rankFilter.ftGlobalRanking = { lte: 100, not: null };
          break;
        case "100+":
          rankFilter.ftGlobalRanking = { gt: 100 };
          break;
      }
      if (Object.keys(rankFilter).length > 0) {
        whereClause.AND.push(rankFilter);
      }
    }

    // Determine which email to use for checking saved universities
    // Priority: session email > query param email > null
    const userEmail = session?.user?.email || email || null;

    // Build final where condition
    const finalWhereClause = whereClause.AND.length > 0 ? whereClause : undefined;

    /**
     * Get total count for pagination
     * Run this query first to calculate total pages
     */
    const totalCount = await prisma.university.count({
      where: finalWhereClause,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Handle empty results early
    if (totalCount === 0) {
      return NextResponse.json({
        message: "No universities found",
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    /**
     * Prisma query - fetch only needed fields and related data with pagination
     */
    const universities = await prisma.university.findMany({
      where: finalWhereClause,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        savedByUsers: userEmail ? {
          where: { email: userEmail },
          select: { id: true },
        } : false, // Don't include savedByUsers if no email available
      },
      skip,
      take: limit,
      orderBy: [
        { ftGlobalRanking: { sort: "asc", nulls: "last" } }, // Rank nulls last
        { universityName: "asc" }
      ],
    });

    /**
     * Transform DB records to API response format
     */
    const transformed = universities.map((u) => ({
      id: u.id,
      slug: u.slug,
      name: u.universityName,
      location: `${u.city}, ${u.country}`,
      image: u.images[0]?.imageUrl || "/default-university.jpg",
      rank: u.ftGlobalRanking || "N/A",
      gmatAvg: u.gmatAverageScore || "N/A",
      acceptRate: u.acceptanceRate || "N/A",
      tuitionFee: u.tuitionFees ? `$${u.tuitionFees.toLocaleString()}` : "N/A",
      applicationFee: u.additionalFees
        ? `$${u.additionalFees.toLocaleString()}`
        : "N/A",
      pros: u.whyChooseHighlights || [],
      cons: [], // No admissionRequirements in schema
      isAdded: u.savedByUsers?.length > 0 || false, // Transform to boolean with fallback
      savedByUsers: u.savedByUsers || [], // Keep original for debugging if needed
    }));

    // Build pagination metadata
    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      startIndex: skip + 1,
      endIndex: Math.min(skip + limit, totalCount),
    };

    // Return JSON response with caching headers
    return NextResponse.json(
      {
        data: transformed,
        pagination,
        // Legacy fields for backward compatibility
        count: transformed.length,
        total: totalCount,
      },
      {
        headers: {
          // Cache for 5 minutes, allow stale for 10 minutes
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          // Add pagination headers for debugging
          "X-Total-Count": totalCount.toString(),
          "X-Page": page.toString(),
          "X-Per-Page": limit.toString(),
          "X-Total-Pages": totalPages.toString(),
        },
      }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch universities", 
        data: [], 
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 12,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/universities
 * 
 * For bulk operations or advanced filtering (future use)
 */
export async function POST(request) {
  return NextResponse.json(
    { error: "POST method not implemented yet" },
    { status: 501 }
  );
}