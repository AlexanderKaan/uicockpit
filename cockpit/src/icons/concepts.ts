/**
 * The 28 icon concepts Cockpit's preview & dashboard use.
 * Every adapter must provide all 28. Build-time check (verify:icons).
 */
export const ICON_CONCEPTS = [
  'check',
  'chevD',
  'chevR',
  'chevL',
  'plus',
  'x',
  'bell',
  'spark',
  'dots',
  'info',
  'edit',
  'trash',
  'file',
  'home',
  'grid',
  'chart',
  'cog',
  'upload',
  'search',
  'cal',
  'store',
  'chat',
  'feed',
  'card',
  'copy',
  'refresh',
  'thumbUp',
  'thumbDown',
] as const

export type IconName = (typeof ICON_CONCEPTS)[number]

import type { ComponentType } from 'react'

export interface IconProps {
  size?: number
  className?: string
}

export type IconMap = Record<IconName, ComponentType<IconProps>>

export interface IconAdapter {
  map: IconMap
}
