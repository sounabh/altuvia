// components/VersionManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, GitBranch, Eye, Download, Copy, Calendar, Trash2, Loader2, FileText, Star, FolderOpen, RefreshCw, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const versionsCache = new Map();

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
  const [expandedGroups, setExpandedGroups] = useState({});
  const hasFetchedRef = useRef(false);
  const cacheKey = `versions_${userEmail}`;

  useEffect(() => {
    if (userEmail) {
      loadAllVersions(false);
    } else {
      setLoading(false);
    }
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
      if (!forceRefresh && versionsCache.has(cacheKey)) {
        const cachedData = versionsCache.get(cacheKey);
        const cacheAge = Date.now() - cachedData.timestamp;
        if (cacheAge < 30000) {
          setVersions(cachedData.versions);
          setGroupedVersions(cachedData.grouped);
          setLoading(false);
          if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;
            setTimeout(() => fetchVersionsInBackground(), 100);
          }
          return;
        }
      }

      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/cv/versions?userEmail=${userEmail}&cvId=${cvId || ''}`);
      const data = await response.json();
      
      if (data.success) {
        const grouped = groupVersions(data.versions);
        setVersions(data.versions);
        setGroupedVersions(grouped);
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
        const currentVersionIds = versions.map(v => v.id).sort().join(',');
        const newVersionIds = data.versions.map(v => v.id).sort().join(',');
        
        if (currentVersionIds !== newVersionIds) {
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
      const optimisticDuplicate = {
        ...version,
        id: `temp_${Date.now()}`,
        versionLabel: `${version.versionLabel} (Copy)`,
        versionNumber: version.versionNumber + 0.1,
        createdAt: new Date().toISOString(),
        isOptimistic: true
      };

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
        versionsCache.delete(cacheKey);
        await loadAllVersions(true);
        toast.success('Version duplicated!');
      } else {
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
    if (!confirm('Delete this version? This cannot be undone.')) return;

    try {
      const versionToDelete = versions.find(v => v.id === versionId);
      
      setVersions(prev => prev.filter(v => v.id !== versionId));
      setGroupedVersions(prev => {
        const key = versionToDelete.cvSlug;
        const newVersions = prev[key].versions.filter(v => v.id !== versionId);
        if (newVersions.length === 0) {
          const { [key]: removed, ...rest } = prev;
          return rest;
        }
        return {
          ...prev,
          [key]: { ...prev[key], versions: newVersions }
        };
      });

      toast.info('Deleting...');
      
      const response = await fetch(`/api/cv/versions/${versionId}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        versionsCache.delete(cacheKey);
        toast.success('Version deleted!');
      } else {
        await loadAllVersions(true);
        toast.error('Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
      await loadAllVersions(true);
      toast.error('Failed to delete');
    }
  };

  const handleExportVersion = async (version) => {
    try {
      toast.info('Generating PDF...');
      const response = await fetch(`/api/cv/export-pdf?versionId=${version.id}`);
      
      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV-${version.versionLabel.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF exported!');
    } catch (error) {
      console.error('Failed to export version:', error);
      toast.error('Failed to export PDF');
    }
  };

  const toggleGroup = (slug) => {
    setExpandedGroups(prev => ({ ...prev, [slug]: !prev[slug] }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002147] flex items-center justify-center shadow-lg shadow-[#002147]/20">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#002147]">My CV Versions</h2>
              <p className="text-xs text-slate-500">{versions.length} versions saved</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => loadAllVersions(true)}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-[#002147]"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-[#002147]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#3598FE]" />
              <p className="text-sm text-slate-500">Loading versions...</p>
            </div>
          ) : !userEmail ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">Please log in to view versions</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">No versions saved yet</p>
              <p className="text-xs text-slate-400">Create and save CV versions to see them here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedVersions).map(([cvSlug, cvGroup]) => {
                const isExpanded = expandedGroups[cvSlug] !== false;
                
                return (
                  <div key={cvSlug} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(cvSlug)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#3598FE]/10 flex items-center justify-center">
                        <FolderOpen className="w-4 h-4 text-[#3598FE]" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-sm font-semibold text-[#002147]">{cvGroup.cvTitle}</h3>
                        <p className="text-[11px] text-slate-400">{cvGroup.versions.length} version{cvGroup.versions.length !== 1 ? 's' : ''}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {/* Version List */}
                    {isExpanded && (
                      <div className="border-t border-slate-100">
                        {cvGroup.versions.map((version) => (
                          <div 
                            key={version.id}
                            className={`flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                              version.isOptimistic ? 'opacity-50' : ''
                            }`}
                          >
                            {/* Version Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[13px] font-medium text-[#002147] truncate">
                                  {version.versionLabel}
                                </span>
                                {version.isOptimistic && (
                                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                                )}
                                {version.isBookmarked && (
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                )}
                                {version.isCurrentCV && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">
                                    Current
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 bg-[#3598FE]/10 text-[#3598FE] text-[10px] font-medium rounded">
                                  v{version.versionNumber}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(version.createdAt).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                                <span>{version.templateId}</span>
                              </div>
                              {version.changeDescription && (
                                <p className="text-[11px] text-slate-500 mt-1 truncate">{version.changeDescription}</p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onLoadVersion(version)}
                                disabled={version.isOptimistic}
                                className="p-1.5 rounded-lg bg-[#002147] text-white hover:bg-[#003167] transition-colors disabled:opacity-50"
                                title="Load"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicate(version)}
                                disabled={version.isOptimistic}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-[#3598FE] hover:text-white transition-colors disabled:opacity-50"
                                title="Duplicate"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleExportVersion(version)}
                                disabled={version.isOptimistic}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-purple-500 hover:text-white transition-colors disabled:opacity-50"
                                title="Export PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(version.id)}
                                disabled={version.isOptimistic}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};