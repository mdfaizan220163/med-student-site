import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-6xl shadow-lg">
            🩺
          </div>
          
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

        {/* Social Links */}
        <div className="flex justify-center gap-4 mb-12">
          <a
            href="https://instagram.com/flar.orc.067"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 text-2xl hover:bg-pink-50 hover:border-pink-300 transition-colors shadow-sm"
            aria-label="Instagram"
          >
            📷
          </a>
          <a
            href="https://youtube.com/@medicosfaizan"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 text-2xl hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
            aria-label="YouTube"
          >
            🎥
          </a>
          <a
            href="https://www.linkedin.com/in/md-faizan-b285442a8"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 text-2xl hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm"
            aria-label="LinkedIn"
          >
            💼
          </a>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
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

        {/* Latest cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              📖 Latest Research
            </h2>
            <p className="text-gray-600 text-sm">
              Coming soon — case studies, literature reviews, and clinical insights.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              🎬 Latest Vlog
            </h2>
            <p className="text-gray-600 text-sm">
              Coming soon — study with me, day in the life, exam prep.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center mt-16">
          Content is for educational purposes only and not medical advice.
        </p>

      </div>
    </main>
  );
}