import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

type Props = {
  to: string;
  end?: boolean;
  children: ReactNode;
};

export default function SidebarLink({ to, end, children }: Props) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "block px-3 py-2 rounded-sm text-sm transition-colors",
          isActive
            ? "bg-paper text-ink font-medium"
            : "text-ink-muted hover:text-ink hover:bg-paper/60",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}