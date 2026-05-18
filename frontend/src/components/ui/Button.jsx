export default function Button({ children, variant = 'primary', size = 'md', fullWidth = false, disabled = false, type = 'button', onClick, className = '' }) {
    const base = 'rounded-2xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm hover:shadow-md';
    const variants = {
        primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
        success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
        warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
        outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white',
    };
    const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5', lg: 'px-7 py-3.5 text-lg' };
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            {children}
        </button>
    );
}