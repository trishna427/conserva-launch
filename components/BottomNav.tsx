"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Plus,
  ChefHat,
  Settings,
  BarChart3,
} from "lucide-react";

const items = [
  {
    href: "/dashboard",
    label: "Home",
    icon: House,
  },
  {
    href: "/recipes",
    label: "Recipes",
    icon: ChefHat,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

return (
  <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center bg-transparent pb-2">
    <div className="flex w-full max-w-[430px] items-center justify-between rounded-[28px] border border-[#E7E2D6] bg-[#FAF7F0] px-6 py-3 shadow-lg">
      {/* Left Side */}
      <div className="flex items-center gap-8">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                active
                  ? "font-bold text-[#3F6B4F]"
                  : "text-[#8A8578]"
              }`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Center Add Button */}
      <Link
        href="/add"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3F6B4F] text-white shadow-md transition-transform hover:scale-105 active:scale-95"
      >
        <Plus size={30} strokeWidth={2.6} />
      </Link>

      {/* Right Side */}
      <div className="flex items-center gap-8">
        {items.slice(2).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                active
                  ? "font-bold text-[#3F6B4F]"
                  : "text-[#8A8578]"
              }`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  </nav>
);}