import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Route, Switch, Link, useLocation } from "wouter";
import { 
  Bot, 
  Megaphone, 
  BookOpen, 
  GitBranch, 
  BarChart3, 
  Menu,
  X,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/auth";
import AgentList from "./agent-list";

const menuItems = [
  { id: "agents", icon: Bot, label: "Agent", path: "/dashboard/agents" },
  { id: "campaigns", icon: Megaphone, label: "Campaign", path: "/dashboard/campaigns" },
  { id: "knowledge", icon: BookOpen, label: "Knowledge Base", path: "/dashboard/knowledge" },
  { id: "workflow", icon: GitBranch, label: "Agent Workflow", path: "/dashboard/workflow" },
  { id: "reports", icon: BarChart3, label: "Reports", path: "/dashboard/reports" },
];

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      window.location.href = "/login";
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-1 h-8 w-8"
          >
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-brand-blue rounded-md flex items-center justify-center">
              <Bot className="text-white w-4 h-4" />
            </div>
            <h1 className="text-sm font-semibold text-gray-900">AI Agent Management</h1>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-xs text-gray-600 hover:text-gray-900 p-2 h-8"
        >
          <LogOut className="w-3.5 h-3.5 mr-1" />
          Logout
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <nav className="p-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.startsWith(item.path);
              
              return (
                <Link key={item.id} href={item.path}>
                  <div className={`flex items-center px-3 py-2 rounded-md text-xs cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-brand-blue text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3 font-medium">{item.label}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Switch>
            <Route path="/dashboard/agents" component={AgentList} />
            <Route path="/dashboard/campaigns">
              <div className="text-sm text-gray-600">Campaign management coming soon...</div>
            </Route>
            <Route path="/dashboard/knowledge">
              <div className="text-sm text-gray-600">Knowledge Base management coming soon...</div>
            </Route>
            <Route path="/dashboard/workflow">
              <div className="text-sm text-gray-600">Agent Workflow management coming soon...</div>
            </Route>
            <Route path="/dashboard/reports">
              <div className="text-sm text-gray-600">Reports coming soon...</div>
            </Route>
            <Route path="/dashboard">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 mb-2">Welcome to AI Agent Management</h1>
                <p className="text-sm text-gray-600">Select a section from the sidebar to get started.</p>
              </div>
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}