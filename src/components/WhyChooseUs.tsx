import { Target, Zap, Palette, Headphones } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SectionHeader from './common/SectionHeader';

const WhyChooseUs = () => {
  const benefits = [
    {
      icon: Target,
      title: "Precision & Quality",
      description: "Every pixel matters. We craft designs with meticulous attention to detail and brand consistency."
    },
    {
      icon: Zap,
      title: "Speed & Efficiency", 
      description: "Fast turnaround without compromising quality. Most projects delivered within 5-7 days."
    },
    {
      icon: Palette,
      title: "Brand-Consistent Design",
      description: "Designs that align perfectly with your brand identity and speak to your target audience."
    },
    {
      icon: Headphones,
      title: "Responsive Support",
      description: "Direct communication via WhatsApp. Quick responses and ongoing support after delivery."
    }
  ];

  return (
    <section className="py-16 md:py-24 scroll-mt-nav">
      <div className="container mx-auto px-4 max-w-6xl">
        <SectionHeader 
          title="Why Choose"
          highlight="Empirial Designs"
          description="We combine creativity with strategic thinking to deliver designs that don't just look good—they work."
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center elegant-shadow smooth-transition hover:elegant-glow w-full">
              <CardHeader className="pb-4 px-4 lg:px-6">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-lg">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 lg:px-6">
                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;