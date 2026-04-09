import { 
  Home, 
  Search, 
  BookOpen, 
  Grid, 
  Star, 
  User as UserIcon, 
  Users, 
  Gift, 
  Zap, 
  ChevronDown,
  LayoutTemplate
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardSidebarProps {
  user: any;
  onSignOut: () => void;
}

export function DashboardSidebar({ user, onSignOut }: DashboardSidebarProps) {
  const { toast } = useToast();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleShareClick = () => {
    toast({
      title: "Link Copied!",
      description: "Your referral link has been copied to clipboard.",
    });
  };

  return (
    <>
    <Sidebar className="w-64 border-r border-[#27272a] bg-[#09090b] text-zinc-300">
      <SidebarHeader className="p-4 border-b border-[#27272a]/40 bg-[#09090b]">
        <div className="flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 p-2 rounded-md transition-colors">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 text-primary rounded font-semibold w-6 h-6 flex items-center justify-center text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'E'}
            </div>
            <span className="font-semibold text-zinc-100 text-sm">
              {user?.email ? user.email.split('@')[0] + "'s Empirial" : "Empirial Designs"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#09090b]">
        <SidebarGroup className="mt-2">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-zinc-800/50 hover:text-white transition-colors">
                  <NavLink to="/">
                    <Home className="h-4 w-4 mr-2" />
                    <span>Home</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-zinc-800/50 hover:text-white transition-colors flex justify-between">
                  <div>
                    <div className="flex items-center">
                      <Search className="h-4 w-4 mr-2" />
                      <span>Search</span>
                    </div>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Ctrl K</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-zinc-800/50 hover:text-white transition-colors">
                  <div>
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span>Resources</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-zinc-500 text-xs font-semibold px-4 mb-2">Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-zinc-800/50 hover:text-white transition-colors text-white font-medium">
                  <NavLink to="/dashboard">
                    <Grid className="h-4 w-4 mr-2" />
                    <span>All projects</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-zinc-800/50 hover:text-white transition-colors">
                  <div>
                    <Star className="h-4 w-4 mr-2" />
                    <span>Starred</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-zinc-800/50 hover:text-white transition-colors">
                  <div>
                    <UserIcon className="h-4 w-4 mr-2" />
                    <span>Created by me</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-zinc-800/50 hover:text-white transition-colors">
                  <div>
                    <Users className="h-4 w-4 mr-2" />
                    <span>Shared with me</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t-0 p-4 space-y-3 bg-[#09090b]">
        <div 
          onClick={handleShareClick}
          className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-zinc-800/60 transition-colors"
        >
          <div>
            <div className="flex items-center font-medium text-sm text-zinc-200">Share Empirial</div>
            <div className="text-xs text-zinc-500 mt-0.5">100 credits per paid referral</div>
          </div>
          <div className="bg-zinc-700 p-1.5 rounded-full">
            <Gift className="h-4 w-4 text-zinc-300" />
          </div>
        </div>

        <div 
          onClick={() => setIsUpgradeOpen(true)}
          className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-zinc-800/60 transition-colors"
        >
          <div>
            <div className="flex items-center font-medium text-sm text-zinc-200">Upgrade to Pro</div>
            <div className="text-xs text-zinc-500 mt-0.5">Unlock more features</div>
          </div>
          <div className="bg-primary/20 p-1.5 rounded-full">
            <Zap className="h-4 w-4 text-primary" />
          </div>
        </div>
        
        <div 
          onClick={() => setIsSettingsOpen(true)}
          className="pt-2 flex justify-between items-center px-1 cursor-pointer group"
        >
          <Avatar className="h-8 w-8 border border-zinc-700 group-hover:border-zinc-500 transition-colors">
            <AvatarFallback className="bg-slate-500/30 text-xs text-zinc-300">
              {user?.email?.charAt(0).toUpperCase() || 'E'}
            </AvatarFallback>
          </Avatar>
          <div className="w-2 h-2 rounded-full bg-primary relative">
             <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75"></div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
    
    <UpgradeModal open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen} />
    <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} email={user?.email || ''} />
    </>
  );
}
