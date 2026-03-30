import { useSelector } from 'react-redux'
import { selectIsGlobalLoading } from '../../redux/slices/globalLoader'

function GlobalLoader() {
  const isLoading = useSelector(selectIsGlobalLoading)

  if (!isLoading) {
    return null
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-cyan-300/40 bg-white/85 shadow-[0_0_40px_rgba(34,211,238,0.18)]">
        <div className="absolute inset-2 rounded-full border border-cyan-400/20" />
        <div className="global-loader-ring h-20 w-20 rounded-full" />
        <div className="global-loader-core absolute flex h-12 w-12 items-center justify-center rounded-full">
          <span className="text-sm font-black tracking-[0.24em] text-white">HRS</span>
        </div>
      </div>
    </div>
  )
}

export default GlobalLoader
