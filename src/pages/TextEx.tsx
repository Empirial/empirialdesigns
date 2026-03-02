import { useState, useRef } from 'react';
import { Upload, FileText, Download, Zap, Target, BarChart, ArrowRight, CheckCircle, Clock, Users, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';

const TextEx = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const openWhatsApp = () => {
    window.open('https://wa.me/message/6ZHJUVYQDOH3O1', '_blank');
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Please select a PDF file.",
        variant: "destructive"
      });
      return;
    }
    setFile(selectedFile);
    setExtractedText('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    // Simulate processing with progress updates
    const intervals = [20, 40, 60, 80, 100];
    for (let i = 0; i < intervals.length; i++) {
      setTimeout(() => {
        setProgress(intervals[i]);
      }, (i + 1) * 800);
    }

    // Mock text extraction after 4 seconds
    setTimeout(() => {
      const mockText = `EXTRACTED TEXT FROM ${file.name.toUpperCase()}

This is a sample of extracted text from your PDF document. In a real implementation, this would contain the actual text content from your uploaded PDF file.

Key Features of Our Text Extraction:
• High accuracy OCR technology
• Preserves formatting and structure
• Handles multiple languages
• Processes scanned documents
• Maintains paragraph breaks
• Extracts tables and lists

The extracted text would appear here, maintaining the original document structure while making it searchable and editable. This powerful tool can process documents of any size and complexity.

Contact us for the full implementation of this PDF text extraction service with advanced features like batch processing, API integration, and custom formatting options.`;

      setExtractedText(mockText);
      setIsProcessing(false);
      toast({
        title: "Text Extraction Complete!",
        description: "Your PDF has been successfully processed."
      });
    }, 4000);
  };

  const downloadText = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-text-${file?.name.replace('.pdf', '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const trustIndicators = [
    { icon: FileText, text: "1000+ PDFs Processed" },
    { icon: Users, text: "Trusted by Professionals" },
    { icon: Clock, text: "Instant Processing" },
    { icon: Award, text: "99.9% Accuracy" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full mb-6">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-semibold">PDF TEXT EXTRACTION</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              <span className="text-gradient">TEXTEX</span>{' '}
              <span className="text-foreground">TOOL</span>
            </h1>
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-black flex-1 max-w-32"></div>
              <p className="text-lg lg:text-xl text-foreground font-black mx-6 lg:mx-8 tracking-[0.3em]">
                EXTRACT & CONVERT
              </p>
              <div className="h-px bg-black flex-1 max-w-32"></div>
            </div>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              Extract text from PDF documents instantly with our advanced OCR technology. 
              Perfect for digitizing documents, data entry, and content migration.
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

          {/* File Upload */}
          <Card className="bg-white/80 backdrop-blur-lg border border-gray-200 shadow-2xl mb-8">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Upload className="w-7 h-7" />
                PDF Text Extractor
              </CardTitle>
              <p className="text-muted-foreground">Upload your PDF to extract text content</p>
            </CardHeader>
            <CardContent className="p-6 lg:p-8">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Drop your PDF here</h3>
                <p className="text-gray-600 mb-4">or click to browse files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mb-4"
                >
                  Choose PDF File
                </Button>
                <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
              </div>

              {file && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-red-600" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button 
                      onClick={processFile}
                      disabled={isProcessing}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      {isProcessing ? 'Processing...' : 'Extract Text'}
                    </Button>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="mt-6 space-y-4 bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Extraction Progress</span>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full h-3" />
                  <div className="text-center">
                    <p className="text-sm text-gray-600 font-medium">
                      {progress < 20 ? 'Reading PDF structure...' :
                       progress < 40 ? 'Analyzing document layout...' :
                       progress < 60 ? 'Extracting text content...' :
                       progress < 80 ? 'Processing formatting...' :
                       progress < 100 ? 'Finalizing extraction...' :
                       'Complete! Text ready for download.'}
                    </p>
                  </div>
                </div>
              )}

              {extractedText && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Extracted Text</h3>
                    <Button 
                      onClick={downloadText}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Text
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {extractedText}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* N8N Workflow Visualization */}
          <Card className="bg-gradient-to-r from-black to-gray-800 text-white border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Powered by N8N Automation</CardTitle>
              <p className="text-gray-300">Professional workflow automation behind the scenes</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold">1. Upload</h4>
                  <p className="text-sm text-gray-300">Secure file upload to processing server</p>
                </div>
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold">2. Process</h4>
                  <p className="text-sm text-gray-300">N8N triggers OCR extraction workflow</p>
                </div>
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold">3. Extract</h4>
                  <p className="text-sm text-gray-300">Advanced OCR extracts text with formatting</p>
                </div>
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                    <Download className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold">4. Deliver</h4>
                  <p className="text-sm text-gray-300">Clean text ready for download</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="text-center border-0 bg-white/60 backdrop-blur hover:bg-white/80 transition-all duration-300">
              <CardContent className="p-6">
                <FileText className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-bold mb-2 text-lg">High Accuracy</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Advanced OCR technology with 99.9% accuracy for clear documents
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 bg-white/60 backdrop-blur hover:bg-white/80 transition-all duration-300">
              <CardContent className="p-6">
                <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
                <h3 className="font-bold mb-2 text-lg">Lightning Fast</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Process documents in seconds with our optimized extraction pipeline
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 bg-white/60 backdrop-blur hover:bg-white/80 transition-all duration-300">
              <CardContent className="p-6">
                <Target className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-bold mb-2 text-lg">Format Preserved</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Maintains original formatting, paragraphs, and document structure
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Professional Services CTA */}
          <Card className="bg-gradient-to-r from-black to-gray-800 text-white border-0 mt-12">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Need Bulk Processing or API Integration?</h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Our professional text extraction service can handle large volumes, multiple formats, 
                and integrate directly with your existing workflows via API.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={openWhatsApp}
                  className="bg-white text-black hover:bg-gray-100 font-bold px-6 py-3"
                >
                  Get Custom Quote
                </Button>
                <Button 
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-black px-6 py-3"
                >
                  View API Docs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TextEx;