"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const queryClient = new QueryClient();

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <div className="flex min-h-screen">
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="fixed inset-0 bg-black/50"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 z-50">
                <Sidebar />
              </div>
            </div>
          )}

          <div className="flex flex-1 flex-col">
            <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            <main className="flex-1 p-4 lg:p-6">{children}</main>
          </div>
        </div>
      </QueryClientProvider>
    </SessionProvider>
  );
}
