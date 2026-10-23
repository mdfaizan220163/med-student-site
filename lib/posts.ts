export type Post = {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  content?: string;
};

export const posts: Post[] = [
  {
    slug: "how-to-read-cbc",
    title: "How to Read a CBC Like a 3rd Year Med Student",
    category: "Clinical Pearls",
    date: "2026-10-23",
    readTime: "5 min",
    excerpt: "RBC, WBC, Platelets explained with 3 pattern tricks every med student should know.",
    content: "Write your full CBC article here. You can delete this text and type your real content."
  },
  {
    slug: "truth-about-medicine-in-russia",
    title: "The Truth About Studying Medicine in Russia",
    category: "Med Journey",
    date: "2026-10-23",
    readTime: "7 min",
    excerpt: "My honest experience, costs, language, and what I wish I knew before.",
    content: "Here is my full story. I study at IKBFU Kaliningrad. Tuition is 326,500 rubles and hostel is 15,000 rubles a year. I lost 3 lakh rupees to a scam. Reach me on Instagram @flar.orc.067 or YouTube @medicosfaizan."
  }
];