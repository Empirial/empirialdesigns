import founderImage from '@/assets/founder.jpg';

const AboutFounder = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg transform rotate-3"></div>
            <img
              src={founderImage}
              alt="Founder of Empirial Designs"
              className="relative rounded-lg shadow-2xl w-full h-auto object-cover"
            />
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-primary font-semibold mb-2">MEET THE FOUNDER</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Building Digital Excellence, <span className="text-gradient">One Project at a Time</span>
              </h2>
            </div>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              As the solo entrepreneur behind Empirial Designs, I'm dedicated to crafting exceptional digital experiences that help businesses thrive in the modern marketplace.
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              With a passion for innovative design and a commitment to excellence, I work closely with each client to bring their vision to life. Every project is a partnership, and your success is my success.
            </p>
            
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">🎨</span>
                </div>
                <div>
                  <p className="font-semibold">Creative Excellence</p>
                  <p className="text-sm text-muted-foreground">Unique designs tailored to your brand</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">🤝</span>
                </div>
                <div>
                  <p className="font-semibold">Personal Touch</p>
                  <p className="text-sm text-muted-foreground">Direct communication, no middlemen</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <p className="font-semibold">Fast Delivery</p>
                  <p className="text-sm text-muted-foreground">Quick turnaround without compromising quality</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutFounder;