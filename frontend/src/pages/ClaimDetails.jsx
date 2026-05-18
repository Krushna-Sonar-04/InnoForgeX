import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchClaimByIdApi, fetchClaimFraudExplanationApi, updateClaimStatusApi } from '../api/api';

export default function ClaimDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [claim, setClaim] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Mock data for demo
                await new Promise(resolve => setTimeout(resolve, 500));
                
                setClaim({
                    id: id,
                    patientName: 'Emily Rodriguez',
                    patientId: 'P-12345',
                    providerName: 'Sunrise Medical Group',
                    providerId: 'PROV-9876',
                    providerNpi: '1234567890',
                    serviceCode: '99213',
                    diagnosisCode: 'M54.5',
                    diagnosisDescription: 'Low back pain',
                    amount: 12450.00,
                    dateOfService: '2025-05-15',
                    dateSubmitted: '2025-05-16',
                    riskScore: 94,
                    riskLevel: 'high',
                    status: 'pending',
                    description: 'Patient presented with chronic back pain. MRI recommended.',
                });
                
                setExplanation({
                    summary: 'High anomaly score due to billing frequency and code mismatch. This claim shows strong indicators of potential fraud.',
                    factors: [
                        'Provider billed 99213 (office visit) 12 times on same day for different patients – unusual pattern.',
                        'Diagnosis code M54.5 (low back pain) typically maps to lower complexity codes than 99213.',
                        'Claim amount is 340% above regional average for this service and diagnosis.',
                        'Provider has a history of upcoding in previous audits (3 flagged claims in last 6 months).',
                    ],
                    riskContributors: [
                        { name: 'Billing Frequency', weight: 45 },
                        { name: 'Code Inconsistency', weight: 30 },
                        { name: 'Amount Outlier', weight: 15 },
                        { name: 'Provider History', weight: 10 },
                    ],
                    recommendation: 'Recommend manual audit and possible recoupment.',
                });
            } catch (err) {
                console.error('Failed to load claim details', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleAuditDecision = async (decision) => {
        setUpdating(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            setClaim((prev) => ({ ...prev, status: decision }));
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

    if (!claim) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Claim not found</p>
                    <button 
                        onClick={() => navigate('/claims')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-all shadow-sm hover:shadow-md"
                    >
                        Back to Claims
                    </button>
                </div>
            </div>
        );
    }

    const getRiskColor = (score) => {
        if (score >= 70) return { bg: 'bg-red-100', text: 'text-red-700', stroke: '#ef4444' };
        if (score >= 40) return { bg: 'bg-yellow-100', text: 'text-yellow-700', stroke: '#f59e0b' };
        return { bg: 'bg-green-100', text: 'text-green-700', stroke: '#10b981' };
    };

    const riskColor = getRiskColor(claim.riskScore);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
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

            {/* Status Banner */}
            <div className={`${riskColor.bg} rounded-2xl p-4 border ${riskColor.bg.replace('100', '200')}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${riskColor.bg.replace('100', '200')} rounded-xl flex items-center justify-center`}>
                            <svg className={`w-6 h-6 ${riskColor.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className={`font-bold ${riskColor.text}`}>
                                {claim.riskScore >= 70 ? 'High Risk Detected' : claim.riskScore >= 40 ? 'Medium Risk' : 'Low Risk'}
                            </h3>
                            <p className={`text-sm ${riskColor.text.replace('700', '600')}`}>
                                This claim requires {claim.riskScore >= 70 ? 'immediate' : 'standard'} review
                            </p>
                        </div>
                    </div>
                    <span className={`px-4 py-2 ${riskColor.bg.replace('100', '200')} ${riskColor.text} rounded-full font-bold text-lg`}>
                        {claim.riskScore}%
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Claim Information */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Claim Information</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Claim ID</p>
                                <p className="font-mono font-semibold text-gray-800">{claim.id}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                    claim.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    claim.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    claim.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
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
                                <p className="text-gray-700">{new Date(claim.dateOfService).toLocaleDateString()}</p>
                            </div>
                        </div>
                        {claim.description && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-gray-500 text-sm mb-1">Description</p>
                                <p className="text-gray-700">{claim.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Provider Information */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
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
                                <p className="text-gray-700">General Practice</p>
                            </div>
                        </div>
                    </div>

                    {/* AI Fraud Explanation */}
                    {explanation && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
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
                                {/* Key Factors */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Suspicious Factors</h3>
                                    <ul className="space-y-2">
                                        {explanation.factors.map((factor, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                                <span className="text-red-500 mt-1">•</span>
                                                <span>{factor}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Risk Contributors */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Risk Contributors</h3>
                                    <div className="space-y-3">
                                        {explanation.riskContributors.map((contributor, idx) => (
                                            <div key={idx}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-700">{contributor.name}</span>
                                                    <span className="font-semibold text-gray-800">{contributor.weight}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${contributor.weight}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <p className="text-sm text-blue-800">
                                    <span className="font-semibold">Recommendation:</span> {explanation.recommendation}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Actions */}
                <div className="space-y-6">
                    {/* Risk Score Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">Fraud Risk Score</h2>
                        <div className="flex flex-col items-center">
                            <div className="relative w-48 h-48">
                                <svg className="transform -rotate-90 w-48 h-48">
                                    <circle cx="96" cy="96" r="88" stroke="#e5e7eb" strokeWidth="16" fill="none" />
                                    <circle 
                                        cx="96" 
                                        cy="96" 
                                        r="88" 
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
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Audit Actions</h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleAuditDecision('approved')}
                                disabled={updating || claim.status !== 'pending'}
                                className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Approve Claim
                            </button>
                            <button
                                onClick={() => handleAuditDecision('rejected')}
                                disabled={updating || claim.status !== 'pending'}
                                className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject Claim
                            </button>
                            <button
                                onClick={() => handleAuditDecision('escalated')}
                                disabled={updating || claim.status !== 'pending'}
                                className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Escalate for Review
                            </button>
                            {updating && <p className="text-center text-sm text-gray-600">Updating status...</p>}
                            {claim.status !== 'pending' && (
                                <p className="text-center text-sm text-gray-600 mt-2">
                                    This claim has been {claim.status}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 border border-blue-100">
                        <h3 className="font-semibold text-gray-800 mb-3">Quick Info</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Submitted</span>
                                <span className="font-medium text-gray-800">{new Date(claim.dateSubmitted).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Service Date</span>
                                <span className="font-medium text-gray-800">{new Date(claim.dateOfService).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Processing Time</span>
                                <span className="font-medium text-gray-800">2 days</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
