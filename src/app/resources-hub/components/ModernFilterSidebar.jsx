import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Filter, School, BookOpen, Target, Star, Clock, Users, Sparkles, TrendingUp } from 'lucide-react';




const ModernFilterSidebar = ({ selectedTags, onTagsChange, resources }) => {
  const [isResourceTypeOpen, setIsResourceTypeOpen] = useState(true);
  const [isSchoolsOpen, setIsSchoolsOpen] = useState(true);
  const [isTopicsOpen, setIsTopicsOpen] = useState(true);

  // Extract unique tags and categorize them
  const allTags = resources.flatMap(resource => resource.tags);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} );

  const schools = Object.keys(tagCounts).filter(tag => 
    ['Harvard', 'Stanford', 'Wharton', 'MIT', 'Columbia', 'Yale', 'Princeton', 'NYU'].includes(tag)
  ).sort((a, b) => tagCounts[b] - tagCounts[a]);
  
  const topics = Object.keys(tagCounts).filter(tag => 
    ['Leadership', 'Personal Statement', 'Interview', 'Scholarship', 'Career Goals', 'Why MBA', 'Teamwork'].includes(tag)
  ).sort((a, b) => tagCounts[b] - tagCounts[a]);
  
  const resourceTypes = Object.keys(tagCounts).filter(tag => 
    ['Essay Sample', 'Interview Prep', 'Application Guide', 'Video Tutorial'].includes(tag)
  ).sort((a, b) => tagCounts[b] - tagCounts[a]);

  const handleTagToggle = (tag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newTags);
  };

  const getFilterIcon = (title) => {
    switch (title) {
      case 'Resource Type':
        return <BookOpen className="h-4 w-4" />;
      case 'Schools':
        return <School className="h-4 w-4" />;
      case 'Topics':
        return <Target className="h-4 w-4" />;
      default:
        return <Filter className="h-4 w-4" />;
    }
  };

  const FilterSection = ({ 
    title, 
    tags, 
    isOpen, 
    onToggle,
    showCounts = true 
  }) => (
    <div className="relative overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-300 group shadow-sm hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#3598FE] to-[#2980d9] text-white shadow-sm group-hover:shadow-lg transition-shadow">
              {getFilterIcon(title)}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 group-hover:text-[#3598FE] transition-colors">{title}</h3>
              <p className="text-xs text-gray-500">{tags.length} options</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedTags.some(tag => tags.includes(tag)) && (
              <div className="relative">
                <Badge className="bg-gradient-to-r from-[#3598FE] to-[#2980d9] text-white text-xs border-0 shadow-sm animate-pulse">
                  {selectedTags.filter(tag => tags.includes(tag)).length}
                </Badge>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              </div>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-all duration-300 ${isOpen ? 'rotate-180 text-[#3598FE]' : ''}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-1 pb-2">
          <div className="mt-3 space-y-2 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            {tags.map(tag => (
              <div key={tag} className="flex items-center justify-between group/item p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative">
                    <Checkbox
                      id={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => handleTagToggle(tag)}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#3598FE] data-[state=checked]:to-[#2980d9] data-[state=checked]:border-0 shadow-sm data-[state=checked]:shadow-lg transition-all"
                    />
                    {selectedTags.includes(tag) && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    )}
                  </div>
                  <label 
                    htmlFor={tag} 
                    className="text-sm text-gray-700 cursor-pointer flex-1 group-hover/item:text-gray-900 group-hover/item:font-medium transition-all"
                  >
                    {tag}
                  </label>
                </div>
                {showCounts && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-gray-500 group-hover/item:text-[#3598FE] group-hover/item:border-[#3598FE] transition-all">
                      {tagCounts[tag]}
                    </Badge>
                    {tagCounts[tag] > 5 && (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3598FE] via-[#2980d9] to-[#1f5f99] p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">Smart Filters</h2>
          </div>
          <p className="text-white/90 text-sm leading-relaxed">
            Discover resources tailored to your needs with our intelligent filtering system
          </p>
        </div>
      </div>

      {/* Enhanced Stats Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#3598FE] to-[#2980d9] bg-clip-text text-transparent mb-1">
              {resources.length}
            </div>
            <div className="text-sm text-gray-600 font-medium">Premium Resources</div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                {resources.filter(r => r.featured).length}
                <Star className="h-3 w-3 text-yellow-500" />
              </div>
              <div className="text-xs text-gray-500">Featured</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {new Set(resources.flatMap(r => r.tags)).size}
              </div>
              <div className="text-xs text-gray-500">Topics</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {resources.filter(r => r.type === 'Video').length}
              </div>
              <div className="text-xs text-gray-500">Videos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modern Filter Sections */}
      <div className="space-y-4">
        <FilterSection
          title="Resource Type"
          tags={resourceTypes}
          isOpen={isResourceTypeOpen}
          onToggle={() => setIsResourceTypeOpen(!isResourceTypeOpen)}
        />
        
        <FilterSection
          title="Schools"
          tags={schools}
          isOpen={isSchoolsOpen}
          onToggle={() => setIsSchoolsOpen(!isSchoolsOpen)}
        />
        
        <FilterSection
          title="Topics"
          tags={topics}
          isOpen={isTopicsOpen}
          onToggle={() => setIsTopicsOpen(!isTopicsOpen)}
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Quick Actions
            </h4>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all border-purple-200 hover:border-purple-300"
                onClick={() => onTagsChange(['Featured'])}
              >
                <Star className="h-4 w-4 mr-2 text-yellow-500" />
                Featured Only
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all border-blue-200 hover:border-blue-300"
                onClick={() => onTagsChange(['Video Tutorial'])}
              >
                <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                Video Resources
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {selectedTags.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-500" />
                Active Filters ({selectedTags.length})
              </h4>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onTagsChange([])}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all text-xs"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <Badge 
                  key={tag} 
                  className="bg-gradient-to-r from-[#3598FE] to-[#2980d9] text-white cursor-pointer hover:from-[#2980d9] hover:to-[#1f5f99] transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModernFilterSidebar;
