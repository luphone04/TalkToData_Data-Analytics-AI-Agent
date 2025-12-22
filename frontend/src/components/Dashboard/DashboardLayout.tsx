"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { UserMenu } from "@/components/Auth/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UsageBadge } from "@/components/Usage";
import { DashboardContent } from "./DashboardContent";

interface DashboardLayoutProps {
  userEmail: string;
}

export function DashboardLayout({ userEmail }: DashboardLayoutProps) {
  const [usageRefreshTrigger, setUsageRefreshTrigger] = useState(0);

  const handleUsageChange = () => {
    setUsageRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-900 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold">TalkToData</span>
          </Link>

          <div className="flex items-center gap-3">
            <UsageBadge refreshTrigger={usageRefreshTrigger} />
            <div className="hidden sm:block w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
            <ThemeToggle />
            <UserMenu email={userEmail} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <DashboardContent onUsageChange={handleUsageChange} />
      </main>
    </div>
  );
}
