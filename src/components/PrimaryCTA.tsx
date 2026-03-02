import { Button } from '@/components/ui/button';
import { MessageCircle, Calendar } from 'lucide-react';

const PrimaryCTA = () => {
  const openWhatsApp = () => {
    window.open('https://wa.me/message/6ZHJUVYQDOH3O1', '_blank');
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center bg-gradient-primary rounded-2xl p-6 md:p-8 lg:p-12 elegant-glow mx-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto px-4">
            Join hundreds of South African businesses that have boosted their online presence with our designs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={openWhatsApp}
              className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-semibold min-w-[200px]"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start WhatsApp Chat
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={scrollToContact}
              className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary min-w-[200px]"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book Free Consultation
            </Button>
          </div>
          
          <p className="text-white/70 text-sm mt-6 px-4">
            Free 15-minute consultation • No commitments • Quick response guaranteed
          </p>
        </div>
      </div>
    </section>
  );
};

export default PrimaryCTA;