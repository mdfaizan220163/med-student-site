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

        {/* Russia Guide Button */}
        <div className="text-center mb-8">
          <Link
            href="/russia"
            className="inline-block px-6 py-3 bg-red-50 text-red-700 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold"
          >
            ⚠️ Read: The Truth About Studying Medicine in Russia
          </Link>
        </div>

        {/* About Button */}
        <div className="text-center mb-8">
          <Link
            href="/about"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            👋 Read my full story →
          </Link>
        </div>

        {/* Social Links */}
        <div className="flex justify-center gap-4 mb-12">
          {/* Instagram */}
          <a
            href="https://instagram.com/flar.orc.067"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white shadow-md hover:scale-110 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="https://youtube.com/@medicosfaizan"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="w-12 h-12 flex items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:scale-110 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/md-faizan-b285442a8"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="w-12 h-12 flex items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-md hover:scale-110 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        </div>

        {/* Main Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          
          {/* Anatomy Button (Open) */}
          <a
            href="/anatomy/clavicle-scapula.html"
            target="_blank"
            className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold text-center hover:bg-green-700 transition-colors shadow-md"
          >
            🦴 Anatomy Notes
          </a>

          {/* Anatomy Button (Download) */}
          <a
            href="/anatomy/clavicle-scapula.html"
            download="Clavicle_and_Scapula_Notes.html"
            className="px-8 py-4 bg-gray-800 text-white rounded-lg font-semibold text-center hover:bg-gray-900 transition-colors shadow-md"
          >
            ⬇️ Download Notes
          </a>

          {/* Research Button */}
          <Link
            href="/faizan"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors shadow-md"
          >
            📚 Research
          </Link>

          {/* Vlogs Button */}
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