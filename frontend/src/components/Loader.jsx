export default function Loader({ size = 'md', fullPage = false, text = 'Loading...' }) {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center space-y-2">
            <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
            {text && <p className="text-sm text-gray-500">{text}</p>}
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
}