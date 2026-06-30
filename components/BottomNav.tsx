"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  PlusCircle,
  ScrollText,
  ChefHat,
  Settings,
} from "lucide-react";

const items = [
  {
    href: "/dashboard",
    label: "Home",
    icon: House,
  },
  {
    href: "/add",
    label: "Add",
    icon: PlusCircle,
  },
  {
    href: "/history",
    label: "History",
    icon: ScrollText,
  },
  {
    href: "/recipes",
    label: "Recipes",
    icon: ChefHat,
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
    <nav className="fixed bottom-0 left-0 right-0 flex justify-center border-t border-[#E7E2D6] bg-[#FAF7F0]">
      <div className="flex w-full max-w-[430px] justify-around py-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-xs ${
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
    </nav>
  );
}