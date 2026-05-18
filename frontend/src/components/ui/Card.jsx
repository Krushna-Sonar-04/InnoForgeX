export default function Card({ children, title, className = '' }) {
    return (
        <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all ${className}`}>
            {title && <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>}
            {children}
        </div>
    );
}