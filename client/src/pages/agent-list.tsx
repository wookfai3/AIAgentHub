import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Agent {
  id: string;
  name: string;
  description: string;
  firstMessage: string;
  createdBy: string;
  createdAt: string;
}

export default function AgentList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agents from API
  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/agents");
      return response.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const response = await apiRequest("DELETE", `/api/agents/${agentId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Success",
        description: "Agent deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (agentId: string) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      deleteMutation.mutate(agentId);
    }
  };

  const filteredAgents = agents.filter((agent: Agent) =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-600">Error loading agents: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Agents</h1>
          <p className="text-xs text-gray-600">Manage your AI agents</p>
        </div>
        <Button size="sm" className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          New Agent
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
        <Input
          placeholder="Search agents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 text-sm h-9"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-600">Loading agents...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAgents.length === 0 && (
        <div className="text-center py-8">
          <Bot className="mx-auto w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600">
            {searchTerm ? "No agents found matching your search." : "No agents created yet."}
          </p>
          {!searchTerm && (
            <Button size="sm" className="mt-3 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create your first agent
            </Button>
          )}
        </div>
      )}

      {/* Agent Grid */}
      {!isLoading && filteredAgents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent: Agent) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-sm font-medium text-gray-900 truncate">
                      {agent.name}
                    </CardTitle>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {agent.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      title="Edit agent"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(agent.id)}
                      disabled={deleteMutation.isPending}
                      title="Delete agent"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* First Message */}
                  <div>
                    <label className="text-xs font-medium text-gray-700">First Message</label>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 bg-gray-50 p-2 rounded">
                      {agent.firstMessage}
                    </p>
                  </div>

                  {/* Meta Information */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>
                      <span className="font-medium">Created by:</span> {agent.createdBy}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}