// ==========================================
// FILE: app/api/user/profile/route.js
// DESCRIPTION: API route for user profile management
// ==========================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// ==========================================
// GET: Fetch User Profile
// ==========================================
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        provider: true,
        emailVerified: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            billingCycle: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            trialEndDate: true,
          }
        },
        profile: {
          select: {
            countries: true,
            courses: true,
            studyLevel: true,
            gpa: true,
            testScores: true,
            workExperience: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error("❌ Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT: Update User Profile (Name & Email)
// ==========================================
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse JSON body
    const body = await request.json();
    const { name, email } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate name
    if (name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    if (email !== session.user?.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== session.userId) {
        return NextResponse.json(
          { error: "Email is already in use by another account" },
          { status: 409 }
        );
      }
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: name.trim(),
        email: email.trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        provider: true,
        emailVerified: true
      }
    });

    console.log("✅ User profile updated in database:", {
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("❌ Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}