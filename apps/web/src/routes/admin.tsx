import { Outlet, createFileRoute, useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'

export const Route = createFileRoute('/admin')({ component: AdminLayout })

function AdminLayout() {
  const router = useRouter()

  return (
    <div className="admin" dir="ltr">
      <nav className="admin-nav">
        <a href="/admin">Events</a>
        <a href="/admin/settings">Settings</a>
        <a href="/" target="_blank" rel="noreferrer">
          Player app
        </a>
        <button
          className="link-btn"
          type="button"
          onClick={async () => {
            await api.adminLogout()
            await router.navigate({ to: '/admin/login' })
          }}
        >
          Log out
        </button>
      </nav>
      <Outlet />
    </div>
  )
}
