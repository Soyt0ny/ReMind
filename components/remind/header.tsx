"use client"

interface HeaderProps {
  title?: string
  onBack?: () => void
  onSettings?: () => void
  displayName?: string
}

export function Header({ title = "ReMind", onBack, onSettings }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="w-10">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Volver"
          >
            <span className="material-symbols-outlined text-[28px] text-[#111418]">arrow_back</span>
          </button>
        )}
      </div>

      <h1 className="text-xl font-bold tracking-tight text-[#111418]">{title}</h1>

      <div className="w-10 flex justify-end">
        {onSettings && (
          <button
            onClick={onSettings}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Ajustes"
          >
            <span className="material-symbols-outlined text-[28px] text-[#111418]">settings</span>
          </button>
        )}
      </div>
    </header>
  )
}
