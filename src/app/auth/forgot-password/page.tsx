"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { KeyRound, Mail, Lock, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP, 3: New Password
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccess("If an account exists, a 6-digit OTP has been sent via Resend.");
      setTimeout(() => { setSuccess(""); setStep(2); }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setResetToken(data.resetToken);
      setSuccess("OTP Verified. You can now reset your password.");
      setTimeout(() => { setSuccess(""); setStep(3); }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => { router.push("/auth/login") }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <Link href="/auth/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
        </Link>
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 inner-glow">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Password Reset</h1>
          <p className="text-muted-foreground">
            {step === 1 && "Start by identifying your account"}
            {step === 2 && "Enter the OTP sent to your email"}
            {step === 3 && "Secure your account with a new password"}
          </p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center mb-2">
              <div className={`h-2 flex-1 rounded-l-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-2 w-1 ${step >= 2 ? 'bg-primary' : 'bg-background'}`} />
              <div className={`h-2 flex-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-2 w-1 ${step >= 3 ? 'bg-primary' : 'bg-background'}`} />
              <div className={`h-2 flex-1 rounded-r-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
            <CardTitle>
              {step === 1 ? "Step 1: Request OTP" : step === 2 ? "Step 2: Verify OTP" : "Step 3: New Password"}
            </CardTitle>
          </CardHeader>
          
          <div className="p-6 pt-0">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            )}
            
            {step === 1 && (
              <form onSubmit={handleRequestOTP} className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. j.doe@uums.edu" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : "Send OTP"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-4 animate-fade-in">
                <div className="space-y-2 text-center">
                  <p className="text-sm text-muted-foreground mb-4">Code sent to <strong>{email}</strong></p>
                  <input type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="w-full text-center text-3xl tracking-[0.5em] py-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono" />
                </div>
                <button type="submit" disabled={loading || otp.length !== 6} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : "Verify OTP"}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={loading || !newPassword} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : "Reset Password"}
                </button>
              </form>
            )}

          </div>
        </Card>
      </div>
    </div>
  );
}
