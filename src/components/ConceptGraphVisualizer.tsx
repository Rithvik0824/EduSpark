import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  ConceptGraphData,
  ConceptGraphNode,
  ConceptGraphLink,
  ConceptNodeType,
  NotesSummaryResult,
} from '../types';
import { buildConceptGraphFromSummary } from '../utils/conceptGraphBuilder';
import { fetchConceptGraph } from '../services/api';
import {
  Network,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Sliders,
  Search,
  Filter,
  Download,
  HelpCircle,
  BookOpen,
  Zap,
  Info,
  CheckCircle2,
  X,
  Share2,
  RefreshCw,
  Eye,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ConceptGraphVisualizerProps {
  summary: NotesSummaryResult;
  onGoToQuiz?: (topicOrNotes: string, subject?: string) => void;
  accentColor?: string;
}

export const ConceptGraphVisualizer: React.FC<ConceptGraphVisualizerProps> = ({
  summary,
  onGoToQuiz,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Graph state
  const [graphData, setGraphData] = useState<ConceptGraphData>(() =>
    buildConceptGraphFromSummary(summary)
  );
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Interaction & UI State
  const [selectedNode, setSelectedNode] = useState<ConceptGraphNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLinkLabels, setShowLinkLabels] = useState(true);

  // Active Type Filters
  const [activeTypes, setActiveTypes] = useState<Record<ConceptNodeType, boolean>>({
    root: true,
    concept: true,
    definition: true,
    formula: true,
    event: true,
    exam_qa: true,
  });

  // Physics Simulation Tuning
  const [chargeStrength, setChargeStrength] = useState(-320);
  const [linkDistance, setLinkDistance] = useState(110);

  // Re-build initial fast graph whenever summary object changes
  useEffect(() => {
    setGraphData(buildConceptGraphFromSummary(summary));
    setSelectedNode(null);
  }, [summary]);

  // Request AI Semantic Enhancement
  const handleEnhanceWithAI = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const enriched = await fetchConceptGraph({
        title: summary.title || summary.subject || 'Core Concepts',
        subject: summary.subject,
        summaryContext: summary.detailedSummary,
        definitions: summary.definitions,
        formulas: summary.formulas,
        keyDates: summary.keyDates,
        examQA: summary.examReadyQA,
      });

      if (enriched && enriched.nodes && enriched.nodes.length > 0) {
        setGraphData(enriched);
        setSelectedNode(null);
      }
    } catch (err: any) {
      console.error('AI graph generation failed:', err);
      setAiError(err.message || 'Failed to generate AI concept graph. Reverted to standard structure.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filtered dataset for rendering
  const filteredData = useMemo(() => {
    const validNodes = graphData.nodes.filter((n) => activeTypes[n.type] !== false);
    const validNodeIds = new Set(validNodes.map((n) => n.id));

    const validLinks = graphData.links.filter((l) => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return validNodeIds.has(sourceId) && validNodeIds.has(targetId);
    });

    return {
      nodes: validNodes,
      links: validLinks,
    };
  }, [graphData, activeTypes]);

  // Color Mapping Helper
  const getNodeColor = (type: ConceptNodeType) => {
    switch (type) {
      case 'root':
        return { fill: '#F59E0B', stroke: '#FDE68A', glow: 'rgba(245, 158, 11, 0.4)', text: '#FEF3C7', label: 'Core Topic' };
      case 'concept':
        return { fill: '#0EA5E9', stroke: '#7DD3FC', glow: 'rgba(14, 165, 233, 0.3)', text: '#E0F2FE', label: 'Key Concept' };
      case 'definition':
        return { fill: '#6366F1', stroke: '#A5B4FC', glow: 'rgba(99, 102, 241, 0.3)', text: '#EEF2FF', label: 'Definition' };
      case 'formula':
        return { fill: '#10B981', stroke: '#6EE7B7', glow: 'rgba(16, 185, 129, 0.35)', text: '#ECFDF5', label: 'Formula / Law' };
      case 'event':
        return { fill: '#F43F5E', stroke: '#FDA4AF', glow: 'rgba(244, 63, 94, 0.3)', text: '#FFF1F2', label: 'Timeline Event' };
      case 'exam_qa':
        return { fill: '#A855F7', stroke: '#D8B4FE', glow: 'rgba(168, 85, 247, 0.35)', text: '#FAF5FF', label: 'Exam Hotspot' };
      default:
        return { fill: '#71717A', stroke: '#D4D4D8', glow: 'rgba(113, 113, 122, 0.2)', text: '#F4F4F5', label: 'Concept' };
    }
  };

  const getNodeIconSymbol = (type: ConceptNodeType) => {
    switch (type) {
      case 'root':
        return '🌟';
      case 'concept':
        return '💡';
      case 'definition':
        return '📖';
      case 'formula':
        return '∑';
      case 'event':
        return '⏱';
      case 'exam_qa':
        return '🎯';
      default:
        return '•';
    }
  };

  // D3 Force Simulation Setup & Lifecycle
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = containerRef.current.clientWidth || 800;
    const height = isFullscreen ? window.innerHeight - 140 : 540;

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // Clone data to avoid mutating react state directly in D3 simulation
    const nodes: ConceptGraphNode[] = filteredData.nodes.map((d) => ({ ...d }));
    const links: ConceptGraphLink[] = filteredData.links.map((d) => ({ ...d }));

    // Container Group for Zoom/Pan
    const g = svg.append('g').attr('class', 'everything-container');

    // Zoom setup
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Marker defs for Arrowheads and Glow Filters
    const defs = svg.append('defs');

    // Arrow Marker
    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 24)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#52525B')
      .attr('opacity', 0.8);

    // Glow Filter
    const filter = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // D3 Force Simulation
    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(linkDistance)
          .strength(0.35)
      )
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide().radius((d: any) => (d.val || 18) + 14).iterations(2)
      );

    // 1. Draw Links
    const linkGroup = g.append('g').attr('class', 'links-group');
    const link = linkGroup
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#3F3F46')
      .attr('stroke-width', (d) => Math.max(1.2, (d.value || 2) * 0.8))
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');

    // 2. Draw Link Labels (Relationship chips)
    let linkLabel: any = null;
    if (showLinkLabels) {
      const linkLabelGroup = g.append('g').attr('class', 'link-labels-group');
      linkLabel = linkLabelGroup
        .selectAll('text')
        .data(links.filter((l) => Boolean(l.relationship)))
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', -4)
        .attr('fill', '#A1A1AA')
        .attr('font-size', '10px')
        .attr('font-family', 'sans-serif')
        .attr('font-weight', '600')
        .attr('pointer-events', 'none')
        .text((d) => d.relationship || '');
    }

    // 3. Draw Nodes Group
    const nodeGroup = g.append('g').attr('class', 'nodes-group');

    // Drag handler
    const drag = d3
      .drag<SVGGElement, ConceptGraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const node = nodeGroup
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-item')
      .style('cursor', 'pointer')
      .call(drag as any);

    // Node outer glow pulse for root node
    node
      .filter((d) => d.type === 'root')
      .append('circle')
      .attr('r', (d) => (d.val || 24) + 8)
      .attr('fill', 'rgba(245, 158, 11, 0.15)')
      .attr('stroke', 'rgba(245, 158, 11, 0.4)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .attr('class', 'animate-pulse');

    // Node Base Circle
    node
      .append('circle')
      .attr('r', (d) => d.val || 20)
      .attr('fill', (d) => getNodeColor(d.type).fill)
      .attr('stroke', (d) => getNodeColor(d.type).stroke)
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#glow)');

    // Node Symbol / Icon Text
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', (d) => (d.type === 'root' ? '14px' : '11px'))
      .attr('font-weight', 'bold')
      .attr('fill', '#09090B')
      .attr('pointer-events', 'none')
      .text((d) => getNodeIconSymbol(d.type));

    // Node Label Text (below circle)
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => (d.val || 20) + 16)
      .attr('fill', (d) => getNodeColor(d.type).text)
      .attr('font-size', (d) => (d.type === 'root' ? '12px' : '11px'))
      .attr('font-weight', (d) => (d.type === 'root' ? '800' : '600'))
      .attr('font-family', 'sans-serif')
      .attr('pointer-events', 'none')
      .text((d) => (d.label.length > 22 ? d.label.slice(0, 20) + '...' : d.label));

    // Interactivity: Click & Hover
    node
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      })
      .on('mouseenter', (event, d) => {
        setHoveredNodeId(d.id);

        // Highlight connected links and nodes
        const connectedNodeIds = new Set<string>();
        connectedNodeIds.add(d.id);

        links.forEach((l: any) => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          if (sId === d.id) connectedNodeIds.add(tId);
          if (tId === d.id) connectedNodeIds.add(sId);
        });

        // Dim unconnected nodes & links
        node.style('opacity', (n) => (connectedNodeIds.has(n.id) ? 1 : 0.2));
        link
          .style('stroke-opacity', (l: any) => {
            const sId = typeof l.source === 'object' ? l.source.id : l.source;
            const tId = typeof l.target === 'object' ? l.target.id : l.target;
            return sId === d.id || tId === d.id ? 1 : 0.1;
          })
          .attr('stroke', (l: any) => {
            const sId = typeof l.source === 'object' ? l.source.id : l.source;
            const tId = typeof l.target === 'object' ? l.target.id : l.target;
            return sId === d.id || tId === d.id ? '#F59E0B' : '#3F3F46';
          })
          .attr('stroke-width', (l: any) => {
            const sId = typeof l.source === 'object' ? l.source.id : l.source;
            const tId = typeof l.target === 'object' ? l.target.id : l.target;
            return sId === d.id || tId === d.id ? 2.5 : 1;
          });

        if (linkLabel) {
          linkLabel.style('opacity', (l: any) => {
            const sId = typeof l.source === 'object' ? l.source.id : l.source;
            const tId = typeof l.target === 'object' ? l.target.id : l.target;
            return sId === d.id || tId === d.id ? 1 : 0.1;
          });
        }
      })
      .on('mouseleave', () => {
        setHoveredNodeId(null);
        node.style('opacity', 1);
        link.style('stroke-opacity', 0.6).attr('stroke', '#3F3F46').attr('stroke-width', (d) => Math.max(1.2, (d.value || 2) * 0.8));
        if (linkLabel) linkLabel.style('opacity', 1);
      });

    // Deselect when clicking SVG background
    svg.on('click', () => {
      setSelectedNode(null);
    });

    // Simulation Tick Updates
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      if (linkLabel) {
        linkLabel
          .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
          .attr('y', (d: any) => (d.source.y + d.target.y) / 2);
      }

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Search query highlight effect
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      node.style('opacity', (d) =>
        d.label.toLowerCase().includes(q) || (d.description && d.description.toLowerCase().includes(q)) ? 1 : 0.25
      );
    }

    return () => {
      simulation.stop();
    };
  }, [filteredData, showLinkLabels, chargeStrength, linkDistance, isFullscreen, searchQuery]);

  // Zoom Button Controls
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.7);
  };

  const handleResetZoom = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(500).call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
  };

  // Toggle type filter
  const toggleTypeFilter = (type: ConceptNodeType) => {
    setActiveTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Download SVG Graph as PNG image
  const handleExportPNG = () => {
    if (!svgRef.current) return;
    try {
      const svgElement = svgRef.current;
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = window.URL ? window.URL.createObjectURL(svgBlob) : (window as any).webkitURL.createObjectURL(svgBlob);
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svgElement.clientWidth * 2;
        canvas.height = svgElement.clientHeight * 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#09090B';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const png = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `EduSpark_Concept_Graph_${encodeURIComponent(graphData.title)}.png`;
          downloadLink.href = png;
          downloadLink.click();
        }
      };
      image.src = blobURL;
    } catch (err) {
      console.warn('SVG export error:', err);
    }
  };

  return (
    <div
      id="section-concept-graph"
      ref={containerRef}
      className={`rounded-3xl border border-zinc-800/90 shadow-sm transition-all relative overflow-hidden ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#09090B] p-6 flex flex-col'
          : 'bg-[#121215] p-5 sm:p-7 space-y-6'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              <Network className="w-3.5 h-3.5" />
              <span>D3 Force-Directed Network</span>
            </span>
            <span className="text-xs text-zinc-400">
              Nodes: <strong className="text-zinc-200">{filteredData.nodes.length}</strong> • Links:{' '}
              <strong className="text-zinc-200">{filteredData.links.length}</strong>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-zinc-100 font-heading tracking-tight flex items-center gap-2">
            <span>Concept Relationship Graph</span>
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </h3>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Interactive visual network illustrating how definitions, laws, formulas, and board exam hotspots connect to each other.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* AI Semantic Enhancement Button */}
          <button
            id="btn-ai-enhance-graph"
            onClick={handleEnhanceWithAI}
            disabled={isAiLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer disabled:opacity-50"
            title="Use Gemini AI to extract deeper multi-hop semantic relationships"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin text-amber-400' : 'text-indigo-400'}`} />
            <span>{isAiLoading ? 'Analyzing Network...' : 'AI Deep Linking'}</span>
          </button>

          {/* Physics / Settings toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              showSettings ? 'bg-zinc-800 text-amber-400 border-amber-500/40' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800'
            }`}
            title="Adjust simulation physics & link labels"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Export PNG */}
          <button
            onClick={handleExportPNG}
            className="p-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all cursor-pointer"
            title="Download Graph snapshot as PNG"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Type Filter Toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-zinc-500 font-bold flex items-center gap-1 pr-1 text-[11px] uppercase">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          <button
            onClick={() => toggleTypeFilter('concept')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeTypes.concept ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 line-through'
            }`}
          >
            <span>💡 Concepts</span>
          </button>

          <button
            onClick={() => toggleTypeFilter('definition')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeTypes.definition ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 line-through'
            }`}
          >
            <span>📖 Definitions</span>
          </button>

          <button
            onClick={() => toggleTypeFilter('formula')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeTypes.formula ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 line-through'
            }`}
          >
            <span>∑ Formulas</span>
          </button>

          <button
            onClick={() => toggleTypeFilter('exam_qa')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeTypes.exam_qa ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 line-through'
            }`}
          >
            <span>🎯 Exam Hotspots</span>
          </button>

          <button
            onClick={() => toggleTypeFilter('event')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeTypes.event ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 line-through'
            }`}
          >
            <span>⏱ Timeline</span>
          </button>
        </div>

        {/* Search Node Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find concept in graph..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* Physics Settings Bar (Collapsible) */}
      {showSettings && (
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-semibold">Repulsion:</span>
              <input
                type="range"
                min="-600"
                max="-100"
                step="20"
                value={chargeStrength}
                onChange={(e) => setChargeStrength(Number(e.target.value))}
                className="w-24 accent-indigo-500 cursor-pointer"
              />
              <span className="text-zinc-300 font-mono text-[11px]">{chargeStrength}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-semibold">Link Distance:</span>
              <input
                type="range"
                min="60"
                max="220"
                step="10"
                value={linkDistance}
                onChange={(e) => setLinkDistance(Number(e.target.value))}
                className="w-24 accent-indigo-500 cursor-pointer"
              />
              <span className="text-zinc-300 font-mono text-[11px]">{linkDistance}px</span>
            </div>

            <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showLinkLabels}
                onChange={(e) => setShowLinkLabels(e.target.checked)}
                className="accent-indigo-500 rounded"
              />
              <span>Show Relation Labels</span>
            </label>
          </div>

          <span className="text-[11px] text-zinc-500">Tip: Drag any node to reposition physics in real time</span>
        </div>
      )}

      {/* Main SVG Graph Canvas Area */}
      <div className="relative w-full rounded-2xl bg-[#0B0B0E] border border-zinc-800/80 overflow-hidden flex-1 min-h-[440px]">
        <svg ref={svgRef} className="w-full h-full block select-none cursor-grab active:cursor-grabbing" />

        {/* Floating Zoom & Control Toolbar */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-zinc-900/80 backdrop-blur-md p-1 rounded-xl border border-zinc-800 shadow-md">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-lg text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Reset Zoom & Center View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Legend / Guide */}
        <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-zinc-950/70 backdrop-blur-md border border-zinc-800/80 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Topic Hub</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Concept</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Definition</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Formula</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Exam Hotspot</span>
        </div>

        {/* Selected Node Details Drawer / Popover */}
        {selectedNode && (
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-[calc(100%-24px)] sm:w-96 max-w-full p-4 rounded-2xl bg-zinc-900/95 backdrop-blur-md border border-zinc-700 shadow-2xl space-y-3 z-20 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2.5">
              <div className="space-y-0.5">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase"
                  style={{
                    backgroundColor: `${getNodeColor(selectedNode.type).fill}20`,
                    color: getNodeColor(selectedNode.type).stroke,
                    border: `1px solid ${getNodeColor(selectedNode.type).fill}40`,
                  }}
                >
                  {getNodeIconSymbol(selectedNode.type)} {getNodeColor(selectedNode.type).label}
                </span>
                <h4 className="font-bold text-sm sm:text-base text-zinc-100 leading-snug">
                  {selectedNode.label}
                </h4>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            {selectedNode.description && (
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                {selectedNode.description}
              </p>
            )}

            {/* Extra Info (e.g. Formula expression, Telugu meaning, scoring tip) */}
            {selectedNode.extraInfo && (
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-amber-300 font-mono">
                {selectedNode.extraInfo}
              </div>
            )}

            {/* Actions for this concept */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-500">Connected Hubs</span>

              {onGoToQuiz && (
                <button
                  onClick={() => onGoToQuiz(selectedNode.label, summary.subject)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all cursor-pointer font-heading"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Quiz on this Node ❓</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary Insight strip */}
      {graphData.summaryInsights && (
        <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200 flex items-center gap-2.5">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>{graphData.summaryInsights}</span>
        </div>
      )}
    </div>
  );
};
