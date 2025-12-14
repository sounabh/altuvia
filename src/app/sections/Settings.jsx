"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  X, 
  CheckCircle2,
  AlertCircle,
  Crown,
  Calendar,
  CreditCard,
  Loader2
} from "lucide-react";

const SettingsPage = () => {
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [imagePreview, setImagePreview] = useState(null);
  const [subscription, setSubscription] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    image: null
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
      setImagePreview(session.user.image);
    }
    fetchSubscription();
  }, [session]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/user/subscription", {
        headers: {
          Authorization: `Bearer ${session?.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
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
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session?.token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        // Update session with new data
        await updateSession({
          ...session,
          user: {
            ...session.user,
            name: data.user.name,
            email: data.user.email,
            image: data.user.image
          }
        });

        toast.success("Profile updated successfully!", { id: toastId });
        setImagePreview(data.user.image);
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
    { id: "security", label: "Security", icon: Lock },
    { id: "subscription", label: "Subscription", icon: Crown }
  ];

  const getPlanBadgeColor = (plan) => {
    switch (plan?.toLowerCase()) {
      case "premium": return "from-purple-500 to-pink-500";
      case "pro": return "from-blue-500 to-cyan-500";
      default: return "from-gray-400 to-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-gradient-to-br from-blue-200 to-transparent opacity-30 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full bg-gradient-to-tr from-indigo-200 to-transparent opacity-30 blur-3xl"
        />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-[#002147] mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 bg-white/80 backdrop-blur-sm p-2 rounded-2xl shadow-lg"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-[#002147] text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100"
          >
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* Profile Image */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#002147] shadow-xl">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                          <User size={48} className="text-white" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-[#002147] text-white p-3 rounded-full cursor-pointer shadow-lg hover:bg-[#3598FE] transition-all duration-300 group-hover:scale-110">
                      <Camera size={20} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">Click camera icon to change photo</p>
                </div>

                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors.name
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-[#002147]"
                      }`}
                      placeholder="Enter your name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
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
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors.email
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-[#002147]"
                      }`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Provider Info */}
                {session?.provider && session.provider !== "credentials" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700">
                      <CheckCircle2 size={16} className="inline mr-2" />
                      Connected via {session.provider.charAt(0).toUpperCase() + session.provider.slice(1)}
                    </p>
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full bg-[#002147] text-white py-4 rounded-xl font-medium hover:bg-[#3598FE] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isSaving ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-[#002147] mb-4">Change Password</h3>

                {session?.provider !== "credentials" ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <Lock size={48} className="mx-auto text-yellow-600 mb-3" />
                    <p className="text-yellow-700">
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
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                            errors.currentPassword
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-200 focus:border-[#002147]"
                          }`}
                          placeholder="Enter current password"
                        />
                      </div>
                      {errors.currentPassword && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
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
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                            errors.newPassword
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-200 focus:border-[#002147]"
                          }`}
                          placeholder="Enter new password"
                        />
                      </div>
                      {errors.newPassword && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
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
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                            errors.confirmPassword
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-200 focus:border-[#002147]"
                          }`}
                          placeholder="Confirm new password"
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    {/* Change Password Button */}
                    <button
                      onClick={handleChangePassword}
                      disabled={isSaving}
                      className="w-full bg-[#002147] text-white py-4 rounded-xl font-medium hover:bg-[#3598FE] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      {isSaving ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Lock size={20} />
                      )}
                      {isSaving ? "Changing..." : "Change Password"}
                    </button>
                  </>
                )}
              </div>
            )}

            {activeTab === "subscription" && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-[#002147] mb-4">Subscription Details</h3>

                {subscription ? (
                  <div className="space-y-4">
                    {/* Plan Badge */}
                    <div className={`p-6 rounded-2xl bg-gradient-to-r ${getPlanBadgeColor(subscription.plan)} text-white shadow-xl`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Crown size={32} />
                          <div>
                            <h4 className="text-2xl font-bold capitalize">{subscription.plan} Plan</h4>
                            <p className="text-sm opacity-90 capitalize">{subscription.status}</p>
                          </div>
                        </div>
                        {subscription.status === "active" && (
                          <CheckCircle2 size={32} />
                        )}
                      </div>
                    </div>

                    {/* Subscription Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar size={20} className="text-[#002147]" />
                          <h5 className="font-medium text-gray-700">Billing Cycle</h5>
                        </div>
                        <p className="text-2xl font-bold text-[#002147] capitalize">
                          {subscription.billingCycle || "N/A"}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                        <div className="flex items-center gap-3 mb-2">
                          <CreditCard size={20} className="text-[#002147]" />
                          <h5 className="font-medium text-gray-700">Current Period</h5>
                        </div>
                        <p className="text-sm font-semibold text-[#002147]">
                          {subscription.currentPeriodStart
                            ? new Date(subscription.currentPeriodStart).toLocaleDateString()
                            : "N/A"}
                          {" - "}
                          {subscription.currentPeriodEnd
                            ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Trial Info */}
                    {subscription.status === "trial" && subscription.trialEndDate && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-yellow-800">
                          <AlertCircle size={16} className="inline mr-2" />
                          Trial ends on {new Date(subscription.trialEndDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {/* Manage Subscription Button */}
                    <button className="w-full bg-gradient-to-r from-[#002147] to-[#3598FE] text-white py-4 rounded-xl font-medium hover:shadow-xl transition-all duration-300">
                      Manage Subscription
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Crown size={64} className="mx-auto text-gray-300 mb-4" />
                    <h4 className="text-xl font-semibold text-gray-700 mb-2">No Active Subscription</h4>
                    <p className="text-gray-500 mb-6">Upgrade to access premium features</p>
                    <button className="bg-gradient-to-r from-[#002147] to-[#3598FE] text-white px-8 py-3 rounded-xl font-medium hover:shadow-xl transition-all duration-300">
                      View Plans
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsPage;