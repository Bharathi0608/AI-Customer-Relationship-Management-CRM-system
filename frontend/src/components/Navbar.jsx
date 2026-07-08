export default function Navbar() {
    return (
        <nav className="bg-blue-700 text-white shadow-lg px-8 py-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">
                    🏥 AI CRM for Healthcare Professionals
                </h1>

                <div className="flex items-center gap-4">
                    <span className="text-lg">Welcome, Admin</span>

                    <div className="w-10 h-10 rounded-full bg-white text-blue-700 flex items-center justify-center font-bold">
                        A
                    </div>
                </div>
            </div>
        </nav>
    );
}