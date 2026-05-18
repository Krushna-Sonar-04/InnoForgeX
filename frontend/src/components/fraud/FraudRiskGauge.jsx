import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function FraudRiskGauge({ score }) {
    const data = [
        { name: 'Risk', value: score },
        { name: 'Remaining', value: 100 - score },
    ];
    const colors = ['#ef4444', '#e5e7eb'];
    return (
        <div className="text-center">
            <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" dataKey="value" stroke="none">
                        {data.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={colors[idx]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 text-2xl font-bold">{score} / 100</div>
            <p className="text-sm text-gray-500">Fraud Risk Score</p>
        </div>
    );
}