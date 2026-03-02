import { useState } from 'react';
import { ShoppingCart, Star, Heart, Filter, Search, User, Menu, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const EliteSneakers = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const sneakers = [
    {
      id: 1,
      name: 'Air Jordan 1 High OG',
      brand: 'Jordan',
      price: 'R3,499',
      originalPrice: 'R3,999',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop',
      rating: 4.9,
      reviews: 156,
      colorway: 'Chicago',
      sizes: ['7', '8', '9', '10', '11', '12'],
      features: ['Premium Leather', 'Air Cushioning', 'Classic Design', 'Retro Style']
    },
    {
      id: 2,
      name: 'Nike Air Force 1 Low',
      brand: 'Nike',
      price: 'R2,299',
      originalPrice: 'R2,799',
      image: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600&h=600&fit=crop',
      rating: 4.8,
      reviews: 289,
      colorway: 'White/White',
      sizes: ['6', '7', '8', '9', '10', '11', '12'],
      features: ['Full Grain Leather', 'Air Sole Unit', 'Rubber Outsole', 'Perforations']
    },
    {
      id: 3,
      name: 'Adidas Ultraboost 22',
      brand: 'Adidas',
      price: 'R3,799',
      originalPrice: 'R4,299',
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop',
      rating: 4.7,
      reviews: 203,
      colorway: 'Core Black',
      sizes: ['7', '8', '9', '10', '11'],
      features: ['Boost Midsole', 'Primeknit Upper', 'Continental Rubber', 'Responsive Feel']
    },
    {
      id: 4,
      name: 'Yeezy Boost 350 V2',
      brand: 'Yeezy',
      price: 'R4,999',
      originalPrice: 'R5,499',
      image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&h=600&fit=crop',
      rating: 4.6,
      reviews: 412,
      colorway: 'Zebra',
      sizes: ['7', '8', '9', '10', '11', '12'],
      features: ['Boost Technology', 'Primeknit Construction', 'Rubber Outsole', 'Comfortable Fit']
    },
    {
      id: 5,
      name: 'New Balance 990v5',
      brand: 'New Balance',
      price: 'R3,299',
      originalPrice: 'R3,799',
      image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=600&h=600&fit=crop',
      rating: 4.5,
      reviews: 134,
      colorway: 'Grey/White',
      sizes: ['7', '8', '9', '10', '11'],
      features: ['ENCAP Technology', 'Pigskin/Mesh Upper', 'Blown Rubber Outsole', 'Made in USA']
    },
    {
      id: 6,
      name: 'Converse Chuck Taylor All Star',
      brand: 'Converse',
      price: 'R1,299',
      originalPrice: 'R1,599',
      image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=600&fit=crop',
      rating: 4.4,
      reviews: 567,
      colorway: 'Black/White',
      sizes: ['6', '7', '8', '9', '10', '11', '12'],
      features: ['Canvas Upper', 'Rubber Toe Cap', 'Classic Silhouette', 'Timeless Design']
    }
  ];

  const brands = ['All', 'Nike', 'Jordan', 'Adidas', 'Yeezy', 'New Balance', 'Converse'];

  const addToCart = (sneaker) => {
    setCartItems([...cartItems, sneaker]);
  };

  const filteredSneakers = selectedBrand === 'All' 
    ? sneakers 
    : sneakers.filter(sneaker => sneaker.brand === selectedBrand);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-lg">E</span>
              </div>
              <span className="text-xl font-black">Elite Sneakers</span>
            </div>

            <div className="hidden lg:flex items-center space-x-8">
              <a href="#" className="hover:text-gray-300 transition-colors">Sneakers</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Brands</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Sale</a>
              <a href="#" className="hover:text-gray-300 transition-colors">About</a>
              <div className="flex items-center space-x-4">
                <Search className="w-5 h-5 hover:text-gray-300 cursor-pointer" />
                <User className="w-5 h-5 hover:text-gray-300 cursor-pointer" />
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 hover:text-gray-300 cursor-pointer" />
                  {cartItems.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs">
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
                Elite
              </span>{' '}
              <span className="text-white">Sneakers</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Step into style with our premium collection of authentic sneakers. 
              From classic icons to limited releases, we've got your feet covered.
            </p>
            <div className="mt-8">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-8 py-4 text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300">
                Shop Collection
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Filter */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {brands.map((brand) => (
              <Button
                key={brand}
                variant={selectedBrand === brand ? "default" : "outline"}
                onClick={() => setSelectedBrand(brand)}
                className={`${
                  selectedBrand === brand 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                    : "border-white/20 text-white hover:bg-white/10"
                } transition-all duration-300`}
              >
                {brand}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Sneakers Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSneakers.map((sneaker) => (
              <Card key={sneaker.id} className="bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/20 transition-all duration-500 group">
                <div className="aspect-square overflow-hidden rounded-t-lg relative">
                  <img 
                    src={sneaker.image} 
                    alt={sneaker.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <Heart className="w-6 h-6 text-white/70 hover:text-red-500 cursor-pointer transition-colors" />
                  </div>
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {sneaker.brand}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="mb-3">
                    <h3 className="text-xl font-black text-white mb-1">{sneaker.name}</h3>
                    <p className="text-gray-400 text-sm">{sneaker.colorway}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(sneaker.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-gray-400 text-sm">({sneaker.reviews})</span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-2xl font-black text-white">{sneaker.price}</span>
                      <span className="text-gray-500 line-through">{sneaker.originalPrice}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-2">Available Sizes:</p>
                    <div className="flex flex-wrap gap-1">
                      {sneaker.sizes.map((size) => (
                        <div key={size} className="text-xs text-white bg-white/10 px-2 py-1 rounded border border-white/20">
                          {size}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 mb-4">
                    {sneaker.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded">
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                      onClick={() => addToCart(sneaker)}
                    >
                      Add to Cart
                    </Button>
                    <Button 
                      variant="outline"
                      size="icon"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
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
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-lg">E</span>
                </div>
                <span className="text-xl font-black">Elite Sneakers</span>
              </div>
              <p className="text-gray-400">
                Your destination for authentic, premium sneakers from the world's top brands.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Brands</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Nike</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Jordan</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Adidas</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Yeezy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Size Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Authentication</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Elite Sneakers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EliteSneakers;