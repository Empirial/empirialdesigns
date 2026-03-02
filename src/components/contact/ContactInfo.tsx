import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Mail, MapPin } from 'lucide-react';

const ContactInfo = () => {
  const openWhatsApp = () => {
    window.open('https://wa.me/message/6ZHJUVYQDOH3O1', '_blank');
  };

  return (
    <Card className="elegant-shadow h-fit w-full">
      <CardHeader>
        <CardTitle>Get in Touch</CardTitle>
        <CardDescription>
          Choose your preferred way to connect with us.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50 smooth-transition hover:bg-card/80">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="font-semibold">WhatsApp</div>
            <div className="text-sm text-muted-foreground">Quick response guaranteed</div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="font-semibold">Email</div>
            <div className="text-sm text-muted-foreground">hello@empirialdesigns.co.za</div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="font-semibold">Location</div>
            <div className="text-sm text-muted-foreground">South Africa</div>
          </div>
        </div>

        <Button 
          onClick={openWhatsApp}
          className="w-full"
          size="lg"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Chat on WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContactInfo;