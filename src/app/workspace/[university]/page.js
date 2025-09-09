"use client"

import { useParams, useSearchParams } from "next/navigation"
import { EssayWorkspace } from "../components/EssayWorkspace"
import { Card } from "@/components/ui/card"
import { Loader2, BookOpen, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"

export default function WorkspacePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [university, setUniversity] = useState(null)
  const [userId, setUserId] = useState(null)
  const [userEmail, setUserEmail] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)

  console.log("WorkspacePage - params:", params)

  useEffect(() => {
    try {
      // Extract and decode university name from URL parameters
      if (params.university) {
        const decodedUniversityName = decodeURIComponent(params.university)
        setUniversity(decodedUniversityName)
        console.log('University Name from URL:', decodedUniversityName)
      } else {
        setError("University name not found in URL")
        return
      }

      // Get userId from localStorage instead of generating temporary one
      if (typeof window !== 'undefined') {
        try {
          const authData = localStorage.getItem('authData')
          
          if (authData) {
            const parsedAuthData = JSON.parse(authData)
            console.log('Auth data from localStorage:', parsedAuthData)
            
            if (parsedAuthData.userId) {
              setUserId(parsedAuthData.userId)
              console.log('Using userId from localStorage:', parsedAuthData.userId)
            }
            
            if (parsedAuthData.email) {
              setUserEmail(parsedAuthData.email)
              console.log('Using email from localStorage:', parsedAuthData.email)
            }
          } else {
            // Fallback: check URL params
            const userIdFromParams = searchParams.get('userId')
            if (userIdFromParams) {
              setUserId(userIdFromParams)
              console.log('Using userId from URL params:', userIdFromParams)
            } else {
              setError("User authentication data not found. Please log in again.")
              return
            }
          }
        } catch (authError) {
          console.error('Error parsing auth data:', authError)
          setError("Invalid authentication data. Please log in again.")
          return
        }
      }

      setIsReady(true)
    } catch (err) {
      console.error('Error in useEffect:', err)
      setError(err.message)
    }
  }, [params.university, searchParams])

  // Loading state while extracting parameters
  if (!isReady) {
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Authentication Error</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-[#3598FE] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
          >
            Go to Login
          </button>
        </Card>
      </div>
    )
  }

  // Missing data state
  if (!university || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Card className="p-8 bg-white/70 backdrop-blur-sm shadow-xl max-w-md text-center">
          <BookOpen className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-600 mb-2">Missing Information</h3>
          <p className="text-sm text-gray-600 mb-4">
            {!university ? 'University name not found' : 'User authentication required'}
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>University: {university || 'Not found'}</p>
            <p>User ID: {userId ? 'Found' : 'Not found'}</p>
            <p>Email: {userEmail || 'Not found'}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <EssayWorkspace 
        universityName={university}
        userId={userId}
        userEmail={userEmail}
      />
    </div>
  )
}