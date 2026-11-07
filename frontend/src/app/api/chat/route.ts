import { createClient } from "@/lib/supabase/server";
import { backendFetch, BackendConfigError } from "@/lib/backend";
import { loadConversationContext } from "@/lib/chatHistory";
import { NextRequest, NextResponse } from "next/server";

// The agent can take minutes (a local two-chart request took 203 s). 300 s is
// the maximum on Vercel Hobby with Fluid compute (also its default); Pro allows
// up to 800 s. If exceeded, Vercel returns 504 FUNCTION_INVOCATION_TIMEOUT.
export const maxDuration = 300;

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
    const { message, conversation_id, message_id, file_id } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    if (!conversation_id || !message_id) {
      return NextResponse.json(
        { error: "conversation_id and message_id are required" },
        { status: 400 }
      );
    }

    // Verify ownership and load earlier messages (oldest first, current one excluded by id)
    const context = await loadConversationContext(supabase, {
      userId: user.id,
      conversationId: conversation_id,
      messageId: message_id,
    });
    if (!context.ok) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    // Get file info if file_id is provided; stop clearly if it can't be prepared
    let fileInfo = null;
    if (file_id) {
      const { data: file } = await supabase
        .from("user_files")
        .select("*")
        .eq("id", file_id)
        .eq("user_id", user.id)
        .single();

      if (!file) {
        return NextResponse.json(
          { error: "The selected file was not found. Please select it again." },
          { status: 404 }
        );
      }

      // Get signed URL for the file
      const { data: signedUrl, error: signedUrlError } = await supabase.storage
        .from("user-files")
        .createSignedUrl(file.storage_path, 3600);

      if (signedUrlError || !signedUrl?.signedUrl) {
        return NextResponse.json(
          { error: `Could not prepare "${file.original_name}" for analysis. Please try again.` },
          { status: 502 }
        );
      }

      fileInfo = {
        filename: file.original_name,
        download_url: signedUrl.signedUrl,
      };
    }

    // Call backend API
    const backendResponse = await backendFetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        conversation_id,
        user_id: user.id,
        history: context.history,
        file: fileInfo,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error("Backend error:", backendResponse.status, errorText);
      return NextResponse.json(
        { error: "Failed to get response from agent" },
        { status: 500 }
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json({
      response: data.response,
      charts: data.charts || [],
      chart_errors: data.chart_errors || [],
      error: Boolean(data.error),
      data: data.data || null,
    });
  } catch (error) {
    if (error instanceof BackendConfigError) {
      console.error(error.message);
      return NextResponse.json(
        { error: "The server is not configured to reach the analysis backend." },
        { status: 500 }
      );
    }
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
