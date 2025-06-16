import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Star, Users, BookOpen, Video, FileText, Award } from 'lucide-react';

const QuickActions = () => {
  const quickFilters = [
    { label: 'Most Popular', icon: TrendingUp, color: 'bg-green-500', count: '24' },
    { label: 'Recently Added', icon: Clock, color: 'bg-blue-500', count: '8' },
    { label: 'Featured', icon: Star, color: 'bg-yellow-500', count: '12' },
    { label: 'Top Rated', icon: Award, color: 'bg-purple-500', count: '16' },
  ];

  const resourceTypes = [
    { label: 'Video Tutorials', icon: Video, count: '18' },
    { label: 'PDF Guides', icon: FileText, count: '25' },
    { label: 'Interactive', icon: Users, count: '12' },
    { label: 'Articles', icon: BookOpen, count: '30' },
  ];

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Quick Access</h2>
        <p className="text-gray-600">Find what you need faster</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Popular Filters */}
        <Card className="bg-white shadow-sm border-0 ring-1 ring-gray-100">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#3598FE]" />
              Popular Filters
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.label}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-gray-50 border-gray-200"
                >
                  <div className={`w-8 h-8 rounded-full ${filter.color} flex items-center justify-center`}>
                    <filter.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">{filter.label}</div>
                    <Badge variant="secondary" className="text-xs">{filter.count}</Badge>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resource Types */}
        <Card className="bg-white shadow-sm border-0 ring-1 ring-gray-100">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#3598FE]" />
              Resource Types
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {resourceTypes.map((type) => (
                <Button
                  key={type.label}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-gray-50 border-gray-200"
                >
                  <type.icon className="h-6 w-6 text-[#3598FE]" />
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">{type.label}</div>
                    <Badge variant="secondary" className="text-xs">{type.count}</Badge>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickActions;