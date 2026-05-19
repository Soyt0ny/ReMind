"use client"

type Tab = "home" | "contacts" | "settings"

interface NavigationProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export function Navigation({ active, onChange }: NavigationProps) {
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "home",     icon: "home",     label: "Inicio"    },
    { id: "contacts", icon: "contacts", label: "Contactos" },
    { id: "settings", icon: "settings", label: "Ajustes"   },
  ]

  return (
    <nav className="fixed bottom-0 w-full max-w-md mx-auto bg-white border-t border-gray-100 pb-safe pt-2 px-6 z-50">
      <div className="flex justify-around items-center h-16 pb-2">
        {tabs.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
              active === id ? "text-[#137fec]" : "text-gray-400 hover:text-gray-600"
            }`}
            aria-current={active === id ? "page" : undefined}
          >
            <span className={`material-symbols-outlined text-[28px] ${active === id ? "filled" : ""}`}>
              {icon}
            </span>
            <span className={`text-xs ${active === id ? "font-bold" : "font-medium"}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
