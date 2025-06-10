import React from 'react';
import UniversityCard from './UniversityCard';

const UniversityGrid = ({ searchQuery, selectedGmat, selectedRanking }) => {
  const universities = [
    {
      id: 1,
      name: 'Harvard University',
      location: 'Cambridge, MA, USA',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=300&fit=crop&crop=center',
      rank: '#1',
      gmatAvg: 730,
      acceptRate: 12,
      category: 'ivy-league',
      region: 'north-america',
      type: 'private',
      pros: ['Elite faculty', 'Global reputation'],
      cons: ['Highly competitive', 'High tuition'],
      isAdded: true
    },
    {
      id: 2,
      name: 'Stanford University',
      location: 'Stanford, CA, USA',
      image: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=400&h=300&fit=crop&crop=center',
      rank: '#2',
      gmatAvg: 735,
      acceptRate: 10,
      category: 'tech-focused',
      region: 'north-america',
      type: 'private',
      pros: ['Tech ecosystem', 'Innovative curriculum'],
      cons: ['Costly living', 'Tough admission'],
      isAdded: true
    },
    {
      id: 3,
      name: 'INSEAD',
      location: 'Fontainebleau, France',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop&crop=center',
      rank: '#5',
      gmatAvg: 710,
      acceptRate: 25,
      category: 'international',
      region: 'europe',
      type: 'private',
      pros: ['Global exposure', '1-year MBA'],
      cons: ['Intensive schedule', 'Limited electives'],
      isAdded: true
    },
    {
      id: 4,
      name: 'University of Cambridge',
      location: 'Cambridge, UK',
      image: 'https://wallpapercave.com/wp/wp2140625.jpg',
      rank: '#8',
      gmatAvg: 720,
      acceptRate: 15,
      category: 'traditional',
      region: 'europe',
      type: 'public',
      pros: ['Historic prestige', 'Research excellence'],
      cons: ['Traditional approach', 'Competitive environment'],
      isAdded: false
    },
    {
      id: 5,
      name: 'MIT Sloan',
      location: 'Cambridge, MA, USA',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center',
      rank: '#10',
      gmatAvg: 728,
      acceptRate: 18,
      category: 'tech-focused',
      region: 'north-america',
      type: 'private',
      pros: ['Innovation focus', 'Tech integration'],
      cons: ['Highly analytical', 'Intense workload'],
      isAdded: false
    }
  ];

  const matchesGmat = (gmat, filter) => {
    switch (filter) {
      case '700+': return gmat >= 700;
      case '650-699': return gmat >= 650 && gmat <= 699;
      case '600-649': return gmat >= 600 && gmat <= 649;
      case 'below-600': return gmat < 600;
      default: return true;
    }
  };

  const matchesRank = (rankStr, filter) => {
    const rank = parseInt(rankStr.replace('#', ''));
    switch (filter) {
      case 'top-10': return rank <= 10;
      case 'top-50': return rank <= 50;
      case 'top-100': return rank <= 100;
      case '100+': return rank > 100;
      default: return true;
    }
  };

  const filteredUniversities = universities.filter(university => {
    const searchMatch =
      searchQuery === '' ||
      university.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      university.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      university.pros.some(pro => pro.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      searchMatch &&
      matchesGmat(university.gmatAvg, selectedGmat) &&
      matchesRank(university.rank, selectedRanking)
    );
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      {filteredUniversities.length > 0 ? (
        filteredUniversities.map(university => (
          <UniversityCard key={university.id} university={university} />
        ))
      ) : (
        <div className="col-span-full text-center text-gray-500">
          No universities found for the selected filters.
        </div>
      )}
    </div>
  );
};

export default UniversityGrid;
