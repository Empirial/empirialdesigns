import { Shield, Clock, Users, Award } from 'lucide-react';

const TrustBar = () => {
  const trustItems = [
    { icon: Shield, text: "100% Original Work" },
    { icon: Users, text: "Trusted by SA Brands" },
    { icon: Clock, text: "Fast Turnaround" },
    { icon: Award, text: "Ongoing Support" }
  ];

  return (
    <section className="py-8 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-muted-foreground">
              <item.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;