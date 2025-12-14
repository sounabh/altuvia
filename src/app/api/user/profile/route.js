// ==========================================
// FILE: app/api/user/profile/route.js
// DESCRIPTION: API route for user profile management
// ==========================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {prisma} from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

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
// PUT: Update User Profile
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

    const formData = await request.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const imageFile = formData.get("image");

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
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
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== session.userId) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
    }

    // Handle image upload if provided
    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      try {
        // Validate image size (5MB limit)
        if (imageFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Image size must be less than 5MB" },
            { status: 400 }
          );
        }

        // Validate image type
        const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (!validTypes.includes(imageFile.type)) {
          return NextResponse.json(
            { error: "Invalid image format. Please use JPG, PNG, or WEBP" },
            { status: 400 }
          );
        }

        // Generate unique filename
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileExtension = imageFile.name.split('.').pop();
        const uniqueFilename = `${session.userId}-${uuidv4()}.${fileExtension}`;
        
        // Save to public/uploads directory
        const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
        const filePath = path.join(uploadDir, uniqueFilename);
        
        // Create directory if it doesn't exist
        const fs = require('fs');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        await writeFile(filePath, buffer);
        imageUrl = `/uploads/profiles/${uniqueFilename}`;

        // Delete old image if exists
        const oldUser = await prisma.user.findUnique({
          where: { id: session.userId },
          select: { image: true }
        });

        if (oldUser?.image && oldUser.image.startsWith('/uploads/')) {
          const oldImagePath = path.join(process.cwd(), "public", oldUser.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      } catch (uploadError) {
        console.error("❌ Image upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }
    }

    // Update user in database
    const updateData = {
      name,
      email,
      ...(imageUrl && { image: imageUrl })
    };

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        provider: true,
        emailVerified: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("❌ Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}