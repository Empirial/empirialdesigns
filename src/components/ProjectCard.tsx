import { MoreVertical, ExternalLink, Calendar } from "lucide-react";

export interface ProjectData {
  id: string;
  name: string;
  updatedAt: string;
  gradientCode: string; // for the visual thumbnail
}

interface ProjectCardProps {
  project: ProjectData;
  onClick: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] rounded-xl overflow-hidden cursor-pointer hover:border-primary/40 hover:bg-white/[0.04] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      <div 
        className="h-32 w-full relative"
        style={{ background: project.gradientCode }}
      >
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <ExternalLink className="w-8 h-8 text-white drop-shadow-md" />
        </div>
      </div>
      
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between">
            <h3 className="text-zinc-100 font-semibold truncate pr-2 text-sm">{project.name}</h3>
            <button className="text-zinc-500 hover:text-zinc-300 transition-colors" onClick={(e) => { e.stopPropagation(); }}>
                <MoreVertical className="w-4 h-4" />
            </button>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            <span>Updated {project.updatedAt}</span>
        </div>
      </div>
    </div>
  );
};
