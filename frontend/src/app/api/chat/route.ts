import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, conversation_id, file_id } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get file info if file_id is provided
    let fileInfo = null;
    if (file_id) {
      const { data: file } = await supabase
        .from("user_files")
        .select("*")
        .eq("id", file_id)
        .eq("user_id", user.id)
        .single();

      if (file) {
        // Get signed URL for the file
        const { data: signedUrl } = await supabase.storage
          .from("user-files")
          .createSignedUrl(file.storage_path, 3600);

        fileInfo = {
          filename: file.original_name,
          download_url: signedUrl?.signedUrl,
        };
      }
    }

    // Call backend API
    const backendResponse = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        conversation_id,
        user_id: user.id,
        file: fileInfo,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error("Backend error:", errorText);
      return NextResponse.json(
        { error: "Failed to get response from agent" },
        { status: 500 }
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json({
      response: data.response,
      charts: data.charts || [],
      data: data.data || null,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
