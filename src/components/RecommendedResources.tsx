import React, { useState, useEffect } from 'react';
import {
  RecommendedResource,
  RecommendedResourcesResponse,
  ResourceCategory,
} from '../types';
import { fetchRecommendedResources } from '../services/api';
import {
  Search,
  ExternalLink,
  BookOpen,
  Video,
  FileText,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  HelpCircle,
  Globe,
  Loader2,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Tag,
  GraduationCap,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface RecommendedResourcesProps {
  subject: string;
  topic: string;
  classLevel?: string;
  onGoToQuiz?: (topicOrNotes: string, subject?: string) => void;
  accentColor?: string;
}

export const RecommendedResources: React.FC<RecommendedResourcesProps> = ({
  subject,
  topic,
  classLevel = 'Class 10 (CBSE / State)',
  onGoToQuiz,
}) => {
  const [data, setData] = useState<RecommendedResourcesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters and search
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expandable grounding details
  const [showGroundingDetails, setShowGroundingDetails] = useState(false);

  // Bookmarked IDs in local storage
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('eduspark_bookmarked_resources');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem('eduspark_bookmarked_resources', JSON.stringify(updated));
      } catch (e) {
        console.warn('Bookmark storage error:', e);
      }
      return updated;
    });
  };

  const loadResources = async (keywordOverride?: string) => {
    if (!subject && !topic) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchRecommendedResources({
        subject: subject || 'General Science',
        topic: topic || subject || 'Key Concepts',
        classLevel,
        keywords: keywordOverride !== undefined ? keywordOverride : appliedKeyword,
        categoryFilter: selectedCategory,
      });

      setData(result);
    } catch (err: any) {
      console.error('Failed to load resources:', err);
      setError(err.message || 'Unable to fetch recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch when subject or topic changes
  useEffect(() => {
    loadResources();
  }, [subject, topic]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedKeyword(searchQuery.trim());
    loadResources(searchQuery.trim());
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered resources based on category and in-page text search
  const filteredResources = (data?.resources || []).filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.type === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim() || appliedKeyword === searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.source.toLowerCase().includes(q) ||
      (item.topicsCovered && item.topicsCovered.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'textbook':
        return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'youtube':
        return <Video className="w-4 h-4 text-red-400" />;
      case 'practice_pdf':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      default:
        return <Globe className="w-4 h-4 text-amber-400" />;
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'textbook':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'youtube':
        return 'bg-red-500/10 text-red-300 border-red-500/30';
      case 'practice_pdf':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div
      id="section-recommended-resources"
      className="bg-[#121215] rounded-3xl p-5 sm:p-7 border border-zinc-800/90 shadow-sm space-y-6"
    >
      {/* Header with Google Grounding Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-300 border border-blue-500/30">
              <Globe className="w-3.5 h-3.5" />
              <span>Google Search Grounded</span>
            </span>
            <span className="text-xs text-zinc-400">
              Active Subject: <strong className="text-zinc-200">{subject || 'General'}</strong>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-zinc-100 font-heading tracking-tight flex items-center gap-2">
            <span>Recommended Resources</span>
            <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          </h3>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Live curated open-source textbooks (NCERT / OpenStax), verified YouTube tutorials, and practice question PDFs matching your summarized topic.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            id="btn-refresh-resources"
            onClick={() => loadResources()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-all cursor-pointer disabled:opacity-50"
            title="Search Google again for fresh recommendations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isLoading ? 'Searching Google...' : 'Refresh Resources'}</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Category Filter Bar */}
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-resources"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, e.g., 'NCERT Chapter PDF', 'Telugu explanation', 'Solved PYQs'..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm font-heading"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-zinc-500 font-bold flex items-center gap-1 pl-1 pr-1 text-[11px] uppercase tracking-wider">
            <Filter className="w-3 h-3" /> Filter:
          </span>

          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-zinc-100 text-zinc-950 shadow-xs'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            All Resources ({data?.resources?.length || 0})
          </button>

          <button
            onClick={() => setSelectedCategory('textbook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'textbook'
                ? 'bg-blue-500 text-zinc-950 shadow-xs'
                : 'bg-zinc-900 text-zinc-400 hover:text-blue-300 border border-zinc-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Textbooks & NCERT</span>
          </button>

          <button
            onClick={() => setSelectedCategory('youtube')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'youtube'
                ? 'bg-red-500 text-zinc-950 shadow-xs'
                : 'bg-zinc-900 text-zinc-400 hover:text-red-300 border border-zinc-800'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>YouTube Tutorials</span>
          </button>

          <button
            onClick={() => setSelectedCategory('practice_pdf')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'practice_pdf'
                ? 'bg-emerald-500 text-zinc-950 shadow-xs'
                : 'bg-zinc-900 text-zinc-400 hover:text-emerald-300 border border-zinc-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Practice PDFs & PYQs</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-zinc-200 font-heading">
              Searching Google for Authentic Academic Resources...
            </p>
            <p className="text-xs text-zinc-500">
              Retrieving NCERT open textbooks, Khan Academy tutorials, and official exam PDFs for {topic || subject}...
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 text-center space-y-3">
          <p className="text-xs sm:text-sm text-red-300 font-medium">{error}</p>
          <button
            onClick={() => loadResources()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results Content */}
      {!isLoading && !error && (
        <>
          {/* Senior Summary Banner */}
          {data?.summary && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 via-zinc-900/80 to-zinc-900/80 border border-blue-500/20 text-xs sm:text-sm text-zinc-300 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                💡
              </div>
              <div className="space-y-1">
                <span className="font-extrabold text-blue-300 block">Senior Study Guide Tip:</span>
                <p className="leading-relaxed">{data.summary}</p>
              </div>
            </div>
          )}

          {/* Resources Cards Grid */}
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource) => {
                const isBookmarked = bookmarkedIds.includes(resource.id);
                const isCopied = copiedId === resource.id;

                return (
                  <div
                    key={resource.id}
                    className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all group relative hover:shadow-md hover:shadow-black/40"
                  >
                    <div className="space-y-3">
                      {/* Top Meta Bar */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold border ${getCategoryColor(
                            resource.type
                          )}`}
                        >
                          {getCategoryIcon(resource.type)}
                          <span>{resource.badge || resource.type}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleBookmark(resource.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isBookmarked
                                ? 'text-amber-400 bg-amber-400/10'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                            }`}
                            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this resource'}
                          >
                            {isBookmarked ? (
                              <BookmarkCheck className="w-3.5 h-3.5 fill-current" />
                            ) : (
                              <Bookmark className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleCopyLink(resource.url, resource.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Resource Title */}
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-blue-300 transition-colors block line-clamp-2 leading-snug"
                      >
                        {resource.title}
                      </a>

                      {/* Source & Rating */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800/80 pb-2.5">
                        <span className="font-semibold text-zinc-300 truncate max-w-[170px]">
                          {resource.source}
                        </span>
                        {resource.ratingOrViews && (
                          <span className="px-1.5 py-0.5 rounded-md bg-zinc-800/90 text-amber-300 font-bold text-[10px]">
                            {resource.ratingOrViews}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-zinc-300 leading-relaxed font-normal line-clamp-3">
                        {resource.description}
                      </p>

                      {/* Topics Covered Chips */}
                      {resource.topicsCovered && resource.topicsCovered.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {resource.topicsCovered.slice(0, 3).map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400 text-[10px] font-medium"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-4 mt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      {resource.language && (
                        <span className="text-[10px] text-zinc-400 font-medium">
                          🌐 {resource.language}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 ml-auto">
                        {onGoToQuiz && (
                          <button
                            onClick={() => onGoToQuiz(resource.title, subject)}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer"
                            title="Generate a practice quiz on this topic"
                          >
                            Quiz ❓
                          </button>
                        )}

                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 transition-all cursor-pointer group-hover:bg-blue-600 group-hover:text-zinc-950"
                        >
                          <span>Open Resource</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-2">
              <p className="text-sm text-zinc-300 font-bold">No resources found in this category.</p>
              <p className="text-xs text-zinc-500">Try choosing 'All Resources' or clearing your search keywords.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setAppliedKeyword('');
                  loadResources('');
                }}
                className="mt-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          )}

          {/* Google Search Grounding Verification Accordion */}
          {((data?.groundingSources && data.groundingSources.length > 0) ||
            (data?.searchQueries && data.searchQueries.length > 0)) && (
            <div className="pt-2">
              <button
                onClick={() => setShowGroundingDetails(!showGroundingDetails)}
                className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Verified Google Search Grounding Sources ({data?.groundingSources?.length || 0})</span>
                {showGroundingDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showGroundingDetails && (
                <div className="mt-3 p-4 rounded-2xl bg-[#0D0D10] border border-zinc-800 space-y-3 text-xs">
                  {data?.searchQueries && data.searchQueries.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Live Google Search Queries Executed:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {data.searchQueries.map((q, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono text-[11px]"
                          >
                            "{q}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {data?.groundingSources && data.groundingSources.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/80">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Discovered Web References:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {data.groundingSources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-blue-300 transition-colors"
                          >
                            <span className="truncate">{src.title}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0 text-zinc-500" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
