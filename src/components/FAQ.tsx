import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ = () => {
  const faqs = [
    {
      question: "What are your payment terms?",
      answer: "We require a 20% deposit to start your project, with the remaining 80% due upon completion and approval. We accept bank transfers, EFT, and secure online payments."
    },
    {
      question: "How long does a typical project take?",
      answer: "Landing page websites are delivered within 5-7 business days, while poster/social designs are completed in 48-72 hours. Complex projects may take longer, and we'll provide a clear timeline upfront."
    },
    {
      question: "How many revisions are included?",
      answer: "Landing page projects include 1 round of revisions, while poster designs include 2 revisions. Additional revisions can be requested for a small fee to ensure you're completely satisfied."
    },
    {
      question: "What files will I receive upon completion?",
      answer: "For websites: fully functional site, source files, and documentation. For designs: high-resolution PNG/JPG, print-ready PDF, and source files upon request. All files are optimized for their intended use."
    },
    {
      question: "Do you provide hosting for websites?",
      answer: "We can recommend reliable hosting providers and help with setup. We also offer ongoing maintenance packages if you need continued support after launch."
    },
    {
      question: "Can you help with copywriting and content?",
      answer: "Yes! We offer copywriting services as an add-on. Our team can create compelling, conversion-focused content that aligns with your brand voice and marketing goals."
    },
    {
      question: "Do you work with businesses outside South Africa?",
      answer: "While we specialize in serving South African businesses, we do work with international clients. Communication is primarily via WhatsApp and email for seamless collaboration."
    },
    {
      question: "What if I'm not satisfied with the final result?",
      answer: "Your satisfaction is our priority. We work closely with you throughout the process and offer revisions to ensure the final product meets your expectations. We stand behind our work with a satisfaction guarantee."
    }
  ];

  return (
    <section className="py-16 md:py-24 scroll-mt-nav">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Got questions? We've got answers. Find everything you need to know about working with us.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4 px-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border border-border rounded-lg px-4 lg:px-6 elegant-shadow"
            >
              <AccordionTrigger className="text-left hover:no-underline hover:text-primary smooth-transition">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;