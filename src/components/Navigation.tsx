import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavClick = (href: string) => {
    if (href.startsWith('/')) {
      // Route navigation
      navigate(href);
    } else if (href.startsWith('#')) {
      // Section scrolling - only if on homepage
      if (location.pathname === '/') {
        scrollToSection(href);
      } else {
        // Navigate to homepage first, then scroll
        navigate('/');
        setTimeout(() => {
          scrollToSection(href);
        }, 100);
      }
    }
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/message/6ZHJUVYQDOH3O1', '_blank');
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '#services' },
    { name: 'Portfolio', href: '#portfolio' },
    { name: 'Contact', href: '#contact' }
  ];

  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="bg-background/80 backdrop-blur-xl border border-border rounded-full px-6 sm:px-8 py-4 elegant-shadow">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/94f51cc3-f695-4449-8dc0-01c2e5cced2f.png" 
              alt="Empirial Designs Logo" 
              className="h-8 sm:h-10 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className="text-foreground hover:text-muted-foreground transition-colors duration-300 font-semibold text-base xl:text-lg relative group px-3 py-2 rounded-full hover:bg-muted/20"
              >
                {item.name}
              </button>
            ))}
            <Button 
              variant="outline"
              className="font-bold px-6 py-3 text-base xl:text-lg transition-all duration-300 rounded-full"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
            <Button 
              className="bg-primary text-primary-foreground font-bold px-6 py-3 text-base xl:text-lg hover:bg-primary/90 transition-all duration-300 rounded-full elegant-shadow"
              onClick={openWhatsApp}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="h-12 w-12 rounded-full hover:bg-muted/20"
            >
              {isOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden mt-6 pt-6 border-t border-border animate-fade-in">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    handleNavClick(item.href);
                    setIsOpen(false);
                  }}
                  className="text-foreground hover:text-muted-foreground transition-colors duration-300 font-semibold text-lg px-4 py-3 rounded-full hover:bg-muted/20 text-left w-full"
                >
                  {item.name}
                </button>
              ))}
              <div className="pt-4 space-y-3">
                <Button 
                  variant="outline"
                  className="w-full font-bold text-lg py-3 rounded-full"
                  onClick={() => {
                    navigate('/auth');
                    setIsOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full bg-primary text-primary-foreground font-bold text-lg py-3 rounded-full elegant-shadow"
                  onClick={openWhatsApp}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;