import { ShieldCheck, Clock, BadgeCheck } from 'lucide-react'

const features = [
  { icon: ShieldCheck, label: 'Escrow-protected payments' },
  { icon: Clock,       label: 'Funds released on delivery' },
  { icon: BadgeCheck,  label: 'Verified buyer & seller badges' },
]

export default function AuthHeroPanel() {
  return (
    <div className="hidden lg:flex flex-col w-[55%] min-h-screen bg-[#E8470A] p-12 justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <ShieldCheck size={17} className="text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">PayClutr</span>
      </div>

      {/* Center */}
      <div>
        <p className="text-sm font-medium text-white/60 uppercase tracking-widest mb-4">Nigeria's Safest Marketplace</p>
        <h2 className="text-[2.6rem] font-bold text-white leading-tight tracking-tight mb-5">
          Buy and sell with<br />complete confidence.
        </h2>
        <p className="text-white/70 text-base leading-relaxed max-w-sm">
          Every transaction is held in escrow until delivery is confirmed — protecting both buyers and sellers.
        </p>

        <div className="mt-10 space-y-3">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <Icon size={13} className="text-white" />
              </div>
              <span className="text-white/80 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-white/40 text-xs">© {new Date().getFullYear()} PayClutr. All rights reserved.</p>
    </div>
  )
}
