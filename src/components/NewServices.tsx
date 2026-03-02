import { Globe, ShoppingCart, Layers } from 'lucide-react';
import ServiceCard from './services/ServiceCard';

const NewServices = () => {
  const openWhatsApp = () => {
    window.open('https://wa.me/message/6ZHJUVYQDOH3O1', '_blank');
  };

  const services = [
    {
      icon: Globe,
      title: "Landing Page",
      price: "R1,999.99",
      popular: false,
      description: "Perfect for startups and small businesses. Get a stunning single-page website that converts.",
      features: [
        "1 Custom Landing Page",
        "Responsive Mobile Design",
        "Contact Form Integration",
        "Basic SEO Setup",
        "WhatsApp Integration",
        "Fast Loading Speed",
        "3 Days Delivery"
      ],
      addons: "Add-ons available: Extra pages (R500 each), Logo design (R200)",
      cta: "Get Started"
    },
    {
      icon: Layers,
      title: "Full Website",
      price: "R3,999.99",
      popular: true,
      description: "Complete multi-page website with advanced features. Perfect for growing businesses.",
      features: [
        "Up to 3 Custom Pages",
        "Premium Responsive Design",
        "Advanced Contact Forms",
        "Full SEO Optimization",
        "Social Media Integration",
        "Google Business Setup",
        "Blog Section",
        "5 Days Delivery"
      ],
      addons: "Add-ons: Extra pages (R500 each), 2 Poster designs (R400), Business Cards (R150)",
      cta: "Get More Client"
    },
    {
      icon: ShoppingCart,
      title: "E-commerce Website",
      price: "R5,999.99",
      popular: false,
      description: "Full-featured online store with payment processing. Start selling online today.",
      features: [
        "Shopping Cart & Checkout",
        "Payment Gateway Integration",
        "Product Management System",
        "Customer Accounts",
        "Inventory Management",
        "Email Notifications",
        "Mobile Responsive",
        "1 Weeks Delivery"
      ],
      addons: "Add-ons: Advanced shipping (R1,500), Multi-currency (R1,000), Product reviews (R800)",
      cta: "This Way"
    }
  ];

  return (
    <section id="services" className="py-20 bg-background relative overflow-hidden scroll-mt-nav">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Choose Your <span className="text-gradient">Package</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Transparent pricing. Premium quality. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <ServiceCard 
              key={index} 
              service={service} 
              onGetStarted={openWhatsApp}
            />
          ))}
        </div>
        
        {/* Service Examples */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8">Recent Work Examples</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto px-4">
            <div className="aspect-[3/4] rounded-lg overflow-hidden elegant-shadow hover:elegant-glow smooth-transition">
              <img src="/lovable-uploads/Website Design Poster.png" alt="Website Design Service" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[3/4] rounded-lg overflow-hidden elegant-shadow hover:elegant-glow smooth-transition">
              <img src="/lovable-uploads/Our Menu (3).pdf.png" alt="Menu Design Service" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[3/4] rounded-lg overflow-hidden elegant-shadow hover:elegant-glow smooth-transition">
              <img src="/lovable-uploads/1.jpg" alt="1.jpg" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[3/4] rounded-lg overflow-hidden elegant-shadow hover:elegant-glow smooth-transition">
              <img src="/lovable-uploads/Breakfast Hamper BW.png" alt="Food Service Design" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewServices;
