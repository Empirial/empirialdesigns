import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface ServiceCardProps {
  service: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    price: string;
    popular: boolean;
    description: string;
    features: string[];
    addons: string;
    cta: string;
  };
  onGetStarted: () => void;
}

const ServiceCard = ({ service, onGetStarted }: ServiceCardProps) => {
  return (
    <Card className={`relative shadow-lg transition-all duration-300 hover:shadow-xl w-full ${service.popular ? 'ring-2 ring-primary' : ''}`}>
      {service.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-black font-bold border-2 border-primary">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-4 p-4 md:p-6">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center elegant-glow">
          <service.icon className="w-8 h-8 text-black" />
        </div>
        <CardTitle className="text-xl">{service.title}</CardTitle>
        <div className="text-2xl md:text-3xl font-black text-gradient">{service.price}</div>
        <CardDescription className="mt-2">{service.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4 md:p-6">
        <div className="space-y-3">
          {service.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">{service.addons}</p>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 md:p-6">
        <Button 
          onClick={onGetStarted}
          className="w-full"
          size="lg"
          variant={service.popular ? "default" : "outline"}
        >
          {service.cta}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;