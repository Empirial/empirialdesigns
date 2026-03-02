import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

// TikTok icon component since it's not available in lucide-react
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

const BlogTeasers = () => {
  const blogPosts = [
    {
      id: 1,
      title: "10 Things Every Business Website Must Have",
      excerpt: "Essential elements that turn visitors into customers and boost your online credibility.",
      category: "Web Design Tips",
      date: "2024-03-15",
      readTime: "5 min read",
      slug: "/blog"
    },
    {
      id: 2,
      title: "Brand Consistency: Why It Matters More Than You Think",
      excerpt: "How consistent branding across all touchpoints can increase revenue by up to 23%.",
      category: "Branding",
      date: "2024-03-12",
      readTime: "4 min read",
      slug: "/blog"
    },
    {
      id: 3,
      title: "SEO Basics for Small Business Owners",
      excerpt: "Simple strategies to improve your website's visibility on Google without technical expertise.",
      category: "Small Biz Growth",
      date: "2024-03-08",
      readTime: "6 min read",
      slug: "/blog"
    },
    {
      id: 4,
      title: "The Psychology of Color in Marketing Design",
      excerpt: "How different colors trigger emotions and drive purchasing decisions in your marketing materials.",
      category: "Design Psychology",
      date: "2024-03-20",
      readTime: "7 min read",
      slug: "/blog"
    },
    {
      id: 5,
      title: "Social Media Graphics That Convert: A Complete Guide",
      excerpt: "Create scroll-stopping visuals that increase engagement and drive traffic to your business.",
      category: "Social Media",
      date: "2024-03-18",
      readTime: "8 min read",
      slug: "/blog"
    },
    {
      id: 6,
      title: "From Logo to Website: Building a Cohesive Brand Identity",
      excerpt: "Step-by-step process to create a unified brand experience across all customer touchpoints.",
      category: "Brand Strategy",
      date: "2024-03-25",
      readTime: "10 min read",
      slug: "/blog"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-card/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Latest from Our <span className="text-gradient">Blog</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Practical tips, insights, and strategies to help your business grow online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 px-4">
          {blogPosts.map((post) => (
            <Card key={post.id} className="elegant-shadow smooth-transition hover:elegant-glow group w-full">
              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary">{post.category}</Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                </div>
                <CardTitle className="group-hover:text-primary smooth-transition">
                  {post.title}
                </CardTitle>
                <CardDescription>{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{post.readTime}</span>
                  <Link to={post.slug}>
                    <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground smooth-transition">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mb-16">
          <Link to="/blog">
            <Button variant="outline" size="lg" className="mx-4">
              View All Articles
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Social Media Links */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-6">
            Follow Us for More <span className="text-gradient">Design Tips</span>
          </h3>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto px-4">
            Stay updated with the latest design trends, business tips, and behind-the-scenes content on our social channels.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 lg:gap-6 px-4">
            <a
              href="https://facebook.com/empirialdesigns"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 lg:px-6 py-4 hover:bg-accent smooth-transition group w-full sm:w-auto justify-center"
            >
              <Facebook className="w-6 h-6 text-blue-600 group-hover:scale-110 smooth-transition" />
              <span className="font-medium">Facebook</span>
            </a>
            <a
              href="https://instagram.com/empirialdesigns"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 lg:px-6 py-4 hover:bg-accent smooth-transition group w-full sm:w-auto justify-center"
            >
              <Instagram className="w-6 h-6 text-pink-600 group-hover:scale-110 smooth-transition" />
              <span className="font-medium">Instagram</span>
            </a>
            <a
              href="https://tiktok.com/@empirialdesigns"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 lg:px-6 py-4 hover:bg-accent smooth-transition group w-full sm:w-auto justify-center"
            >
              <TikTokIcon className="w-6 h-6 text-foreground group-hover:scale-110 smooth-transition" />
              <span className="font-medium">TikTok</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogTeasers;