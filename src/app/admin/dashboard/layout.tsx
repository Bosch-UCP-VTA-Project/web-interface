"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check for the admin token instead of the simple boolean flag
    const isAuthenticated = localStorage.getItem("adminToken");
    if (!isAuthenticated) {
      // Redirect to admin login page if token is not found
      router.push("/admin");
    }
    // Optional: Add token validation logic here if needed (e.g., check expiry)
  }, [router]);

  const handleLogout = () => {
    // Remove the admin token on logout
    localStorage.removeItem("adminToken");
    router.push("/admin"); // Redirect to admin login page
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-primary">
              Bosch VTA Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout} // Use updated logout handler
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <>
        <div className="h-1 bg-gradient-to-r from-red-500 via-blue-500 to-green-500"></div>
        <div className="flex-1 overflow-auto">
          <div className="h-full p-8">{children}</div>
        </div>
      </>
    </div>
  );
}
