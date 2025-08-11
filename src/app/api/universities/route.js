// app/api/universities/route.js
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

/**
 * GET endpoint for fetching universities with filtering capabilities
 * @param {Request} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response containing:
 * - Filtered universities data
 * - Count of filtered results
 * - Total available universities count
 * - Error messages if applicable
 */
export async function GET(request) {
  // Get current user session for saved status check
  const session = await getServerSession(authOptions);

  try {
    // Extract query parameters from URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const gmat = searchParams.get('gmat') || 'all';
    const ranking = searchParams.get('ranking') || 'all';

    /**
     * Fetch universities with:
     * - Primary image
     * - Saved status for current user
     */
    const universities = await prisma.university.findMany({
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        savedByUsers: {
          where: {
            email: session?.user.email,
          },
          select: {
            id: true,
          },
        },
      },
      take: 100,
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
     * Transform university data for frontend consumption:
     * - Format location strings
     * - Handle default images
     * - Format ranking display
     * - Format financial values
     * - Process pros/cons data
     */
    const transformed = universities.map(u => ({
      id: u.id,
      name: u.universityName,
      location: `${u.city}, ${u.country}`,
      image: u.images[0]?.imageUrl || '/default-university.jpg',
      rank: u.ftGlobalRanking ? `#${u.ftGlobalRanking}` : 'N/A',
      gmatAvg: u.gmatAverageScore || 0,
      acceptRate: u.acceptanceRate || 0,
      tuitionFee: u.tuitionFees ? `$${u.tuitionFees.toLocaleString()}` : 'N/A',
      applicationFee: u.additionalFees ? `$${u.additionalFees.toLocaleString()}` : 'N/A',
      pros: u.whyChooseHighlights || [],
      cons: u.admissionRequirements?.split('.').filter(Boolean) || [],
      savedByUsers: u.savedByUsers
    }));

    /**
     * Filter universities based on query parameters:
     * - Search term (name or location)
     * - GMAT score range
     * - University ranking range
     */
    const filtered = transformed.filter(u => {
      // Search filter (name or location)
      const matchesSearch = search === '' || 
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.location.toLowerCase().includes(search.toLowerCase());
        
      // GMAT score filter
      const matchesGmat = gmat === 'all' || (
        gmat === '700+' ? u.gmatAvg >= 700 :
        gmat === '650-699' ? u.gmatAvg >= 650 && u.gmatAvg <= 699 :
        gmat === '600-649' ? u.gmatAvg >= 600 && u.gmatAvg <= 649 :
        gmat === 'below-600' ? u.gmatAvg < 600 : true
      );

      // Ranking filter (convert string ranks to numbers)
      const rankNum = u.rank === 'N/A' ? 999 : parseInt(u.rank.replace('#', ''));
      const matchesRank = ranking === 'all' || (
        ranking === 'top-10' ? rankNum <= 10 :
        ranking === 'top-50' ? rankNum <= 50 :
        ranking === 'top-100' ? rankNum <= 100 :
        ranking === '100+' ? rankNum > 100 : true
      );

      return matchesSearch && matchesGmat && matchesRank;
    });

    // Return successful response with filtered data
    return NextResponse.json({
      data: filtered,
      count: filtered.length,
      total: universities.length
    });

  } catch (error) {
    console.error("Database error:", error);
    
    // Return error response
    return NextResponse.json(
      {
        error: "Failed to fetch universities",
        details: error.message,
        data: [],
        count: 0
      },
      { status: 500 }
    );
  }
}