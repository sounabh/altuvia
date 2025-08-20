import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

/**
 * GET /api/universities
 * 
 * Fetches a filtered and optimized list of universities with search, GMAT, and ranking filters.
 * Includes primary image and saved state for the current user.
 * 
 * @param {Request} request - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with university list
 */
export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const gmat = searchParams.get('gmat') || 'all';
    const ranking = searchParams.get('ranking') || 'all';
    
    // Build optimized WHERE clause - filter at DB level
    const whereClause = { AND: [] };
    
    /**
     * Search filter
     * Matches against university name, city, or country (case-insensitive)
     */
    if (search) {
      whereClause.AND.push({
        OR: [
          { universityName: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { country: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    /**
     * GMAT filter
     * Applies range-based filtering on gmatAverageScore
     */
    if (gmat !== 'all') {
      const gmatFilter = {};
      switch (gmat) {
        case '700+': gmatFilter.gmatAverageScore = { gte: 700 }; break;
        case '650-699': gmatFilter.gmatAverageScore = { gte: 650, lte: 699 }; break;
        case '600-649': gmatFilter.gmatAverageScore = { gte: 600, lte: 649 }; break;
        case 'below-600': gmatFilter.gmatAverageScore = { lt: 600, not: null }; break;
      }
      if (Object.keys(gmatFilter).length > 0) {
        whereClause.AND.push(gmatFilter);
      }
    }

    /**
     * Ranking filter
     * Filters by FT Global Ranking ranges
     */
    if (ranking !== 'all') {
      const rankFilter = {};
      switch (ranking) {
        case 'top-10': rankFilter.ftGlobalRanking = { lte: 10, not: null }; break;
        case 'top-50': rankFilter.ftGlobalRanking = { lte: 50, not: null }; break;
        case 'top-100': rankFilter.ftGlobalRanking = { lte: 100, not: null }; break;
        case '100+': rankFilter.ftGlobalRanking = { gt: 100 }; break;
      }
      if (Object.keys(rankFilter).length > 0) {
        whereClause.AND.push(rankFilter);
      }
    }

    /**
     * Prisma query - fetch only needed fields and related data
     */
    const universities = await prisma.university.findMany({
      where: whereClause.AND.length > 0 ? whereClause : undefined,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        savedByUsers: {
          where: { email: session?.user?.email },
          select: { id: true },
        },
      },
      take: 50,
      orderBy: [
        { ftGlobalRanking: 'asc' },
        { universityName: 'asc' }
      ],
    });

    // Handle empty results
    if (universities.length === 0) {
      return NextResponse.json({
        message: "No universities found",
        data: [],
        count: 0
      });
    }

    /**
     * Transform DB records to API response format
     */
// In your /api/universities route


    const transformed = universities.map(u => ({
      id: u.id,
      slug: u.slug,
      name: u.universityName,
      location: `${u.city}, ${u.country}`,
      image: u.images[0]?.imageUrl || '/default-university.jpg',
      rank: u.ftGlobalRanking ? `#${u.ftGlobalRanking}` : 'N/A',
      gmatAvg: u.gmatAverageScore || 0,
      acceptRate: u.acceptanceRate || 0,
      tuitionFee: u.tuitionFees ? `$${u.tuitionFees.toLocaleString()}` : 'N/A',
      applicationFee: u.additionalFees ? `$${u.additionalFees.toLocaleString()}` : 'N/A',
      pros: u.whyChooseHighlights || [],
      cons: [], // No admissionRequirements in schema
      savedByUsers: u.savedByUsers
    }));

    // Return JSON response with caching headers
    return NextResponse.json({
      data: transformed,
      count: transformed.length,
      total: transformed.length
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch universities", data: [], count: 0 },
      { status: 500 }
    );
  }
}
