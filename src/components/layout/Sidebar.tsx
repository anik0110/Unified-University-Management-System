"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth, roleLabels, UserRole } from "@/lib/auth";
import {
  LayoutDashboard, Users, GraduationCap, Building2, Wallet, BarChart3,
  MessageSquare, BookOpen, PartyPopper, X, ChevronLeft, ChevronRight, LogOut, Shield,
  Megaphone, LibraryBig
} from "lucide-react";
import { useState } from "react";
import { WalletWidget } from "./WalletWidget";

const allNavItems = [
  { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard, roles: ["super_admin", "director", "dean"] as UserRole[] },
  { label: "Manage Students", href: "/dashboard/admin/students", icon: GraduationCap, roles: ["super_admin", "director", "dean"] as UserRole[] },
  { label: "Manage Faculty", href: "/dashboard/admin/faculty", icon: Users, roles: ["super_admin", "director", "dean"] as UserRole[] },
  { label: "Courses", href: "/dashboard/admin/courses", icon: BookOpen, roles: ["super_admin", "director", "dean"] as UserRole[] },
  { label: "Student Portal", href: "/dashboard/student", icon: GraduationCap, roles: ["student"] as UserRole[] },
  { label: "Academics", href: "/dashboard/student/academics", icon: BookOpen, roles: ["student"] as UserRole[] },
  { label: "Attendance", href: "/dashboard/student/attendance", icon: BarChart3, roles: ["student"] as UserRole[] },
  { label: "My Fees", href: "/dashboard/student/fees", icon: Wallet, roles: ["student"] as UserRole[] },
  { label: "Faculty Portal", href: "/dashboard/faculty", icon: Users, roles: ["professor", "hod"] as UserRole[] },
  { label: "Mark Attendance", href: "/dashboard/faculty/attendance", icon: Shield, roles: ["professor", "hod"] as UserRole[] },
  { label: "Hostel Mgmt", href: "/dashboard/hostel", icon: Building2, roles: ["hostel_warden", "chief_warden", "hostel_supervisor", "student"] as UserRole[] },
  { label: "Complaints", href: "/dashboard/hostel/complaints", icon: MessageSquare, roles: ["hostel_warden", "chief_warden", "hostel_supervisor", "student"] as UserRole[] },
  { label: "Finance", href: "/dashboard/finance", icon: Wallet, roles: ["accountant", "super_admin", "director"] as UserRole[] },
  { label: "Communication", href: "/dashboard/communication", icon: Megaphone, roles: ["super_admin", "director", "dean", "hod", "professor", "student", "fest_coordinator"] as UserRole[] },
  { label: "Messages", href: "/dashboard/communication/messages", icon: MessageSquare, roles: ["super_admin", "director", "dean", "hod", "professor", "student", "hostel_warden", "chief_warden", "accountant", "fest_coordinator", "librarian"] as UserRole[] },
  { label: "Library Catalog", href: "/dashboard/library", icon: BookOpen, roles: ["super_admin", "director", "dean", "hod", "professor", "student", "librarian"] as UserRole[] },
  { label: "Manage Library", href: "/dashboard/library/manage", icon: LibraryBig, roles: ["super_admin", "director", "librarian"] as UserRole[] },
  { label: "Fest Mgmt", href: "/dashboard/fest", icon: PartyPopper, roles: ["fest_coordinator", "student", "super_admin"] as UserRole[] },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const navItems = allNavItems.filter((item) => 
    item.roles.includes(user.role) || 
    (user.extraRoles && user.extraRoles.some(r => item.roles.includes(r as UserRole)))
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={clsx(
          "fixed top-0 left-0 z-50 flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                U
              </div>
              <span className="font-bold text-sidebar-foreground">UUMS</span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              U
            </div>
          )}
          <button onClick={onMobileClose} className="lg:hidden text-sidebar-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User profile mini */}
        <div className={clsx("border-b border-sidebar-border p-4", collapsed && "px-2 py-3")}>
          <div className={clsx("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {user.avatar}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{roleLabels[user.role]}</p>
              </div>
            )}
          </div>
        </div>

        {/* Wallet Widget */}
        <WalletWidget collapsed={collapsed} />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-active text-primary shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-hover",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={clsx("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-hover transition-colors"
          >
            {collapsed ? <ChevronRight className="h-5 w-5 mx-auto" /> : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>Collapse</span>
              </>
            )}
          </button>
          <button
            onClick={logout}
            className={clsx(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
