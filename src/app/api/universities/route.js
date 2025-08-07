// app/api/universities/route.js
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request) {

  const session = await getServerSession(authOptions)








  try {
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const gmat = searchParams.get('gmat') || 'all';
    const ranking = searchParams.get('ranking') || 'all';

    // Fetch universities with related images
    const universities = await prisma.university.findMany({
  include: {
    images: {
      where: { isPrimary: true },
      take: 1,
    },
    savedByUsers: {
      where: {
        email: session?.user.email, // Replace with the logged-in user's ID
      },
      select: {
        id: true,
      },
    },
  },
  take: 100,
});




    if (universities.length === 0) {
      return NextResponse.json({
        message: "No universities found",
        data: [],
        count: 0
      });
    }

    // Transform data for UI
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
      savedByUsers:u.savedByUsers
     
    }));

    // Filter based on query params
    const filtered = transformed.filter(u => {
      const matchesSearch = search === '' || 
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.location.toLowerCase().includes(search.toLowerCase());
        
      const matchesGmat = gmat === 'all' || (
        gmat === '700+' ? u.gmatAvg >= 700 :
        gmat === '650-699' ? u.gmatAvg >= 650 && u.gmatAvg <= 699 :
        gmat === '600-649' ? u.gmatAvg >= 600 && u.gmatAvg <= 649 :
        gmat === 'below-600' ? u.gmatAvg < 600 : true
      );

      const rankNum = u.rank === 'N/A' ? 999 : parseInt(u.rank.replace('#', ''));
      const matchesRank = ranking === 'all' || (
        ranking === 'top-10' ? rankNum <= 10 :
        ranking === 'top-50' ? rankNum <= 50 :
        ranking === 'top-100' ? rankNum <= 100 :
        ranking === '100+' ? rankNum > 100 : true
      );

      return matchesSearch && matchesGmat && matchesRank;
    });

    return NextResponse.json({
      data: filtered,
      count: filtered.length,
      total: universities.length
    });

  } catch (error) {
    console.error("Database error:", error);
    
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