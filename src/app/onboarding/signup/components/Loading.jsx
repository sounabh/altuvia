import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const LoadingStep = memo(({ userData, onComplete }) => {
  const { data: session, update: updateSession, status } = useSession();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [phase, setPhase] = useState("processing");


  const hasSubmittedRef = useRef(false);
  const toastIdRef = useRef(null);

  const isSessionReady = status === "authenticated" && session?.token; //ensure user is logged in and have token

  const prepareSubmissionData = useCallback(
    () => ({
      preferences: {
        countries: userData?.countries || [],
        courses: userData?.courses || [],
        studyLevel: userData?.studyLevel || "",
      },
      academicInfo: userData?.academicInfo || {},
      paymentInfo: {
        name: userData?.paymentInfo?.name || "",
        email: userData?.paymentInfo?.email || "",
        cardNumber: userData?.paymentInfo?.cardNumber
          ? "****" + userData.paymentInfo.cardNumber.slice(-4)
          : "",
      },
    }),
    [userData]
  );

  const submitData = useCallback(async () => {
    if (hasSubmittedRef.current || !isSessionReady) return;

    hasSubmittedRef.current = true;
    setIsSubmitting(true);
    setPhase("submitting");
    setSubmitError(null);

    toastIdRef.current = toast.loading("Creating your profile...");

    try {
      const token = session.token;

      if (!token) {
        throw new Error("Authentication token not found. Please sign in again.");
      }

      const payload = prepareSubmissionData();
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 15000) : null;

      const response = await fetch(`${API_BASE_URL}/api/user/complete-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
        ...(controller && { signal: controller.signal }),
      });

      if (timeoutId) clearTimeout(timeoutId);
      
      const data = await response.json();

      if (response.ok && data.success !== false) {
        setPhase("complete");
        setIsComplete(true);
        toast.success("Profile created successfully!", { id: toastIdRef.current });

        // ✅ Update session with profile completion status
        await updateSession({
          hasCompleteProfile: true,
          isNewUser: false,
          token: data.token || token,
        });

        //redirect to dashboard
        setTimeout(() => router.push("/dashboard"), 2000);

        if (onComplete) onComplete(data);
      } else if (response.status === 409 && data.userExists) {
        setPhase("complete");
        setIsComplete(true);
        toast("Profile already exists", { id: toastIdRef.current });

        await updateSession({
          hasCompleteProfile: true,
          isNewUser: false,
          token: data.token || token,
        });

        setTimeout(() => router.push("/dashboard"), 2000);

        if (onComplete) onComplete(data);
      } else {
        throw new Error(data?.error || data?.message || "Profile submission failed");
      }
    } catch (error) {
      console.error("❌ Profile submission error:", error);
      hasSubmittedRef.current = false;

      let errorMessage = "Failed to submit profile. Please try again.";
      let requiresReauth = false;

      if (error.name === "AbortError") {
        errorMessage = "Request timeout. Please check your connection and try again.";
      } else if (error.message?.includes("Authentication token") || error.message?.includes("401")) {
        errorMessage = "Session expired. Please sign in again.";
        requiresReauth = true;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setPhase("error");
      setSubmitError(errorMessage);
      toast.error(errorMessage, { id: toastIdRef.current });

      if (requiresReauth) {
        setTimeout(() => window.location.href = "/auth/signin", 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [session, isSessionReady, prepareSubmissionData, updateSession, onComplete, router]);

  const handleRetry = useCallback(() => {
    hasSubmittedRef.current = false;
    setSubmitError(null);
    setPhase("processing");
    setIsSubmitting(false);
    toast("Retrying profile submission...");
  }, []);

  useEffect(() => {
    if (!isSessionReady || hasSubmittedRef.current || isComplete) return;

    const submitTimer = setTimeout(() => submitData(), 500);
    return () => clearTimeout(submitTimer);
  }, [isSessionReady, isComplete, submitData]);

  if (phase === "processing" && !isSubmitting) return <ProcessingPhase />;
  if (phase === "submitting" || isSubmitting) return <SubmittingPhase />;
  if (phase === "complete" || isComplete) return <CompletePhase />;
  if (phase === "error") return <ErrorPhase error={submitError} onRetry={handleRetry} />;

  return null;
});

LoadingStep.displayName = "LoadingStep";

// Phase components (unchanged)
const ProcessingPhase = memo(() => (
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <div className="max-w-sm w-full text-center space-y-12">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-[#002147] to-[#003d7a] rounded-2xl animate-pulse"></div>
        <div className="absolute inset-1 bg-white rounded-2xl flex items-center justify-center">
          <svg className="w-12 h-12 text-[#002147]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#002147]">Finalizing your profile</h1>
        <p className="text-slate-600 text-sm">We're preparing your personalized experience</p>
      </div>
      <div className="flex justify-center gap-2">
        <div className="w-3 h-3 bg-[#002147] rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-[#002147] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-3 h-3 bg-[#002147] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  </div>
));

ProcessingPhase.displayName = "ProcessingPhase";

const SubmittingPhase = memo(() => (
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <div className="max-w-sm w-full text-center space-y-12">
      <div className="relative w-24 h-24 mx-auto">
        <svg className="w-24 h-24 text-[#002147] animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#002147]">Setting up your dashboard</h1>
        <p className="text-slate-600 text-sm">Please wait while we process your information</p>
      </div>
    </div>
  </div>
));

SubmittingPhase.displayName = "SubmittingPhase";

const CompletePhase = memo(() => (
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <div className="max-w-sm w-full text-center space-y-12">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-2xl animate-pulse"></div>
        <div className="absolute inset-1 bg-white rounded-2xl flex items-center justify-center">
          <svg className="w-12 h-12 text-emerald-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-emerald-600">All set!</h1>
        <p className="text-slate-600 text-sm">Your profile has been created successfully</p>
      </div>
      <p className="text-sm text-slate-600">Redirecting to dashboard...</p>
    </div>
  </div>
));

CompletePhase.displayName = "CompletePhase";

const ErrorPhase = memo(({ error, onRetry }) => (
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <div className="max-w-sm w-full text-center space-y-8">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 rounded-2xl"></div>
        <div className="absolute inset-1 bg-white rounded-2xl flex items-center justify-center">
          <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-red-600">Something went wrong</h1>
        <p className="text-slate-600 text-sm">{error || "We encountered an issue processing your profile"}</p>
      </div>
      <div className="space-y-3 pt-4">
        <button onClick={onRetry} className="w-full py-3 bg-[#002147] text-white font-semibold rounded-lg hover:bg-[#001a38] transition-all duration-300 transform hover:scale-105 shadow-lg">
          Try Again
        </button>
        <button onClick={() => (window.location.href = "/")} className="w-full py-3 bg-slate-300 text-slate-800 font-semibold rounded-lg hover:bg-slate-400 transition-all duration-300 shadow-md">
          Sign In Again
        </button>
      </div>
    </div>
  </div>
));

ErrorPhase.displayName = "ErrorPhase";