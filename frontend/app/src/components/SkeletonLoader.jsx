/**
 * SkeletonLoader.jsx — Skeleton loading placeholders for SUP'ONE AI
 *
 * Provides animated skeleton screens as alternatives to spinners.
 * Used for initial load, message loading, and content placeholders.
 */

import { motion } from 'framer-motion'

const shimmer = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

/**
 * Base skeleton element with shimmer effect.
 */
function Skeleton({ width = '100%', height = 16, borderRadius = 8, style = {} }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={shimmer}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-hover) 50%, var(--bg-tertiary) 75%)',
        backgroundSize: '200% 100%',
        ...style,
      }}
      aria-hidden="true"
    />
  )
}

/**
 * Skeleton for a chat message bubble (user).
 */
export function UserMessageSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '8px 0',
      }}
      aria-label="Chargement du message"
      role="status"
    >
      <div
        style={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
        }}
      >
        <Skeleton width={180} height={36} borderRadius={18} />
      </div>
    </div>
  )
}

/**
 * Skeleton for a chat message bubble (bot).
 */
export function BotMessageSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        padding: '8px 0',
        gap: 8,
      }}
      aria-label="Chargement de la réponse"
      role="status"
    >
      <Skeleton width={32} height={32} borderRadius={16} style={{ flexShrink: 0 }} />
      <div
        style={{
          maxWidth: '80%',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <Skeleton width="100%" height={16} borderRadius={4} />
        <Skeleton width="85%" height={16} borderRadius={4} />
        <Skeleton width="60%" height={16} borderRadius={4} />
      </div>
    </div>
  )
}

/**
 * Skeleton for the welcome screen suggestions.
 */
export function WelcomeSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 24,
        padding: 32,
      }}
      aria-label="Chargement"
      role="status"
    >
      <Skeleton width={64} height={64} borderRadius={32} />
      <Skeleton width={200} height={24} borderRadius={12} />
      <Skeleton width={300} height={16} borderRadius={8} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          width: '100%',
          maxWidth: 400,
          marginTop: 16,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={60} borderRadius={12} />
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton for sidebar history items.
 */
export function SidebarSkeleton({ count = 5 }) {
  return (
    <div style={{ padding: '8px 12px' }} role="status" aria-label="Chargement de l'historique">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: '10px 12px',
            marginBottom: 4,
          }}
        >
          <Skeleton
            width={`${60 + Math.random() * 30}%`}
            height={14}
            borderRadius={4}
          />
        </div>
      ))}
    </div>
  )
}

/**
 * Full-page loading skeleton (replaces LoadingScreen).
 */
export function FullPageSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
      role="status"
      aria-label="Chargement de l'application"
    >
      {/* Header skeleton */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Skeleton width={120} height={20} borderRadius={4} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton width={28} height={28} borderRadius={14} />
        </div>
      </div>

      {/* Chat area skeleton */}
      <div style={{ flex: 1, padding: 16 }}>
        <BotMessageSkeleton />
        <UserMessageSkeleton />
        <BotMessageSkeleton />
      </div>

      {/* Input skeleton */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <Skeleton height={44} borderRadius={22} />
      </div>
    </div>
  )
}

export default Skeleton
