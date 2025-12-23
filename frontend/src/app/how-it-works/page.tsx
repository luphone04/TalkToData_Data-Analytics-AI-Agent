"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  Cog,
  FileText,
  BarChart3,
  PieChart,
  ArrowRight,
  RefreshCw,
  Zap,
  MessageSquare,
  Database,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-900 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold">TalkToData</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard" className="flex items-center gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">How TalkToData Works</h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Powered by an Agentic AI built with the OpenAI Agents SDK and GPT-4o
          </p>
        </div>

        {/* Architecture Overview */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">System Architecture</h2>

          <div className="flex flex-col items-center gap-4">
            {/* Frontend & Supabase Row */}
            <div className="flex flex-wrap justify-center gap-4 w-full">
              <Card className="w-48 text-center">
                <CardContent className="pt-6">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold">Frontend</p>
                  <p className="text-xs text-zinc-500">Next.js + React</p>
                </CardContent>
              </Card>

              <Card className="w-48 text-center">
                <CardContent className="pt-6">
                  <Database className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold">Supabase</p>
                  <p className="text-xs text-zinc-500">Auth + DB + Storage</p>
                </CardContent>
              </Card>
            </div>

            {/* Arrow Down */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
              <ArrowRight className="h-5 w-5 text-zinc-400 rotate-90" />
            </div>

            {/* AI Agent - The Main Focus */}
            <Card className="w-full max-w-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Brain className="h-6 w-6 text-purple-600" />
                  AI Agent Service
                </CardTitle>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">FastAPI Backend + OpenAI Agents SDK</p>
              </CardHeader>
              <CardContent>
                {/* ReAct Loop Visualization */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 mb-4">
                  <h4 className="text-center font-semibold mb-4 text-purple-600">Agentic Loop (ReAct Pattern)</h4>

                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 px-4 py-2 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Query</span>
                    </div>

                    <ArrowRight className="h-5 w-5 text-zinc-400 hidden sm:block" />

                    <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/50 px-4 py-2 rounded-lg">
                      <Brain className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium">Think</span>
                    </div>

                    <ArrowRight className="h-5 w-5 text-zinc-400 hidden sm:block" />

                    <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/50 px-4 py-2 rounded-lg">
                      <Zap className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Act</span>
                    </div>

                    <ArrowRight className="h-5 w-5 text-zinc-400 hidden sm:block" />

                    <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/50 px-4 py-2 rounded-lg">
                      <Eye className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Observe</span>
                    </div>
                  </div>

                  <div className="flex justify-center mt-3">
                    <div className="flex items-center gap-1 text-sm text-zinc-500">
                      <RefreshCw className="h-4 w-4" />
                      <span>Repeat until complete</span>
                    </div>
                  </div>
                </div>

                {/* Tools */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 text-center">
                    <FileText className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                    <p className="text-sm font-medium">File Tools</p>
                    <p className="text-xs text-zinc-500">3 tools</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 text-center">
                    <Cog className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                    <p className="text-sm font-medium">Analysis Tools</p>
                    <p className="text-xs text-zinc-500">5 tools</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 text-center">
                    <PieChart className="h-6 w-6 mx-auto mb-1 text-green-500" />
                    <p className="text-sm font-medium">Visualization</p>
                    <p className="text-xs text-zinc-500">5 tools</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Arrow Down */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-700" />
              <ArrowRight className="h-5 w-5 text-zinc-400 rotate-90" />
            </div>

            {/* OpenAI API */}
            <Card className="w-48 text-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
              <CardContent className="pt-6">
                <Brain className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                <p className="font-semibold">OpenAI API</p>
                <p className="text-xs text-zinc-500">GPT-4o</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Key Concepts */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Key AI Concepts</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  LLM Backbone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  GPT-4o provides reasoning, natural language understanding, and autonomous decision-making capabilities.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Tool Use / Function Calling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Agent invokes Python functions decorated with <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">@function_tool</code> to interact with data and generate visualizations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  ReAct Pattern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Agent iteratively <strong>Reasons</strong> about the task, <strong>Acts</strong> by calling tools, and <strong>Observes</strong> results in a loop.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cog className="h-5 w-5 text-green-600" />
                  Prompt Engineering
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  System instructions guide agent behavior, define capabilities, and structure response format for consistent outputs.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Available Tools */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">11 Agent Tools</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-500" />
                  File Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                  <li>• Load datasets (CSV, Excel)</li>
                  <li>• Inspect column schemas</li>
                  <li>• List available files</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cog className="h-5 w-5 text-blue-500" />
                  Analysis Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                  <li>• Statistical summaries</li>
                  <li>• Data filtering</li>
                  <li>• Group by aggregations</li>
                  <li>• Value counts</li>
                  <li>• Correlation analysis</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-green-500" />
                  Visualization Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                  <li>• Bar charts</li>
                  <li>• Line charts</li>
                  <li>• Histograms</li>
                  <li>• Scatter plots</li>
                  <li>• Pie charts</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" asChild>
            <Link href="/dashboard">
              Try it Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
