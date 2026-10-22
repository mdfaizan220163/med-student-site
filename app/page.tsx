
import { posts } from "@/lib/posts";
import AdSlot from "@/components/AdSlot";

export default function Home() {
  return (
    <div>
      <section className="py-16">
        <p className="text-4xl">🩺</p>
        <h1 className="text-4xl font-bold mt-4">M D Faizan</h1>
        <p className="text-gray-600 mt-2 text-lg">Medical Student · Researcher · Content Creator</p>
        <p className="mt-4 max-w-2xl text-gray-700">Sharing my journey through medical school — from research papers and clinical insights to daily study vlogs.</p>
        <div className="flex gap-3 mt-6">
          <a href="/blog" className="bg-black text-white px-5 py-2.5 rounded-full text-sm">Read Blog</a>
          <a href="/about" className="border px-5 py-2.5 rounded-full text-sm">My Story →</a>
        </div>
      </section>

      <AdSlot label="Homepage Top Banner" />

      <section>
        <h2 className="font-semibold text-xl mb-4">📖 Latest Posts</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {posts.map(p => (
            <a key={p.slug} href={`/blog/${p.slug}`} className="border rounded-xl p-5 hover:shadow">
              <p className="text-xs text-blue-600">{p.category} • {p.readTime}</p>
              <h3 className="font-semibold mt-2">{p.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{p.excerpt}</p>
            </a>
          ))}
        </div>
      </section>

      <AdSlot label="Homepage In-Feed" />
    </div>
  );
}
