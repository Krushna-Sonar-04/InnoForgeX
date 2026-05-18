import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchClaimsApi, deleteAllClaimsApi } from '../api/api';

export default function Claims() {
    const [claims, setClaims] = useState([]);
    const [filteredClaims, setFilteredClaims] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const loadClaims = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetchClaimsApi();
                const data = Array.isArray(res.data) ? res.data : [];
                setClaims(data);
                setFilteredClaims(data);
            } catch (err) {
                console.error('Failed to load claims', err);
                setError('Failed to load claims. Please try again.');
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        loadClaims();
    }, []);

    useEffect(() => {
        let result = [...claims];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c => {
                const patient  = (c.patient || c.patientName || c.patient_name || '').toLowerCase();
                const provider = (c.provider || c.providerName || c.provider_name || '').toLowerCase();
                const pid      = (c.patientId || c.patient_id || '').toLowerCase();
                return (
                    String(c.id).toLowerCase().includes(term) ||
                    patient.includes(term) ||
                    provider.includes(term) ||
                    pid.includes(term)
                );
            });
        }

        if (statusFilter !== 'all') {
            result = result.filter(c => c.status === statusFilter);
        }

        setFilteredClaims(result);
    }, [searchTerm, statusFilter, claims]);

    const getStatusBadge = (status) => {
        const styles = {
            flagged: 'bg-red-50 text-red-700 border-red-100',
            pending: 'bg-blue-50 text-blue-700 border-blue-100',
            under_review: 'bg-yellow-50 text-yellow-700 border-yellow-100',
            review: 'bg-yellow-50 text-yellow-700 border-yellow-100',
            approved: 'bg-green-50 text-green-700 border-green-100',
            rejected: 'bg-red-50 text-red-700 border-red-100',
        };
        return styles[status] || styles.pending;
    };

    const handleDeleteAll = async () => {
        setDeleting(true);
        try {
            await deleteAllClaimsApi();
            setClaims([]);
            setFilteredClaims([]);
            setShowConfirm(false);
        } catch (err) {
            console.error('Failed to delete claims', err);
        } finally {
            setDeleting(false);
        }
    };

    const exportToCSV = () => {
        if (filteredClaims.length === 0) return;
        
        const headers = ['Claim ID', 'Patient Name', 'Patient ID', 'Provider', 'Provider ID', 'Amount', 'Risk Score', 'Status', 'Date'];
        const csvRows = [headers.join(',')];
        
        filteredClaims.forEach(claim => {
            const row = [
                claim.id,
                `"${claim.patient || claim.patientName || claim.patient_name || ''}"`,
                `"${claim.patientId || claim.patient_id || ''}"`,
                `"${claim.provider || claim.providerName || claim.provider_name || ''}"`,
                `"${claim.providerId || claim.provider_id || ''}"`,
                claim.amount || 0,
                `${claim.risk ?? claim.risk_score ?? 0}%`,
                claim.status,
                `"${claim.time || claim.submitted_at || ''}"`
            ];
            csvRows.push(row.join(','));
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `claims_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-5 page-transition">
            {/* Confirm Delete Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-[28px] p-8 shadow-2xl border border-gray-100 max-w-sm w-full mx-4 animate-scale-in">
                        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete All Claims?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            This will permanently delete all claims and fraud flags from the database. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                disabled={deleting}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Deleting...</>
                                ) : 'Delete All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Claims Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Review and manage insurance claims</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all text-sm font-medium flex items-center gap-2 border border-red-100"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear All
                    </button>
                    <button
                        onClick={loadClaims}
                        className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all text-sm font-medium flex items-center gap-2 border border-gray-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                    <Link to="/submit-claim">
                        <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-sm font-medium flex items-center gap-2 hover-lift shadow-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Claim
                        </button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 hover-lift animate-slide-in-left">
                <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by claim ID, patient, or provider..."
                            className="bg-transparent outline-none text-sm w-full text-gray-700 placeholder-gray-400"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="flagged">Flagged</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                    </button>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span>Showing {filteredClaims.length} of {claims.length} claims</span>
                    <button onClick={exportToCSV} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Claims List */}
            <div className="bg-white rounded-[28px] shadow-sm border border-gray-100 overflow-hidden hover-lift animate-slide-in-right">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Claim</th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-50">
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} className="py-4 px-6">
                                                <div className="h-4 bg-gray-100 rounded skeleton" style={{ width: j === 0 ? '80px' : j === 3 ? '60px' : '100px' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : error ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-red-500 text-sm">{error}</td>
                                </tr>
                            ) : filteredClaims.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                                        {searchTerm || statusFilter !== 'all' ? 'No claims match your filters.' : 'No claims found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredClaims.map((claim, idx) => {
                                    // Normalize field names — backend may use different keys
                                    const patientName = claim.patient || claim.patientName || claim.patient_name || '—';
                                    const patientId   = claim.patientId || claim.patient_id || '—';
                                    const provider    = claim.provider || claim.providerName || claim.provider_name || '—';
                                    const providerId  = claim.providerId || claim.provider_id || '';
                                    const amount      = claim.amount || 0;
                                    const risk        = claim.risk ?? claim.risk_score ?? 0;
                                    const status      = claim.status || 'pending';
                                    const date        = claim.time || claim.submitted_at || claim.service_date;

                                    return (
                                        <tr
                                            key={claim.id}
                                            className="border-b border-gray-50 hover:bg-gray-50 transition-all animate-fade-in"
                                            style={{ animationDelay: `${idx * 0.05}s`, opacity: 0 }}
                                        >
                                            <td className="py-4 px-6">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{claim.id}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {date ? new Date(date).toLocaleDateString() : '—'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div>
                                                    <div className="text-sm text-gray-900">{patientName}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{patientId}</div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div>
                                                    <div className="text-sm text-gray-700 max-w-[200px] truncate">{provider}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{providerId}</div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-sm font-semibold text-gray-900">${amount.toLocaleString()}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${risk >= 70 ? 'bg-red-500' : risk >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                            style={{ width: `${risk}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 w-8">{risk}%</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(status)}`}>
                                                    {status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <Link to={`/claims/${claim.id}`}>
                                                    <button className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors group flex items-center gap-1">
                                                        View
                                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
