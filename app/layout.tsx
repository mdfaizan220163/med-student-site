import Link from "next/link";
import { posts } from "../../../lib/posts";
import { notFound } from "next/navigation";
import AdSlot from "../../../components/AdSlot";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const post = posts.find((p) => p.slug === resolvedParams.slug);
  
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | M D Faizan`,
    description: post.excerpt,
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = posts.find((p) => p.slug === resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const postData = post as any;

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/blog" className="text-blue-600 hover:underline mb-8 inline-block">
        ← Back to Blog
      </Link>
      
      <div className="mb-8">
        <p className="text-sm text-blue-600 font-medium mb-2">
          {postData.category || "Blog"} • {postData.readTime || "5 min"}
        </p>
        <h1 className="text-4xl font-bold mb-4">{postData.title}</h1>
        <p className="text-lg text-gray-600">{postData.excerpt}</p>
      </div>

      <AdSlot />

      <div className="prose prose-lg max-w-none mt-8">
        <p>{postData.content || "Content coming soon..."}</p>
        
        {postData.slug === "truth-about-medicine-in-russia" && (
          <Link href="/russia" className="inline-block mt-6 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-bold">
            Read the Full Detailed Guide Here →
          </Link>
        )}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-xl font-bold mb-4">Connect with me</h3>
        <div className="flex flex-wrap gap-4">
          <a href="https://instagram.com/flar.orc.067" target="_blank" className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition">Instagram</a>
          <a href="https://youtube.com/@medicosfaizan?si=bUrktJ4yKUKwUt70" target="_blank" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">YouTube</a>
          <a href="https://linkedin.com/in/md-faizan-b285442a8" target="_blank" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">LinkedIn</a>
          <a href="/contact" className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition">Contact Page</a>
        </div>
      </div>
    </main>
  );
}