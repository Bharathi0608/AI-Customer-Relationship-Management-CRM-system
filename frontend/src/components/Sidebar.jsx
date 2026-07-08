export default function Sidebar() {
    return (
        <aside className="w-64 bg-white shadow-md min-h-screen p-6">

            <h2 className="text-2xl font-bold text-blue-700 mb-8">
                Dashboard
            </h2>

            <ul className="space-y-5">

                <li className="hover:bg-blue-100 p-3 rounded-lg cursor-pointer">
                    🏠 Dashboard
                </li>

                <li className="hover:bg-blue-100 p-3 rounded-lg cursor-pointer">
                    👨‍⚕️ HCP Interactions
                </li>

                <li className="hover:bg-blue-100 p-3 rounded-lg cursor-pointer">
                    🤖 AI Assistant
                </li>

                <li className="hover:bg-blue-100 p-3 rounded-lg cursor-pointer">
                    📊 Analytics
                </li>

                <li className="hover:bg-blue-100 p-3 rounded-lg cursor-pointer">
                    ⚙ Settings
                </li>

            </ul>

        </aside>
    );
}