import { useState } from 'react';
import { Calendar, Clock, User, Download, ArrowRight, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const blogPosts = [
    {
      id: 1,
      title: '10 Things Every Business Website Must Have in 2024',
      excerpt: 'Essential elements that make your website convert visitors into customers. From mobile optimization to clear call-to-actions.',
      category: 'Website Tips',
      author: 'Empirial Team',
      date: '2024-01-15',
      readTime: '8 min read',
      image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      featured: true
    },
    {
      id: 2,
      title: 'SEO Tricks That Actually Work in 2024',
      excerpt: 'Stop wasting time on outdated SEO tactics. These proven strategies will boost your search rankings and drive organic traffic.',
      category: 'SEO',
      author: 'Empirial Team',
      date: '2024-01-10',
      readTime: '12 min read',
      image: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      featured: false
    },
    {
      id: 3,
      title: 'UI/UX Trends Reshaping Digital Experiences',
      excerpt: 'From micro-interactions to dark mode, discover the design trends that are defining user experiences in modern web design.',
      category: 'UI/UX Trends',
      author: 'Empirial Team',
      date: '2024-01-08',
      readTime: '6 min read',
      image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      featured: false
    },
    {
      id: 4,
      title: 'Digital Marketing Strategies for Small Businesses',
      excerpt: 'Maximize your marketing budget with these cost-effective digital strategies that deliver real results for growing businesses.',
      category: 'Digital Marketing',
      author: 'Empirial Team',
      date: '2024-01-05',
      readTime: '10 min read',
      image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      featured: false
    },
    {
      id: 5,
      title: 'Case Study: How We Increased Conversions by 300%',
      excerpt: 'A detailed breakdown of our design process and the specific changes that led to a 300% increase in conversion rates.',
      category: 'Case Studies',
      author: 'Empirial Team',
      date: '2024-01-03',
      readTime: '15 min read',
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      featured: true
    },
    {
      id: 6,
      title: 'Website Performance Optimization Checklist',
      excerpt: 'Speed up your website and improve user experience with this comprehensive performance optimization guide.',
      category: 'Website Tips',
      author: 'Empirial Team',
      date: '2024-01-01',
      readTime: '9 min read',
      image: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',
      featured: false
    }
  ];

  const categories = ['All', 'Website Tips', 'SEO', 'UI/UX Trends', 'Digital Marketing', 'Case Studies'];

  const downloadAuditChecklist = () => {
    window.open('/seo-audit', '_blank');
  };

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-6">
              <span className="text-gradient">BLOG</span>{' '}
              <span className="text-foreground">&</span>{' '}
              <span className="text-foreground">RESOURCES</span>
            </h1>
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-black flex-1 max-w-32"></div>
              <p className="text-lg lg:text-xl text-foreground font-black mx-6 lg:mx-8 tracking-[0.3em]">
                KNOWLEDGE HUB
              </p>
              <div className="h-px bg-black flex-1 max-w-32"></div>
            </div>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              Stay ahead of the curve with weekly insights on web design, SEO, digital marketing, 
              and business growth strategies from our expert team.
            </p>
            
            {/* Lead Magnet */}
            <Card className="max-w-md mx-auto bg-gradient-to-r from-black to-gray-800 text-white border-0">
              <CardContent className="p-6">
                <div className="text-center">
                  <Download className="w-12 h-12 mx-auto mb-4 text-white" />
                  <h3 className="text-xl font-bold mb-2">FREE Website Audit Checklist</h3>
                  <p className="text-gray-300 mb-4 text-sm">
                    Get our comprehensive 50-point checklist to audit any website like a pro.
                  </p>
                  <Button 
                    onClick={downloadAuditChecklist}
                    className="w-full bg-white text-black hover:bg-gray-100 font-bold"
                  >
                    Download Free Checklist
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 
                    "bg-black text-white" : 
                    "border-gray-300 hover:bg-gray-50"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && selectedCategory === 'All' && !searchTerm && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <h2 className="text-3xl md:text-4xl font-black mb-12 text-center">Featured Articles</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="group hover:shadow-xl transition-all duration-500 border-0 bg-white overflow-hidden">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-6 lg:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="bg-black text-white border-black">
                        {post.category}
                      </Badge>
                      <div className="text-sm text-gray-500 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold mb-3 group-hover:text-gray-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{post.author}</span>
                      </div>
                      <Button variant="ghost" className="group-hover:bg-black group-hover:text-white transition-all">
                        Read More <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Posts */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => (
              <Card key={post.id} className="group hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {post.category}
                    </Badge>
                    <span className="text-xs text-gray-500">{post.readTime}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-gray-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                    <Button size="sm" variant="ghost" className="text-xs p-0 h-auto">
                      Read More <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No articles found</h3>
              <p className="text-gray-500">Try adjusting your search terms or filter selection.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;