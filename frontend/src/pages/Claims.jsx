import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Claims() {
    const [claims, setClaims] = useState([]);
    const [filteredClaims, setFilteredClaims] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const mockClaims = [
            { id: 'CLM-10042', patient: 'Emily Rodriguez', provider: 'Sunrise Medical Group', amount: 12450, date: '2025-05-15', risk: 94, status: 'flagged', location: 'California' },
            { id: 'CLM-10038', patient: 'Michael Chen', provider: 'Advanced Orthopedics', amount: 8750, date: '2025-05-14', risk: 88, status: 'pending', location: 'New York' },
            { id: 'CLM-10035', patient: 'Sarah Johnson', provider: 'City General Hospital', amount: 15200, date: '2025-05-12', risk: 91, status: 'flagged', location: 'Texas' },
            { id: 'CLM-10029', patient: 'David Kim', provider: 'Metro Physicians', amount: 5300, date: '2025-05-10', risk: 76, status: 'pending', location: 'Florida' },
            { id: 'CLM-10022', patient: 'Lisa Brown', provider: 'Wellness Clinic', amount: 21800, date: '2025-05-08', risk: 95, status: 'review', location: 'Illinois' },
            { id: 'CLM-10019', patient: 'James Wilson', provider: 'Heart Specialists', amount: 3450, date: '2025-05-05', risk: 32, status: 'approved', location: 'Ohio' },
            { id: 'CLM-10015', patient: 'Maria Garcia', provider: 'Family Care Center', amount: 2100, date: '2025-05-03', risk: 45, status: 'pending', location: 'Arizona' },
            { id: 'CLM-10008', patient: 'Robert Taylor', provider: 'Ortho Center', amount: 7800, date: '2025-04-28', risk: 68, status: 'flagged', location: 'Nevada' },
        ];
        setClaims(mockClaims);
        setFilteredClaims(mockClaims);
    }, []);

    useEffect(() => {
        let result = [...claims];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.id.toLowerCase().includes(term) ||
                c.patient.toLowerCase().includes(term) ||
                c.provider.toLowerCase().includes(term)
            );
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
            review: 'bg-yellow-50 text-yellow-700 border-yellow-100',
            approved: 'bg-green-50 text-green-700 border-green-100',
        };
        return styles[status] || styles.pending;
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-5 page-transition">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Claims Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Review and manage insurance claims</p>
                </div>
                <Link to="/submit-claim">
                    <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-sm font-medium flex items-center gap-2 hover-lift shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Claim
                    </button>
                </Link>
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
                        <option value="review">Under Review</option>
                        <option value="approved">Approved</option>
                    </select>
                    <button className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                    </button>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span>Showing {filteredClaims.length} of {claims.length} claims</span>
                    <button className="hover:text-gray-900 transition-colors">Export</button>
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
                            {filteredClaims.map((claim, idx) => (
                                <tr 
                                    key={claim.id} 
                                    className="border-b border-gray-50 hover:bg-gray-50 transition-all animate-fade-in"
                                    style={{ animationDelay: `${idx * 0.05}s`, opacity: 0 }}
                                >
                                    <td className="py-4 px-6">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{claim.id}</div>
                                            <div className="text-xs text-gray-500">{new Date(claim.date).toLocaleDateString()}</div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div>
                                            <div className="text-sm text-gray-900">{claim.patient}</div>
                                            <div className="text-xs text-gray-500">{claim.location}</div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="text-sm text-gray-700 max-w-[200px] truncate">{claim.provider}</div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="text-sm font-semibold text-gray-900">${claim.amount.toLocaleString()}</div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                                                <div 
                                                    className={`h-full transition-all duration-500 ${claim.risk >= 70 ? 'bg-red-500' : claim.risk >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                    style={{ width: `${claim.risk}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 w-8">{claim.risk}%</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(claim.status)}`}>
                                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
