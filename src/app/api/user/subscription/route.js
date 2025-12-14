// ==========================================
// FILE: app/api/user/subscription/route.js
// DESCRIPTION: API route for subscription management
// ==========================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {prisma} from "@/lib/prisma";

// ==========================================
// GET: Fetch User Subscription
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

    // Check if prisma is properly initialized
    if (!prisma) {
      console.error("❌ Prisma client not initialized");
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    // Fetch subscription data
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.userId },
      select: {
        id: true,
        plan: true,
        status: true,
        billingCycle: true,
        trialStartDate: true,
        trialEndDate: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // If no subscription exists, create a default free subscription
    if (!subscription) {
      const newSubscription = await prisma.subscription.create({
        data: {
          userId: session.userId,
          plan: "free",
          status: "active"
        },
        select: {
          id: true,
          plan: true,
          status: true,
          billingCycle: true,
          trialStartDate: true,
          trialEndDate: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return NextResponse.json({
        success: true,
        subscription: newSubscription
      });
    }

    // Check if trial has expired and update status
    if (subscription.status === "trial" && subscription.trialEndDate) {
      const now = new Date();
      const trialEnd = new Date(subscription.trialEndDate);
      
      if (now > trialEnd) {
        const updatedSubscription = await prisma.subscription.update({
          where: { userId: session.userId },
          data: { 
            status: "expired",
            plan: "free"
          },
          select: {
            id: true,
            plan: true,
            status: true,
            billingCycle: true,
            trialStartDate: true,
            trialEndDate: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            createdAt: true,
            updatedAt: true
          }
        });

        return NextResponse.json({
          success: true,
          subscription: updatedSubscription
        });
      }
    }

    // Check if subscription period has ended
    if (subscription.currentPeriodEnd) {
      const now = new Date();
      const periodEnd = new Date(subscription.currentPeriodEnd);
      
      if (now > periodEnd && subscription.status === "active") {
        // In real implementation, this would trigger Stripe webhook
        // For now, we'll just mark it as expired
        const updatedSubscription = await prisma.subscription.update({
          where: { userId: session.userId },
          data: { 
            status: "expired",
            plan: "free"
          },
          select: {
            id: true,
            plan: true,
            status: true,
            billingCycle: true,
            trialStartDate: true,
            trialEndDate: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            createdAt: true,
            updatedAt: true
          }
        });

        return NextResponse.json({
          success: true,
          subscription: updatedSubscription
        });
      }
    }

    return NextResponse.json({
      success: true,
      subscription
    });

  } catch (error) {
    console.error("❌ Subscription fetch error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      prismaAvailable: !!prisma
    });
    
    return NextResponse.json(
      { 
        error: "Failed to fetch subscription",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT: Update Subscription (for admin/webhooks)
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

    if (!prisma) {
      console.error("❌ Prisma client not initialized");
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    const { plan, status, billingCycle, currentPeriodEnd } = await request.json();

    // Validate plan
    const validPlans = ["free", "premium", "pro"];
    if (plan && !validPlans.includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["active", "cancelled", "expired", "trial"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const updateData = {};
    if (plan) updateData.plan = plan;
    if (status) updateData.status = status;
    if (billingCycle) updateData.billingCycle = billingCycle;
    if (currentPeriodEnd) updateData.currentPeriodEnd = new Date(currentPeriodEnd);

    const updatedSubscription = await prisma.subscription.update({
      where: { userId: session.userId },
      data: updateData,
      select: {
        id: true,
        plan: true,
        status: true,
        billingCycle: true,
        trialStartDate: true,
        trialEndDate: true,
        currentPeriodStart: true,
        currentPeriodEnd: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      subscription: updatedSubscription
    });

  } catch (error) {
    console.error("❌ Subscription update error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      prismaAvailable: !!prisma
    });
    
    return NextResponse.json(
      { 
        error: "Failed to update subscription",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}