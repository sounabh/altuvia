// components/VersionManager.jsx - SHOWS ALL USER VERSIONS
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, GitBranch, Eye, Download, Copy, Calendar, Trash2, Loader2, FileText, Star, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

export const VersionManager = ({ onClose, cvId, onLoadVersion, userEmail }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedVersions, setGroupedVersions] = useState({});

  useEffect(() => {
    if (userEmail) {
      loadAllVersions();
    } else {
      setLoading(false);
    }
  }, [userEmail]);

  const loadAllVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cv/versions?userEmail=${userEmail}&cvId=${cvId || ''}`);
      const data = await response.json();
      
      if (data.success) {
        setVersions(data.versions);
        
        // Group versions by CV
        const grouped = data.versions.reduce((acc, version) => {
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
        
        setGroupedVersions(grouped);
      } else {
        toast.error('Failed to load versions');
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
      toast.error('Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (version) => {
    try {
      toast.info('Duplicating version...');
      const response = await fetch('/api/cv/versions/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: version.id })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Version duplicated successfully!');
        loadAllVersions();
      } else {
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
      toast.info('Deleting version...');
      const response = await fetch(`/api/cv/versions/${versionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Version deleted successfully!');
        loadAllVersions();
      } else {
        toast.error('Failed to delete version');
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
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
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
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
                      <Card key={version.id} className="border border-cvBorder hover:border-cvAccent transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold cv-heading text-base">{version.versionLabel}</h4>
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
                                className="border-cvAccent text-cvAccent hover:bg-cvAccent hover:text-white"
                                title="Load this version"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Load
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDuplicate(version)}
                                className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                                title="Duplicate version"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportVersion(version)}
                                className="border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white"
                                title="Export as PDF"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(version.id)}
                                className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
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