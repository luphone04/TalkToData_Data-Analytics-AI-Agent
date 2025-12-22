import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, FileSpreadsheet, MessageSquare, Sparkles, Zap, Shield, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold">TalkToData</span>
        </div>
        <div className="flex gap-4">
          {user ? (
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Data Analysis
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Chat with your data,
            <span className="text-blue-600"> get instant insights</span>
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
            Upload CSV or Excel files and ask questions in plain English.
            Our AI analyzes your data and creates beautiful visualizations in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  <Sparkles className="h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    <Sparkles className="h-5 w-5" />
                    Start Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="p-6 rounded-xl border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Any Data</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Support for CSV and Excel files. Just drag and drop to get started with your analysis.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ask in Plain English</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              No SQL or coding needed. Just ask questions like you would ask a data analyst.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Visualizations</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Generate charts, graphs, and reports automatically with a single request.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold mb-2">Upload your data</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">Drag and drop your CSV or Excel file into the app</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold mb-2">Ask a question</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">Type your question in natural language</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold mb-2">Get insights</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">Receive analysis, statistics, and visualizations</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-32 grid md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="font-semibold">Lightning Fast</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Get answers in seconds, not hours</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-semibold">Secure</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Your data is encrypted and private</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Download className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-semibold">Export Charts</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Download visualizations as PNG</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            {user ? "Continue analyzing your data" : "Ready to analyze your data?"}
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            {user
              ? "Pick up where you left off and get more insights from your data."
              : "Join thousands of users who are already getting insights from their data with AI."
            }
          </p>
          <Link href={user ? "/dashboard" : "/signup"}>
            <Button size="lg" variant="secondary" className="gap-2">
              <Sparkles className="h-5 w-5" />
              {user ? "Go to Dashboard" : "Get Started Free"}
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-20 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="font-semibold">TalkToData</span>
          </div>
          <p className="text-sm text-zinc-500">AI-powered data analysis made simple</p>
        </div>
      </footer>
    </div>
  );
}
