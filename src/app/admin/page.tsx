"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LockKeyhole } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call the backend admin login endpoint
      const formData = new URLSearchParams();
      formData.append("username", email); // FastAPI expects 'username'
      formData.append("password", password);

      const response = await fetch(`${process.env.SERVER_URL}/auth/admin/token`, { // Use NEXT_PUBLIC_ prefix for client-side env vars
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Authentication failed" }));
        throw new Error(errorData.detail || "Invalid credentials or not an admin");
      }

      const data = await response.json();

      if (!data.access_token) {
        throw new Error("No access token received");
      }

      // Store the token in localStorage
      localStorage.setItem("adminToken", data.access_token); // Use a specific name like adminToken
      router.push("/admin/dashboard");
      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });

    } catch (error) {
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="space-y-1 text-center">
          {/* ... existing CardHeader content ... */}
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <LockKeyhole className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com" // Keep placeholder or update if needed
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? "Authenticating..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}