import { useState } from 'react';
import { Link } from 'react-router-dom';
import RiskBadge from './RiskBadge';
import Button from './ui/Button';

export default function ClaimsTable({ claims, onReviewClick, showReviewButton = true }) {
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedClaims = [...claims].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        if (sortField === 'amount') {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        }
        if (sortField === 'date') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const headers = [
        { key: 'id', label: 'Claim ID' },
        { key: 'patientName', label: 'Patient' },
        { key: 'provider', label: 'Provider' },
        { key: 'amount', label: 'Amount' },
        { key: 'date', label: 'Date' },
        { key: 'riskScore', label: 'Risk Score' },
    ];

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                    <tr>
                        {headers.map((header) => (
                            <th
                                key={header.key}
                                onClick={() => handleSort(header.key)}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                            >
                                {header.label}
                                {sortField === header.key && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                            </th>
                        ))}
                        {showReviewButton && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Action</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sortedClaims.map((claim) => (
                        <tr key={claim.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{claim.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{claim.patientName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{claim.provider}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${parseFloat(claim.amount).toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(claim.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <RiskBadge score={claim.riskScore} />
                            </td>
                            {showReviewButton && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link to={`/claims/${claim.id}`}>
                                        <Button size="sm" variant="outline">Review</Button>
                                    </Link>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}