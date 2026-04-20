import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiCheckCircle, FiXCircle, FiClock, FiShield, FiZap, FiDollarSign, FiPieChart, FiActivity, FiUsers, FiTarget, FiInfo } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const formatNumber = (v, isCurrency = false) => {
  if (v == null) return '—';
  if (typeof v === 'number') {
    const prefix = isCurrency ? '₹' : '';
    if (Math.abs(v) >= 1e7) return `${prefix}${(v / 1e7).toFixed(2)} Cr`;
    if (Math.abs(v) >= 1e5) return `${prefix}${(v / 1e5).toFixed(2)} L`;
    return prefix + v.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  return String(v);
};

// ─── Animated Score Ring ───
function ScoreRing({ score, size = 200, strokeWidth = 14 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  const getColor = (s) => {
    if (s >= 80) return { stroke: '#10b981', glow: 'rgba(16,185,129,0.4)', text: '#10b981' };
    if (s >= 65) return { stroke: '#3b82f6', glow: 'rgba(59,130,246,0.4)', text: '#3b82f6' };
    if (s >= 50) return { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.4)', text: '#f59e0b' };
    if (s >= 35) return { stroke: '#f97316', glow: 'rgba(249,115,22,0.4)', text: '#f97316' };
    return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.4)', text: '#ef4444' };
  };

  const colors = getColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={colors.stroke} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 12px ${colors.glow})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black tracking-tight" style={{ color: colors.text }}>
          {score}
        </span>
        <span className="text-sm text-gray-500 font-semibold mt-1 uppercase tracking-widest">Score</span>
      </div>
    </div>
  );
}

// ─── Group Progress Bar ───
function GroupBar({ name, earned, max, weight, icon, color, delay = 0 }) {
  const pct = max > 0 ? (earned / max) * 100 : 0;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 200 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="group p-5 rounded-2xl bg-linear-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-black/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: `${color}15` }}>
            <span style={{ color }} className="text-lg">{icon}</span>
          </div>
          <div>
            <span className="text-sm font-bold text-gray-200">{name}</span>
            <span className="text-xs text-gray-500 ml-2">({weight}% weight)</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-black" style={{ color }}>{earned.toFixed(1)}</span>
          <span className="text-xs text-gray-500">/{max}</span>
        </div>
      </div>
      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 10px ${color}55`,
          }}
        />
      </div>
    </div>
  );
}

function ParamRow({ param }) {
  const pct = param.maxPoints > 0 ? (param.earnedPoints / param.maxPoints) * 100 : 0;
  const getIndicator = () => {
    if (param.isIgnored) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 font-medium">IGNORED</span>;
    if (param.value == null) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 font-medium">N/A</span>;
    if (pct >= 70) return <FiCheckCircle className="text-green-500" />;
    if (pct >= 40) return <FiClock className="text-yellow-500" />;
    return <FiXCircle className="text-red-500" />;
  };
  const formatParamName = (n) => n.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-800/50 transition-colors group/row">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getIndicator()}
        <div className="min-w-0">
          <span className="text-sm font-medium text-gray-300">{formatParamName(param.name)}</span>
          <p className="text-xs text-gray-500 truncate max-w-[300px]">{param.reasoning}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-sm font-mono text-gray-400">{formatNumber(param.value)}</span>
        <div className="w-16 text-right">
          <span className={`text-sm font-bold ${pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
            {param.earnedPoints.toFixed(1)}/{param.maxPoints}
          </span>
        </div>
      </div>
    </div>
  );
}

