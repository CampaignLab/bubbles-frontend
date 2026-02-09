import { useState } from "react";
import { Sidebar } from "./Sidebar";
import BoundaryPage from "../boundaries/BoundaryPage";
import { Layout } from "@/components/layout";

export default function DashboardPage() {
    // Current application state for page navigation
    const [currentPage, setCurrentPage] = useState('boundaries');

    const renderContent = () => {
        switch (currentPage) {
            case 'boundaries':
                return <BoundaryPage />;
            case 'dashboard':
                return (
                    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Project Dashboard</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
                                    <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Active Campaign {i}</div>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>London Central</div>
                                </div>
                            ))}
                        </div>
                        <p style={{ marginTop: '24px', color: '#64748b' }}>Select 'Boundaries' in the sidebar to return to the interactive map.</p>
                    </div>
                );
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