import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
          About Stock Scanner
        </h2>

        <div className="space-y-4 text-gray-300 leading-relaxed">
          <p>
            <strong className="text-white">Stock Scanner</strong> is a daily technical analysis
            tracker that helps you monitor stock price levels and crossings. Add symbols to your
            watchlist, set price levels to watch, and track whether stocks cross above or below
            your targets.
          </p>

          <h3 className="text-lg font-semibold text-white pt-4">Features</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>Add stocks with Yahoo Finance symbol autocomplete</li>
            <li>Set price levels and track above/below crossings</li>
            <li>Live price data with one-click refresh</li>
            <li>Carry forward watchlists to the next trading day</li>
            <li>Visual crossing alerts when targets are hit</li>
            <li>Personal accounts to save your watchlists, or use as guest</li>
            <li>Date-based navigation for historical tracking</li>
          </ul>

          <h3 className="text-lg font-semibold text-white pt-4">Tech Stack</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>Next.js with React &mdash; App Router</li>
            <li>Tailwind CSS &mdash; Dark theme UI</li>
            <li>Drizzle ORM with SQLite</li>
            <li>Yahoo Finance API for live market data</li>
          </ul>
        </div>

        <hr className="border-white/10 my-8" />

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            SB
          </div>
          <div>
            <p className="text-white font-semibold">Spandan Brahmbhatt</p>
            <a
              href="https://www.linkedin.com/in/brahmbhattspandan/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn Profile
            </a>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-400"
          >
            ← Back to Scanner
          </Link>
        </div>
      </div>
    </div>
  );
}
