"use client";

import { useTheme } from "next-themes";
import { useAuth, roleLabels, UserRole } from "@/lib/auth";
import { Bell, Menu, Moon, Search, Sun, Loader2, MessageSquare, Home } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Poll for notifications
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/messages");
        const json = await res.json();
        if (json.success) {
          const unreadConvs = json.conversations.filter((c: any) => c.unread > 0);
          const totalUnread = unreadConvs.reduce((sum: number, c: any) => sum + c.unread, 0);
          setUnreadConversations(unreadConvs);
          setUnreadCount(totalUnread);
        }
      } catch (e) {}
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // real-time every 10s
    return () => clearInterval(interval);
  }, [user]);

  // Handle Search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        const json = await res.json();
        if (json.success) {
          setSearchResults(json.users);
          setShowSearchResults(true);
        }
      } catch (e) {}
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-muted px-3 py-2 w-64 relative" ref={searchRef}>
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {isSearching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground absolute right-3" />}
          
          {/* Search Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-[300px] overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
              ) : (
                <div className="py-2">
                  {searchResults.map(u => (
                    <button
                      key={u._id}
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery("");
                        router.push(`/dashboard/communication/messages?userId=${u._id}`);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs shrink-0">
                        {u.avatar || u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{roleLabels[u.role as UserRole]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )}

        {/* Home Link */}
        <Link
          href="/"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Home"
        >
          <Home className="h-5 w-5" />
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
              <div className="p-3 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-sm">Notifications</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {unreadConversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">You're all caught up!</p>
                  </div>
                ) : (
                  <div>
                    {unreadConversations.map((conv, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setShowNotifications(false);
                          router.push("/dashboard/communication/messages");
                        }}
                        className="w-full text-left p-3 hover:bg-muted transition-colors border-b border-border last:border-0 flex gap-3 items-start"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">New message from {conv.partner?.name}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 font-medium text-primary">
                            {conv.unread} unread message{conv.unread !== 1 && "s"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-border bg-muted/30">
                <Link href="/dashboard/communication/messages" onClick={() => setShowNotifications(false)} className="block w-full text-center text-xs font-medium text-primary hover:underline">
                  View all messages
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        {user && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{roleLabels[user.role]}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {getInitials(user.name)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
