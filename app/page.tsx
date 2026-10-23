import Link from "next/link";
import { posts } from "../lib/posts";
import AdSlot from "../components/AdSlot";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-4">
        <span className="text-5xl">🩺</span>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          M D Faizan
        </h1>
        <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
          Medical Student · Researcher · Content Creator
        </p>
        <p className="max-w-2xl text-gray-600 dark:text-gray-400">
          Sharing my journey through medical school — from research papers and clinical insights to daily study vlogs.
        </p>

        {/* SOCIAL MEDIA ICONS START */}
        <div className="flex justify-center gap-6 pt-4 pb-2">
          <a href="https://instagram.com/flar.orc.067" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          
          <a href="https://youtube.com/@medicosfaizan?si=bUrktJ4yKUKwUt70" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition transform hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
            </svg>
          </a>
        </div>
        {/* SOCIAL MEDIA ICONS END */}
        
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link 
            href="/blog" 
            className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition"
          >
            Read Blog
          </Link>
          <Link 
            href="/russia" 
            className="bg-red-600 text-white px-6 py-2 rounded-full font-medium hover:bg-red-700 transition shadow-lg shadow-red-200"
          >
            ⚠️ The Truth About Russia
          </Link>
          <Link 
            href="/about" 
            className="border border-gray-300 px-6 py-2 rounded-full font-medium hover:bg-gray-50 transition"
          >
            My Story →
          </Link>
        </div>
      </div>

      {/* Ad Slot */}
      <div className="my-12">
        <AdSlot />
      </div>

      {/* Latest Posts Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>📚</span> Latest Posts
        </h2>
        <div className="grid gap-6">
          {posts.map((post) => {
            const postLink = post.slug === "truth-about-medicine-in-russia" 
              ? "/russia" 
              : `/blog/${post.slug}`;

            return (
              <Link 
                key={post.slug} 
                href={postLink}
                className="block p-6 border border-gray-200 rounded-xl hover:border-blue-500 transition"
              >
                <p className="text-sm text-blue-600 font-medium mb-2">
                  {post.category} • {post.readTime}
                </p>
                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                <p className="text-gray-600 text-sm">{post.excerpt}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}