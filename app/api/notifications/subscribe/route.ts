import { NextRequest, NextResponse } from "next/server";
import { subscribeToTopic } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const { token, topic } = await request.json();

    if (!token || !topic) {
      return NextResponse.json(
        { error: "Missing token or topic" },
        { status: 400 },
      );
    }

    await subscribeToTopic([token], topic);

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to topic: ${topic}`,
    });
  } catch (error: any) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to subscribe" },
      { status: 500 },
    );
  }
}
