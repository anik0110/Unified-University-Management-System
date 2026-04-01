"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

export type UserRole = "student" | "professor" | "hod" | "dean" | "director" | "hostel_warden" | "chief_warden" | "hostel_supervisor" | "accountant" | "fest_coordinator" | "librarian" | "super_admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  extraRoles?: string[];
  walletBalance?: number;
  avatar?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
  roleLabel: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  director: "Director / VC",
  dean: "Dean",
  hod: "Head of Department",
  professor: "Professor",
  student: "Student",
  hostel_warden: "Hostel Warden",
  chief_warden: "Chief Warden",
  hostel_supervisor: "Hostel Supervisor",
  accountant: "Accountant",
  fest_coordinator: "Fest Coordinator",
  librarian: "Librarian",
};

export const roleDashboardPaths: Record<UserRole, string> = {
  super_admin: "/dashboard/admin",
  director: "/dashboard/admin",
  dean: "/dashboard/admin",
  hod: "/dashboard/faculty",
  professor: "/dashboard/faculty",
  student: "/dashboard/student",
  hostel_warden: "/dashboard/hostel",
  chief_warden: "/dashboard/hostel",
  hostel_supervisor: "/dashboard/hostel",
  accountant: "/dashboard/finance",
  fest_coordinator: "/dashboard/fest",
  librarian: "/dashboard/library/manage",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser({ ...data.user, id: data.user._id });
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [pathname]);

  const login = (userData: User) => {
    setUser(userData);
    router.push(roleDashboardPaths[userData.role] || "/dashboard");
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/auth/login");
    } catch (err) {
      console.error("Failed to logout", err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isLoading,
      roleLabel: user ? roleLabels[user.role as UserRole] : "",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