function ExceptionCard({ exception }) {
  const isPositive = exception.adjustment > 0;
  return (
    <div className={`p-4 rounded-xl border ${isPositive ? 'bg-green-950/30 border-green-800/50' : 'bg-red-950/30 border-red-800/50'} transition-all hover:scale-[1.01]`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-900/40' : 'bg-red-900/40'} mt-0.5`}>
          {isPositive ? <FiCheckCircle className="text-green-400" /> : <FiAlertTriangle className="text-red-400" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-200">{exception.rule}</h4>
            <span className={`text-sm font-black ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{exception.adjustment} pts
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{exception.reasoning}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtext, icon }) {
  return (
    <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-all group/metric">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-500 group-hover/metric:text-blue-400 transition-colors">{icon}</span>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-100">
        {typeof value === 'number' && icon.type === FiDollarSign
          ? formatNumber(value, true)
          : formatNumber(value)}
      </p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

export default function StockAnalysis() {
  const { symbol } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [mlAnalysis, setMlAnalysis] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const analysisRes = await fetch(`http://127.0.0.1:8000/stocks/${symbol}/analysis`);
        if (!analysisRes.ok) throw new Error('Failed to fetch analysis');
        const data = await analysisRes.json();
        if (data.status === 'error') throw new Error(data.message);
        setAnalysis(data);

        try {
          setMlLoading(true);
          const mlRes = await fetch(`http://127.0.0.1:8000/stocks/${symbol}/backtest`);
          if (mlRes.ok) {
            const mlData = await mlRes.json();
            if (mlData.status === 'success') {
              setMlAnalysis(mlData);
            }
          }
        } catch (e) {
          console.error("ML Backtest fetch failed", e);
        } finally {
          setMlLoading(false);
        }
      } catch (err) {
        setError(err.message || 'Error fetching analysis');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [symbol]);

  const GROUP_META = useMemo(() => ({
    'Profitability': { icon: <FiDollarSign />, color: '#a855f7' },
    'Growth': { icon: <FiTrendingUp />, color: '#3b82f6' },
    'Financial Health': { icon: <FiShield />, color: '#10b981' },
    'Valuation': { icon: <FiTarget />, color: '#f59e0b' },
    'Ownership': { icon: <FiUsers />, color: '#f97316' },
    'Efficiency': { icon: <FiZap />, color: '#ef4444' },
  }), []);

  const getRatingBadge = (rating) => {
    const map = {
      'Strong': { bg: 'bg-green-900/40', border: 'border-green-700/50', text: 'text-green-400' },
      'Moderate-Strong': { bg: 'bg-blue-900/40', border: 'border-blue-700/50', text: 'text-blue-400' },
      'Moderate': { bg: 'bg-yellow-900/40', border: 'border-yellow-700/50', text: 'text-yellow-400' },
      'Weak-Moderate': { bg: 'bg-orange-900/40', border: 'border-orange-700/50', text: 'text-orange-400' },
      'Weak': { bg: 'bg-red-900/40', border: 'border-red-700/50', text: 'text-red-400' },
    };
    const style = map[rating] || map['Moderate'];
    return `${style.bg} ${style.border} ${style.text}`;
  };

  const getTimingBadge = (signal) => {
    const map = {
      'Strong Entry': { bg: 'bg-green-900/40', border: 'border-green-700/50', text: 'text-green-400', icon: <FiTrendingUp /> },
      'Good Entry': { bg: 'bg-blue-900/40', border: 'border-blue-700/50', text: 'text-blue-400', icon: <FiTrendingUp /> },
      'Moderate': { bg: 'bg-yellow-900/40', border: 'border-yellow-700/50', text: 'text-yellow-400', icon: <FiClock /> },
      'Neutral': { bg: 'bg-gray-800/40', border: 'border-gray-700/50', text: 'text-gray-400', icon: <FiClock /> },
      'Avoid': { bg: 'bg-red-900/40', border: 'border-red-700/50', text: 'text-red-400', icon: <FiXCircle /> },
    };
    return map[signal] || map['Neutral'];
  };

  // ─── Loading ───
  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-900 rounded-full animate-spin border-t-blue-500"></div>
          <div className="w-14 h-14 border-4 border-purple-900 rounded-full animate-spin border-t-purple-500 absolute top-3 left-3" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="text-gray-400 mt-6 font-medium animate-pulse">Analyzing {symbol}...</p>
        <p className="text-gray-600 text-sm mt-2">Running Financial Intelligence Engine</p>
      </div>
    </div>
  );

  // ─── Error ───
  if (error || !analysis) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
        <FiAlertTriangle className="text-red-500 text-4xl mx-auto mb-4" />
        <p className="text-red-400 text-lg font-bold mb-2">Analysis Failed</p>
        <p className="text-gray-500 mb-6">{error || 'Could not complete analysis'}</p>
        <Link to={`/stocks/${symbol}`} className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors">
          Back to Stock
        </Link>
      </div>
    </div>
  );

  const f = analysis.fundamentals;
  const timing = getTimingBadge(analysis.timingSignal);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-28 md:pt-32 pb-16 relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <Link to={`/stocks/${symbol}`} className="inline-flex items-center text-gray-400 hover:text-white transition-colors group">
              <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to {symbol.toUpperCase()}
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter">{analysis.symbol}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRatingBadge(analysis.rating)}`}>
                  {analysis.rating}
                </span>
              </div>
              <p className="text-xl text-gray-400 font-medium mb-1">{analysis.name}</p>
              <p className="text-sm text-gray-600 mb-6">{analysis.sector}</p>

              {/* Timing */}
              <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border ${timing.bg} ${timing.border} ${timing.text} mb-4`}>
                {timing.icon}
                <span className="font-bold text-sm">{analysis.timingSignal}</span>
              </div>
              {analysis.timingReasoning && (
                <p className="text-xs text-gray-500 mt-1 max-w-sm">{analysis.timingReasoning}</p>
              )}
            </div>

            {/* Center: Score Ring */}
            <div className="flex justify-center items-center">
              <ScoreRing score={analysis.totalScore} size={220} />
            </div>

            {/* Right: Sector Insights */}
            <div className="lg:col-span-1 flex flex-col h-full min-h-[320px]">
              <div className="p-6 rounded-2xl bg-linear-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 backdrop-blur-sm flex-1 flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest"><FiInfo className="inline mr-1 text-blue-500" /> Analysis Context</h3>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Sector Profile</span>
                    <span className="text-sm font-bold text-gray-200">{analysis.sectorLabel}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Scoring Methodology</span>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      This analysis uses a fundamental-first approach, evaluating profitability, growth, health, valuation, efficiency, and ownership.
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center text-xs">
                  <span className="text-gray-500">Fundamental Engine</span>
                  <span className="text-gray-400 font-mono">V1.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-20 space-y-12">

        {/* Investment Details / Recommendation Bar moved here */}
        <div className="p-5 rounded-2xl bg-linear-to-r from-gray-900/80 to-gray-900/40 border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              INVESTMENT RECOMMENDATION
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed mb-1">{analysis.suggestion}</p>
            {analysis.sectorNotes && (
              <p className="text-xs text-blue-400/80 mt-2 italic">{analysis.sectorNotes}</p>
            )}
          </div>
          <div className="flex items-center gap-8 shrink-0 border-l border-gray-800 pl-8">
            <div>
              <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">ALLOCATION</span>
              <span className="text-xl font-black text-blue-400">{analysis.allocationPercent}</span>
            </div>
          </div>
        </div>



        {/* ── Group Scores Overview ── */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
            Scoring Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.groups.map((g, i) => {
              const gName = g.groupName || g.name;
              const meta = GROUP_META[gName] || { icon: <FiActivity />, color: '#6b7280' };
              return (
                <div key={gName} onClick={() => setExpandedGroup(expandedGroup === gName ? null : gName)} className="cursor-pointer">
                  <GroupBar
                    name={gName}
                    earned={g.earnedPoints}
                    max={g.maxPoints}
                    weight={g.weight}
                    icon={meta.icon}
                    color={meta.color}
                    delay={i * 100}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Expanded Group Details ── */}
        {expandedGroup && (
          <section className="animate-in fade-in slide-in-from-top duration-300">
            <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-200">
                  {(() => {
                    const meta = GROUP_META[expandedGroup] || { icon: <FiActivity />, color: '#6b7280' };
                    return <span className="flex items-center gap-2" style={{ color: meta.color }}>{meta.icon} {expandedGroup} — Detailed Breakdown</span>;
                  })()}
                </h3>
                <button onClick={() => setExpandedGroup(null)} className="text-gray-500 hover:text-white text-sm">✕ Close</button>
              </div>
              <div className="divide-y divide-gray-800/50">
                {analysis.groups.find(g => (g.groupName || g.name) === expandedGroup)?.parameters.map((p) => (
                  <ParamRow key={`${expandedGroup}-${p.name}`} param={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Multi-Horizon AI System ── */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
            Quantitative AI System (30-Day Horizon)
          </h2>
          {mlLoading ? (
            <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 text-center text-gray-400 animate-pulse">Running 3 Independent ML Pipelines (1D, 7D, 30D)...</div>
          ) : mlAnalysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Column: Final Signal & Risk Level */}
              <div className="lg:col-span-1 space-y-4">
                <div className="p-6 rounded-2xl bg-linear-to-br from-gray-900 to-gray-950 border border-gray-800 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">FINAL STRATEGY SIGNAL</span>
                  <h3 className={`text-4xl font-black mb-1 ${['BUY', 'BUY DIP'].includes(mlAnalysis.finalSignal) ? 'text-green-400' : mlAnalysis.finalSignal === 'AVOID' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {mlAnalysis.finalSignal} {['BUY', 'BUY DIP'].includes(mlAnalysis.finalSignal) ? '🚀' : ''}
                  </h3>
                </div>

                <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Risk Level</span>
                    <span className={`text-sm font-bold ${mlAnalysis.riskLevel === 'LOW' ? 'text-green-400' : mlAnalysis.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {mlAnalysis.riskLevel}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-800/50">
                      <span className="text-sm text-gray-400">ML Model Accuracy</span>
                      <span className="text-sm font-bold text-purple-400">{mlAnalysis.modelAccuracy}%</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-800/50">
                      <span className="text-sm text-gray-400">Suggested Allocation</span>
                      <span className="text-sm font-bold text-blue-400">{mlAnalysis.suggestedAllocation}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Middle Column: Signal Breakdown & Expected Returns */}
              <div className="lg:col-span-1 space-y-4">
                <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800">
                  <h4 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
                    <FiActivity className="text-blue-400" /> Signal Breakdown
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">1-Day (Short-term):</span>
                      <strong className={mlAnalysis.multiHorizon?.['1d']?.signal === 'BUY' ? 'text-green-400' : 'text-red-400'}>{mlAnalysis.multiHorizon?.['1d']?.signal} {mlAnalysis.multiHorizon?.['1d']?.signal === 'BUY' ? '🟢' : '🔴'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">7-Day (Mid-term):</span>
                      <strong className={mlAnalysis.multiHorizon?.['7d']?.signal === 'BUY' ? 'text-green-400' : 'text-red-400'}>{mlAnalysis.multiHorizon?.['7d']?.signal} {mlAnalysis.multiHorizon?.['7d']?.signal === 'BUY' ? '🟢' : '🔴'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">30-Day (Long-term):</span>
                      <strong className={mlAnalysis.multiHorizon?.['30d']?.signal === 'BUY' ? 'text-green-400' : 'text-red-400'}>{mlAnalysis.multiHorizon?.['30d']?.signal} {mlAnalysis.multiHorizon?.['30d']?.signal === 'BUY' ? '🟢' : '🔴'}</strong>
                    </div>
                  </div>
                  <div className="mt-4 p-2 rounded bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400 flex items-center gap-2">
                    <span>⚠️</span> <span>Short-term opportunity (higher risk)</span>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800">
                  <h4 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
                    <FiDollarSign className="text-green-400" /> Expected Returns (Multi-Horizon)
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-300 font-semibold">1-Day (Short-term):</span>
                      <div className="ml-2 mt-1">
                        <p className="text-xs text-gray-400">→ Range: <span className="font-mono text-green-400">{mlAnalysis.multiHorizon?.['1d']?.expectedReturn}</span></p>
                        <p className="text-xs text-gray-400">→ Confidence: <span className={mlAnalysis.multiHorizon?.['1d']?.confidence === 'HIGH' ? 'text-green-400' : mlAnalysis.multiHorizon?.['1d']?.confidence === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'}>{mlAnalysis.multiHorizon?.['1d']?.confidence} {mlAnalysis.multiHorizon?.['1d']?.confidence === 'LOW' && '⚠️'}</span></p>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-300 font-semibold">7-Day (Swing):</span>
                      <div className="ml-2 mt-1">
                        <p className="text-xs text-gray-400">→ Range: <span className="font-mono text-green-400">{mlAnalysis.multiHorizon?.['7d']?.expectedReturn}</span></p>
                        <p className="text-xs text-gray-400">→ Confidence: <span className={mlAnalysis.multiHorizon?.['7d']?.confidence === 'HIGH' ? 'text-green-400' : mlAnalysis.multiHorizon?.['7d']?.confidence === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'}>{mlAnalysis.multiHorizon?.['7d']?.confidence}</span></p>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-300 font-semibold">30-Day (Primary):</span>
                      <div className="ml-2 mt-1">
                        <p className="text-xs text-gray-400">→ Range: <span className="font-mono text-green-400">{mlAnalysis.multiHorizon?.['30d']?.expectedReturn}</span></p>
                        <p className="text-xs text-gray-400">→ Confidence: <span className={mlAnalysis.multiHorizon?.['30d']?.confidence === 'HIGH' ? 'text-green-400' : mlAnalysis.multiHorizon?.['30d']?.confidence === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'}>{mlAnalysis.multiHorizon?.['30d']?.confidence}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-center gap-2">
                    <span>⚠️</span> <span>Estimated range, not guaranteed</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Why this signal (Explainability) & Performance */}
              <div className="lg:col-span-1 space-y-4">
                <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800">
                  <h4 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
                    <FiZap className="text-purple-400" /> Reason (Why this signal?)
                  </h4>
                  <ul className="space-y-2">
                    {mlAnalysis.reasons?.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                        <span className="text-green-500 mt-0.5">✔</span> {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Performance</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs text-gray-500 mb-1">Win Rate</span>
                      <span className="text-sm font-bold text-white">{mlAnalysis.winRate}%</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-1">Max Drawdown</span>
                      <span className="text-sm font-bold text-red-400">{mlAnalysis.maxDrawdown}%</span>
                    </div>
                    <div className="col-span-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500">Strategy vs Market</span>
                      <span className="text-sm font-bold text-blue-400">{mlAnalysis.strategySumReturn}% <span className="text-gray-600 font-normal">vs</span> {mlAnalysis.buyAndHoldReturn}%</span>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 text-center text-gray-500">Backtest data unavailable.</div>
          )}
        </section>

        {/* ── Action Matrix ── */}
        {mlAnalysis && !mlLoading && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
              Execution Action Matrix
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-linear-to-br from-gray-900 to-gray-950 border border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">If You DON'T Hold Shares</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-3xl font-black ${['STRONG_BUY', 'BUY'].includes(mlAnalysis.actionNotHolding?.action) ? 'text-green-400' : mlAnalysis.actionNotHolding?.action === 'AVOID' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {mlAnalysis.actionNotHolding?.action?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-3"><strong>Reason:</strong> {mlAnalysis.actionNotHolding?.reason}</p>
              </div>
              <div className="p-6 rounded-2xl bg-linear-to-br from-gray-900 to-gray-950 border border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">If You CURRENTLY Hold Shares</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-3xl font-black ${['HOLD'].includes(mlAnalysis.actionHolding?.action) ? 'text-blue-400' : ['EXIT_ALL', 'PARTIAL_EXIT'].includes(mlAnalysis.actionHolding?.action) ? 'text-red-400' : 'text-yellow-400'}`}>
                    {mlAnalysis.actionHolding?.action?.replace('_', ' ')}
                    {mlAnalysis.actionHolding?.size && ` (${mlAnalysis.actionHolding.size})`}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-3"><strong>Reason:</strong> {mlAnalysis.actionHolding?.reason}</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Fundamentals Grid ── */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
            Raw Fundamentals
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <MetricCard key="roe" label="ROE" value={f.roe !== null && f.roe !== undefined ? `${f.roe}%` : null} icon={<FiDollarSign />} subtext="Return on Equity" />
            <MetricCard key="pat" label="PAT Margin" value={f.patMargin !== null ? `${f.patMargin}%` : null} icon={<FiPieChart />} subtext="Profit After Tax" />
            <MetricCard key="sales" label="Sales Growth" value={f.salesGrowth !== null ? `${f.salesGrowth}%` : null} icon={<FiTrendingUp />} subtext="YoY" />
            <MetricCard key="profit" label="Profit Growth" value={f.profitGrowth !== null ? `${f.profitGrowth}%` : null} icon={<FiTrendingUp />} subtext="YoY" />
            <MetricCard key="eps" label="EPS" value={f.eps} icon={<FiDollarSign />} subtext="Earnings/Share" />
            <MetricCard key="de" label="D/E Ratio" value={f.debtEquity} icon={<FiShield />} subtext="Debt to Equity" />
            <MetricCard key="cash" label="Cash" value={f.cash} icon={<FiDollarSign />} />
            <MetricCard key="debt" label="Tot. Debt" value={f.totalDebt} icon={<FiAlertTriangle />} />
            <MetricCard key="mcap" label="Market Cap" value={f.marketCap} icon={<FiActivity />} />
            <MetricCard key="ev" label="EV" value={f.enterpriseValue} icon={<FiTarget />} subtext="Enterprise Value" />
            <MetricCard key="pe" label="P/E" value={f.pe} icon={<FiTarget />} subtext="Trailing" />
            <MetricCard key="fpe" label="Fwd P/E" value={f.forwardPe} icon={<FiTarget />} subtext="Forward" />
            <MetricCard key="pb" label="P/B" value={f.pb} icon={<FiActivity />} subtext="Price to Book" />
            <MetricCard key="bv" label="Book Value" value={f.bookValue} icon={<FiDollarSign />} />
            <MetricCard key="div" label="Div Yield" value={f.dividendYield !== null ? `${f.dividendYield}%` : null} icon={<FiPieChart />} />
            <MetricCard key="price" label="Price" value={f.currentPrice} icon={<FiDollarSign />} subtext="Current" />

          </div>
        </section>

        {/* ── Exception Engine ── */}
        {analysis.exceptions && analysis.exceptions.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-red-500 rounded-full" />
              Exception Rules Triggered
              <span className="text-xs px-2 py-1 rounded-full bg-red-900/30 border border-red-800/50 text-red-400 font-medium">
                {analysis.exceptions.length} rule{analysis.exceptions.length > 1 ? 's' : ''}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.exceptions.map((ex) => (
                <ExceptionCard key={ex.rule} exception={ex} />
              ))}
            </div>
          </section>
        )}

        {/* ── Model Info Footer ── */}
        <section className="border-t border-gray-800/50 pt-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-1">🧠 Strategic Financial Intelligence Model</h3>
              <p className="text-xs text-gray-600 max-w-lg">
                Rules-based scoring engine with sector-aware adjustments, context-based dividend analysis,
                and an exception engine for edge cases. Similar to analyst-level decision systems used by institutional investors.
              </p>
            </div>
            <div className="flex gap-3 text-xs text-gray-600">
              <span className="px-3 py-1.5 rounded-full border border-gray-800 bg-gray-900/50">✅ Explainable Analysis</span>
              <span className="px-3 py-1.5 rounded-full border border-gray-800 bg-gray-900/50">🧠 Fundamental Rules Engine</span>
              <span className="px-3 py-1.5 rounded-full border border-gray-800 bg-gray-900/50">📊 6 Groups × {analysis.groups.reduce((a, g) => a + g.parameters.length, 0)} Params</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
