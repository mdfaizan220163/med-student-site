
import { posts } from "@/lib/posts";
import AdSlot from "@/components/AdSlot";

export function generateStaticParams() {
  return posts.map(p => ({ slug: p.slug }));
}

export default function Post({ params }: { params: { slug: string } }) {
  const post = posts.find(p => p.slug === params.slug);
  if (!post) return <div>Post not found</div>;
  return (
    <article className="max-w-3xl">
      <p className="text-sm text-blue-600">{post.category} • {post.readTime}</p>
      <h1 className="text-3xl font-bold mt-2">{post.title}</h1>
      <p className="text-sm text-gray-500 mt-2">{post.date} • By M D Faizan, 3rd Year Medical Student</p>

      <div className="prose mt-8">
        <p><strong>TLDR:</strong> {post.excerpt}</p>
        <AdSlot label="In-Article 1" />
        <h2>Content</h2>
        <p>Replace this with your MDX content. For the CBC post, use the content from the artifact I generated. Add disclaimer box at end.</p>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-sm mt-8">
          <strong>Disclaimer:</strong> For educational purposes only. This is not medical advice. Always consult qualified healthcare professionals.
        </div>
        <AdSlot label="In-Article 2 - End" />
      </div>
    </article>
  );
}
