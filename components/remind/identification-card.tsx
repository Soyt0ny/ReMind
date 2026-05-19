"use client"

export interface IdentificationResult {
  name: string
  relationship: string
  confidence: number
  age?: number
  extra?: string
  photo?: string
}

interface IdentificationCardProps {
  result: IdentificationResult | null
  isIdentifying: boolean
  onRegister?: () => void
  onRetry?: () => void
}

export function IdentificationCard({ result, isIdentifying, onRegister, onRetry }: IdentificationCardProps) {
  if (!result && isIdentifying) {
    return (
      <div className="mx-auto w-full max-w-md animate-slide-up rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#137fec]" />
          </div>
          <p className="text-lg font-semibold text-[#111418]">Identificando...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 40 }}>face</span>
          </div>
          <p className="text-lg font-medium text-gray-500">Apunte la cámara hacia un rostro</p>
        </div>
      </div>
    )
  }

  const isUnknown = result.name === "desconocido"

  return (
    <div className="mx-auto w-full max-w-md animate-slide-up rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100 shadow-inner flex items-center justify-center">
            {result.photo && !isUnknown ? (
              <img src={result.photo} alt={result.name} className="h-full w-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-gray-400" style={{ fontSize: 40 }}>
                {isUnknown ? "question_mark" : "person"}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          {!isUnknown && (
            <p className="text-xs font-bold uppercase tracking-widest text-[#137fec] mb-0.5">IDENTIFICADA</p>
          )}
          <h2 className="text-2xl font-bold leading-tight text-[#111418]">
            {isUnknown ? "Persona desconocida" : result.name}
          </h2>
          <p className="text-lg font-medium text-gray-500 mt-0.5">
            {isUnknown ? "No hay coincidencias" : result.relationship}
          </p>
          {result.age && !isUnknown && (
            <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-base">person</span>
              {result.age} años
            </p>
          )}
        </div>
      </div>

      {isUnknown && (onRegister || onRetry) && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {onRegister && (
            <button
              onClick={onRegister}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#137fec] p-3 text-white transition-opacity hover:opacity-90 shadow-lg shadow-blue-500/30"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span className="text-sm font-semibold">Registrar</span>
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 p-3 transition-colors hover:bg-gray-200"
            >
              <span className="material-symbols-outlined text-gray-700 text-lg">refresh</span>
              <span className="text-sm font-semibold text-gray-700">Intentar de nuevo</span>
            </button>
          )}
        </div>
      )}

      {!isUnknown && result.extra && (
        <p className="mt-3 text-sm text-gray-400 border-t border-gray-100 pt-3">{result.extra}</p>
      )}
    </div>
  )
}
