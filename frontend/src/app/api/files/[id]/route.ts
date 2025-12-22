import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// DELETE: Remove a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get file record to verify ownership and get storage path
  const { data: file, error: fetchError } = await supabase
    .from("user_files")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("user-files")
    .remove([file.storage_path]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
    // Continue anyway to clean up database record
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("user_files")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (dbError) {
    console.error("Database delete error:", dbError);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// GET: Get file download URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get file record
  const { data: file, error: fetchError } = await supabase
    .from("user_files")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Generate signed URL for download
  const { data: signedUrl, error: urlError } = await supabase.storage
    .from("user-files")
    .createSignedUrl(file.storage_path, 3600); // 1 hour expiry

  if (urlError) {
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    file: {
      id: file.id,
      filename: file.filename,
      originalName: file.original_name,
      size: file.file_size,
      mimeType: file.mime_type,
      downloadUrl: signedUrl.signedUrl,
    },
  });
}
