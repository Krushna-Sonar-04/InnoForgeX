export default function RiskBadge({ score, size = 'md' }) {
    let variant = 'low';
    if (score >= 70) variant = 'high';
    else if (score >= 40) variant = 'medium';

    const variants = {
        low: 'bg-green-100 text-green-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-red-100 text-red-800',
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
    };

    let label = `${score}%`;
    if (variant === 'low') label = `${score}% • Low Risk`;
    else if (variant === 'medium') label = `${score}% • Medium Risk`;
    else label = `${score}% • High Risk`;

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizeClasses[size]}`}>
            {label}
        </span>
    );
}