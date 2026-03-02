import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Chen",
      company: "Bloom Boutique",
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      rating: 5,
      text: "Empirial Designs transformed our online presence completely. The landing page they created increased our conversions by 40% in just two months."
    },
    {
      id: 2,
      name: "Michael Botha",
      company: "TechStart SA",
      avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      rating: 5,
      text: "Professional, fast, and exactly what we needed. The team understood our vision immediately and delivered beyond expectations."
    },
    {
      id: 3,
      name: "Priya Patel",
      company: "Spice Route Restaurant",
      avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      rating: 5,
      text: "The poster designs they created for our restaurant are absolutely stunning. We've received so many compliments from customers."
    },
    {
      id: 4,
      name: "James Mthembu",
      company: "Urban Fitness",
      avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      rating: 5,
      text: "Quick turnaround, excellent communication, and results that speak for themselves. Highly recommend for any business in SA."
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-card/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our <span className="text-gradient">Clients Say</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Don't just take our word for it. See what our satisfied clients have to say about working with us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 px-4">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="elegant-shadow smooth-transition hover:elegant-glow w-full">
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                
                <blockquote className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.text}"
                </blockquote>
                
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.company}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Design Showcase */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8">
            Designs That <span className="text-gradient">Get Results</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
            <div className="bg-white rounded-lg p-6 elegant-shadow">
              <div className="aspect-[3/4] mb-4 rounded-lg overflow-hidden">
                <img src="/lovable-uploads/Gudani Driving School.png" alt="Driving School Poster" className="w-full h-full object-cover" />
              </div>
              <h4 className="font-semibold mb-2">Professional Service Posters</h4>
              <p className="text-sm text-muted-foreground">Clear messaging that converts prospects into customers</p>
            </div>
            <div className="bg-white rounded-lg p-6 elegant-shadow">
              <div className="aspect-[3/4] mb-4 rounded-lg overflow-hidden">
                <img src="/lovable-uploads/Our Menu (3).pdf.png" alt="Restaurant Menu" className="w-full h-full object-cover" />
              </div>
              <h4 className="font-semibold mb-2">Restaurant Menus</h4>
              <p className="text-sm text-muted-foreground">Appetizing designs that increase average order value</p>
            </div>
            <div className="bg-white rounded-lg p-6 elegant-shadow">
              <div className="aspect-[3/4] mb-4 rounded-lg overflow-hidden">
                <img src="/lovable-uploads/Genesis & Her Nails (2).png" alt="Beauty Salon Design" className="w-full h-full object-cover" />
              </div>
              <h4 className="font-semibold mb-2">Beauty & Wellness</h4>
              <p className="text-sm text-muted-foreground">Elegant designs that attract premium clients</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;