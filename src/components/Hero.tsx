import { Button } from '@/components/ui/button';
import heroStatue from '@/assets/hero-statue.png';
import statueAccent1 from '@/assets/statue-accent-1.png';
import statueAccent2 from '@/assets/statue-accent-2.png';

const Hero = () => {
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/message/6ZHJUVYQDOH3O1', '_blank');
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      {/* Floating statue accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 opacity-20 animate-float hidden lg:block">
          <img src={statueAccent1} alt="" className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="absolute bottom-20 right-10 w-40 h-40 opacity-20 animate-float hidden lg:block" style={{ animationDelay: '1s' }}>
          <img src={statueAccent2} alt="" className="w-full h-full object-cover rounded-lg" />
        </div>
        
        {/* Gold geometric elements */}
        <div className="absolute top-32 right-24 w-16 h-16 border-2 border-primary/30 rounded-full animate-float hidden xl:block"></div>
        <div className="absolute bottom-32 left-24 w-12 h-12 bg-gradient-primary opacity-20 rotate-45 animate-float hidden xl:block" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 right-12 w-8 h-8 border-2 border-primary/40 rotate-12 animate-float hidden xl:block" style={{ animationDelay: '1.5s' }}></div>
      </div>
      
      {/* Main hero statue */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <img src={heroStatue} alt="" className="h-full w-auto object-cover" />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
            Legendary <span className="text-gradient">Websites</span> & Graphics
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-8 px-4">
            Crafted with the precision of ancient masters, enhanced with modern gold-standard design.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4 max-w-md mx-auto sm:max-w-none">
            <Button 
              size="lg" 
              onClick={openWhatsApp}
              className="bg-gradient-primary text-black hover:opacity-90 font-bold text-lg px-8 py-4 w-full sm:w-auto min-w-[200px] elegant-glow border-2 border-primary/50"
            >
              Get a Free Quote
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => scrollToSection('services')}
              className="border-2 border-primary text-primary hover:bg-primary hover:text-black font-bold text-lg px-8 py-4 w-full sm:w-auto min-w-[200px] bg-transparent"
            >
              View Packages
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
