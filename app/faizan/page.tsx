import Link from "next/link";

export default function FaizanPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Back link */}
        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm mb-8 inline-block"
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            📚 Faizan's Research & Notes
          </h1>
          <p className="text-gray-600">
            My collection of medical research papers, case studies, and study notes.
          </p>
        </div>

        {/* Posts list */}
        <div className="space-y-6">

          <article className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-blue-600 mb-1">Coming Soon</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              My First Research Post
            </h2>
            <p className="text-gray-600 text-sm">
              A case study on... (content coming soon)
            </p>
          </article>

          <article className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-blue-600 mb-1">Coming Soon</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Study Notes: Cardiology
            </h2>
            <p className="text-gray-600 text-sm">
              Key concepts and clinical pearls...
            </p>
          </article>

        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center mt-16">
          Content is for educational purposes only and not medical advice.
        </p>

      </div>
    </main>
  );
}