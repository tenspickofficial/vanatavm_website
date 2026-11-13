import React from 'react';

export const metadata = {
  title: 'Admin CMS | Vanatvam',
  description: 'Manage Vanatvam Blogs & Content',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="admin-root"
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
      }}
    >
      {children}
    </div>
  );
}
