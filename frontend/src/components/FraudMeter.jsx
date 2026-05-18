import { useEffect, useState } from 'react';

export default function FraudMeter({ score = 0, size = 120 }) {
    const [offset, setOffset] = useState(0);
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        const progress = Math.min(Math.max(score, 0), 100);
        setOffset(circumference - (progress / 100) * circumference);
    }, [score, circumference]);

    const getColor = () => {
        if (score >= 70) return '#ef4444';
        if (score >= 40) return '#f59e0b';
        return '#10b981';
    };

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                />
                {/* Foreground progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={getColor()}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
            </svg>
            <div className="absolute text-center">
                <span className="text-2xl font-bold">{score}</span>
                <span className="text-xs text-gray-500 block">Risk Score</span>
            </div>
        </div>
    );
}