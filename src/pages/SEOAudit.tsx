import { useState } from 'react';
import { Search, CheckCircle, AlertTriangle, XCircle, Download, Globe, Zap, Target, BarChart, ArrowRight, TrendingUp, Users, Clock, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';

interface AuditResult {
  score: number;
  criticalIssues: string[];
  quickWins: string[];
  opportunities: string[];
  techAnalysis: {
    pageSpeed: number;
    mobileOptimized: boolean;
    seoTitle: boolean;
    metaDescription: boolean;
    headingStructure: boolean;
    imageAlt: boolean;
    sslCertificate: boolean;
    xmlSitemap: boolean;
  };
  competitorAnalysis: {
    ranking: number;
    totalCompetitors: number;
    strengths: string[];
    weaknesses: string[];
  };
}

const SEOAudit = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const { toast } = useToast();

  const openWhatsApp = () => {
    window.open('https://wa.me/message/6ZHJUVYQDOH3O1', '_blank');
  };

  const handleAudit = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setAuditResult(null);

    // Simulate audit process
    const intervals = [15, 30, 45, 60, 75, 90, 100];
    for (let i = 0; i < intervals.length; i++) {
      setTimeout(() => {
        setProgress(intervals[i]);
      }, (i + 1) * 700);
    }

    // Mock audit results after 5 seconds
    setTimeout(() => {
      const mockResult: AuditResult = {
        score: Math.floor(Math.random() * 40) + 60,
        criticalIssues: [
          'Missing meta description on 5 key pages',
          'No structured data markup found',
          'Page speed issues (3.2s average load time)',
          'Missing canonical tags on 8 pages',
          'Broken internal links detected (12 links)',
          'Missing alt text on 23 images'
        ],
        quickWins: [
          'Optimize title tag length (3 pages too long)',
          'Add missing H1 tags on 4 pages',
          'Fix duplicate meta descriptions',
          'Compress images for 40% size reduction',
          'Add proper heading hierarchy',
          'Update outdated copyright year'
        ],
        opportunities: [
          'Implement schema markup for better rich snippets',
          'Create topic clusters for content strategy',
          'Build high-quality backlinks from industry sites',
          'Optimize for featured snippets',
          'Improve mobile page speed score',
          'Add FAQ schema for voice search optimization'
        ],
        techAnalysis: {
          pageSpeed: Math.floor(Math.random() * 30) + 60,
          mobileOptimized: Math.random() > 0.3,
          seoTitle: Math.random() > 0.2,
          metaDescription: Math.random() > 0.4,
          headingStructure: Math.random() > 0.3,
          imageAlt: Math.random() > 0.5,
          sslCertificate: Math.random() > 0.1,
          xmlSitemap: Math.random() > 0.4
        },
        competitorAnalysis: {
          ranking: Math.floor(Math.random() * 10) + 1,
          totalCompetitors: 50,
          strengths: [
            'Strong domain authority',
            'Good mobile optimization',
            'Active social media presence'
          ],
          weaknesses: [
            'Slow page load times',
            'Limited content depth',
            'Poor local SEO optimization'
          ]
        }
      };

      setAuditResult(mockResult);
      setIsAnalyzing(false);
      toast({
        title: "Audit Complete!",
        description: "Your comprehensive website analysis is ready to review."
      });
    }, 5000);
  };

  const downloadReport = () => {
    toast({
      title: "Report Generated",
      description: "Your detailed SEO audit report has been prepared. Contact us for the full professional version!",
    });
    openWhatsApp();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const trustIndicators = [
    { icon: Globe, text: "500+ Websites Audited" },
    { icon: Users, text: "Trusted by SA Businesses" },
    { icon: Clock, text: "Instant Results" },
    { icon: Award, text: "Professional Analysis" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">PROFESSIONAL SEO AUDIT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              <span className="text-gradient">WEBSITE</span>{' '}
              <span className="text-foreground">SEO AUDIT</span>
            </h1>
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-black flex-1 max-w-32"></div>
              <p className="text-lg lg:text-xl text-foreground font-black mx-6 lg:mx-8 tracking-[0.3em]">
                INSTANT ANALYSIS
              </p>
              <div className="h-px bg-black flex-1 max-w-32"></div>
            </div>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              Get a comprehensive SEO audit of your website with professional insights. Identify critical issues, 
              quick wins, and strategic opportunities to boost your search rankings and drive more organic traffic.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mb-12 py-6 border-y border-gray-200">
            {trustIndicators.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-muted-foreground min-w-0">
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-xs md:text-sm font-medium whitespace-nowrap">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Audit Tool */}
          <Card className="bg-white/80 backdrop-blur-lg border border-gray-200 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Search className="w-7 h-7" />
                Website SEO Analyzer
              </CardTitle>
              <p className="text-muted-foreground">Enter your website URL to get started</p>
            </CardHeader>
            <CardContent className="p-6 lg:p-8">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="text-base md:text-lg p-3 md:p-4 h-12 md:h-14 border-2 focus:border-primary"
                      disabled={isAnalyzing}
                    />
                  </div>
                  <Button 
                    onClick={handleAudit}
                    disabled={isAnalyzing || !url}
                    className="bg-black text-white hover:bg-gray-800 px-6 md:px-8 h-12 md:h-14 text-base md:text-lg font-bold min-w-[120px] md:min-w-[140px]"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Audit Now'}
                  </Button>
                </div>

                {isAnalyzing && (
                  <div className="space-y-4 bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Analysis Progress</span>
                      <span className="text-sm text-gray-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full h-3" />
                    <div className="text-center">
                      <p className="text-sm text-gray-600 font-medium">
                        {progress < 15 ? 'Fetching website data...' :
                         progress < 30 ? 'Analyzing technical SEO...' :
                         progress < 45 ? 'Checking content optimization...' :
                         progress < 60 ? 'Evaluating page performance...' :
                         progress < 75 ? 'Analyzing competitor landscape...' :
                         progress < 90 ? 'Generating recommendations...' :
                         progress < 100 ? 'Finalizing audit results...' :
                         'Complete! Preparing your report...'}
                      </p>
                    </div>
                  </div>
                )}

                {auditResult && (
                  <div className="mt-8 space-y-6">
                    {/* Overall Score */}
                    <Card className={`${getScoreBg(auditResult.score)} border-2`}>
                      <CardContent className="p-8 text-center">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`text-5xl md:text-6xl font-black ${getScoreColor(auditResult.score)}`}>
                              {auditResult.score}
                            </div>
                            <div className="text-left">
                              <div className="text-2xl font-bold text-gray-600">/100</div>
                              <div className="text-sm text-gray-500">SEO Score</div>
                            </div>
                          </div>
                          <div className="text-center">
                            {auditResult.score >= 80 ? 
                              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-2" /> :
                              auditResult.score >= 60 ?
                              <AlertTriangle className="w-16 h-16 text-yellow-600 mx-auto mb-2" /> :
                              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-2" />
                            }
                            <h3 className="text-xl font-bold mb-2">
                              {auditResult.score >= 80 ? 'Excellent Performance' :
                               auditResult.score >= 60 ? 'Good Foundation' :
                               'Needs Improvement'}
                            </h3>
                          </div>
                        </div>
                        <p className="text-gray-600 text-lg">
                          {auditResult.score >= 80 ? 'Your website is well optimized with minor areas for enhancement.' :
                           auditResult.score >= 60 ? 'Solid foundation with several optimization opportunities identified.' :
                           'Significant optimization potential - implementing our recommendations could dramatically improve your rankings.'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Technical Analysis Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="text-center">
                        <CardContent className="p-4">
                          <div className={`text-2xl font-bold mb-1 ${getScoreColor(auditResult.techAnalysis.pageSpeed)}`}>
                            {auditResult.techAnalysis.pageSpeed}
                          </div>
                          <p className="text-xs text-gray-600">Page Speed</p>
                        </CardContent>
                      </Card>
                      <Card className="text-center">
                        <CardContent className="p-4">
                          {auditResult.techAnalysis.mobileOptimized ? 
                            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-1" /> :
                            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-1" />
                          }
                          <p className="text-xs text-gray-600">Mobile Ready</p>
                        </CardContent>
                      </Card>
                      <Card className="text-center">
                        <CardContent className="p-4">
                          {auditResult.techAnalysis.sslCertificate ? 
                            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-1" /> :
                            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-1" />
                          }
                          <p className="text-xs text-gray-600">SSL Security</p>
                        </CardContent>
                      </Card>
                      <Card className="text-center">
                        <CardContent className="p-4">
                          {auditResult.techAnalysis.xmlSitemap ? 
                            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-1" /> :
                            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-1" />
                          }
                          <p className="text-xs text-gray-600">XML Sitemap</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Competitor Analysis */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                          <TrendingUp className="w-5 h-5" />
                          Competitive Position
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="text-center">
                            <div className="text-3xl font-black text-blue-600 mb-2">
                              #{auditResult.competitorAnalysis.ranking}
                            </div>
                            <p className="text-blue-700">
                              out of {auditResult.competitorAnalysis.totalCompetitors} competitors
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-700 mb-2">Key Strengths:</h4>
                            <ul className="space-y-1">
                              {auditResult.competitorAnalysis.strengths.map((strength, index) => (
                                <li key={index} className="text-sm text-blue-600 flex items-center gap-2">
                                  <CheckCircle className="w-3 h-3" />
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Detailed Results */}
                    <Tabs defaultValue="critical" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="critical" className="text-sm">Critical Issues</TabsTrigger>
                        <TabsTrigger value="quick" className="text-sm">Quick Wins</TabsTrigger>
                        <TabsTrigger value="opportunities" className="text-sm">Growth Opportunities</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="critical" className="space-y-4">
                        <Card className="border-red-200">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                              <XCircle className="w-5 h-5" />
                              Critical Issues - Fix Immediately
                            </CardTitle>
                            <p className="text-sm text-red-500">These issues are significantly impacting your search rankings</p>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-4">
                              {auditResult.criticalIssues.map((issue, index) => (
                                <li key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <span className="font-medium text-red-700">{issue}</span>
                                    <div className="text-xs text-red-600 mt-1">High Priority</div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="quick" className="space-y-4">
                        <Card className="border-yellow-200">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-600">
                              <Zap className="w-5 h-5" />
                              Quick Wins - Easy Fixes
                            </CardTitle>
                            <p className="text-sm text-yellow-600">Simple changes that can improve your rankings quickly</p>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-4">
                              {auditResult.quickWins.map((win, index) => (
                                <li key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                                  <Zap className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <span className="font-medium text-yellow-700">{win}</span>
                                    <div className="text-xs text-yellow-600 mt-1">Medium Priority</div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="opportunities" className="space-y-4">
                        <Card className="border-blue-200">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-600">
                              <Target className="w-5 h-5" />
                              Growth Opportunities
                            </CardTitle>
                            <p className="text-sm text-blue-600">Strategic improvements for long-term SEO success</p>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-4">
                              {auditResult.opportunities.map((opportunity, index) => (
                                <li key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                  <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <span className="font-medium text-blue-700">{opportunity}</span>
                                    <div className="text-xs text-blue-600 mt-1">Strategic Priority</div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                      <Button 
                        onClick={downloadReport}
                        className="flex-1 bg-black text-white hover:bg-gray-800 h-12 text-base font-bold"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Get Detailed Report
                      </Button>
                      <Button 
                        onClick={openWhatsApp}
                        variant="outline"
                        className="flex-1 border-2 border-black text-black hover:bg-black hover:text-white h-12 text-base font-bold"
                      >
                        Get Professional Help
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>

                    {/* Professional Services CTA */}
                    <Card className="bg-gradient-to-r from-black to-gray-800 text-white border-0 mt-8">
                      <CardContent className="p-8 text-center">
                        <h3 className="text-2xl font-bold mb-4">Want Professional SEO Implementation?</h3>
                        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                          Our SEO experts can implement all these recommendations for you. Get a custom quote 
                          for professional SEO services that deliver measurable results.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button 
                            onClick={openWhatsApp}
                            className="bg-white text-black hover:bg-gray-100 font-bold px-6 py-3"
                          >
                            Get SEO Quote
                          </Button>
                          <Button 
                            variant="outline"
                            className="border-white text-white hover:bg-white hover:text-black px-6 py-3"
                          >
                            View SEO Packages
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="text-center border-0 bg-white/60 backdrop-blur hover:bg-white/80 transition-all duration-300">
              <CardContent className="p-6">
                <Globe className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-bold mb-2 text-lg">Complete Analysis</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Technical SEO, content optimization, performance metrics, and competitor analysis
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 bg-white/60 backdrop-blur hover:bg-white/80 transition-all duration-300">
              <CardContent className="p-6">
                <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
                <h3 className="font-bold mb-2 text-lg">Instant Results</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Get comprehensive audit results in under 30 seconds with actionable insights
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 bg-white/60 backdrop-blur hover:bg-white/80 transition-all duration-300">
              <CardContent className="p-6">
                <Target className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-bold mb-2 text-lg">Actionable Insights</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Clear, prioritized recommendations you can implement immediately
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SEOAudit;