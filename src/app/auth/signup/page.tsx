"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { UserPlus, Mail, Lock, User, Hash, Phone, BookOpen, Building2, GraduationCap, Briefcase, ArrowRight, ArrowLeft, Check, Loader2, Eye, EyeOff, Home } from "lucide-react";
import Link from "next/link";

type Role = "student" | "professor";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  registrationNo: string;
  contactNo: string;
  // Student-specific
  course: string;
  branch: string;
  semester: number;
  section: string;
  admissionYear: number;
  bloodGroup: string;
  // Faculty-specific
  department: string;
  designation: string;
  qualification: string;
}

const initialFormData: FormData = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "student",
  registrationNo: "",
  contactNo: "",
  course: "B.Tech",
  branch: "Computer Science",
  semester: 1,
  section: "A",
  admissionYear: new Date().getFullYear(),
  bloodGroup: "Unknown",
  department: "Computer Science",
  designation: "Assistant Professor",
  qualification: "",
};

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const emailDomain = "@uums.ac.in";

  const updateField = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const passwordStrength = (pw: string): { label: string; color: string; width: string } => {
    if (pw.length === 0) return { label: "", color: "", width: "0%" };
    if (pw.length < 6) return { label: "Weak", color: "bg-red-500", width: "25%" };
    if (pw.length < 8) return { label: "Fair", color: "bg-amber-500", width: "50%" };
    if (/(?=.*[A-Z])(?=.*[0-9])/.test(pw)) return { label: "Strong", color: "bg-emerald-500", width: "100%" };
    return { label: "Good", color: "bg-blue-500", width: "75%" };
  };

  const strength = passwordStrength(formData.password);

  const validateStep1 = () => {
    if (!formData.name.trim()) return "Full name is required.";
    if (!formData.email.trim()) return "Email is required.";
    if (!formData.email.toLowerCase().endsWith(emailDomain))
      return `Email must end with ${emailDomain}`;
    if (formData.password.length < 6) return "Password must be at least 6 characters.";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
    return null;
  };

  const validateStep2 = () => {
    if (!formData.registrationNo.trim())
      return formData.role === "student" ? "Enrollment number is required." : "Employee ID is required.";
    if (!formData.contactNo.trim()) return "Contact number is required.";
    if (formData.role === "professor" && !formData.qualification.trim())
      return "Qualification is required.";
    return null;
  };

  const goNext = () => {
    setError("");
    const err = validateStep1();
    if (err) { setError(err); return; }
    setStep(2);
  };

  const goBack = () => {
    setError("");
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const err = validateStep2();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm";
  const labelClass = "text-sm font-medium text-foreground";
  const selectClass =
    "w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm";

  // Success State
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-fade-in text-center">
          <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-emerald-500/20">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Registration Submitted!</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Your application has been sent to the university administration for review.
            You&apos;ll receive an email notification once your account is approved.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-md"
          >
            Back to Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 inner-glow">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Create Account</h1>
          <p className="text-muted-foreground">Register with your university email</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step >= s
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                {s === 1 ? "Account" : "Profile"}
              </span>
              {s === 1 && (
                <div className={`w-12 h-0.5 rounded-full transition-all duration-300 ${step > 1 ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5">
          <CardHeader className="pb-4">
            <CardTitle>{step === 1 ? "Account Information" : "Profile Details"}</CardTitle>
            <CardDescription>
              {step === 1
                ? "Enter your university credentials to get started."
                : `Provide your ${formData.role === "student" ? "academic" : "professional"} information.`}
            </CardDescription>
          </CardHeader>

          <div className="p-6 pt-0">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                {error}
              </div>
            )}

            <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); goNext(); }}>
              {/* ===== STEP 1: Account Info ===== */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Role Toggle */}
                  <div className="space-y-2">
                    <label className={labelClass}>I am a</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                      {(["student", "professor"] as Role[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => updateField("role", r)}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            formData.role === r
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {r === "student" ? (
                            <GraduationCap className="h-4 w-4" />
                          ) : (
                            <Briefcase className="h-4 w-4" />
                          )}
                          {r === "student" ? "Student" : "Faculty"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className={labelClass}>Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className={labelClass}>University Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder={`e.g. rahul.sharma${emailDomain}`}
                        className={inputClass}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must end with <span className="font-mono text-primary font-medium">{emailDomain}</span>
                    </p>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        placeholder="Min. 6 characters"
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                            style={{ width: strength.width }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{strength.label}</span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className={labelClass}>Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => updateField("confirmPassword", e.target.value)}
                        placeholder="Re-enter your password"
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* ===== STEP 2: Profile Details ===== */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Registration/Employee ID */}
                  <div className="space-y-2">
                    <label className={labelClass}>
                      {formData.role === "student" ? "Enrollment / Registration No." : "Employee ID"}
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={formData.registrationNo}
                        onChange={(e) => updateField("registrationNo", e.target.value)}
                        placeholder={formData.role === "student" ? "e.g. 2024BTCS001" : "e.g. FAC2024001"}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Contact No */}
                  <div className="space-y-2">
                    <label className={labelClass}>Contact Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="tel"
                        required
                        value={formData.contactNo}
                        onChange={(e) => updateField("contactNo", e.target.value)}
                        placeholder="e.g. 9876543210"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Student-specific fields */}
                  {formData.role === "student" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className={labelClass}>Course</label>
                          <select
                            className={selectClass}
                            value={formData.course}
                            onChange={(e) => updateField("course", e.target.value)}
                          >
                            <option>B.Tech</option>
                            <option>M.Tech</option>
                            <option>BCA</option>
                            <option>MCA</option>
                            <option>MBA</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>Branch</label>
                          <select
                            className={selectClass}
                            value={formData.branch}
                            onChange={(e) => updateField("branch", e.target.value)}
                          >
                            <option>Computer Science</option>
                            <option>Electronics</option>
                            <option>Mechanical</option>
                            <option>Civil</option>
                            <option>Electrical</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <label className={labelClass}>Semester</label>
                          <input
                            type="number"
                            min={1}
                            max={8}
                            className={selectClass}
                            value={formData.semester}
                            onChange={(e) => updateField("semester", parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>Section</label>
                          <input
                            className={selectClass}
                            value={formData.section}
                            onChange={(e) => updateField("section", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>Admission Year</label>
                          <input
                            type="number"
                            className={selectClass}
                            value={formData.admissionYear}
                            onChange={(e) => updateField("admissionYear", parseInt(e.target.value) || new Date().getFullYear())}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className={labelClass}>Blood Group</label>
                        <select
                          className={selectClass}
                          value={formData.bloodGroup}
                          onChange={(e) => updateField("bloodGroup", e.target.value)}
                        >
                          <option>Unknown</option>
                          <option>A+</option>
                          <option>A-</option>
                          <option>B+</option>
                          <option>B-</option>
                          <option>O+</option>
                          <option>O-</option>
                          <option>AB+</option>
                          <option>AB-</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Faculty-specific fields */}
                  {formData.role === "professor" && (
                    <>
                      <div className="space-y-2">
                        <label className={labelClass}>Department</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <select
                            className={`${inputClass} pl-10`}
                            value={formData.department}
                            onChange={(e) => updateField("department", e.target.value)}
                          >
                            <option>Computer Science</option>
                            <option>Electronics</option>
                            <option>Mechanical</option>
                            <option>Civil</option>
                            <option>Electrical</option>
                            <option>Mathematics</option>
                            <option>Physics</option>
                            <option>Chemistry</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className={labelClass}>Designation</label>
                        <select
                          className={selectClass}
                          value={formData.designation}
                          onChange={(e) => updateField("designation", e.target.value)}
                        >
                          <option>Assistant Professor</option>
                          <option>Associate Professor</option>
                          <option>Professor</option>
                          <option>Visiting Faculty</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className={labelClass}>Qualification</label>
                        <div className="relative">
                          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            required
                            value={formData.qualification}
                            onChange={(e) => updateField("qualification", e.target.value)}
                            placeholder="e.g. Ph.D. in Computer Science"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 py-2.5 rounded-xl border border-border font-semibold hover:bg-muted transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          Submit Registration
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
