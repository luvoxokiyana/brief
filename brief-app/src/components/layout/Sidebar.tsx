import { useAuth } from "../../context/AuthContext";
import SidebarLink from "./SidebarLink";

export default function Sidebar() {
  const { profile, signOut } = useAuth();

  return (
    <aside
      className="lg:h-screen lg:sticky lg:top-0 flex flex-col
                 bg-paper-warm border-b lg:border-b-0 lg:border-r border-rule
                 w-full lg:w-[250px] lg:flex-shrink-0
                 px-5 py-6 lg:py-8"
    >
      <div className="mb-8">
        <p className="font-editorial text-xl font-medium tracking-tight text-ink">
          Brief
        </p>
      </div>

      <nav className="flex flex-col gap-1" aria-label="Primary">
        <SidebarLink to="/" end>Dashboard</SidebarLink>
        <SidebarLink to="/calendar">Calendar</SidebarLink>
        <SidebarLink to="/tasks">Tasks</SidebarLink>
        <SidebarLink to="/staff">Staff</SidebarLink>
      </nav>

      <div className="mt-6 lg:mt-auto pt-6 border-t border-rule">
        <SidebarLink to="/settings">Settings</SidebarLink>

        <div className="mt-5">
          {profile && (
            <div className="mb-3">
              <p className="text-sm font-medium text-ink truncate">
                {profile.full_name}
              </p>
              <p className="text-xs text-ink-muted capitalize">
                {profile.role}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={signOut}
            className="btn-quiet w-full justify-start !px-0"
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}