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
        
        <div className="flex gap-4 pt-4">
          <Link 
            href="/blog" 
            className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition"
          >
            Read Blog
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
        <AdSlot type="top" />
      </div>

      {/* Latest Posts Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>📚</span> Latest Posts
        </h2>
        <div className="grid gap-6">
          {posts.map((post) => (
            <Link 
              key={post.slug} 
              href={`/blog/${post.slug}`}
              className="block p-6 border border-gray-200 rounded-xl hover:border-blue-500 transition"
            >
              <p className="text-sm text-blue-600 font-medium mb-2">
                {post.category} • {post.readTime}
              </p>
              <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
              <p className="text-gray-600 text-sm">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}