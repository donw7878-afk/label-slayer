export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverImageUrl?: string;
  author: string;
  publishedAt: string;
  readingMinutes?: number;
  body?: string;
}
