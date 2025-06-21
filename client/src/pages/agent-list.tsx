import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, Search, Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAgentSchema } from "@shared/schema";

interface Agent {
  id: number;
  agent_name: string;
  description: string;
  first_message: string;
  createdBy: string;
  createdAt: string;
}

export default function AgentList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form for creating/editing agents
  const form = useForm({
    resolver: zodResolver(insertAgentSchema),
    defaultValues: {
      agent_name: "",
      description: "",
      first_message: "",
      createdBy: "admin" // Default user
    }
  });

  // Fetch agents from API
  const { data: agentsData, isLoading, error } = useQuery({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/agents");
      return response.json();
    },
  });

  const agents = agentsData?.agents || [];

  // Create/Update mutation
  const saveAgentMutation = useMutation({
    mutationFn: async (agentData: any) => {
      const url = editingAgent ? `/api/agents/${editingAgent.id}` : "/api/agents";
      const method = editingAgent ? "PATCH" : "POST";
      const response = await apiRequest(method, url, agentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Success",
        description: editingAgent ? "Agent updated successfully" : "Agent created successfully",
      });
      setIsSheetOpen(false);
      setEditingAgent(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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

  const handleDelete = (agentId: number) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      deleteMutation.mutate(agentId.toString());
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    form.reset({
      agent_name: agent.agent_name,
      description: agent.description,
      first_message: agent.first_message,
      createdBy: agent.createdBy
    });
    setIsSheetOpen(true);
  };

  const handleNew = () => {
    setEditingAgent(null);
    form.reset({
      agent_name: "",
      description: "",
      first_message: "",
      createdBy: "admin"
    });
    setIsSheetOpen(true);
  };

  const onSubmit = (data: any) => {
    saveAgentMutation.mutate(data);
  };

  const filteredAgents = agents.filter((agent: Agent) =>
    agent.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <Button size="sm" className="text-xs" onClick={handleNew}>
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
            <Button size="sm" className="mt-3 text-xs" onClick={handleNew}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create your first agent
            </Button>
          )}
        </div>
      )}

      {/* Agent Grid */}
      {!isLoading && filteredAgents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent: Agent, index: number) => (
            <Card key={`${agent.id}-${agent.agent_name}-${agent.createdAt}-${index}`} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-sm font-medium text-gray-900 truncate">
                      {agent.agent_name}
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
                      onClick={() => handleEdit(agent)}
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
                      {agent.first_message}
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

      {/* Sliding Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>
              {editingAgent ? "Edit Agent" : "Create New Agent"}
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="agent_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter agent name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this agent does"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="first_message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the agent's initial greeting message"
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="createdBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Created By</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter creator name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={saveAgentMutation.isPending}
                    className="flex-1"
                  >
                    {saveAgentMutation.isPending ? "Saving..." : (editingAgent ? "Update Agent" : "Create Agent")}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsSheetOpen(false)}
                    disabled={saveAgentMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}