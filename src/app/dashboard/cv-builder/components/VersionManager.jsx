// components/VersionManager.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, GitBranch, Eye, Download, Copy, Calendar, Trash2, Loader2, FileText, Star, FolderOpen, RefreshCw, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

// Cache for storing versions data to minimize API calls
const versionsCache = new Map();

/**
 * Clears the cache for a specific user
 * @param {string} userEmail - User's email to clear cache for
 */
export const clearVersionsCache = (userEmail) => {
  if (userEmail) {
    versionsCache.delete(`versions_${userEmail}`);
  }
};

/**
 * Groups versions by their CV slug
 * @param {Array} versionsList - Array of version objects
 * @returns {Object} Grouped versions by CV slug
 */
const groupVersions = (versionsList) => {
  return versionsList.reduce((acc, version) => {
    const key = version.cvSlug;
    
    // Create new group if it doesn't exist
    if (!acc[key]) {
      acc[key] = {
        cvTitle: version.cvTitle,
        cvSlug: version.cvSlug,
        versions: [],
      };
    }
    
    // Add version to group
    acc[key].versions.push(version);
    
    return acc;
  }, {});
};

/**
 * LoadingState - Memoized loading indicator component
 */
const LoadingState = memo(() => (
  <div className="flex flex-col items-center justify-center h-48 gap-3">
    <Loader2 className="w-8 h-8 animate-spin text-[#3598FE]" />
    <p className="text-sm text-slate-500">Loading versions...</p>
  </div>
));

LoadingState.displayName = 'LoadingState';

/**
 * EmptyState - Memoized empty state component
 * @param {Object} props - Component props
 * @param {string} props.title - Title text
 * @param {string} props.subtitle - Subtitle text (optional)
 */
