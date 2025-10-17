// components/VersionManager.jsx - OPTIMISTIC UPDATES WITH CACHING
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, GitBranch, Eye, Download, Copy, Calendar, Trash2, Loader2, FileText, Star, FolderOpen, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Cache for versions data
const versionsCache = new Map();

// Export function to clear cache (can be called from parent component)
export const clearVersionsCache = (userEmail) => {
  if (userEmail) {
    versionsCache.delete(`versions_${userEmail}`);
  }
};

export const VersionManager = ({ onClose, cvId, onLoadVersion, userEmail }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupedVersions, setGroupedVersions] = useState({});
  const hasFetchedRef = useRef(false);
  const cacheKey = `versions_${userEmail}`;

  useEffect(() => {
    if (userEmail) {
      loadAllVersions(false);
    } else {
      setLoading(false);
    }
    
    // Reset fetch ref when component mounts
    return () => {
      hasFetchedRef.current = false;
    };
  }, [userEmail]);

  const groupVersions = (versionsList) => {
    return versionsList.reduce((acc, version) => {
      const key = version.cvSlug;
      if (!acc[key]) {
        acc[key] = {
          cvTitle: version.cvTitle,
          cvSlug: version.cvSlug,
          versions: [],
        };
      }
      acc[key].versions.push(version);
      return acc;
    }, {});
  };

  const loadAllVersions = async (forceRefresh = false) => {
    try {
      // Check cache first for instant display
      if (!forceRefresh && versionsCache.has(cacheKey)) {
        const cachedData = versionsCache.get(cacheKey);
        const cacheAge = Date.now() - cachedData.timestamp;
        
        // Use cache if less than 30 seconds old
        if (cacheAge < 30000) {
          setVersions(cachedData.versions);
          setGroupedVersions(cachedData.grouped);
          setLoading(false);
          
          // Fetch in background to update cache after first render
          if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;
            setTimeout(() => fetchVersionsInBackground(), 100);
          }
          return;
        }
      }

      // First load or force refresh
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/cv/versions?userEmail=${userEmail}&cvId=${cvId || ''}`);
      const data = await response.json();
      
      if (data.success) {
        const grouped = groupVersions(data.versions);
        
        // Update state
        setVersions(data.versions);
        setGroupedVersions(grouped);
        
        // Update cache
        versionsCache.set(cacheKey, {
          versions: data.versions,
          grouped: grouped,
          timestamp: Date.now()
        });
      } else {
        toast.error('Failed to load versions');
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
      toast.error('Failed to load versions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchVersionsInBackground = async () => {
    try {
      const response = await fetch(`/api/cv/versions?userEmail=${userEmail}&cvId=${cvId || ''}`);
      const data = await response.json();
      
      if (data.success) {
        const grouped = groupVersions(data.versions);
        
        // Check if data changed
        const currentVersionIds = versions.map(v => v.id).sort().join(',');
        const newVersionIds = data.versions.map(v => v.id).sort().join(',');
        
        if (currentVersionIds !== newVersionIds) {
          // Silently update cache and state
          versionsCache.set(cacheKey, {
            versions: data.versions,
            grouped: grouped,
            timestamp: Date.now()
          });
          
          setVersions(data.versions);
          setGroupedVersions(grouped);
        }
      }
    } catch (error) {
      console.error('Background fetch failed:', error);
    }
  };

  const handleDuplicate = async (version) => {
    try {
      // Optimistic update - add duplicate immediately
      const optimisticDuplicate = {
        ...version,
        id: `temp_${Date.now()}`,
        versionLabel: `${version.versionLabel} (Copy)`,
        versionNumber: version.versionNumber + 0.1,
        createdAt: new Date().toISOString(),
        isOptimistic: true
      };

      // Update UI immediately
      setVersions(prev => [optimisticDuplicate, ...prev]);
      setGroupedVersions(prev => {
        const key = version.cvSlug;
        return {
          ...prev,
          [key]: {
            ...prev[key],
            versions: [optimisticDuplicate, ...prev[key].versions]
          }
        };
      });

      toast.info('Duplicating version...');
      
      const response = await fetch('/api/cv/versions/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: version.id })
      });

      const data = await response.json();
      
      if (data.success) {
        // Replace optimistic version with real data
        versionsCache.delete(cacheKey);
        await loadAllVersions(true);
        toast.success('Version duplicated successfully!');
      } else {
        // Rollback on failure
        setVersions(prev => prev.filter(v => v.id !== optimisticDuplicate.id));
        setGroupedVersions(prev => {
          const key = version.cvSlug;
          return {
            ...prev,
            [key]: {
              ...prev[key],
              versions: prev[key].versions.filter(v => v.id !== optimisticDuplicate.id)
            }
          };
        });
        toast.error('Failed to duplicate version');
      }
    } catch (error) {
      console.error('Failed to duplicate version:', error);
      toast.error('Failed to duplicate version');
    }
  };

  const handleDelete = async (versionId) => {
    if (!confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      return;
    }

    try {
      // Store for rollback
      const versionToDelete = versions.find(v => v.id === versionId);
      
      // Optimistic update - remove immediately
      setVersions(prev => prev.filter(v => v.id !== versionId));
      setGroupedVersions(prev => {
        const key = versionToDelete.cvSlug;
        const newVersions = prev[key].versions.filter(v => v.id !== versionId);
        
        // If no versions left in this CV group, remove the group
        if (newVersions.length === 0) {
          const { [key]: removed, ...rest } = prev;
          return rest;
        }
        
        return {
          ...prev,
          [key]: {
            ...prev[key],
            versions: newVersions
          }
        };
      });

      toast.info('Deleting version...');
      
      const response = await fetch(`/api/cv/versions/${versionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        // Update cache
        versionsCache.delete(cacheKey);
        toast.success('Version deleted successfully!');
      } else {
        // Rollback on failure
        setVersions(prev => [...prev, versionToDelete].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ));
        await loadAllVersions(true);
        toast.error('Failed to delete version');
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
      await loadAllVersions(true);
      toast.error('Failed to delete version');
    }
  };

  const handleExportVersion = async (version) => {
    try {
      toast.info('Generating PDF...');
      const response = await fetch(`/api/cv/export-pdf?versionId=${version.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV-${version.versionLabel.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Failed to export version:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleLoadVersion = (version) => {
    onLoadVersion(version);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-cvBorder">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-6 h-6 text-cvAccent" />
            <h2 className="text-xl font-bold cv-heading">All My CV Versions</h2>
            {versions.length > 0 && (
              <Badge className="bg-blue-100 text-blue-800 ml-2">
                {versions.length} total
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => loadAllVersions(true)}
              disabled={refreshing}
              title="Refresh versions"
              className="hover:bg-gray-100"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-cvAccent" />
            </div>
          ) : !userEmail ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Please log in to view versions</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No versions saved yet</p>
              <p className="text-sm text-gray-400">Create CVs and save versions to see them here!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedVersions).map(([cvSlug, cvGroup]) => (
                <div key={cvSlug} className="space-y-3">
                  <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold cv-heading text-blue-900">
                      {cvGroup.cvTitle}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {cvGroup.versions.length} version{cvGroup.versions.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 pl-7">
                    {cvGroup.versions.map((version) => (
                      <Card 
                        key={version.id} 
                        className={`border border-cvBorder hover:border-cvAccent transition-colors ${
                          version.isOptimistic ? 'opacity-60 animate-pulse' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold cv-heading text-base">{version.versionLabel}</h4>
                                {version.isOptimistic && (
                                  <Badge className="bg-gray-100 text-gray-600 border-gray-300">
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Saving...
                                  </Badge>
                                )}
                                {version.isBookmarked && (
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                    <Star className="w-3 h-3 mr-1 fill-yellow-600" />
                                    Bookmarked
                                  </Badge>
                                )}
                                {version.isCurrentCV && (
                                  <Badge className="bg-green-100 text-green-800 border-green-300">
                                    Current CV
                                  </Badge>
                                )}
                                <Badge className="bg-blue-100 text-blue-800">
                                  v{version.versionNumber}
                                </Badge>
                              </div>
                              
                              {version.changeDescription && (
                                <p className="text-sm text-gray-600 mb-2">{version.changeDescription}</p>
                              )}
                              
                              <div className="flex items-center space-x-4 text-sm cv-body text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(version.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</span>
                                </div>
                                <span>•</span>
                                <span>{version.templateId} template</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLoadVersion(version)}
                                disabled={version.isOptimistic}
                                className="border-cvAccent text-cvAccent hover:bg-cvAccent hover:text-white disabled:opacity-50"
                                title="Load this version"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Load
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDuplicate(version)}
                                disabled={version.isOptimistic}
                                className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white disabled:opacity-50"
                                title="Duplicate version"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportVersion(version)}
                                disabled={version.isOptimistic}
                                className="border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white disabled:opacity-50"
                                title="Export as PDF"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(version.id)}
                                disabled={version.isOptimistic}
                                className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-50"
                                title="Delete version"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};