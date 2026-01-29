import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, User, Car, Palmtree } from "lucide-react";

export default function BottomBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const navItems = [
    { label: "Holidays", icon: Palmtree, path: "/holidays", color: "text-teal-500", bg: "bg-teal-50" },
    { label: "Home", icon: Home, path: "/", color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Cabs", icon: Car, path: "/cabs", color: "text-yellow-500", bg: "bg-yellow-50" },
    { label: "Profile", icon: User, path: "/profile", color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-2 pointer-events-none md:hidden">
      <div className="pointer-events-auto w-full max-w-md mx-4 bg-white/90 backdrop-blur-xl shadow-lg border border-white/20 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Exact match for root, startsWith for others to handle sub-routes if needed, 
            // but for bottom bar usually exact or specific logic is better.
            // Using exact match for now as per previous logic.
            const isActive = currentPath === item.path;

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center w-14 group outline-none"
              >
                {isActive && (
                  <span
                    className={`absolute -top-8 w-8 h-1 rounded-full ${item.color.replace("text", "bg")} opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]`}
                  />
                )}

                <div
                  className={`relative p-2 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    isActive ? `-translate-y-1 ${item.bg}` : "translate-y-0 bg-transparent hover:bg-gray-100"
                  }`}
                >
                  <Icon
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`w-5 h-5 transition-all duration-500 ease-out ${
                      isActive 
                        ? `${item.color} scale-110 rotate-3` 
                        : "text-gray-400 scale-100 group-hover:text-gray-600"
                    }`}
                  />
                </div>

                <span
                  className={`text-[10px] font-semibold mt-0.5 transition-all duration-500 ${
                    isActive
                      ? `${item.color} translate-y-0 opacity-100 scale-100`
                      : "text-gray-400 translate-y-2 opacity-0 scale-75 absolute bottom-0"
                  }`}
                >
                  {item.label}
                </span>
                
                {isActive && (
                    <div className={`absolute -bottom-2 w-1 h-1 rounded-full ${item.color.replace("text", "bg")}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
