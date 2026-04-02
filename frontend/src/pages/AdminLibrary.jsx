import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLibraryPanel from '../components/AdminLibraryPanel';
import { AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function AdminLibrary() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // Check if user is admin
    if (!user || user.role !== 'admin') {
        return (
            <div style={{
                minHeight: '100vh',
                background: isLight ? '#f8f9fa' : '#030303',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{
                    background: isLight ? 'white' : '#1a1a1a',
                    border: isLight ? '1px solid #e0e0e0' : '1px solid var(--zinc-800)',
                    borderRadius: '12px',
                    padding: '40px',
                    textAlign: 'center',
                    maxWidth: '400px'
                }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 20px', color: '#dc2626' }} />
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                        Access Denied
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                        You do not have permission to access the admin library panel. Only administrators can access this page.
                    </p>
                    <a href="/" className="btn btn-primary" style={{ display: 'inline-block' }}>
                        Go Home
                    </a>
                </div>
            </div>
        );
    }

    return <AdminLibraryPanel />;
}
