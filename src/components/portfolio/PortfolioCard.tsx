import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';

interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  image: string;
  url: string;
  description: string;
}

interface PortfolioCardProps {
  item: PortfolioItem;
}

const PortfolioCard = ({ item }: PortfolioCardProps) => {
  const isWebsite = item.category === 'Landing Pages';

  return (
    <div className="group relative bg-card rounded-lg overflow-hidden elegant-shadow smooth-transition hover:elegant-glow w-full">
      {isWebsite ? (
        <div className="aspect-video overflow-hidden">
          <img 
            src={item.image} 
            alt={item.title}
            className="w-full h-full object-cover smooth-transition group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer aspect-[3/4] overflow-hidden">
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-full object-cover smooth-transition group-hover:scale-105"
                loading="lazy"
              />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-0">
            <DialogTitle className="sr-only">{item.title}</DialogTitle>
            <img 
              src={item.image} 
              alt={item.title}
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg group-hover:text-primary smooth-transition">
            {item.title}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {item.category}
          </Badge>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
          {item.description}
        </p>
        
        {isWebsite && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground smooth-transition"
            onClick={() => window.open(item.url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Project
          </Button>
        )}
      </div>
    </div>
  );
};

export default PortfolioCard;