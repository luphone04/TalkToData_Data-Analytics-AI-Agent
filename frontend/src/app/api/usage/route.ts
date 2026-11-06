import { createClient } from "@/lib/supabase/server";
import { backendFetch } from "@/lib/backend";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Call backend API to get usage
    const backendResponse = await backendFetch(`/api/usage/${user.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error("Backend error:", errorText);
      return NextResponse.json(
        { error: "Failed to get usage data" },
        { status: 500 }
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
