
export type Post = {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
};

export const posts: Post[] = [
  {
    slug: "how-to-read-cbc",
    title: "How to Read a CBC Like a 3rd Year Med Student",
    category: "Clinical Pearls",
    date: "2026-10-22",
    readTime: "5 min",
    excerpt: "RBC, WBC, Platelets explained with 3 pattern tricks every med student should know."
  },
  {
    slug: "truth-about-medicine-in-russia",
    title: "The Truth About Studying Medicine in Russia",
    category: "Med Journey",
    date: "2026-10-20",
    readTime: "7 min",
    excerpt: "My honest experience, costs, language, and what I wish I knew before."
  }
];
