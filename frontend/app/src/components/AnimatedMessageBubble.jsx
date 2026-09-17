/**
 * AnimatedMessageBubble.jsx — Animated message wrapper with framer-motion
 *
 * Provides slide-up + fade-in animation for messages,
 * stagger support for multiple messages, and exit animations.
 */

import { motion, AnimatePresence } from 'framer-motion'

const messageVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.97,
    transition: {
      duration: 0.15,
    },
  },
}

/**
 * Wrapper component that adds entrance animation to a message.
 * @param {Object} props
 * @param {React.ReactNode} props.children - The message content
 * @param {boolean} props.animate - Whether to animate (default: true)
 * @param {number} props.delay - Stagger delay in ms (default: 0)
 * @param {string} props.key - Unique key for animation
 */
export default function AnimatedMessageBubble({
  children,
  animate = true,
  delay = 0,
  ...props
}) {
  if (!animate) {
    return <div {...props}>{children}</div>
  }

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay: delay / 1000 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * AnimatePresence wrapper for message list transitions.
 * Use this around the message container for exit animations.
 */
export function AnimatedMessageList({ children }) {
  return (
    <AnimatePresence mode="popLayout">
      {children}
    </AnimatePresence>
  )
}

/**
 * Slide-in animation for modals and overlays.
 */
export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
}

/**
 * Fade transition for screen changes.
 */
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
}

/**
 * Slide from right for sidebar.
 */
export const slideFromRight = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    x: '100%',
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

/**
 * Pulse animation for loading states.
 */
export const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}
