interface Props { size?: number; color?: string }

export default function RadarLogoMark({ size = 28, color = '#0B1B3D' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke={color} strokeWidth="3.5" />
      <path d="M14 32a18 18 0 0 1 18-18" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M50 32a18 18 0 0 1-18 18" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="6" fill="#048ABF" />
      <circle cx="42" cy="32" r="2.4" fill="#F2B705" />
      <circle cx="48" cy="32" r="2.4" fill="#F25C05" />
    </svg>
  )
}
