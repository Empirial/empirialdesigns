interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description: string;
  highlight?: string;
}

const SectionHeader = ({ title, subtitle, description, highlight }: SectionHeaderProps) => {
  return (
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        {title} {highlight && <span className="text-gradient">{highlight}</span>}
      </h2>
      {subtitle && (
        <div className="flex items-center justify-center mb-6">
          <div className="h-px bg-black flex-1 max-w-32"></div>
          <p className="text-lg text-foreground font-black mx-6 tracking-[0.3em]">
            {subtitle}
          </p>
          <div className="h-px bg-black flex-1 max-w-32"></div>
        </div>
      )}
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto px-4">
        {description}
      </p>
    </div>
  );
};

export default SectionHeader;