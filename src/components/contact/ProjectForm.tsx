import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  deadline: string;
  brief: string;
}

const ProjectForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    service: '',
    budget: '',
    deadline: '',
    brief: ''
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Format WhatsApp message
    const whatsappMessage = `*New Project Inquiry - Empirial Designs*

📝 *Client Details:*
• Name: ${formData.name}
• Email: ${formData.email}
• Phone: ${formData.phone || 'Not provided'}

🎯 *Project Details:*
• Service Type: ${formData.service}
• Budget Range: ${formData.budget || 'Not specified'}
• Preferred Deadline: ${formData.deadline || 'Not specified'}

📋 *Project Brief:*
${formData.brief}

---
*Sent via EmpirialDesigns.com Contact Form*`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // Open WhatsApp
    window.open(`https://wa.me/27818885950?text=${encodedMessage}`, '_blank');
    
    toast({
      title: "Redirected to WhatsApp!",
      description: "Your message has been formatted and ready to send via WhatsApp.",
    });
    
    setIsSubmitting(false);
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      service: '',
      budget: '',
      deadline: '',
      brief: ''
    });
  };

  return (
    <Card className="elegant-shadow w-full">
      <CardHeader>
        <CardTitle>Project Brief</CardTitle>
        <CardDescription>
          Tell us about your project and we'll provide a custom quote within 24 hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input 
                id="name" 
                placeholder="Your full name" 
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your@email.com" 
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone/WhatsApp</Label>
              <Input 
                id="phone" 
                placeholder="+27 XX XXX XXXX" 
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Service Type *</Label>
              <Select 
                value={formData.service} 
                onValueChange={(value) => handleInputChange('service', value)} 
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landing-page">Landing Page Website</SelectItem>
                  <SelectItem value="poster-design">Poster/Social Design</SelectItem>
                  <SelectItem value="logo-design">Logo Design</SelectItem>
                  <SelectItem value="custom-quote">Custom Quote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget Range</Label>
              <Select 
                value={formData.budget} 
                onValueChange={(value) => handleInputChange('budget', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-500">Under R500</SelectItem>
                  <SelectItem value="500-1500">R500 - R1,500</SelectItem>
                  <SelectItem value="1500-5000">R1,500 - R5,000</SelectItem>
                  <SelectItem value="5000-plus">R5,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Preferred Deadline</Label>
              <Input 
                id="deadline" 
                type="date" 
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brief">Project Brief *</Label>
            <Textarea 
              id="brief" 
              placeholder="Tell us about your project, goals, target audience, and any specific requirements..."
              className="min-h-[120px]"
              value={formData.brief}
              onChange={(e) => handleInputChange('brief', e.target.value)}
              required
            />
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Project Brief
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectForm;