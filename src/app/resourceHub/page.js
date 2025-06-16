"use client"


import { useState } from 'react';
import { Search, Filter, SortDesc, Grid, List, Bookmark, TrendingUp, Clock, Users, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import ResourceCard from './components/ResourceCard';
import ModernFilterSidebar from './components/ModernFilterSidebar';
import FeaturedSection from './components/FeaturedSection';
import QuickActions from './components/QuickAction';
import { mockResources } from './data/mockResource';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [bookmarkedResources, setBookmarkedResources] = useState([]);
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredResources = mockResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => resource.tags.includes(tag));
    
    return matchesSearch && matchesCategory && matchesTags;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'popular':
        return b.views - a.views;
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const handleBookmark = (resourceId) => {
    setBookmarkedResources(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const categories = [
    { id: 'all', label: 'All Resources', count: mockResources.length },
    { id: 'MBA', label: 'MBA Programs', count: mockResources.filter(r => r.category === 'MBA').length },
    { id: 'College', label: 'College', count: mockResources.filter(r => r.category === 'College').length },
    { id: 'Masters', label: 'Master\'s Programs', count: mockResources.filter(r => r.category === 'Masters').length },
  ];

  const clearAllFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('popular');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Modern Hero Header */}
      <div className="relative bg-[#002147]  overflow-hidden">
        <div className="absolute inset-0 bg-[#002147]"></div>
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="text-white/90 text-sm font-medium">Premium Resources Hub</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Your Gateway to
              <span className="block bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Academic Success
              </span>
            </h1>
            
            <p className="text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              Discover curated resources, expert insights, and comprehensive guides to excel in your MBA, College, and Masters application journey.
            </p>

            {/* Enhanced Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-2 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-gray-400 ml-4" />
                    <Input
                      placeholder="Search resources, schools, topics, or programs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 bg-transparent text-lg placeholder:text-gray-500 focus-visible:ring-0 flex-1"
                    />
                    <Button className="bg-gradient-to-r from-[#3598FE] to-[#2980d9] hover:from-[#2980d9] hover:to-[#1f5f99] text-white px-8 py-3 rounded-xl font-semibold">
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <QuickActions />

        {/* Featured Section */}
        <FeaturedSection />

        {/* Modern Category Tabs */}
        <div className="mb-8">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
              <TabsList className="grid grid-cols-2 lg:grid-cols-4 bg-white shadow-sm border">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="flex flex-col items-center gap-1 data-[state=active]:bg-[#3598FE] data-[state=active]:text-white"
                  >
                    <span className="font-medium">{category.label.split(' ')[0]}</span>
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                      {category.count}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Modern Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-80">
            <ModernFilterSidebar
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              resources={mockResources}
            />
          </div>

          {/* Mobile Filter Sheet */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" className="mb-4">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {selectedTags.length > 0 && (
                  <Badge className="ml-2 bg-[#3598FE]">{selectedTags.length}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filter Resources</SheetTitle>
                <SheetDescription>
                  Refine your search to find the perfect resources
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <ModernFilterSidebar
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  resources={mockResources}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <div className="flex-1">
            {/* Enhanced Results Header */}
            <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {filteredResources.length} Resources Found
                    </h2>
                    <p className="text-gray-600">
                      {selectedCategory !== 'all' && `in ${categories.find(c => c.id === selectedCategory)?.label}`}
                    </p>
                  </div>
                  
                  {selectedTags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {selectedTags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
                          onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-[#3598FE] focus:border-transparent outline-none"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="alphabetical">A-Z</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Clear All Button */}
                  <Button 
                    variant="outline" 
                    onClick={clearAllFilters}
                    className="px-4 py-2 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </div>

            {/* Resources Grid/List */}
            {filteredResources.length > 0 ? (
              <div className={`grid gap-8 ${
              viewMode === 'grid' 
    ? 'grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2' 
    : 'grid-cols-1'
              }`}>
                {filteredResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    isBookmarked={bookmarkedResources.includes(resource.id)}
                    onBookmark={() => handleBookmark(resource.id)}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center border-2 border-dashed border-gray-200">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources found</h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search terms or filters to find what youre looking for.
                  </p>
                  <Button onClick={clearAllFilters} className="bg-[#3598FE] hover:bg-[#2980d9]">
                    Clear All Filters
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
