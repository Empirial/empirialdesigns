import { useState } from 'react';
import { ShoppingCart, Star, Heart, Filter, Search, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const EmpirialIPhones = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const products = [
    {
      id: 1,
      name: 'iPhone 15 Pro Max',
      price: 'R24,999',
      originalPrice: 'R27,999',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop',
      category: 'iPhone 15',
      rating: 4.9,
      reviews: 245,
      storage: '256GB',
      color: 'Titanium Blue',
      features: ['A17 Pro Chip', 'ProRAW Photos', '5x Telephoto', 'USB-C']
    },
    {
      id: 2,
      name: 'iPhone 15 Pro',
      price: 'R21,999',
      originalPrice: 'R24,999',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop',
      category: 'iPhone 15',
      rating: 4.8,
      reviews: 189,
      storage: '128GB',
      color: 'Natural Titanium',
      features: ['A17 Pro Chip', 'ProRAW Photos', '3x Telephoto', 'USB-C']
    },
    {
      id: 3,
      name: 'iPhone 15',
      price: 'R16,999',
      originalPrice: 'R18,999',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop',
      category: 'iPhone 15',
      rating: 4.7,
      reviews: 156,
      storage: '128GB',
      color: 'Pink',
      features: ['A16 Bionic', '48MP Camera', 'Dynamic Island', 'USB-C']
    },
    {
      id: 4,
      name: 'iPhone 14 Pro',
      price: 'R18,999',
      originalPrice: 'R22,999',
      image: 'https://images.unsplash.com/photo-1663499482523-1c0137808bcd?w=600&h=600&fit=crop',
      category: 'iPhone 14',
      rating: 4.6,
      reviews: 298,
      storage: '256GB',
      color: 'Deep Purple',
      features: ['A16 Bionic', 'ProRAW Photos', '3x Telephoto', 'Lightning']
    },
    {
      id: 5,
      name: 'iPhone 14',
      price: 'R14,999',
      originalPrice: 'R17,999',
      image: 'https://images.unsplash.com/photo-1663499482523-1c0137808bcd?w=600&h=600&fit=crop',
      category: 'iPhone 14',
      rating: 4.5,
      reviews: 203,
      storage: '128GB',
      color: 'Blue',
      features: ['A15 Bionic', '12MP Camera', 'Ceramic Shield', 'Lightning']
    },
    {
      id: 6,
      name: 'iPhone 13',
      price: 'R12,999',
      originalPrice: 'R15,999',
      image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&h=600&fit=crop',
      category: 'iPhone 13',
      rating: 4.4,
      reviews: 412,
      storage: '128GB',
      color: 'Midnight',
      features: ['A15 Bionic', '12MP Camera', 'Cinematic Mode', 'Lightning']
    }
  ];

  const categories = ['All', 'iPhone 15', 'iPhone 14', 'iPhone 13', 'Accessories'];

  const addToCart = (product) => {
    setCartItems([...cartItems, product]);
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-black text-lg">E</span>
              </div>
              <span className="text-xl font-black">Empirial iPhones</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#" className="hover:text-gray-300 transition-colors">Products</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Support</a>
              <a href="#" className="hover:text-gray-300 transition-colors">About</a>
              <div className="flex items-center space-x-4">
                <Search className="w-5 h-5 hover:text-gray-300 cursor-pointer" />
                <User className="w-5 h-5 hover:text-gray-300 cursor-pointer" />
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 hover:text-gray-300 cursor-pointer" />
                  {cartItems.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-white text-black text-xs">
                      {cartItems.length}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
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
      <section className="pt-24 pb-16 bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-8xl font-black mb-6">
              <span className="text-white">iPhone</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Excellence
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Discover the latest iPhones at unbeatable prices. Premium quality, 
              authentic products, and exceptional customer service.
            </p>
            <div className="mt-8">
              <Button className="bg-white text-black font-bold px-8 py-4 text-lg hover:bg-gray-200 transition-all duration-300">
                Shop Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`${
                  selectedCategory === category 
                    ? "bg-white text-black" 
                    : "border-white/20 text-white hover:bg-white/10"
                } transition-all duration-300`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="bg-gray-900 border-gray-800 hover:border-white/20 transition-all duration-500 group">
                <div className="aspect-square overflow-hidden rounded-t-lg">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-black text-white mb-1">{product.name}</h3>
                      <p className="text-gray-400 text-sm">{product.storage} • {product.color}</p>
                    </div>
                    <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 cursor-pointer transition-colors" />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-gray-400 text-sm">({product.reviews})</span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-2xl font-black text-white">{product.price}</span>
                      <span className="text-gray-500 line-through">{product.originalPrice}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {product.features.map((feature, index) => (
                      <div key={index} className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full bg-white text-black font-bold hover:bg-gray-200 transition-all duration-300"
                    onClick={() => addToCart(product)}
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-black font-black text-lg">E</span>
                </div>
                <span className="text-xl font-black">Empirial iPhones</span>
              </div>
              <p className="text-gray-400">
                Your trusted destination for premium iPhones and exceptional service.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Products</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">iPhone 15 Series</a></li>
                <li><a href="#" className="hover:text-white transition-colors">iPhone 14 Series</a></li>
                <li><a href="#" className="hover:text-white transition-colors">iPhone 13 Series</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Accessories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Customer Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Warranty</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Empirial iPhones. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EmpirialIPhones;