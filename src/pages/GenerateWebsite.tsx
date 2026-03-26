import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { onAuthStateChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '@/integrations/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import type { User } from 'firebase/auth';

interface GenerationStep {
  id: number;
  title: string;
  description: string;
}

const steps: GenerationStep[] = [
  { id: 1, title: 'Describe Your Website', description: 'Tell us what kind of website you want' },
  { id: 2, title: 'Configure Details', description: 'Set name and basic information' },
  { id: 3, title: 'Generate', description: 'AI creates your website' },
];

const GenerateWebsite = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    prompt: '',
    websiteType: 'landing',
    repoName: '',
    companyName: '',
    description: '',
  });

  const [generatedRepo, setGeneratedRepo] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        navigate('/auth');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const websiteTypes = [
    {
      value: 'landing',
      label: 'Landing Page',
      description: 'Modern landing page with hero, features, and CTA',
      preview: '🎯',
      features: ['Hero Section', 'Features', 'Testimonials', 'Call-to-Action', 'Responsive Design'],
      color: 'bg-blue-500'
    },
    {
      value: 'ecommerce',
      label: 'E-commerce Store',
      description: 'Online store with products, cart, and checkout',
      preview: '🛒',
      features: ['Product Catalog', 'Shopping Cart', 'Checkout', 'Product Details', 'Payment Ready'],
      color: 'bg-green-500'
    },
    {
      value: 'blog',
      label: 'Blog',
      description: 'Content blog with posts, categories, and archives',
      preview: '✍️',
      features: ['Post Listing', 'Categories', 'Search', 'Archive', 'Reading Experience'],
      color: 'bg-purple-500'
    },
    {
      value: 'portfolio',
      label: 'Portfolio',
      description: 'Showcase your work and projects',
      preview: '🎨',
      features: ['Project Showcase', 'Gallery', 'About Section', 'Contact Form', 'Modern Design'],
      color: 'bg-pink-500'
    },
    {
      value: 'saas',
      label: 'SaaS Landing',
      description: 'Software product landing with pricing and features',
      preview: '💼',
      features: ['Pricing Tiers', 'Feature Showcase', 'Integrations', 'Testimonials', 'Sign-up CTA'],
      color: 'bg-indigo-500'
    },
    {
      value: 'restaurant',
      label: 'Restaurant',
      description: 'Menu, reservations, and location info',
      preview: '🍽️',
      features: ['Menu Display', 'Reservations', 'Location Map', 'Gallery', 'Contact Info'],
      color: 'bg-orange-500'
    },
  ];

  const handleNext = () => {
    if (currentStep === 1 && !formData.prompt.trim()) {
      toast({
        title: "Required",
        description: "Please describe the website you want to create",
        variant: "destructive",
      });
      return;
    }
    if (currentStep === 2 && !formData.repoName.trim()) {
      toast({
        title: "Required",
        description: "Please enter a repository name",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleGenerate = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Validation
    if (!formData.prompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe the website you want to create",
        variant: "destructive",
      });
      return;
    }

    if (!formData.repoName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a repository name",
        variant: "destructive",
      });
      setCurrentStep(2);
      return;
    }

    // Validate repo name format
    const repoNameRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;
    if (!repoNameRegex.test(formData.repoName)) {
      toast({
        title: "Invalid Repository Name",
        description: "Repository name can only contain letters, numbers, and hyphens",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      toast({
        title: "Generating Website",
        description: "Creating repository and generating files...",
      });

      const createWebsite = httpsCallable(functions, 'createWebsite');
      const result = await createWebsite({
        prompt: formData.prompt,
        repoName: formData.repoName || undefined,
        websiteType: formData.websiteType,
        companyName: formData.companyName || undefined,
      });

      const data = result.data as any;
      if (!data?.repo) throw new Error('Invalid response from server');

      setGeneratedRepo(data.repo);

      toast({
        title: "Success! 🎉",
        description: `Website generated with ${data.repo.files_created || 'multiple'} files`,
      });

      // Auto-advance after a moment
      setTimeout(() => {
        setCurrentStep(3);
      }, 500);

    } catch (error: any) {
      console.error('Generation error:', error);

      const msg = error.message || '';
      if (msg.includes('already exists')) {
        toast({
          title: "Error",
          description: `Repository "${formData.repoName}" already exists. Please choose a different name.`,
          variant: "destructive",
        });
      } else if (msg.includes('token')) {
        toast({
          title: "Error",
          description: 'GitHub token error. Please check your configuration.',
          variant: "destructive",
        });
      } else if (error.name === 'TypeError' && msg.includes('fetch')) {
        toast({
          title: "Network Error",
          description: "Could not connect to server. Please check your internet connection.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: msg || "Failed to generate website. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewRepo = () => {
    if (generatedRepo?.url) {
      window.open(generatedRepo.url, '_blank');
    }
  };

  const handleGoToPreview = () => {
    if (generatedRepo?.id) {
      navigate(`/preview/${generatedRepo.id}`);
    } else {
      navigate('/repos');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/repos')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Repositories
          </Button>
          <h1 className="text-4xl font-bold mb-2">AI Website Generator</h1>
          <p className="text-muted-foreground">
            Create a complete website in seconds with AI
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep > step.id
                        ? 'bg-primary text-primary-foreground'
                        : currentStep === step.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Describe Website */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="prompt">What kind of website do you want?</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., Create a modern landing page for my SaaS startup with a pricing section and contact form"
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    Be specific about features, style, and purpose for best results
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>Or choose a template to get started:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {websiteTypes.map((type) => (
                      <Card
                        key={type.value}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          formData.websiteType === type.value
                            ? 'ring-2 ring-primary border-primary'
                            : ''
                        }`}
                        onClick={() => {
                          setFormData({ ...formData, websiteType: type.value });
                          if (!formData.prompt) {
                            setFormData(prev => ({
                              ...prev,
                              websiteType: type.value,
                              prompt: `Create a ${type.label.toLowerCase()} website${type.value === 'landing' ? ' with hero section, features, testimonials, and call-to-action' : type.value === 'ecommerce' ? ' with product catalog, shopping cart, and checkout functionality' : type.value === 'blog' ? ' with post listing, categories, and search functionality' : type.value === 'portfolio' ? ' to showcase my work and projects' : type.value === 'saas' ? ' with pricing tiers, feature showcase, and sign-up CTA' : ' with menu, reservations, and location info'}`
                            }));
                          }
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg ${type.color} flex items-center justify-center text-2xl`}>
                              {type.preview}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{type.label}</CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {type.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Includes:</p>
                            <ul className="text-xs space-y-1">
                              {type.features.slice(0, 3).map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-primary" />
                                  {feature}
                                </li>
                              ))}
                              {type.features.length > 3 && (
                                <li className="text-muted-foreground">
                                  +{type.features.length - 3} more features
                                </li>
                              )}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click on a template to select it and auto-fill the prompt
                  </p>
                </div>
              </>
            )}

            {/* Step 2: Configure Details */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="repoName">Repository Name *</Label>
                  <Input
                    id="repoName"
                    placeholder="my-awesome-website"
                    value={formData.repoName}
                    onChange={(e) => setFormData({ ...formData, repoName: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be your GitHub repository name
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company/Project Name (optional)</Label>
                  <Input
                    id="companyName"
                    placeholder="My Awesome Company"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your website"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Step 3: Generate */}
            {currentStep === 3 && (
              <div className="text-center space-y-6 py-8">
                {!generatedRepo ? (
                  <>
                    <div className="flex justify-center">
                      <Sparkles className="h-16 w-16 text-primary animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">Ready to Generate!</h3>
                      <p className="text-muted-foreground mb-6">
                        Click the button below to create your website
                      </p>
                      <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        size="lg"
                        className="min-w-[200px]"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Website
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">Website Generated! 🎉</h3>
                      <p className="text-muted-foreground mb-4">
                        Your website has been created with {generatedRepo.files_created} files
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                          onClick={handleViewRepo}
                          variant="outline"
                          size="lg"
                        >
                          View on GitHub
                        </Button>
                        <Button
                          onClick={handleGoToPreview}
                          size="lg"
                        >
                          Edit & Preview
                        </Button>
                      </div>
                      {generatedRepo.commit_url && (
                        <p className="text-sm text-muted-foreground mt-4">
                          <a
                            href={generatedRepo.commit_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-primary"
                          >
                            View initial commit
                          </a>
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
              >
                Back
              </Button>
              {currentStep < 3 ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : !generatedRepo ? (
                <Button onClick={handleGenerate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Website'
                  )}
                </Button>
              ) : (
                <Button onClick={handleGoToPreview}>
                  Continue to Preview
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenerateWebsite;
