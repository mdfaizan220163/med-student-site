import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-6xl mb-4">🩺</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            M D Faizan
          </h1>
          <p className="text-lg text-blue-600 font-medium mb-4">
            Medical Student · Researcher · Content Creator
          </p>
          <p className="text-gray-600 max-w-xl mx-auto">
            Sharing my journey through medical school — from research papers 
            and clinical insights to daily study vlogs.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link
            href="/faizan"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors shadow-md"
          >
            📚 Research
          </Link>
          <Link
            href="/vlogs"
            className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold text-center hover:bg-blue-50 transition-colors"
          >
            🎥 Vlogs
          </Link>
        </div>

        {/* Coming Soon Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              📖 Latest Research
            </h2>
            <p className="text-gray-600 text-sm">
              Coming soon — case studies, literature reviews, and clinical insights.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              🎬 Latest Vlog
            </h2>
            <p className="text-gray-600 text-sm">
              Coming soon — study with me, day in the life, exam prep.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="texst-xs text-gray-400 text-center mt-16">
          Content is for educational purposes only and not medical advice.
        </p>

      </div>
    </main>
  );
}