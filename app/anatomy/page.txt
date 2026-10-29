import Link from 'next/link';

export default function AnatomyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Anatomy Notes</h1>
      <p className="mb-8 text-gray-600">
        Welcome to my anatomy section. Click a topic below to open the specific notes.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Clavicle & Scapula Note */}
        <a 
          href="/anatomy/notes/clavicle-scapula.html" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block p-6 border border-gray-200 rounded-lg hover:shadow-lg transition bg-white"
        >
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Clavicle & Scapula</h2>
          <p className="text-sm text-gray-600">
            Comprehensive notes on the clavicle and scapula bones.
          </p>
          <span className="text-blue-500 text-sm font-medium mt-4 inline-block">
            Open Notes &rarr;
          </span>
        </a>

        {/* 2. Brachial Plexus Note */}
        <a 
          href="/anatomy/notes/brachial-plexus.html" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block p-6 border border-gray-200 rounded-lg hover:shadow-lg transition bg-white"
        >
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Brachial Plexus</h2>
          <p className="text-sm text-gray-600">
            Detailed notes on the brachial plexus, cords, and main nerves.
          </p>
          <span className="text-blue-500 text-sm font-medium mt-4 inline-block">
            Open Notes &rarr;
          </span>
        </a>

        {/* 3. Upcoming Notes Placeholder */}
        <div className="block p-6 border border-gray-200 border-dashed rounded-lg bg-gray-50 opacity-80">
          <h2 className="text-xl font-semibold text-gray-500 mb-2">More Notes Coming Soon...</h2>
          <p className="text-sm text-gray-500">
            I am currently working on new anatomy notes. Stay tuned!
          </p>
          <span className="text-gray-400 text-sm font-medium mt-4 inline-block">
            Coming Soon
          </span>
        </div>

      </div>
    </div>
  );
}