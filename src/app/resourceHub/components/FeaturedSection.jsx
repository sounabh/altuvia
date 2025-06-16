import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Star, Clock, Users, ExternalLink, PlayCircle, Award, Zap } from 'lucide-react';
import { mockResources } from '../data/mockResource';

const FeaturedSection = () => {
  const featuredResources = mockResources.filter(resource => resource.featured).slice(0, 3);
  
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Star className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Resources</h2>
            <p className="text-gray-600">Hand-picked premium content for your success</p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-4 py-2">
          <Award className="h-4 w-4 mr-1" />
          Premium Collection
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featuredResources.map((resource, index) => (
          <Card 
            key={resource.id} 
            className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2"
          >
            {/* Premium Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${
              index === 0 ? 'from-blue-600 via-purple-600 to-blue-800'
              : index === 1 ? 'from-emerald-500 via-teal-600 to-cyan-600'
              : 'from-orange-500 via-red-500 to-pink-600'
            }`}>
            </div>
            
            {/* Glassmorphism Overlay */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
            
            {/* Premium Badge */}
            <div className="absolute top-4 right-4 z-20">
              <Badge className="bg-yellow-400 text-yellow-900 border-0 shadow-lg">
                <Zap className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
            
            {/* Content */}
            <div className="relative z-10 text-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <PlayCircle className="h-3 w-3 mr-1" />
                    {resource.type}
                  </Badge>
                  <TrendingUp className="h-4 w-4 opacity-80" />
                </div>
                <CardTitle className="text-xl font-bold leading-tight">
                  {resource.title}
                </CardTitle>
                <CardDescription className="text-white/90 text-sm leading-relaxed">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-white/80">
                    {resource.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {resource.duration}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {resource.views.toLocaleString()} views
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      4.9
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex gap-2 flex-wrap">
                    {resource.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} className="bg-white/10 text-white border-white/20 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Action Button */}
                  <Button 
                    className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Access Premium Contents
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </div>
            
            {/* Animated Border */}
            <div className="absolute inset-0 rounded-lg border-2 border-transparent bg-gradient-to-r from-white/20 via-white/40 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Shine Effect */}
            <div className="absolute top-0 -left-4 w-4 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 group-hover:left-full transition-all duration-1000"></div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeaturedSection;