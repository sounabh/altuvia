"use client"

import { useParams } from "next/navigation"
import { EssayWorkspace } from "../components/EssayWorkspace"
import { Card } from "@/components/ui/card"
import { Loader2, BookOpen, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function WorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  
  const [university, setUniversity] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      // Wait for session to load
      if (status === "loading") {
        return
      }

      // Check authentication
      if (status !== "authenticated" || !session?.token) {
        setError("Please login to access this workspace")
        return
      }

      // Extract and decode university name from URL parameters
      if (params.university) {
        const decodedUniversityName = decodeURIComponent(params.university)
        setUniversity(decodedUniversityName)
        console.log('University Name from URL:', decodedUniversityName)
        console.log('User ID from session:', session.userId)
        console.log('User email from session:', session.user?.email)
      } else {
        setError("University name not found in URL")
        return
      }

      setIsReady(true)
    } catch (err) {
      console.error('Error in useEffect:', err)
      setError(err.message)
    }
  }, [params.university, session, status])

  // Loading state while session is loading
  if (status === "loading" || !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl">
          <div className="flex items-center space-x-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#3598FE]" />
            <div>
              <h3 className="text-lg font-semibold text-[#002147]">Loading Workspace</h3>
              <p className="text-sm text-[#6C7280]">Setting up your essay environment...</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Error state or authentication required
  if (error || status !== "authenticated" || !session?.token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Authentication Required</h3>
          <p className="text-sm text-gray-600 mb-4">
            {error || "Please sign in to access this workspace"}
          </p>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="px-4 py-2 bg-[#3598FE] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
          >
            Go to Sign In
          </button>
        </Card>
      </div>
    )
  }

  // Missing data state
  if (!university || !session.userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl max-w-md text-center">
          <BookOpen className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-600 mb-2">Missing Information</h3>
          <p className="text-sm text-gray-600 mb-4">
            {!university ? 'University name not found' : 'User session data missing'}
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>University: {university || 'Not found'}</p>
            <p>User ID: {session.userId ? 'Found' : 'Not found'}</p>
            <p>Email: {session.user?.email || 'Not found'}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <EssayWorkspace 
        universityName={university}
        userId={session.userId}
        userEmail={session.user?.email}
      />
    </div>
  )
}