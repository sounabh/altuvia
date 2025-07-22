import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, Clock, Eye, FileText, PlayCircle, Download, ExternalLink, Star, TrendingUp, Heart, Users, Calendar } from 'lucide-react';



const ResourceCard = ({ resource, isBookmarked, onBookmark, viewMode = 'grid' }) => {
  const getResourceIcon = (type) => {
    switch (type) {
      case 'Video':
        return <PlayCircle className="h-4 w-4" />;
      case 'PDF':
        return <Download className="h-4 w-4" />;
      case 'Article':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Video':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0';
      case 'PDF':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0';
      case 'Article':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0';
      case 'Interactive':
        return 'bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0';
    }
  };

  // Sample images based on resource type
const getResourceImage = (type) => {
  const imageMap = {
    'Video': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop',
    'PDF': 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=250&fit=crop',
    'Article': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop',
    'Interactive': 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=250&fit=crop'
  };
  return imageMap[type] || imageMap['Article'];
};


  if (viewMode === 'list') {
    return (
      <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white shadow-lg ring-1 ring-gray-100 hover:ring-2 hover:ring-[#3598FE]/30 hover:-translate-y-1 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-start">
            {/* Image Section */}
            <div className="relative w-56 h-40 flex-shrink-0 overflow-hidden">
              <img 
                src={getResourceImage(resource.type, resource.id)} 
                alt={resource.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute top-4 left-4">
                <Badge className={`${getTypeColor(resource.type)} flex items-center gap-1 shadow-lg`}>
                  {getResourceIcon(resource.type)}
                  {resource.type}
                </Badge>
              </div>
              {resource.featured && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-lg animate-pulse">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Content Section */}
            <div className="flex-1 p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-[#3598FE] transition-colors mb-3 line-clamp-1">
                    {resource.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-base line-clamp-2 mb-6 leading-relaxed">
                    {resource.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmark();
                  }}
                  className="p-3 h-auto opacity-70 hover:opacity-100 transition-all hover:scale-110"
                >
                  <Bookmark 
                    className={`h-5 w-5 ${isBookmarked ? 'fill-[#3598FE] text-[#3598FE]' : 'text-gray-400 hover:text-red-500'}`} 
                  />
                </Button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-3 mb-6">
                {resource.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 hover:bg-[#3598FE] hover:text-white transition-colors px-3 py-1">
                    {tag}
                  </Badge>
                ))}
                {resource.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1">
                    +{resource.tags.length - 3} more
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8 text-sm text-gray-500">
                  {resource.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      {resource.duration}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-green-500" />
                    {resource.views.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    Popular
                  </div>
                  <Badge variant="outline" className="text-xs font-medium px-3 py-1">
                    {resource.category}
                  </Badge>
                </div>
                
                <Button 
                  className="bg-gradient-to-r from-[#3598FE] to-[#2980d9] hover:from-[#2980d9] hover:to-[#1f5f99] text-white shadow-lg hover:shadow-xl transition-all px-8 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  {resource.type === 'PDF' ? 'Download' : 'View'}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-white shadow-lg ring-1 ring-gray-100 hover:ring-2 hover:ring-[#3598FE]/30 hover:-translate-y-3 relative overflow-hidden h-full">
      {/* Premium Gradient Overlay */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3598FE] via-purple-500 to-[#2980d9]"></div>
      
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden">
        <img 
          src={getResourceImage(resource.type, resource.id)} 
          alt={resource.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        
        {/* Floating Badges */}
        <div className="absolute top-5 left-5">
          <Badge className={`${getTypeColor(resource.type)} flex items-center gap-1 shadow-lg backdrop-blur-sm`}>
            {getResourceIcon(resource.type)}
            {resource.type}
          </Badge>
        </div>
        
        {resource.featured && (
          <div className="absolute top-5 right-5">
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-lg animate-pulse backdrop-blur-sm">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}

        {/* Bookmark Button */}
        <div className="absolute bottom-5 right-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
            className="p-3 h-auto bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all hover:scale-110"
          >
            <Bookmark 
              className={`h-4 w-4 ${isBookmarked ? 'fill-[#3598FE] text-[#3598FE]' : 'text-white hover:text-yellow-400'}`} 
            />
          </Button>
        </div>

        {/* Stats Overlay */}
        <div className="absolute bottom-5 left-5 flex items-center gap-4 text-white text-sm">
          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Eye className="h-3 w-3" />
            {resource.views > 1000 ? `${(resource.views/1000).toFixed(1)}k` : resource.views}
          </div>
          {resource.duration && (
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Clock className="h-3 w-3" />
              {resource.duration}
            </div>
          )}
        </div>
      </div>
      
      <CardHeader className="pb-4 pt-6 px-8 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs font-medium bg-white px-3 py-1">
            {resource.category}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            {new Date(resource.createdAt).toLocaleDateString()}
          </div>
        </div>
        
        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-[#3598FE] transition-colors leading-tight line-clamp-2 min-h-[3.5rem] mb-4">
          {resource.title}
        </CardTitle>
        
        <CardDescription className="text-gray-600 text-base line-clap-3 leading-relaxed min-h-[4.5rem]">
          {resource.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 px-8 pb-8 relative z-10 flex-1">
        <div className="space-y-6">
          {/* Tags */}
          <div className="flex flex-wrap gap-2.5">
            {resource.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs bg-gradient-to-r from-gray-50 to-gray-100 hover:from-[#3598FE] hover:to-[#2980d9] hover:text-white transition-all cursor-default px-3 py-1.5">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200 px-3 py-1.5">
                +{resource.tags.length - 2} more
              </Badge>
            )}
          </div>
          
          {/* Action Button */}
          <Button 
            className="w-full bg-gradient-to-r from-[#3598FE] to-[#2980d9] hover:from-[#2980d9] hover:to-[#1f5f99] text-white group-hover:shadow-xl transition-all transform group-hover:scale-105 font-semibold py-4"
            onClick={(e) => e.stopPropagation()}
          >
            {resource.type === 'PDF' ? (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            ) : resource.type === 'Video' ? (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Watch Video
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Resource
              </>
            )}
          </Button>
        </div>
      </CardContent>
      
      {/* Premium Shine Effect */}
      <div className="absolute top-0 -left-4 w-4 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 group-hover:left-full transition-all duration-1000"></div>
      
      {/* Glassmorphism Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    </Card>
  );
};

export default ResourceCard;
