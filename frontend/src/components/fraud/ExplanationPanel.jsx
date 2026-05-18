export default function ExplanationPanel({ summary, factors, contributors }) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">AI Fraud Explanation</h2>
            <p className="text-gray-700 mb-4">{summary}</p>
            {factors && factors.length > 0 && (
                <div className="mb-4">
                    <h3 className="font-medium text-gray-800">Key Factors</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mt-2">
                        {factors.map((f, i) => (
                            <li key={i}>{f}</li>
                        ))}
                    </ul>
                </div>
            )}
            {contributors && (
                <div>
                    <h3 className="font-medium text-gray-800">Risk Contributors</h3>
                    <div className="mt-2 space-y-2">
                        {contributors.map((c, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm">
                                    <span>{c.name}</span>
                                    <span>{c.weight}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${c.weight}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}