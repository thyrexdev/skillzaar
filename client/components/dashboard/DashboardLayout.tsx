"use client";

import ClientSidebar from "./Client/Sidebar";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for desktop */}
      <div className="hidden md:block">
        <ClientSidebar />
      </div>
      {/* Mobile menu button and drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center h-14 bg-card border-b border-border px-10 justify-between">
        <span className="text-xl font-bold text-primary">Skillzaar</span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button aria-label="Open menu">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-[260px] sm:w-[300px]">
            <ClientSidebar hideCloseButton />
          </SheetContent>
        </Sheet>
      </div>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64 ml-0 transition-all duration-300 pt-14 md:pt-0">
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