const EmptyState = memo(({ title, subtitle }) => (
  <div className="flex flex-col items-center justify-center h-48 gap-3">
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
      <FileText className="w-8 h-8 text-slate-300" />
    </div>
    <p className="text-sm font-medium text-slate-600">{title}</p>
    {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
  </div>
));

EmptyState.displayName = 'EmptyState';

/**
 * VersionItem - Memoized individual version row component
 * @param {Object} props - Component props
 * @param {Object} props.version - Version data object
 * @param {Function} props.onLoad - Callback to load version
 * @param {Function} props.onDuplicate - Callback to duplicate version
 * @param {Function} props.onExport - Callback to export version
 * @param {Function} props.onDelete - Callback to delete version
 */
const VersionItem = memo(({ version, onLoad, onDuplicate, onExport, onDelete }) => {
  // Memoized date formatting to prevent recalculation
  const formattedDate = useMemo(() => {
    return new Date(version.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }, [version.createdAt]);

  return (
    <div 
      className={`flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
        version.isOptimistic ? 'opacity-50' : ''
      }`}
    >
      
      {/* Version information */}
      <div className="flex-1 min-w-0">
        {/* Version label and badges */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-medium text-[#002147] truncate">
            {version.versionLabel}
          </span>
          
          {/* Optimistic loading indicator */}
          {version.isOptimistic && (
            <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
          )}
          
          {/* Bookmark indicator */}
          {version.isBookmarked && (
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          )}
          
          {/* Current version badge */}
          {version.isCurrentCV && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">
              Current
            </span>
          )}
          
          {/* Version number badge */}
          <span className="px-1.5 py-0.5 bg-[#3598FE]/10 text-[#3598FE] text-[10px] font-medium rounded">
            v{version.versionNumber}
          </span>
        </div>
        
        {/* Version metadata */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formattedDate}
          </span>
          <span>{version.templateId}</span>
        </div>
        
        {/* Change description */}
        {version.changeDescription && (
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {version.changeDescription}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* Load button */}
        <button
          onClick={onLoad}
          disabled={version.isOptimistic}
          className="p-1.5 rounded-lg bg-[#002147] text-white hover:bg-[#003167] transition-colors disabled:opacity-50"
          title="Load"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        
        {/* Duplicate button */}
        <button
          onClick={onDuplicate}
          disabled={version.isOptimistic}
          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-[#3598FE] hover:text-white transition-colors disabled:opacity-50"
          title="Duplicate"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        
        {/* Export button */}
        <button
          onClick={onExport}
          disabled={version.isOptimistic}
          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-purple-500 hover:text-white transition-colors disabled:opacity-50"
          title="Export PDF"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        
        {/* Delete button */}
        <button
          onClick={onDelete}
          disabled={version.isOptimistic}
          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

VersionItem.displayName = 'VersionItem';

/**
 * VersionGroup - Memoized version group component with expand/collapse
 * @param {Object} props - Component props
 * @param {string} props.cvSlug - CV slug identifier
 * @param {Object} props.cvGroup - Group data containing versions
 * @param {boolean} props.isExpanded - Whether group is expanded
 * @param {Function} props.onToggle - Callback to toggle expand/collapse
 * @param {Function} props.onLoadVersion - Callback to load a version
 * @param {Function} props.onDuplicate - Callback to duplicate a version
 * @param {Function} props.onExport - Callback to export a version
 * @param {Function} props.onDelete - Callback to delete a version
 */
const VersionGroup = memo(({ 
  cvSlug, 
  cvGroup, 
  isExpanded, 
  onToggle, 
  onLoadVersion, 
  onDuplicate, 
  onExport, 
  onDelete 
}) => {
  // Memoized toggle handler
  const handleToggle = useCallback(() => {
    onToggle(cvSlug);
  }, [onToggle, cvSlug]);

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
      
      {/* Group header - clickable to expand/collapse */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[#3598FE]/10 flex items-center justify-center">
          <FolderOpen className="w-4 h-4 text-[#3598FE]" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-sm font-semibold text-[#002147]">{cvGroup.cvTitle}</h3>
          <p className="text-[11px] text-slate-400">
            {cvGroup.versions.length} version{cvGroup.versions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>
      
      {/* Expanded versions list */}
      {isExpanded && (
        <div className="border-t border-slate-100">
          
          {/* Render each version in the group */}
          {cvGroup.versions.map((version) => (
            <VersionItem
              key={version.id}
              version={version}
              onLoad={() => onLoadVersion(version)}
              onDuplicate={() => onDuplicate(version)}
              onExport={() => onExport(version)}
              onDelete={() => onDelete(version.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

VersionGroup.displayName = 'VersionGroup';

/**
 * VersionManager - Modal component for managing CV versions
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback to close the modal
 * @param {string} props.cvId - Current CV ID (optional)
 * @param {Function} props.onLoadVersion - Callback to load a specific version
 * @param {string} props.userEmail - User's email for filtering versions
 * @returns {JSX.Element} Version manager modal
 */
export const VersionManager = memo(({ onClose, cvId, onLoadVersion, userEmail }) => {
  // State for storing all versions
  const [versions, setVersions] = useState([]);
  
  // Loading state for initial load
  const [loading, setLoading] = useState(true);
  
  // Refreshing state for manual refresh
  const [refreshing, setRefreshing] = useState(false);
  
  // State for tracking expanded/collapsed groups
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // Ref to track if initial fetch has been done
  const hasFetchedRef = useRef(false);
  
  // Cache key based on user email
  const cacheKey = useMemo(() => `versions_${userEmail}`, [userEmail]);

  // Memoized grouped versions calculation
  const groupedVersions = useMemo(() => {
    return groupVersions(versions);
  }, [versions]);

  /**
   * Fetches versions in background to check for updates
   */
  const fetchVersionsInBackground = useCallback(async () => {
    try {
      const response = await fetch(`/api/cv/versions?userEmail=${userEmail}&cvId=${cvId || ''}`);
      const data = await response.json();
      
      if (data.success) {
        // Check if versions have changed
        setVersions(prevVersions => {
          const currentVersionIds = prevVersions.map(v => v.id).sort().join(',');
          const newVersionIds = data.versions.map(v => v.id).sort().join(',');
          
          // Only update if versions differ
          if (currentVersionIds !== newVersionIds) {
            const grouped = groupVersions(data.versions);
            versionsCache.set(cacheKey, {
              versions: data.versions,
              grouped: grouped,
              timestamp: Date.now()
            });
            return data.versions;
          }
          return prevVersions;
        });
      }
    } catch (error) {
      console.error('Background fetch failed:', error);
    }
  }, [userEmail, cvId, cacheKey]);

  /**
   * Loads all versions from API with caching support
   * @param {boolean} forceRefresh - Whether to bypass cache
   */
  const loadAllVersions = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh && versionsCache.has(cacheKey)) {
        const cachedData = versionsCache.get(cacheKey);
        const cacheAge = Date.now() - cachedData.timestamp;
        
        // Use cache if less than 30 seconds old
        if (cacheAge < 30000) {
          setVersions(cachedData.versions);
          setLoading(false);
          
          // Trigger background refresh if first load
          if (!hasFetchedRef.current) {
            hasFetchedRef.current = true;
            setTimeout(() => fetchVersionsInBackground(), 100);
          }
          
          return;
        }
      }

      // Set loading states
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch versions from API
      const response = await fetch(`/api/cv/versions?userEmail=${userEmail}&cvId=${cvId || ''}`);
      const data = await response.json();
      
      if (data.success) {
        // Group versions and update state
        const grouped = groupVersions(data.versions);
        setVersions(data.versions);
        
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
  }, [userEmail, cvId, cacheKey, fetchVersionsInBackground]);

  // Effect to load versions when component mounts or userEmail changes
  useEffect(() => {
    if (userEmail) {
      loadAllVersions(false);
    } else {
      setLoading(false);
    }
    
    // Cleanup function
    return () => {
      hasFetchedRef.current = false;
    };
  }, [userEmail, loadAllVersions]);

  /**
   * Handles duplicating a version
   * @param {Object} version - Version object to duplicate
   */
  const handleDuplicate = useCallback(async (version) => {
    try {
      // Create optimistic duplicate for immediate UI update
      const optimisticDuplicate = {
        ...version,
        id: `temp_${Date.now()}`,
        versionLabel: `${version.versionLabel} (Copy)`,
        versionNumber: version.versionNumber + 0.1,
        createdAt: new Date().toISOString(),
        isOptimistic: true
      };

      // Update state optimistically
      setVersions(prev => [optimisticDuplicate, ...prev]);

      toast.info('Duplicating version...');
      
      // Make API call to create duplicate
      const response = await fetch('/api/cv/versions/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: version.id })
      });

      const data = await response.json();
      
      if (data.success) {
        // Clear cache and reload fresh data
        versionsCache.delete(cacheKey);
        await loadAllVersions(true);
        toast.success('Version duplicated!');
      } else {
        // Revert optimistic update on failure
        setVersions(prev => prev.filter(v => v.id !== optimisticDuplicate.id));
        toast.error('Failed to duplicate version');
      }
    } catch (error) {
      console.error('Failed to duplicate version:', error);
      toast.error('Failed to duplicate version');
    }
  }, [cacheKey, loadAllVersions]);

  /**
   * Handles deleting a version
   * @param {string} versionId - ID of version to delete
   */
  const handleDelete = useCallback(async (versionId) => {
    // Confirm deletion
    if (!confirm('Delete this version? This cannot be undone.')) return;

    try {
      // Find version to delete
      const versionToDelete = versions.find(v => v.id === versionId);
      
      // Optimistically remove from UI
      setVersions(prev => prev.filter(v => v.id !== versionId));

      toast.info('Deleting...');
      
      // Make API call to delete
      const response = await fetch(`/api/cv/versions/${versionId}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        // Clear cache on successful deletion
        versionsCache.delete(cacheKey);
        toast.success('Version deleted!');
      } else {
        // Reload data if deletion failed
        await loadAllVersions(true);
        toast.error('Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
      await loadAllVersions(true);
      toast.error('Failed to delete');
    }
  }, [versions, cacheKey, loadAllVersions]);

  /**
   * Handles exporting a version as PDF
   * @param {Object} version - Version object to export
   */
  const handleExportVersion = useCallback(async (version) => {
    try {
      toast.info('Generating PDF...');
      
      // Fetch PDF from API
      const response = await fetch(`/api/cv/export-pdf?versionId=${version.id}`);
      
      if (!response.ok) throw new Error('Failed to generate PDF');

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV-${version.versionLabel.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF exported!');
    } catch (error) {
      console.error('Failed to export version:', error);
      toast.error('Failed to export PDF');
    }
  }, []);

  /**
   * Toggles expanded state of a version group
   * @param {string} slug - CV slug of the group
   */
  const toggleGroup = useCallback((slug) => {
    setExpandedGroups(prev => ({ ...prev, [slug]: !prev[slug] }));
  }, []);

  /**
   * Handles refresh button click
   */
  const handleRefresh = useCallback(() => {
    loadAllVersions(true);
  }, [loadAllVersions]);

  // Memoized grouped entries for rendering
  const groupedEntries = useMemo(() => {
    return Object.entries(groupedVersions);
  }, [groupedVersions]);

  // Memoized version count text
  const versionCountText = useMemo(() => {
    return `${versions.length} versions saved`;
  }, [versions.length]);

  return (
    // Modal overlay
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      
      {/* Main modal container */}
      <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header section */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          
          {/* Left side: Title and icon */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002147] flex items-center justify-center shadow-lg shadow-[#002147]/20">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#002147]">My CV Versions</h2>
              <p className="text-xs text-slate-500">{versionCountText}</p>
            </div>
          </div>

          {/* Right side: Refresh and close buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
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

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* Loading state */}
          {loading ? (
            <LoadingState />
          
          ) : 
          
          /* No user logged in state */
          !userEmail ? (
            <EmptyState title="Please log in to view versions" />
          
          ) : 
          
          /* No versions state */
          versions.length === 0 ? (
            <EmptyState 
              title="No versions saved yet" 
              subtitle="Create and save CV versions to see them here" 
            />
          
          ) : 
          
          /* Versions list */
          (
            <div className="space-y-3">
              {/* Render each CV group */}
              {groupedEntries.map(([cvSlug, cvGroup]) => (
                <VersionGroup
                  key={cvSlug}
                  cvSlug={cvSlug}
                  cvGroup={cvGroup}
                  isExpanded={expandedGroups[cvSlug] !== false}
                  onToggle={toggleGroup}
                  onLoadVersion={onLoadVersion}
                  onDuplicate={handleDuplicate}
                  onExport={handleExportVersion}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

VersionManager.displayName = 'VersionManager';