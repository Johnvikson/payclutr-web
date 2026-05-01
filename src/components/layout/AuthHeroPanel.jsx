import { BadgeCheck, ShieldCheck, Wallet } from 'lucide-react'
import Logo from '../ui/Logo.jsx'

const features = [
  {
    icon: ShieldCheck,
    title: 'Escrow protection',
    body: 'Funds held safely until delivery',
  },
  {
    icon: BadgeCheck,
    title: 'Verified sellers',
    body: 'Every seller passes BVN + NIN checks',
  },
  {
    icon: Wallet,
    title: 'Safe payments',
    body: 'No card details ever leave your bank',
  },
]

export default function AuthHeroPanel() {
  return (
    <div className="hidden lg:flex flex-1 min-h-screen bg-zinc-900 text-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 p-12 flex flex-col justify-between w-full">
        <div className="opacity-90">
          <Logo size="md" mono />
        </div>

        <div>
          <h2 className="text-4xl font-bold tracking-tight leading-tight max-w-md">
            Declutter & sell with <span className="text-brand">confidence</span>.
          </h2>
          <p className="mt-3 text-zinc-400 text-sm max-w-sm">
            Nigeria&apos;s declutter marketplace. Sell what you don&apos;t need, buy what you do, every trade protected by escrow.
          </p>

          <div className="mt-10 space-y-4 max-w-sm">
            {features.map((feature) => {
              const FeatureIcon = feature.icon

              return (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                    <FeatureIcon size={18} className="text-brand" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{feature.title}</div>
                    <div className="text-xs text-zinc-500">{feature.body}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-xs text-zinc-600">© {new Date().getFullYear()} PayClutr, Lagos, Nigeria</p>
      </div>
    </div>
  )
}
