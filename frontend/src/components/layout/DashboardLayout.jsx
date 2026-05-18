import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';

export default function DashboardLayout() {
    return (
        <div className="min-h-screen bg-[#f8f9fc]">
            <Navbar />
            <main className="p-8">
                <Outlet />
            </main>
        </div>
    );
}