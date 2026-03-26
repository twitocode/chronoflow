'use client'

import { motion, useReducedMotion } from 'motion/react'
import { Outlet, useLocation } from '@tanstack/react-router'

const transition = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }

export function AnimatedOutlet() {
  const { pathname } = useLocation()
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <div className="min-h-full w-full min-w-0">
        <Outlet />
      </div>
    )
  }

  return (
    <motion.div
      key={pathname}
      className="min-h-full w-full min-w-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
    >
      <Outlet />
    </motion.div>
  )
}
