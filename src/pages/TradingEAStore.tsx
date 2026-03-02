import { useState } from 'react';
import { Download, Star, TrendingUp, BarChart3, Search, User, Menu, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TradingEAStore = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tradingEAs = [
    {
      id: 1,
      name: 'Forex Scalper Pro',
      category: 'Scalping',
      price: '$299',
      originalPrice: '$399',
      rating: 4.9,
      reviews: 234,
      profitFactor: '2.3',
      winRate: '78%',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop',
      features: ['M1-M5 Timeframes', 'Low Drawdown', 'News Filter', 'Multiple Pairs'],
      description: 'Advanced scalping EA with built-in risk management and news filtering.',
      backtest: '2+ Years',
      monthlyReturn: '12-18%'
    },
    {
      id: 2,
      name: 'Trend Master EA',
      category: 'Trend Following',
      price: '$199',
      originalPrice: '$299',
      rating: 4.7,
      reviews: 189,
      profitFactor: '1.8',
      winRate: '65%',
      image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop',
      features: ['H1-H4 Timeframes', 'Trend Detection', 'Dynamic SL/TP', 'Multi-Currency'],
      description: 'Reliable trend-following system with adaptive position sizing.',
      backtest: '3+ Years',
      monthlyReturn: '8-12%'
    },
    {
      id: 3,
      name: 'Grid Master Pro',
      category: 'Grid Trading',
      price: '$399',
      originalPrice: '$499',
      rating: 4.6,
      reviews: 156,
      profitFactor: '2.1',
      winRate: '82%',
      image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&h=400&fit=crop',
      features: ['Grid Strategy', 'Recovery Mode', 'Hedge Protection', 'Account Manager'],
      description: 'Professional grid trading system with advanced recovery algorithms.',
      backtest: '5+ Years',
      monthlyReturn: '15-25%'
    },
    {
      id: 4,
      name: 'AI Neural Network EA',
      category: 'AI Trading',
      price: '$599',
      originalPrice: '$799',
      rating: 4.8,
      reviews: 98,
      profitFactor: '2.7',
      winRate: '71%',
      image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=400&fit=crop',
      features: ['Machine Learning', 'Pattern Recognition', 'Adaptive Algorithm', 'Real-time Analysis'],
      description: 'Cutting-edge AI-powered trading system with neural network technology.',
      backtest: '1+ Years',
      monthlyReturn: '20-30%'
    },
    {
      id: 5,
      name: 'Breakout Hunter',
      category: 'Breakout',
      price: '$249',
      originalPrice: '$349',
      rating: 4.5,
      reviews: 203,
      profitFactor: '1.9',
      winRate: '69%',
      image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=600&h=400&fit=crop',
      features: ['Support/Resistance', 'Volume Analysis', 'Volatility Filter', 'Multiple Markets'],
      description: 'Sophisticated breakout detection system with volume confirmation.',
      backtest: '2+ Years',
      monthlyReturn: '10-15%'
    },
    {
      id: 6,
      name: 'News Trader Elite',
      category: 'News Trading',
      price: '$349',
      originalPrice: '$449',
      rating: 4.4,
      reviews: 127,
      profitFactor: '2.2',
      winRate: '73%',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop',
      features: ['Economic Calendar', 'News Impact Filter', 'Fast Execution', 'Risk Management'],
      description: 'Specialized news trading EA with economic calendar integration.',
      backtest: '18+ Months',
      monthlyReturn: '12-20%'
    }
  ];

  const categories = ['All', 'Scalping', 'Trend Following', 'Grid Trading', 'AI Trading', 'Breakout', 'News Trading'];

  const addToCart = (ea) => {
    setCartItems([...cartItems, ea]);
  };

  const filteredEAs = selectedCategory === 'All' 
    ? tradingEAs 
    : tradingEAs.filter(ea => ea.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-green-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black">Trading EA Store</span>
            </div>

            <div className="hidden lg:flex items-center space-x-8">
              <a href="#" className="hover:text-gray-300 transition-colors">EAs</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Performance</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Support</a>
              <a href="#" className="hover:text-gray-300 transition-colors">About</a>
              <div className="flex items-center space-x-4">
                <Search className="w-5 h-5 hover:text-gray-300 cursor-pointer" />
                <User className="w-5 h-5 hover:text-gray-300 cursor-pointer" />
                <div className="relative">
                  <Download className="w-5 h-5 hover:text-gray-300 cursor-pointer" />
                  {cartItems.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                      {cartItems.length}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:bg-white/10"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-8xl font-black mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-green-500 to-yellow-500">
                Trading
              </span>{' '}
              <span className="text-white">EAs</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Professional Expert Advisors for automated trading. Proven strategies, 
              instant downloads, and lifetime licenses for serious traders.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold px-8 py-4 text-lg hover:from-blue-600 hover:to-green-600 transition-all duration-300">
                Browse EAs
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg">
                View Performance
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white/5 backdrop-blur-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-green-400 mb-2">5000+</div>
              <div className="text-gray-300">Happy Traders</div>
            </div>
            <div>
              <div className="text-3xl font-black text-blue-400 mb-2">15+</div>
              <div className="text-gray-300">Trading EAs</div>
            </div>
            <div>
              <div className="text-3xl font-black text-yellow-400 mb-2">98%</div>
              <div className="text-gray-300">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-black text-purple-400 mb-2">24/7</div>
              <div className="text-gray-300">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`${
                  selectedCategory === category 
                    ? "bg-gradient-to-r from-blue-500 to-green-500 text-white" 
                    : "border-white/20 text-white hover:bg-white/10"
                } transition-all duration-300`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* EAs Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEAs.map((ea) => (
              <Card key={ea.id} className="bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/20 transition-all duration-500 group">
                <div className="aspect-video overflow-hidden rounded-t-lg relative">
                  <img 
                    src={ea.image} 
                    alt={ea.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
                      {ea.category}
                    </Badge>
                  </div>
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center bg-black/50 rounded-full px-2 py-1">
                      <Shield className="w-4 h-4 text-green-400 mr-1" />
                      <span className="text-xs text-white">Verified</span>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="mb-3">
                    <h3 className="text-xl font-black text-white mb-1">{ea.name}</h3>
                    <p className="text-gray-400 text-sm">{ea.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(ea.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-gray-400 text-sm">({ea.reviews})</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center bg-green-500/10 rounded-lg p-2">
                      <div className="text-lg font-bold text-green-400">{ea.winRate}</div>
                      <div className="text-xs text-gray-400">Win Rate</div>
                    </div>
                    <div className="text-center bg-blue-500/10 rounded-lg p-2">
                      <div className="text-lg font-bold text-blue-400">{ea.profitFactor}</div>
                      <div className="text-xs text-gray-400">Profit Factor</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Monthly Return:</span>
                      <span className="text-green-400">{ea.monthlyReturn}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Backtest Period:</span>
                      <span>{ea.backtest}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 mb-4">
                    {ea.features.map((feature, index) => (
                      <div key={index} className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded">
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-black text-white">{ea.price}</span>
                      <span className="text-gray-500 line-through">{ea.originalPrice}</span>
                    </div>
                    <p className="text-xs text-green-400">Instant Download • Lifetime License</p>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold hover:from-blue-600 hover:to-green-600 transition-all duration-300"
                    onClick={() => addToCart(ea)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Buy & Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-lg py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black">Trading EA Store</span>
              </div>
              <p className="text-gray-400">
                Professional trading algorithms for automated forex success.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Products</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Scalping EAs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trend Following</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Grid Trading</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI Trading</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Installation Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">VPS Setup</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Broker List</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Risk Disclaimer</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Trading EA Store. All rights reserved. Trading involves risk.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TradingEAStore;