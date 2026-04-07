// Example usage of ProtectedRoute component

// For client-only pages (like dashboard)
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Dashboard content - accessible to all authenticated users</div>
    </ProtectedRoute>
  );
}

// For role-specific pages (masters only)
export default function MasterDashboardPage() {
  return (
    <ProtectedRoute requiredRole="MASTER">
      <div>Master dashboard - only for verified masters</div>
    </ProtectedRoute>
  );
}

// For admin-only pages
export default function AdminPanelPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div>Admin panel - administrators only</div>
    </ProtectedRoute>
  );
}

// With custom fallback path
export default function SpecialPage() {
  return (
    <ProtectedRoute fallbackPath="/special-login">
      <div>Special content</div>
    </ProtectedRoute>
  );
}