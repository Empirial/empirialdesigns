import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    from_name: '',
    from_email: '',
    phone: '',
    company: '',
    project_type: '',
    budget: '',
    timeline: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format message for WhatsApp
    const whatsappMessage = `*New Contact Form Submission*

*Name:* ${formData.from_name}
*Email:* ${formData.from_email}
*Phone:* ${formData.phone || 'Not provided'}
*Company:* ${formData.company || 'Not provided'}
*Project Type:* ${formData.project_type}
*Budget:* ${formData.budget || 'Not specified'}
*Timeline:* ${formData.timeline || 'Not specified'}

*Message:*
${formData.message}`;

    const whatsappUrl = `https://wa.me/27606691849?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
    setFormData({ from_name: '', from_email: '', phone: '', company: '', project_type: '', budget: '', timeline: '', message: '' });
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="from_name" className="block text-sm font-medium mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="from_name"
              name="from_name"
              value={formData.from_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label htmlFor="from_email" className="block text-sm font-medium mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="from_email"
              name="from_email"
              value={formData.from_email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-2">
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="project_type" className="block text-sm font-medium mb-2">
              Project Type *
            </label>
            <select
              id="project_type"
              name="project_type"
              value={formData.project_type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a project type</option>
              <option value="web-development">Web Development</option>
              <option value="mobile-app">Mobile App</option>
              <option value="e-commerce">E-commerce</option>
              <option value="branding">Branding & Design</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="budget" className="block text-sm font-medium mb-2">
              Budget Range
            </label>
            <select
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select budget range</option>
              <option value="under-2k">Under R2,000</option>
              <option value="2k-5k">R2,000 - R5,000</option>
              <option value="5k-10k">R5,000 - R10,000</option>
              <option value="10k-plus">R10,000+</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="timeline" className="block text-sm font-medium mb-2">
            Project Timeline
          </label>
          <select
            id="timeline"
            name="timeline"
            value={formData.timeline}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select timeline</option>
            <option value="asap">ASAP</option>
            <option value="1-month">Within 1 month</option>
            <option value="2-3-months">2-3 months</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">
            Project Details *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Tell us about your project requirements, goals, and any specific features you need..."
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-vertical"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-6 rounded-md font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Send Message via WhatsApp
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
