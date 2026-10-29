import Link from "next/link";

export default function VlogsPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        
        {/* Back Link */}
        <Link href="/" className="text-blue-600 hover:text-blue-800 hover:underline mb-8 inline-flex items-center gap-2 font-medium transition-colors">
          <span>←</span> Back to Home
        </Link>

        {/* Big SEO Header & IKBFU Banner */}
        <header className="text-center mb-12 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-500/30 text-blue-100 text-sm font-semibold tracking-wide mb-4 border border-blue-400/30">
              Medical Student Journey
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter drop-shadow-sm">
              IKBFU
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 font-medium">
              Immanuel Kant Baltic Federal University
            </p>
            <p className="text-blue-200 mt-2 max-w-xl mx-auto">
              Kaliningrad, Russia · 3rd Year MBBS
            </p>
          </div>
        </header>

        {/* Main Content Article */}
        <article className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-12">
          
          {/* YouTube Short Embed */}
          <div className="bg-gray-950 w-full flex justify-center py-6 md:py-10">
            <iframe
              className="w-full max-w-[360px] aspect-[9/16] rounded-xl shadow-2xl border border-gray-800"
              src="https://www.youtube.com/embed/TqTa7EDYjqw"
              title="3rd Year MBBS Student | My Med School Journey"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>

          <div className="p-6 md:p-12">
            {/* Video Title */}
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 leading-tight">
              My Med School Journey 🩺
            </h2>
            
            {/* The Beautiful Quote/Text */}
            <div className="prose prose-lg text-gray-700 leading-relaxed max-w-none">
              <p className="text-xl text-gray-500 font-medium mb-6">
                Here is a little bit about me and my journey so far:
              </p>
              
              <blockquote className="relative border-l-4 border-blue-600 pl-6 md:pl-8 italic bg-blue-50/50 py-6 pr-6 rounded-r-2xl my-8 text-gray-800 shadow-sm">
                <span className="absolute top-2 left-2 text-6xl text-blue-200/50 font-serif leading-none">"</span>
                <p className="relative z-10 text-lg md:text-xl">
                  Guys, my name is Mohammed Faizan and I am currently a third year MBBS student. I love anatomy and I love skull, and I love sketching, drawing and I love chocolates. I love coffee. I am just a random person not enough famous. So if you want to stick around with me and want to get me along, I will love you so much for that. And please visit my website which I created.
                </p>
              </blockquote>

              <p className="mb-4">
                Studying medicine at <strong>IKBFU in Kaliningrad</strong> is a unique experience. If you are a medical student, a pre-med, or just someone interested in what life is like studying medicine abroad in Russia, this is the place for you.
              </p>
              <p>
                Stick around for study tips, research breakdowns, anatomy sketches, and the reality of med school.
              </p>
            </div>

            {/* Social Links */}
            <div className="mt-10 flex flex-wrap gap-4 border-t border-gray-100 pt-8">
              <a 
                href="https://youtube.com/@medicosfaizan" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 hover:-translate-y-1 transition-all shadow-lg text-sm flex items-center gap-2"
              >
                ▶ Subscribe on YouTube
              </a>
              <a 
                href="https://instagram.com/flar.orc.067" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:opacity-90 hover:-translate-y-1 transition-all shadow-lg text-sm flex items-center gap-2"
              >
                📸 Follow on Instagram
              </a>
            </div>
          </div>
        </article>

        {/* Coming Soon Section */}
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-gray-500 font-medium">
            More vlogs and research breakdowns coming soon. Stay tuned! 🚀
          </p>
        </div>

      </div>
    </main>
  );
}