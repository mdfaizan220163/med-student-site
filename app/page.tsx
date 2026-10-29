import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6 text-gray-800">
      
      <main className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 md:p-12">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4 tracking-tight">
            MD Faizan
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            3rd-year MBBS Student at IKBFU Kaliningrad
          </p>
          <p className="text-md text-gray-500">
            Welcome to my study notes, research, and portfolio.
          </p>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          
          <Link href="/anatomy" className="group block p-6 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md">
            <h2 className="text-xl font-bold mb-2 text-blue-800 group-hover:text-white">Anatomy Notes</h2>
            <p className="text-sm text-gray-600 group-hover:text-blue-100">Access my curated anatomy study materials.</p>
          </Link>

          <Link href="/faizan" className="group block p-6 bg-green-50 border border-green-100 rounded-xl hover:bg-green-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md">
            <h2 className="text-xl font-bold mb-2 text-green-800 group-hover:text-white">Research</h2>
            <p className="text-sm text-gray-600 group-hover:text-green-100">Explore my medical research and projects.</p>
          </Link>

          <Link href="/vlogs" className="group block p-6 bg-red-50 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md">
            <h2 className="text-xl font-bold mb-2 text-red-800 group-hover:text-white">Vlogs</h2>
            <p className="text-sm text-gray-600 group-hover:text-red-100">Watch my journey as a medical student in Russia.</p>
          </Link>

          <Link href="/russia" className="group block p-6 bg-purple-50 border border-purple-100 rounded-xl hover:bg-purple-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md">
            <h2 className="text-xl font-bold mb-2 text-purple-800 group-hover:text-white">Russia Guide</h2>
            <p className="text-sm text-gray-600 group-hover:text-purple-100">Tips for studying and living in Russia.</p>
          </Link>

          <Link href="/about" className="group block p-6 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-800 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md sm:col-span-2">
            <h2 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-white">About Me</h2>
            <p className="text-sm text-gray-600 group-hover:text-gray-300">Learn more about my background and goals.</p>
          </Link>

        </div>

        {/* Social Links Section */}
        <div className="border-t border-gray-200 pt-8 mt-4 text-center">
          <p className="text-sm text-gray-500 mb-4 uppercase tracking-wider font-semibold">Connect with me</p>
          <div className="flex justify-center space-x-6">
            <a href="https://instagram.com/flar.orc.067" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-600 transition-colors">
              Instagram
            </a>
            <a href="https://youtube.com/@medicosfaizan" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-red-600 transition-colors">
              YouTube
            </a>
            <a href="https://linkedin.com/in/md-faizan-b285442a8" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-700 transition-colors">
              LinkedIn
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}