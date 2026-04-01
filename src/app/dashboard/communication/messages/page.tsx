"use client";

import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ArrowLeft, Send, Search, MessageSquare, User as UserIcon } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/messages");
    const data = await res.json();
    if (data.success) setConversations(data.conversations);
    setLoading(false);
  }, []);

  // Fetch chat with selected user
  const fetchChat = useCallback(async (partnerId: string) => {
    const res = await fetch(`/api/messages/${partnerId}`);
    const data = await res.json();
    if (data.success) {
      setMessages(data.messages);
      setSelectedUser(data.partner);
    }
  }, []);

  // Search users
  useEffect(() => {
    if (search.length < 2) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) setSearchResults(data.users);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Initial load
  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Polling for new messages
  useEffect(() => {
    if (selectedUser) {
      pollRef.current = setInterval(() => fetchChat(selectedUser._id), 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedUser, fetchChat]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) return null;

  const openChat = (partnerId: string, partner?: any) => {
    if (partner) setSelectedUser(partner);
    fetchChat(partnerId);
    setSearch("");
    setSearchResults([]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${selectedUser._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage("");
        fetchConversations();
      }
    } catch {}
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const roleColors: Record<string, string> = {
    student: "bg-blue-500/10 text-blue-600", professor: "bg-violet-500/10 text-violet-600",
    hod: "bg-violet-500/10 text-violet-600", super_admin: "bg-red-500/10 text-red-600",
    librarian: "bg-amber-500/10 text-amber-600",
  };

  return (
    <DashboardLayout>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/dashboard/communication" className="p-2 rounded-lg hover:bg-muted transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" /> Messages</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: "calc(100vh - 180px)" }}>
        {/* Sidebar: Conversations + Search */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search users to start a chat..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-muted/30 text-sm focus:ring-2 focus:ring-primary outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                {searchResults.map((u: any) => (
                  <button key={u._id} onClick={() => openChat(u._id, u)} className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/50 transition-colors text-left">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{u.name?.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${roleColors[u.role] || "bg-muted text-muted-foreground"}`}>{u.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 rounded-full border-3 border-primary border-t-transparent animate-spin" /></div>
            ) : conversations.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No conversations yet.<br />Search a user above to start chatting.</p>
            ) : (
              conversations.map((conv: any) => (
                <button
                  key={conv.partnerId}
                  onClick={() => openChat(conv.partnerId.toString(), conv.partner)}
                  className={`w-full flex items-center gap-3 p-3 border-b border-border/50 hover:bg-muted/30 transition-colors text-left ${selectedUser?._id === conv.partnerId?.toString() ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">{conv.partner?.name?.charAt(0) || "?"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className="font-medium text-sm truncate">{conv.partner?.name}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{new Date(conv.lastTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shrink-0">{conv.unread}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/20">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{selectedUser.name?.charAt(0)}</div>
                <div>
                  <p className="font-semibold">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email} • {selectedUser.role}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Say hello! 👋</p>
                ) : (
                  messages.map((msg: any) => (
                    <div key={msg._id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.isMine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border bg-muted/10">
                <div className="flex gap-2">
                  <input
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button onClick={sendMessage} disabled={!newMessage.trim() || sending} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Select a conversation</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">Choose from your conversations or search for a user to start a new chat.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
