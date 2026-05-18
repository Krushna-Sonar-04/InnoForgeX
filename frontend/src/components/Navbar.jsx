import { useNavigate, NavLink } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Auditor';
    const userEmail = localStorage.getItem('userEmail') || 'auditor@claimshield.com';
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        navigate('/login');
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <nav className="bg-white border-b border-gray-100 px-8 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-sm">C</span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900">ClaimShield</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                                `px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                                    isActive ? 'text-gray-900 bg-gray-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`
                            }
                        >
                            Home
                        </NavLink>
                        <NavLink
                            to="/claims"
                            className={({ isActive }) =>
                                `px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                                    isActive ? 'text-gray-900 bg-gray-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`
                            }
                        >
                            Claims
                        </NavLink>
                        <NavLink
                            to="/submit-claim"
                            className={({ isActive }) =>
                                `px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                                    isActive ? 'text-gray-900 bg-gray-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`
                            }
                        >
                            Submit
                        </NavLink>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* User Profile */}
                    <div className="flex items-center gap-2" ref={profileRef}>
                        <button 
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center cursor-pointer hover:shadow-lg transition-all relative"
                        >
                            <span className="text-white font-semibold text-sm">{getInitials(userName)}</span>
                        </button>

                        {/* Profile Dropdown Menu */}
                        {showProfileMenu && (
                            <div className="absolute top-16 right-8 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in z-50">
                                {/* Profile Header */}
                                <div className="p-6 text-center border-b border-gray-100">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                                        <span className="text-white font-bold text-2xl">{getInitials(userName)}</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{userName}</h3>
                                    <p className="text-sm text-gray-500">{userEmail}</p>
                                </div>

                                {/* Logout */}
                                <div className="border-t border-gray-100 p-3">
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}