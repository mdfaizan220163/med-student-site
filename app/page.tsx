import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">MD Faizan</h1>
        <p className="text-lg text-gray-600 mb-8">
          3rd-year MBBS student at IKBFU Kaliningrad. Welcome to my study notes and portfolio.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Anatomy Button */}
          <Link 
            href="/anatomy" 
            className="p-4 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition text-blue-600 font-semibold"
          >
            Anatomy Notes
          </Link>

          {/* Research Button */}
          <Link 
            href="/faizan" 
            className="p-4 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition text-blue-600 font-semibold"
          >
            Research
          </Link>

          {/* Vlogs Button */}
          <Link 
            href="/vlogs" 
            className="p-4 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition text-blue-600 font-semibold"
          >
            Vlogs
          </Link>

          {/* Russia Guide Button */}
          <Link 
            href="/russia" 
            className="p-4 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition text-blue-600 font-semibold"
          >
            Russia Guide
          </Link>

          {/* About Button */}
          <Link 
            href="/about" 
            className="p-4 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition text-blue-600 font-semibold"
          >
            About Me
          </Link>
        </div>
      </div>
    </main>
  );
}