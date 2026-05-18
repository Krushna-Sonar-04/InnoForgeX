import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fetchFraudSummaryApi, fetchClaimsApi } from '../api/api';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [summaryRes, claimsRes] = await Promise.all([
                    fetchFraudSummaryApi(selectedPeriod),
                    fetchClaimsApi()
                ]);

                const summary = summaryRes.data;
                // Support both 'chart_data' and 'trends' key from backend
                const chartData = summary.chart_data || summary.trends || [];

                // High risk claims: sort by risk desc, take top 5
                const allClaims = Array.isArray(claimsRes.data) ? claimsRes.data : [];
                const highRiskClaims = [...allClaims]
                    .sort((a, b) => (b.risk || 0) - (a.risk || 0))
                    .slice(0, 5);

                setData({ summary, chartData, highRiskClaims });
            } catch (err) {
                console.error('Dashboard failed to load', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [selectedPeriod]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => setSelectedPeriod(p => p)}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const { summary, chartData, highRiskClaims } = data;

    // Compute % change from last two data points
    const lastVal = chartData.length > 0 ? (chartData[chartData.length - 1]?.amount || 0) : 0;
    const prevVal = chartData.length > 1 ? (chartData[chartData.length - 2]?.amount || 0) : 0;
    let percentChange = 0;
    if (prevVal > 0) {
        percentChange = (((lastVal - prevVal) / prevVal) * 100).toFixed(1);
    } else if (lastVal > 0) {
        percentChange = 100;
    }

    // Highlight the bar with the highest amount
    const maxIdx = chartData.reduce((maxI, d, i, arr) => (d.amount > arr[maxI].amount ? i : maxI), 0);

    const stats = [
        {
            label: 'Total Claims',
            value: summary.total_claims ?? '—',
            change: summary.changes?.total_claims ?? null,
        },
        {
            label: 'Flagged',
            value: summary.flagged_claims ?? summary.flagged ?? '—',
            change: summary.changes?.flagged_claims ?? null,
        },
        {
            label: 'Fraud Rate',
            value: summary.fraud_rate != null ? `${summary.fraud_rate}%` : '—',
            change: summary.changes?.fraud_rate ?? null,
        },
        {
            label: 'Avg Risk Score',
            value: summary.avg_risk != null ? summary.avg_risk.toFixed(1) : '—',
            change: summary.changes?.avg_risk ?? null,
        },
    ];

    return (
        <div className="max-w-[1400px] mx-auto space-y-5 page-transition">
            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-5">
                {/* Claims Tracker */}
                <div className="col-span-7 bg-white rounded-[28px] p-7 shadow-sm border border-gray-100 hover-lift animate-fade-in">
                    <div className="flex items-start justify-between mb-8">
                        <div className="animate-slide-in-left">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Claims Tracker</h2>
                            </div>
                            <p className="text-sm text-gray-500 ml-12">Monitor claim submissions over time</p>
                        </div>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-gray-100 animate-slide-in-right"
                        >
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                            <option value="year">Year</option>
                        </select>
                    </div>

                    {/* Chart */}
                    {chartData.length > 0 ? (
                        <div className="relative h-64 mb-6">
                            <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium animate-bounce-in z-10">
                                ${lastVal.toLocaleString()}
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 500 }}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                        content={({ active, payload }) => {
                                            if (active && payload?.length) {
                                                return (
                                                    <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm shadow-lg">
                                                        <p className="font-semibold text-gray-900">${payload[0].value.toLocaleString()}</p>
                                                        {payload[0].payload.flagged != null && (
                                                            <p className="text-xs text-gray-500">{payload[0].payload.flagged} flagged</p>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={60}>
                                        {chartData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={index === maxIdx ? '#2563eb' : '#e5e7eb'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400 text-sm mb-6">
                            No chart data available for this period
                        </div>
                    )}

                    <div className="flex items-center gap-2 animate-fade-in animate-delay-500">
                        <div className="text-4xl font-bold text-gray-900">
                            {percentChange > 0 ? '+' : ''}{percentChange}%
                        </div>
                        <div className="text-sm text-gray-500 mt-2">vs previous period</div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-span-5 space-y-5">
                    {/* High Risk Claims */}
                    <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 hover-lift animate-slide-in-right">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-semibold text-gray-900">High Risk Claims</h3>
                            <Link to="/claims" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">See all</Link>
                        </div>
                        <div className="space-y-3">
                            {highRiskClaims.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">No claims found</p>
                            ) : (
                                highRiskClaims.map((claim, idx) => (
                                    <Link
                                        key={claim.id}
                                        to={`/claims/${claim.id}`}
                                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-all group animate-fade-in"
                                        style={{ animationDelay: `${idx * 0.08}s`, opacity: 0 }}
                                    >
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 ${
                                            (claim.risk || 0) >= 70 ? 'bg-red-50' : 'bg-blue-50'
                                        }`}>
                                            <svg className={`w-5 h-5 ${(claim.risk || 0) >= 70 ? 'text-red-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {claim.patient || claim.patientName || `Claim #${claim.id}`}
                                                </p>
                                                {(claim.risk || 0) >= 70 && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-md flex-shrink-0">
                                                        {claim.risk}%
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                ${(claim.amount || 0).toLocaleString()} •{' '}
                                                {claim.time ? new Date(claim.time).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* AI CTA */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-[28px] p-6 border border-blue-100 hover-lift animate-slide-in-right animate-delay-200">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">AI Fraud Detection</h3>
                        <p className="text-sm text-gray-600 mb-5">Get instant fraud risk analysis</p>
                        <Link
                            to="/submit-claim"
                            className="flex items-center justify-between w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all group"
                        >
                            <span className="text-sm font-medium">Submit New Claim</span>
                            <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-5">
                {stats.map((stat, idx) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 hover-lift animate-scale-in"
                        style={{ animationDelay: `${idx * 0.1}s`, opacity: 0 }}
                    >
                        <span className="text-sm text-gray-500">{stat.label}</span>
                        <div className="text-3xl font-bold text-gray-900 my-2">{stat.value}</div>
                        {stat.change != null && (
                            <div className={`text-xs font-medium ${
                                String(stat.change).startsWith('+') ? 'text-green-600' :
                                String(stat.change).startsWith('-') ? 'text-red-600' :
                                'text-gray-500'
                            }`}>
                                {stat.change}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
