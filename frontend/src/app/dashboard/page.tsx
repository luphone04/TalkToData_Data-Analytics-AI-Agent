import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BarChart3 } from "lucide-react";
import { UserMenu } from "@/components/Auth/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardContent } from "@/components/Dashboard/DashboardContent";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold">TalkToData</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu email={user.email || ""} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Welcome to TalkToData</h1>
        <DashboardContent />
      </main>
    </div>
  );
}
