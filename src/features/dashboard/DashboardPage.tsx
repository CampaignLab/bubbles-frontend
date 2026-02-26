import { useState } from "react";
import { Sidebar } from "./Sidebar";
import BoundaryPage from "../boundaries/BoundaryPage";
import { Layout } from "@/components/layout";
import { CampaignDashboard } from "./CampaignDashboard";

export default function DashboardPage() {
    // Current application state for page navigation
    const [currentPage, setCurrentPage] = useState('boundaries');

    const renderContent = () => {
        switch (currentPage) {
            case 'boundaries':
                return <BoundaryPage />;
            case 'dashboard':
                return <CampaignDashboard />;
            default:
                return <BoundaryPage />;
        }
    };

    return (
        <Layout>
            <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
                {/* Global Navigation Sidebar */}
                <Sidebar
                    activePage={currentPage}
                    onPageChange={setCurrentPage}
                />

                {/* Main Content Area */}
                <main style={{ flex: 1, height: '100%', position: 'relative' }}>
                    {renderContent()}
                </main>
            </div>
        </Layout>
    );
}