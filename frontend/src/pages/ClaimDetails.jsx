import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchClaimByIdApi, fetchClaimFraudExplanationApi, updateClaimStatusApi } from '../api/api';

// Normalize raw API claim object into a consistent shape
function normalizeClaim(raw) {
    return {
        id:              raw.id,
        patientName:     raw.patientName  || raw.patient_name  || raw.patient  || raw.patientId  || '—',
        patientId:       raw.patientId    || raw.patient_id    || '—',
        providerName:    raw.providerName || raw.provider_name || raw.provider || raw.providerId || '—',
        providerId:      raw.providerId   || raw.provider_id   || '—',
        providerNpi:     raw.providerNpi  || raw.npi           || '—',
        providerSpecialty: raw.providerSpecialty || raw.specialty || '—',
        serviceCode:     raw.procedure_code || raw.serviceCode || raw.procedureCode || '—',
        diagnosisCode:   raw.diagnosis    || raw.diagnosisCode || raw.diagnosis_code || '—',
        amount:          raw.amount       || 0,
        dateOfService:   raw.service_date || raw.serviceDate   || raw.time || null,
        dateSubmitted:   raw.submitted_at || raw.dateSubmitted || raw.time || null,
        riskScore:       raw.risk         || raw.risk_score    || 0,
        riskLevel:       raw.riskLevel    || raw.risk_level    || 'low',
        status:          raw.status       || 'pending',
        aiSummary:       raw.ai_summary   || raw.description   || '',
    };
}

// Map severity string → numeric weight for the progress bar
function severityToWeight(severity) {
    if (!severity) return 20;
    const s = severity.toUpperCase();
    if (s === 'HIGH')   return 80;
    if (s === 'MEDIUM') return 50;
    return 20;
}

// Compute processing time in days between two date strings
function processingDays(submitted, service) {
    try {
        const a = new Date(submitted);
        const b = new Date(service);
        if (isNaN(a) || isNaN(b)) return null;
        const diff = Math.abs(Math.round((a - b) / (1000 * 60 * 60 * 24)));
        return diff;
    } catch {
        return null;
    }
}

function formatDate(val) {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d) ? val : d.toLocaleDateString();
}

export default function ClaimDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [claim, setClaim] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [claimRes, expRes] = await Promise.all([
                    fetchClaimByIdApi(id),
                    fetchClaimFraudExplanationApi(id).catch(() => ({ data: null })),
                ]);

                // Backend may wrap in { claim: {...} } or return the object directly
                const raw = claimRes.data?.claim || claimRes.data || {};
                setClaim(normalizeClaim(raw));

                const expData = expRes?.data;
                if (expData?.reasons?.length) {
                    setExplanation({
                        summary:      expData.summary      || 'AI detected unusual patterns in this claim.',
                        recommendation: expData.recommendation || 'Recommend manual audit.',
                        factors: expData.reasons.map(r => r.reason || r.description || String(r)),
                        riskContributors: expData.reasons.map(r => ({
                            // Use the full reason text; truncate only for display
                            name:   r.reason || r.description || 'Factor',
                            weight: r.weight != null ? r.weight : severityToWeight(r.severity),
                            severity: r.severity || 'MEDIUM',
                        })),
                    });
                } else {
                    setExplanation(null);
                }
            } catch (err) {
                console.error('Failed to load claim details', err);
                setError('Could not load claim. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleAuditDecision = async (decision) => {
        setUpdating(true);
        try {
            await updateClaimStatusApi(id, decision);
            setClaim(prev => ({ ...prev, status: decision }));
        } catch (err) {
            console.error('Update failed', err);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading claim analysis...</p>
                </div>
            </div>
        );
    }

    if (error || !claim) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">{error || 'Claim not found'}</p>
                    <button
                        onClick={() => navigate('/claims')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-all"
                    >
                        Back to Claims
                    </button>
                </div>
            </div>
        );
    }

    const getRiskColor = (score) => {
        if (score >= 70) return { bg: 'bg-red-100',    text: 'text-red-700',    stroke: '#ef4444' };
        if (score >= 40) return { bg: 'bg-yellow-100', text: 'text-yellow-700', stroke: '#f59e0b' };
        return              { bg: 'bg-green-100',  text: 'text-green-700',  stroke: '#10b981' };
    };

    const riskColor = getRiskColor(claim.riskScore);
    const isActionable = claim.status === 'pending' || claim.status === 'under_review';
    const days = processingDays(claim.dateSubmitted, claim.dateOfService);

    const statusLabel = {
        approved:     'Approved',
        rejected:     'Rejected',
        pending:      'Pending',
        under_review: 'Under Review',
        flagged:      'Flagged',
        escalated:    'Escalated',
    }[claim.status] ?? claim.status;

    const statusStyle = {
        approved:     'bg-green-100 text-green-700',
        rejected:     'bg-red-100 text-red-700',
        pending:      'bg-blue-100 text-blue-700',
        under_review: 'bg-yellow-100 text-yellow-700',
        flagged:      'bg-red-100 text-red-700',
        escalated:    'bg-orange-100 text-orange-700',
    }[claim.status] ?? 'bg-gray-100 text-gray-700';

    return (
        <div className="space-y-6 page-transition">
            {/* Header */}
            <div className="flex justify-between items-center animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Claim Analysis</h1>
                    <p className="text-gray-600 mt-1">
                        Detailed view for claim <span className="font-mono text-blue-600">{claim.id}</span>
                    </p>
                </div>
                <button
                    onClick={() => navigate('/claims')}
                    className="px-4 py-2 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-200 text-gray-700 font-medium"
                >
                    ← Back to Claims
                </button>
            </div>

            {/* Risk Banner */}
            <div className={`${riskColor.bg} rounded-2xl p-4 border border-opacity-50 animate-slide-in-left`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${riskColor.bg} rounded-xl flex items-center justify-center`}>
                            <svg className={`w-6 h-6 ${riskColor.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className={`font-bold ${riskColor.text}`}>
                                {claim.riskScore >= 70 ? 'High Risk Detected' : claim.riskScore >= 40 ? 'Medium Risk' : 'Low Risk'}
                            </h3>
                            <p className={`text-sm ${riskColor.text}`}>
                                This claim requires {claim.riskScore >= 70 ? 'immediate' : 'standard'} review
                            </p>
                        </div>
                    </div>
                    <span className={`px-4 py-2 ${riskColor.bg} ${riskColor.text} rounded-full font-bold text-lg`}>
                        {claim.riskScore}%
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Claim Information */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-slide-in-left">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Claim Information</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Claim ID</p>
                                <p className="font-mono font-semibold text-gray-800">{claim.id}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusStyle}`}>
                                    {statusLabel}
                                </span>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Patient Name</p>
                                <p className="font-semibold text-gray-800">{claim.patientName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Patient ID</p>
                                <p className="font-mono text-gray-700">{claim.patientId}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Service Code</p>
                                <p className="font-mono text-gray-700">{claim.serviceCode}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Diagnosis Code</p>
                                <p className="font-mono text-gray-700">{claim.diagnosisCode}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Claim Amount</p>
                                <p className="font-bold text-gray-800 text-lg">${claim.amount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Service Date</p>
                                <p className="text-gray-700">{formatDate(claim.dateOfService)}</p>
                            </div>
                        </div>
                        {claim.aiSummary && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-gray-500 text-sm mb-1">Description</p>
                                <p className="text-gray-700 leading-relaxed">{claim.aiSummary}</p>
                            </div>
                        )}
                    </div>

                    {/* Provider Information */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-slide-in-left animate-delay-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Provider Information</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Provider Name</p>
                                <p className="font-semibold text-gray-800">{claim.providerName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Provider ID</p>
                                <p className="font-mono text-gray-700">{claim.providerId}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">NPI Number</p>
                                <p className="font-mono text-gray-700">{claim.providerNpi}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Specialty</p>
                                <p className="text-gray-700">{claim.providerSpecialty}</p>
                            </div>
                        </div>
                    </div>

                    {/* AI Fraud Analysis */}
                    {explanation ? (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-slide-in-left animate-delay-200">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">AI Fraud Analysis</h2>
                            </div>
                            <p className="text-gray-700 mb-6 leading-relaxed">{explanation.summary}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Suspicious Factors */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Suspicious Factors</h3>
                                    <ul className="space-y-2">
                                        {explanation.factors.map((factor, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                                <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>
                                                <span>{factor}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Risk Contributors — real weights from model */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Risk Contributors</h3>
                                    <div className="space-y-3">
                                        {explanation.riskContributors.map((c, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-700 truncate max-w-[160px]" title={c.name}>{c.name}</span>
                                                    <span className={`font-semibold flex-shrink-0 ml-2 ${
                                                        c.severity === 'HIGH' ? 'text-red-600' :
                                                        c.severity === 'MEDIUM' ? 'text-yellow-600' :
                                                        'text-green-600'
                                                    }`}>{c.weight}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-700 ${
                                                            c.severity === 'HIGH' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                                                            c.severity === 'MEDIUM' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                                                            'bg-gradient-to-r from-green-400 to-emerald-400'
                                                        }`}
                                                        style={{ width: `${Math.min(c.weight, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <p className="text-sm text-blue-800">
                                    <span className="font-semibold">Recommendation:</span> {explanation.recommendation}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center text-gray-400 text-sm animate-fade-in">
                            No AI fraud explanation available for this claim.
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Risk Score Gauge */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-slide-in-right">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">Fraud Risk Score</h2>
                        <div className="flex flex-col items-center">
                            <div className="relative w-48 h-48">
                                <svg className="transform -rotate-90 w-48 h-48">
                                    <circle cx="96" cy="96" r="88" stroke="#e5e7eb" strokeWidth="16" fill="none" />
                                    <circle
                                        cx="96" cy="96" r="88"
                                        stroke={riskColor.stroke}
                                        strokeWidth="16"
                                        fill="none"
                                        strokeDasharray={`${(claim.riskScore / 100) * 553} 553`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-bold text-gray-800">{claim.riskScore}</span>
                                    <span className="text-sm text-gray-500">out of 100</span>
                                </div>
                            </div>
                            <div className="mt-6">
                                <span className={`px-6 py-2 ${riskColor.bg} ${riskColor.text} rounded-full font-semibold`}>
                                    {claim.riskScore >= 70 ? 'High Risk' : claim.riskScore >= 40 ? 'Medium Risk' : 'Low Risk'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Audit Actions */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-slide-in-right animate-delay-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Audit Actions</h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleAuditDecision('approved')}
                                disabled={updating || !isActionable}
                                className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Approve Claim
                            </button>
                            <button
                                onClick={() => handleAuditDecision('rejected')}
                                disabled={updating || !isActionable}
                                className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject Claim
                            </button>
                            <button
                                onClick={() => handleAuditDecision('escalated')}
                                disabled={updating || !isActionable}
                                className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Escalate for Review
                            </button>
                            {updating && (
                                <p className="text-center text-sm text-gray-500">Updating status...</p>
                            )}
                            {!isActionable && (
                                <p className="text-center text-sm font-medium px-3 py-2 rounded-lg bg-gray-50 text-gray-700">
                                    Decision recorded: {statusLabel}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 border border-blue-100 animate-slide-in-right animate-delay-200">
                        <h3 className="font-semibold text-gray-800 mb-3">Quick Info</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Submitted</span>
                                <span className="font-medium text-gray-800">{formatDate(claim.dateSubmitted)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Service Date</span>
                                <span className="font-medium text-gray-800">{formatDate(claim.dateOfService)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Processing Time</span>
                                <span className="font-medium text-gray-800">
                                    {days != null ? `${days} day${days !== 1 ? 's' : ''}` : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
