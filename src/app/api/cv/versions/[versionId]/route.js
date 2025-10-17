// app/api/cv/versions/[versionId]/route.js - DELETE
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  try {
    const { versionId } = params;

    await prisma.cVVersion.delete({
      where: { id: versionId },
    });

    return NextResponse.json({
      success: true,
      message: "Version deleted successfully",
    });
  } catch (error) {
    console.error("Delete version error:", error);
    return NextResponse.json(
      { error: "Failed to delete version" },
      { status: 500 }
    );
  }
}