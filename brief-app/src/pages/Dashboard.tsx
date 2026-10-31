import { useAuth } from "../context/AuthContext";
import WeeklyCalendar from "../components/dashboard/WeeklyCalendar";
import TaskList from "../components/dashboard/TaskList";
import UpcomingEvents from "../components/dashboard/UpcomingEvents";

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          {profile?.role === "admin" ? "Administrator" : "Staff"}
        </p>
        <h1 className="mt-2 font-editorial text-3xl font-medium tracking-tight text-ink">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Here's the week at a glance.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyCalendar />
        </div>
        <div className="flex flex-col gap-6">
          <TaskList />
          <UpcomingEvents />
        </div>
      </div>
    </div>
  );
}