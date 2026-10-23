import Link from "next/link";
import { posts } from "../../../lib/posts";
import { notFound } from "next/navigation";
import AdSlot from "../../../components/AdSlot";

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = posts.find((p) => p.slug === resolvedParams.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/blog" className="text-blue-600 hover:underline mb-8 inline-block">
        ← Back to Blog
      </Link>
      
      <div className="mb-8">
        <p className="text-sm text-blue-600 font-medium mb-2">
          {post.category} • {post.readTime}
        </p>
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <p className="text-lg text-gray-600">{post.excerpt}</p>
      </div>

      <AdSlot />

      <div className="prose prose-lg dark:prose-invert max-w-none">
        {/* This renders the actual blog text */}
        <p>{post.content || "Content coming soon..."}</p>
      </div>
    </main>
  );
}