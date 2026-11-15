import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({ component: AdminLayout })

function AdminLayout() {
  return (
    <div className="admin">
      <nav className="admin-nav">
        <a href="/admin">Routes</a>
        <a href="/admin/settings">Settings</a>
        <a href="/" target="_blank" rel="noreferrer">
          Player app
        </a>
        <a href="/admin/login">Login</a>
      </nav>
      <Outlet />
    </div>
  )
}
