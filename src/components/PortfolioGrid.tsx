import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import PortfolioCard from './portfolio/PortfolioCard';
import MILogo from '@/assets/MI logo.png';
import SKCCLogo from '@/assets/skcclogo.png';
import YtshikaLogo from '@/assets/ytshikalogo.png';
import EmpirialAttorneysLogo from '@/assets/EmpirialAttorneysLogo.png';
import EmpirialSpaLogo from '@/assets/Empirialspalogo.png';
import EmpirialDesignsLogo from '@/assets/Empirialdesignslogo.png';
import SiyaleleProjectsLogo from '@/assets/SiyaleleprojectsLogo.png';

const PortfolioGrid = () => {
  const [activeFilter, setActiveFilter] = useState('All');

  const categories = ['All', 'Landing Pages', 'Logos', 'Posters', 'Social'];

  const portfolioItems = [
    {
      id: 1,
      title: "Mphela Industries",
      category: "Landing Pages",
      image: MILogo,
      url: "https://mphelaindsutriespty.netlify.app",
      description: "Professional industrial services website with modern design and clear messaging."
    },
    {
      id: 2,
      title: "SKCC Legal Services",
      category: "Landing Pages", 
      image: SKCCLogo,
      url: "https://skcc.netlify.app/",
      description: "Legal services firm website with trust-building elements and professional layout."
    },
    {
      id: 3,
      title: "Ytshika Attorneys",
      category: "Landing Pages",
      image: YtshikaLogo,
      url: "https://ytshikaattorneys.co.za",
      description: "Attorney firm website with comprehensive legal services showcase."
    },
    {
      id: 4,
      title: "Empirial Attorney",
      category: "Landing Pages",
      image: EmpirialAttorneysLogo,
      url: "https://empirialattorney.netlify.app",
      description: "Modern legal practice website with client-focused design approach."
    },
    {
      id: 5,
      title: "Empirial Spa", 
      category: "Landing Pages",
      image: EmpirialSpaLogo,
      url: "https://empirialspa.netlify.app/",
      description: "Luxury spa website with elegant design and booking functionality."
    },
    {
      id: 6,
      title: "Empirial Designs",
      category: "Landing Pages",
      image: EmpirialDesignsLogo,
      url: "https://empirialdesigns.netlify.app",
      description: "Design agency portfolio showcasing creative services and client work."
    },
    {
      id: 7,
      title: "Mbendela Matt Attorneys",
      category: "Landing Pages",
      image: "https://images.pexels.com/photos/5668772/pexels-photo-5668772.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop",
      url: "https://www.mbendelamtattorneys.co.za",
      description: "Professional legal services with expertise in various law practice areas."
    },
    {
      id: 8,
      title: "Siyalele Projects",
      category: "Landing Pages",
      image: SiyaleleProjectsLogo,
      url: "https://www.siyaleleprojects.co.za",
      description: "Project management and construction services website with comprehensive showcase."
    },
    {
      id: 9,
      title: "Website Design Poster",
      category: "Posters",
      image: "/lovable-uploads/Website Design Poster.png",
      url: "#",
      description: "Professional website design service poster with modern layout and clear messaging."
    },
    {
      id: 10,
      title: "Restaurant Menu Design",
      category: "Posters",
      image: "/lovable-uploads/Our Menu (3).pdf.png",
      url: "#",
      description: "Elegant restaurant menu design with professional typography and layout."
    },
    {
      id: 11,
      title: "Gudani Driving School",
      category: "Posters",
      image: "/lovable-uploads/Gudani Driving School.png",
      url: "#",
      description: "Driving school promotional poster with clear branding and contact information."
    },
    {
      id: 12,
      title: "Genesis & Her Nails",
      category: "Posters",
      image: "/lovable-uploads/Genesis & Her Nails (2).png",
      url: "#",
      description: "Beauty salon promotional design with elegant styling and service highlights."
    },
    {
      id: 13,
      title: "Breakfast Hamper",
      category: "Posters",
      image: "/lovable-uploads/Breakfast Hamper BW.png",
      url: "#",
      description: "Food service promotional poster with appetizing design and clear pricing."
    },
    {
      id: 14,
      title: "TT Resellers Logo",
      category: "Logo",
      image: "/Lovable-uploads/5.jpg",
      url: "#",
      description: "A Logo capturing the essence of the Owner"
    },
  {
      id: 15,
      title: "TT Resellers Poster",
      category: "Posters",
      image: "/Lovable-uploads/1.jpg",
      url: "#",
      description: "Thinking of everlasting fragrance"
    },
  {
      id: 16,
      title: "TT Resellers Poster",
      category: "Posters",
      image: "/Lovable-uploads/3.jpg",
      url: "#",
      description: "Check Out the Catolugue for Everlasting Fragance"
    }
  ];

  const filteredItems = activeFilter === 'All' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeFilter);

  return (
    <section id="portfolio" className="py-16 md:py-24 scroll-mt-nav">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our <span className="text-gradient">Portfolio</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Real projects that delivered real results for our clients across South Africa.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 lg:gap-3 mb-12 px-4">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeFilter === category ? "default" : "outline"}
              size="sm" 
              onClick={() => setActiveFilter(category)}
              className="smooth-transition text-xs lg:text-sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              {category}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-4">
          {filteredItems.map((item) => (
            <PortfolioCard key={item.id} item={item} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PortfolioGrid;
