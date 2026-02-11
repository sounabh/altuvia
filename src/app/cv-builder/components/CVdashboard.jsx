"use client"

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  FileText, Eye, Download, Copy, Trash2, Loader2, 
  Star, RefreshCw, Clock, Plus, Edit, Calendar,
  Sparkles, FolderOpen, GitBranch, ChevronRight, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// ============================================
// CACHE MANAGEMENT
// ============================================

const versionsCache = new Map();

export const clearVersionsCache = (userEmail) => {
  if (userEmail) {
    versionsCache.delete(`versions_${userEmail}`);
  }
};

// ============================================
// MEMOIZED SUB-COMPONENTS
// ============================================

const BackgroundAnimation = memo(() => (
  <div className="absolute top-0 left-0 w-full h-[400px] pointer-events-none z-0 overflow-hidden">
    <div className="absolute top-[-10%] left-[-5%] w-[25rem] h-[25rem] rounded-full bg-blue-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob" />
    <div className="absolute top-[20%] right-[-5%] w-[20rem] h-[20rem] rounded-full bg-purple-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob animation-delay-2000" />
    <div className="absolute top-[40%] left-[30%] w-[15rem] h-[15rem] rounded-full bg-pink-100 blur-[60px] mix-blend-multiply opacity-40 animate-blob animation-delay-4000" />
  </div>
));
BackgroundAnimation.displayName = 'BackgroundAnimation';

const HeroHeader = memo(({ title, subtitle, onNewCV, onRefresh, refreshing }) => (
  <div className="relative z-10 backdrop-blur-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold text-[#002147] mb-4 tracking-tight"
          >
            {title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-gray-500 max-w-2xl font-medium"
          >
            {subtitle}
          </motion.p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-200 text-[#002147] rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-[#3598FE] transition-all duration-300 flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          
          <button
            onClick={onNewCV}
            className="px-6 py-2 bg-[#002147] text-white rounded-xl text-sm font-semibold hover:bg-[#3598FE] transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            New CV
          </button>
        </div>
      </div>
    </div>
  </div>
));
HeroHeader.displayName = 'HeroHeader';

const LoadingCard = memo(() => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="p-6 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
      </div>
      
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full"></div>
        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
      </div>
      
      <div className="flex items-center gap-2 pt-2">
        <div className="h-8 bg-gray-200 rounded-lg flex-1"></div>
        <div className="h-8 w-8 bg-gray-100 rounded-lg"></div>
        <div className="h-8 w-8 bg-gray-100 rounded-lg"></div>
        <div className="h-8 w-8 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  </div>
));
LoadingCard.displayName = 'LoadingCard';

const EmptyState = memo(({ onNewCV }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="text-center py-16 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200 backdrop-blur-sm"
  >
    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
      <FileText className="w-10 h-10 text-[#002147]" />
    </div>
    <h3 className="text-xl font-semibold text-[#002147] mb-2">
      No CVs Created Yet
    </h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">
      Start building your professional resume with our AI-powered CV builder
    </p>
    <button
      onClick={onNewCV}
      className="px-6 py-3 bg-[#002147] text-white rounded-xl hover:bg-[#3598FE] transition-all duration-300 font-medium flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl"
    >
      <Sparkles className="w-4 h-4" />
      Create Your First CV
    </button>

    {/* Quick Tips */}
    <div className="mt-10 max-w-2xl mx-auto">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-4 font-semibold">
        What You Can Do
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/60 rounded-xl p-4 border border-gray-100">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 font-medium">Multiple Templates</p>
          <p className="text-xs text-gray-400 mt-1">
            Choose from professional CV templates
          </p>
        </div>
        <div className="bg-white/60 rounded-xl p-4 border border-gray-100">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
            <GitBranch className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-sm text-gray-600 font-medium">Version Control</p>
          <p className="text-xs text-gray-400 mt-1">
            Save multiple versions of your CV
          </p>
        </div>
        <div className="bg-white/60 rounded-xl p-4 border border-gray-100">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-600 font-medium">AI Analysis</p>
          <p className="text-xs text-gray-400 mt-1">
            Get AI-powered suggestions and tips
          </p>
        </div>
      </div>
    </div>
  </motion.div>
));
EmptyState.displayName = 'EmptyState';

const VersionCard = memo(({ version, index, onEdit, onDuplicate, onExport, onDelete }) => {
  const formattedDate = useMemo(() => {
    return new Date(version.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [version.createdAt]);

  // Color variations for modern borders
  const variations = [
    { border: "border-blue-200", accent: "blue", bg: "bg-blue-50/30", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    { border: "border-purple-200", accent: "purple", bg: "bg-purple-50/30", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
    { border: "border-emerald-200", accent: "emerald", bg: "bg-emerald-50/30", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
    { border: "border-rose-200", accent: "rose", bg: "bg-rose-50/30", iconBg: "bg-rose-100", iconColor: "text-rose-600" },
  ];
  const style = variations[index % variations.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative flex flex-col w-full break-inside-avoid ${style.bg} rounded-2xl p-5 border ${style.border} shadow-sm transition-all duration-300 group-hover:shadow-md overflow-hidden`}
    >
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-50 pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-bl-[8rem]" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-tr-[6rem]" />
      </div>

      {/* CV Icon - Top Left */}
      <div className="absolute top-5 left-5">
        <div className={`w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center shadow-sm`}>
          <FileText className={`w-6 h-6 ${style.iconColor}`} />
        </div>
      </div>

      {/* Version Badge - Top Right */}
      <div className="absolute top-5 right-5">
        <div className={`px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg text-[11px] font-bold tracking-wide uppercase text-${style.accent}-600 shadow-sm flex items-center gap-1`}>
          <GitBranch className="w-3 h-3" />
          v{version.versionNumber}
        </div>
      </div>

      {/* Bookmark Star - Floating */}
      {version.isBookmarked && (
        <div className="absolute top-20 left-5 z-10">
          <div className="bg-amber-500 text-white rounded-full p-1.5 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-current" />
          </div>
        </div>
      )}

      {/* Active Status - Floating */}
      {version.isCurrentCV && (
        <div className="absolute top-20 right-5 z-10">
          <div className="px-2.5 py-1 bg-green-500 text-white rounded-lg text-[10px] font-bold tracking-wide uppercase shadow-sm flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Active
          </div>
        </div>
      )}

      {/* Main Content - Starts after icon space */}
      <div className="relative z-10 mt-16">
        {/* CV Title - Main Heading (NO CV ID) */}
        <div className="mb-3">
          
          
          {/* Template Info */}
          <div className="flex items-center text-gray-500 text-[13px]">
            <FolderOpen className="w-3.5 h-3.5 mr-1" />
            {version.templateId || 'Default Template'}
          </div>
        </div>

        {/* Change Description */}
        {version.changeDescription && (
          <div className="mb-4 bg-white/60 rounded-lg p-3 border border-white/50">
            <p className="text-[12px] text-gray-600 line-clamp-2">
              {version.changeDescription}
            </p>
          </div>
        )}

        {/* Metadata Section */}
        <div className="mb-4 space-y-2">
          {/* Created Date */}
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400 mt-1 flex-shrink-0"></span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase text-gray-400 leading-none">
                Created
              </span>
              <span className="text-[12px] text-gray-600 mt-0.5">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Version Label */}
          <div className="flex items-start gap-2">
            <span className={`w-2 h-2 rounded-full bg-${style.accent}-400 mt-1 flex-shrink-0`}></span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase text-gray-400 leading-none">
                Version
              </span>
              <span className="text-[12px] text-gray-600 mt-0.5">
                {version.versionLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={onEdit}
            disabled={version.isOptimistic}
            className="flex-1 px-4 py-2 bg-[#002147] text-white rounded-xl text-[13px] font-semibold hover:bg-[#3598FE] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
          
          <button
            onClick={onDuplicate}
            disabled={version.isOptimistic}
            className="p-2 rounded-xl bg-white/60 border border-gray-200 text-gray-600 hover:bg-[#3598FE] hover:text-white hover:border-[#3598FE] transition-all duration-300 disabled:opacity-50"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={onExport}
            disabled={version.isOptimistic}
            className="p-2 rounded-xl bg-white/60 border border-gray-200 text-gray-600 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all duration-300 disabled:opacity-50"
            title="Export PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={onDelete}
            disabled={version.isOptimistic}
            className="p-2 rounded-xl bg-white/60 border border-gray-200 text-gray-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* View Details CTA */}
      
      </div>
    </motion.div>
  );
});
VersionCard.displayName = 'VersionCard';

// ============================================
// STATS OVERVIEW COMPONENT
// ============================================

const StatsOverview = memo(({ stats }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
  >
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Total CVs</p>
          <p className="text-2xl font-bold text-[#002147]">{stats.totalCVs}</p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <GitBranch className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Versions</p>
          <p className="text-2xl font-bold text-[#002147]">{stats.totalVersions}</p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <Star className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Bookmarked</p>
          <p className="text-2xl font-bold text-[#002147]">{stats.bookmarked}</p>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Calendar className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Last Updated</p>
          <p className="text-sm font-bold text-[#002147]">{stats.lastUpdated}</p>
        </div>
      </div>
    </div>
  </motion.div>
));
StatsOverview.displayName = 'StatsOverview';

// ============================================
// MAIN CV DASHBOARD COMPONENT
// ============================================

const CVDashboard = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const userEmail = session?.user?.email;
  const cacheKey = useMemo(() => `versions_${userEmail}`, [userEmail]);

  // Calculate stats
  const stats = useMemo(() => {
    const cvGroups = new Set(versions.map(v => v.cvSlug));
    const bookmarkedCount = versions.filter(v => v.isBookmarked).length;
    const lastVersion = versions[0];
    
    return {
      totalCVs: cvGroups.size,
      totalVersions: versions.length,
      bookmarked: bookmarkedCount,
      lastUpdated: lastVersion 
        ? new Date(lastVersion.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'N/A'
    };
  }, [versions]);

  // Load versions
  const loadVersions = useCallback(async (forceRefresh = false) => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    try {
      // Check cache first
      if (!forceRefresh && versionsCache.has(cacheKey)) {
        const cachedData = versionsCache.get(cacheKey);
        const cacheAge = Date.now() - cachedData.timestamp;
        
        if (cacheAge < 30000) {
          setVersions(cachedData.versions);
          setLoading(false);
          setIsInitialized(true);
          return;
        }
      }

      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/cv/versions?userEmail=${userEmail}`);
      const data = await response.json();
      
      if (data.success) {
        setVersions(data.versions);
        versionsCache.set(cacheKey, {
          versions: data.versions,
          timestamp: Date.now()
        });
      } else {
        toast.error('Failed to load CV versions');
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
      toast.error('Failed to load CV versions');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsInitialized(true);
    }
  }, [userEmail, cacheKey]);

  // Initial load
  useEffect(() => {
    if (status === 'authenticated' && userEmail) {
      loadVersions(false);
    }
  }, [status, userEmail, loadVersions]);

  // Handle new CV - Navigate to editor with 'new' parameter
  const handleNewCV = useCallback(() => {
    router.push('/cv-builder?new=true');
  }, [router]);

  // Handle edit version - Navigate to editor with cvId
  const handleEditVersion = useCallback((version) => {
    router.push(`/cv-builder?cvId=${version.cvId}&versionId=${version.id}`);
  }, [router]);

  // Handle duplicate
  const handleDuplicate = useCallback(async (version) => {
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
      toast.info('Duplicating version...');
      
      const response = await fetch('/api/cv/versions/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: version.id })
      });

      const data = await response.json();
      
      if (data.success) {
        versionsCache.delete(cacheKey);
        await loadVersions(true);
        toast.success('Version duplicated!');
      } else {
        setVersions(prev => prev.filter(v => v.id !== optimisticDuplicate.id));
        toast.error('Failed to duplicate version');
      }
    } catch (error) {
      console.error('Failed to duplicate:', error);
      toast.error('Failed to duplicate version');
    }
  }, [cacheKey, loadVersions]);

  // Handle export
  const handleExport = useCallback(async (version) => {
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
      console.error('Failed to export:', error);
      toast.error('Failed to export PDF');
    }
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (versionId) => {
    if (!confirm('Delete this version? This cannot be undone.')) return;

    try {
      setVersions(prev => prev.filter(v => v.id !== versionId));
      toast.info('Deleting...');
      
      const response = await fetch(`/api/cv/versions/${versionId}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        versionsCache.delete(cacheKey);
        toast.success('Version deleted!');
      } else {
        await loadVersions(true);
        toast.error('Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      await loadVersions(true);
      toast.error('Failed to delete');
    }
  }, [cacheKey, loadVersions]);

  // Loading state
  if ((loading && !isInitialized) || status === "loading") {
    return (
      <div className="min-h-screen bg-blue-50/60 relative overflow-hidden">
        <BackgroundAnimation />

        <HeroHeader 
          title={<>Your <span className="text-[#3598FE]">CV Dashboard.</span></>}
          subtitle="Loading your CVs and versions..."
          onNewCV={handleNewCV}
          onRefresh={() => {}}
          refreshing={false}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm animate-pulse">
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Auth check
  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50/60">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-blue-50/60 relative overflow-hidden">
      <BackgroundAnimation />

      <HeroHeader 
        title={<>Your <span className="text-[#3598FE]">CV Dashboard.</span></>}
        subtitle="Manage all your CV versions in one place"
        onNewCV={handleNewCV}
        onRefresh={() => loadVersions(true)}
        refreshing={refreshing}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        <StatsOverview stats={stats} />

        {versions.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#002147]">All CV Versions</h2>
                <p className="text-sm text-gray-500">{versions.length} versions saved</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {versions.map((version, index) => (
                <VersionCard
                  key={version.id}
                  version={version}
                  index={index}
                  onEdit={() => handleEditVersion(version)}
                  onDuplicate={() => handleDuplicate(version)}
                  onExport={() => handleExport(version)}
                  onDelete={() => handleDelete(version.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState onNewCV={handleNewCV} />
        )}
      </div>

      <div className="h-20"></div>
    </div>
  );
};

CVDashboard.displayName = 'CVDashboard';

export default CVDashboard;