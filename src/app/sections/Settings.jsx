"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  CheckCircle2,
  AlertCircle,
  Crown,
  Lock as LockIcon,
  Loader2,
  Shield,
  Sparkles,
  Gift,
  Zap,
  Check,
  Star
} from "lucide-react";

const SettingsPage = () => {
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});

  // Load user data
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || "",
        email: session.user.email || ""
      }));
    }
  }, [session]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (session?.user?.provider === "credentials") {
      if (!formData.currentPassword) {
        newErrors.currentPassword = "Current password is required";
      }
    }
    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    setIsSaving(true);
    const toastId = toast.loading("Updating profile...");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session?.token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        await updateSession({
          ...session,
          user: {
            ...session.user,
            name: data.user.name,
            email: data.user.email
          }
        });

        toast.success("Profile updated successfully!", { id: toastId });
      } else {
        toast.error(data.error || "Failed to update profile", { id: toastId });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("An error occurred. Please try again.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setIsSaving(true);
    const toastId = toast.loading("Changing password...");

    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password changed successfully!", { id: toastId });
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }));
      } else {
        toast.error(data.error || "Failed to change password", { id: toastId });
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("An error occurred. Please try again.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "subscription", label: "Subscription", icon: Crown, free: true }
  ];

  const freeFeatures = [
    "Unlimited CV Creations",
    "AI-Powered Analysis",
    "Multiple Templates",
    "PDF Export",
    "Version History",
    "Smart Tips & Suggestions",
    "ATS Score Checker",
    "Real-time Preview"
  ];

  return (
    <div className="min-h-screen bg-blue-50/60 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[25rem] h-[25rem] rounded-full bg-blue-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob" />
        <div className="absolute top-[20%] right-[-5%] w-[20rem] h-[20rem] rounded-full bg-blue-100 blur-[80px] mix-blend-multiply opacity-60 animate-blob animation-delay-2000" />
      </div>

      {/* Hero Header */}
      <div className="relative z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold text-[#002147] mb-4 tracking-tight"
          >
            Account <span className="text-[#3598FE]">Settings</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto font-medium"
          >
            Manage your profile, security, and enjoy our free premium features
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 mb-8 border-b border-gray-200"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition-colors relative flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "text-[#002147] border-b-2 border-[#002147]"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {tab.free && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    FREE
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-8"
          >
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-[#002147] mb-1">Profile Information</h3>
                  <p className="text-sm text-gray-500">Update your account details</p>
                </div>

                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.name
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-[#002147]"
                      }`}
                      placeholder="Enter your name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.email
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-[#002147]"
                      }`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Provider Info */}
                {session?.provider && session.provider !== "credentials" && (
                  <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Connected via {session.provider.charAt(0).toUpperCase() + session.provider.slice(1)}
                    </p>
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full bg-[#002147] text-white py-3 rounded-lg font-medium hover:bg-[#003366] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-[#002147] mb-1">Security Settings</h3>
                  <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
                </div>

                {session?.provider !== "credentials" ? (
                  <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-6 text-center">
                    <Lock size={40} className="mx-auto text-amber-600 mb-3" />
                    <p className="text-amber-800 font-medium">
                      You're signed in with {session.provider}. Password changes are managed through your {session.provider} account.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.currentPassword
                              ? "border-red-300 focus:ring-red-500"
                              : "border-gray-300 focus:ring-[#002147]"
                          }`}
                          placeholder="Enter current password"
                        />
                      </div>
                      {errors.currentPassword && (
                        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors.currentPassword}
                        </p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.newPassword
                              ? "border-red-300 focus:ring-red-500"
                              : "border-gray-300 focus:ring-[#002147]"
                          }`}
                          placeholder="Enter new password"
                        />
                      </div>
                      {errors.newPassword && (
                        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors.newPassword}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            errors.confirmPassword
                              ? "border-red-300 focus:ring-red-500"
                              : "border-gray-300 focus:ring-[#002147]"
                          }`}
                          placeholder="Confirm new password"
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    {/* Change Password Button */}
                    <button
                      onClick={handleChangePassword}
                      disabled={isSaving}
                      className="w-full bg-[#002147] text-white py-3 rounded-lg font-medium hover:bg-[#003366] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Lock size={18} />
                      )}
                      {isSaving ? "Changing..." : "Change Password"}
                    </button>
                  </>
                )}
              </div>
            )}

            {activeTab === "subscription" && (
              <div className="space-y-8">
                {/* Header */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl mb-4">
                    <Gift size={32} className="text-emerald-600" />
                  </div>
<h3 className="text-xl font-semibold text-[#002147] mb-2">
  🎉 Enjoy Premium Features — Completely Free!
</h3>
<p className="text-gray-500 text-md max-w-2xl font-regular mx-auto">
  Currently, our platform is completely free. We believe every MBA applicant
  deserves access to powerful, high-quality application tools.
  Enjoy all premium features at no cost — we’re here to help you build a
  strong application and secure admission to your dream MBA program.
</p>

                </div>

             
            

                {/* Lock Note */}
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <LockIcon size={20} className="text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-amber-800 font-medium mb-1">
                        🔒 Currently Locked: Payment System
                      </p>
                      <p className="text-amber-700 text-sm">
                        While we remain free, our payment system is temporarily locked. We'll notify you well in advance 
                        if we ever introduce paid plans. For now, enjoy unlimited access!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Final Message */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-gray-500 text-sm">
                    <span className="font-semibold text-[#002147]">No Hidden Costs • No Expiration • No Limits</span>
                    <br />
                    We're committed to keeping our core features accessible to everyone
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsPage;