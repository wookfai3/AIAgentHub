import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Bot, TriangleAlert, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/auth";
import { loginSchema, type LoginRequest } from "@shared/schema";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: "Login successful! Redirecting...",
        });
        // TODO: Redirect to dashboard
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginRequest) => {
    loginMutation.mutate(data);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header Section */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-brand-blue rounded-lg flex items-center justify-center mb-3">
            <Bot className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">AI Agent Management</h1>
          <p className="text-sm text-brand-gray">Sign in to manage your AI agents</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Username Field */}
            <div className="input-group relative">
              <Input
                id="username"
                type="text"
                className={`form-input w-full px-3 py-2.5 text-sm ${
                  form.formState.errors.username ? 'error-state border-red-500' : ''
                }`}
                placeholder=" "
                {...form.register("username")}
              />
              <Label htmlFor="username" className="floating-label">
                Username
              </Label>
              {form.formState.errors.username && (
                <div className="error-message mt-1 text-xs text-brand-error flex items-center">
                  <TriangleAlert className="w-3 h-3 mr-1" />
                  <span>{form.formState.errors.username.message}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="input-group relative">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input w-full px-3 py-2.5 pr-10 text-sm ${
                    form.formState.errors.password ? 'error-state border-red-500' : ''
                  }`}
                  placeholder=" "
                  {...form.register("password")}
                />
                <Label htmlFor="password" className="floating-label">
                  Password
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-brand-gray hover:text-gray-700 h-auto p-1"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
              {form.formState.errors.password && (
                <div className="error-message mt-1 text-xs text-brand-error flex items-center">
                  <TriangleAlert className="w-3 h-3 mr-1" />
                  <span>{form.formState.errors.password.message}</span>
                </div>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                />
                <Label htmlFor="remember" className="text-xs text-gray-600">
                  Remember me
                </Label>
              </div>
              <a href="#" className="text-xs text-brand-blue hover:text-blue-700 font-medium">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-brand-blue hover:bg-blue-700 text-white py-2.5 px-4 text-sm font-medium transition-colors duration-200 disabled:opacity-50"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Success Message */}
            {loginMutation.isSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 slide-in">
                <div className="flex items-center">
                  <CheckCircle className="text-brand-success w-4 h-4 mr-2" />
                  <span className="text-xs text-green-800">Login successful! Redirecting...</span>
                </div>
              </div>
            )}
          </form>

          {/* Additional Links */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-brand-gray">
              Need access?{" "}
              <a href="#" className="text-brand-blue hover:text-blue-700 font-medium">
                Contact Administrator
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-brand-gray">
          <p>&copy; 2024 AI Agent Management Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
