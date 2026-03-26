import { NextRequest, NextResponse } from "next/server";
import { unsubscribeFromTopic } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const { token, topic } = await request.json();

    if (!token || !topic) {
      return NextResponse.json(
        { error: "Missing token or topic" },
        { status: 400 },
      );
    }

    await unsubscribeFromTopic([token], topic);

    return NextResponse.json({
      success: true,
      message: `Successfully unsubscribed from topic: ${topic}`,
    });
  } catch (error: any) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unsubscribe" },
      { status: 500 },
    );
  }
}
