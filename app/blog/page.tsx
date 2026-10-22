
import { posts } from "@/lib/posts";
export default function Blog() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Blog</h1>
      <p className="text-gray-600 mt-2">Clinical pearls, research simplified, and study notes.</p>
      <div className="grid gap-4 mt-8">
        {posts.map(p => (
          <a key={p.slug} href={`/blog/${p.slug}`} className="border rounded-xl p-5">
            <p className="text-xs text-blue-600">{p.category} • {p.date}</p>
            <h3 className="font-semibold text-lg mt-1">{p.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{p.excerpt}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
