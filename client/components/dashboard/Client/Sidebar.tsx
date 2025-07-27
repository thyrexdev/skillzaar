"use client";

import { useAuth } from "@/stores/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  HomeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PowerIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  DocumentCheckIcon,
  HeartIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import React from "react";
import Link from "next/link";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  children?: SidebarItem[];
}

const navigation: SidebarItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
  },
  {
    name: "Find Talent",
    href: "/dashboard/find-talent",
    icon: MagnifyingGlassIcon,
  },
  {
    name: "My Jobs",
    href: "/dashboard/jobs",
    icon: BriefcaseIcon,
    badge: 3,
    children: [
      { name: "Active Jobs", href: "/dashboard/jobs/active", icon: ClockIcon },
      { name: "Completed", href: "/dashboard/jobs/completed", icon: CheckCircleIcon },
      { name: "Drafts", href: "/dashboard/jobs/drafts", icon: DocumentTextIcon },
      { name: "Archived", href: "/dashboard/jobs/archived", icon: XCircleIcon },
    ],
  },
  {
    name: "Proposals",
    href: "/dashboard/proposals",
    icon: DocumentTextIcon,
    badge: 12,
  },
  {
    name: "Contracts",
    href: "/dashboard/contracts",
    icon: DocumentCheckIcon,
    badge: 5,
  },
  {
    name: "Messages",
    href: "/dashboard/messages",
    icon: ChatBubbleLeftRightIcon,
    badge: 8,
  },
  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: CreditCardIcon,
    children: [
      { name: "Payment History", href: "/dashboard/payments/history", icon: ClockIcon },
      { name: "Invoices", href: "/dashboard/payments/invoices", icon: DocumentTextIcon },
      { name: "Payment Methods", href: "/dashboard/payments/methods", icon: CreditCardIcon },
    ],
  },
  {
    name: "Reviews",
    href: "/dashboard/reviews",
    icon: StarIcon,
  },
  {
    name: "Saved Talent",
    href: "/dashboard/saved",
    icon: HeartIcon,
    badge: 15,
  },
];

const bottomNavigation: SidebarItem[] = [
  {
    name: "Settings",
    href: "/account/settings",
    icon: Cog6ToothIcon,
  },
  {
    name: "Help & Support",
    href: "/dashboard/help",
    icon: QuestionMarkCircleIcon,
  },
];

interface ClientSidebarProps {
  hideCloseButton?: boolean;
}

const ClientSidebar: React.FC<ClientSidebarProps> = ({ hideCloseButton }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: SidebarItem) => {
    if (isActive(item.href)) return true;
    return item.children?.some(child => isActive(child.href)) || false;
  };

  const renderNavigationItem = (item: SidebarItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const active = isParentActive(item);

    return (
      <div key={item.name}>
        {hasChildren ? (
          <div
            className={`
              group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200
              ${active
                ? "bg-[var(--color-sidebar-primary)] text-[var(--color-sidebar-primary-foreground)] border-r-2 border-[var(--color-sidebar-ring)]"
                : "text-[var(--color-sidebar-foreground)] hover:bg-[var(--color-sidebar-accent)] hover:text-[var(--color-sidebar-accent-foreground)]"
              }
              ${isChild ? "ml-4 pl-8" : ""}
              ${isCollapsed ? "justify-center px-2" : ""}
            `}
            onClick={() => toggleExpanded(item.name)}
          >
            <div className="flex items-center min-w-0 flex-1">
              <item.icon
                className={`
                  ${isCollapsed ? "h-6 w-6" : "mr-3 h-5 w-5"}
                  ${active ? "text-[var(--color-sidebar-primary-foreground)]" : "text-[var(--color-sidebar-foreground)] group-hover:text-[var(--color-sidebar-accent-foreground)]"}
                  transition-colors duration-200
                `}
              />
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-[var(--color-sidebar-accent-foreground)] bg-[var(--color-sidebar-accent)] rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </div>
            {!isCollapsed && hasChildren && (
              <ChevronRightIcon
                className={`ml-2 h-4 w-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            )}
          </div>
        ) : (
          <Link
            href={item.href}
            className={`
              group flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200
              ${active
                ? "bg-[var(--color-sidebar-primary)] text-[var(--color-sidebar-primary-foreground)] border-r-2 border-[var(--color-sidebar-ring)]"
                : "text-[var(--color-sidebar-foreground)] hover:bg-[var(--color-sidebar-accent)] hover:text-[var(--color-sidebar-accent-foreground)]"
              }
              ${isChild ? "ml-4 pl-8" : ""}
              ${isCollapsed ? "justify-center px-2" : ""}
            `}
            prefetch={false}
          >
            <div className="flex items-center min-w-0 flex-1">
              <item.icon
                className={`
                  ${isCollapsed ? "h-6 w-6" : "mr-3 h-5 w-5"}
                  ${active ? "text-[var(--color-sidebar-primary-foreground)]" : "text-[var(--color-sidebar-foreground)] group-hover:text-[var(--color-sidebar-accent-foreground)]"}
                  transition-colors duration-200
                `}
              />
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-[var(--color-sidebar-accent-foreground)] bg-[var(--color-sidebar-accent)] rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </div>
          </Link>
        )}

        {/* Children items */}
        {!isCollapsed && hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderNavigationItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`
        fixed left-0 top-0 h-full bg-[var(--color-sidebar)]/95 backdrop-blur-sm border-r border-[var(--color-sidebar-border)] z-40 transition-all duration-300 ease-in-out shadow-sm
        ${isCollapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--color-sidebar-border)]">
        {!isCollapsed && (
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">Skillzaar</h1>
            </div>
          </div>
        )}
        {!hideCloseButton && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-sidebar-accent transition-colors duration-200"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-[var(--color-sidebar-border)]">
          <div className="flex items-center">
            <div className="flex-shrink-0">
            <UserCircleIcon className="h-10 w-10 text-[var(--color-sidebar-foreground)]" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-sidebar-foreground)] truncate">
                {user?.name || "Client User"}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                {user?.email || "client@example.com"}
              </p>
            </div>
            <div className="ml-2">
              <BellIcon className="h-5 w-5 text-[var(--color-sidebar-foreground)] hover:text-[var(--color-sidebar-accent)] cursor-pointer" />
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Button */}
      {!isCollapsed && (
        <div className="p-4">
          <button
            onClick={() => router.push("/dashboard/jobs/post")}
            className="w-full flex items-center justify-center px-4 py-2 bg-[var(--color-sidebar-primary)] text-[var(--color-sidebar-primary-foreground)] text-sm font-medium rounded-lg hover:bg-[var(--color-sidebar-accent)] hover:text-[var(--color-sidebar-accent-foreground)] transition-colors duration-200"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Post a Job
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map(item => renderNavigationItem(item))}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-[var(--color-sidebar-border)] p-3 space-y-1">
        {bottomNavigation.map(item => renderNavigationItem(item))}
        
        {/* Logout Button */}
        <div
          className={`
            group flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10
            ${isCollapsed ? "justify-center px-2" : ""}
          `}
          onClick={handleLogout}
        >
          <PowerIcon
            className={`
              ${isCollapsed ? "h-6 w-6" : "mr-3 h-5 w-5"}
              text-[var(--color-destructive)] transition-colors duration-200
            `}
          />
          {!isCollapsed && <span>Logout</span>}
        </div>
      </div>

      {/* Collapsed tooltips */}
      {isCollapsed && (
        <div className="absolute left-full top-0 h-full pointer-events-none">
          {/* Tooltips would be rendered here on hover */}
        </div>
      )}
    </div>
  );
};

export default ClientSidebar;
