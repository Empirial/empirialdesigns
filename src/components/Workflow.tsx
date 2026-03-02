import { CreditCard, Layout, Rocket } from 'lucide-react';

const Workflow = () => {
  const steps = [
    {
      icon: CreditCard,
      step: "1",
      title: "20% Deposit & Brief",
      description: "Share your vision, goals, and requirements. Secure your project with a small deposit."
    },
    {
      icon: Layout,
      step: "2", 
      title: "Wireframe & Design",
      description: "We create wireframes and designs that align with your brand and convert visitors."
    },
    {
      icon: Rocket,
      step: "3",
      title: "Build, QA & Launch",
      description: "Development, testing, and launch with 7-day support to ensure everything works perfectly."
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-card/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple <span className="text-gradient">Process</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            From concept to launch in three straightforward steps. No complexity, just results.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {steps.map((step, index) => (
            <div key={index} className="text-center relative w-full">
              <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center relative">
                <step.icon className="w-10 h-10 text-primary" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-1/2 -z-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Workflow;