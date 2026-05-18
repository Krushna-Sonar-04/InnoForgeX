import { useState } from 'react';

export default function DataTable({ data, columns }) {
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState('asc');

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    let sortedData = [...data];
    if (sortKey) {
        sortedData.sort((a, b) => {
            let aVal = a[sortKey];
            let bVal = b[sortKey];
            if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
            return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
        });
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                            >
                                {col.label}
                                {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sortedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                            {columns.map((col) => (
                                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}