import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-6xl px-6 lg:px-10 py-8 lg:py-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}