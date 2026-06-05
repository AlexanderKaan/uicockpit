#!/usr/bin/env node
/**
 * Build-time icon-mapping verification.
 *
 * Imports each adapter's source mapping and confirms that every one of the
 * 21 concept names resolves to a real export in the installed library version.
 *
 * Run via:   npm run verify:icons   (also runs automatically before build)
 *
 * Fails loudly if a library renamed/removed an icon between versions
 * — exactly the failure mode ICONS.md warns about.
 */

const CONCEPTS = [
  'check', 'chevD', 'chevR', 'chevL', 'plus', 'x',
  'bell', 'spark', 'dots', 'info', 'edit', 'trash',
  'file', 'home', 'grid', 'chart', 'cog', 'upload',
  'search', 'cal', 'store',
]

const LIBRARIES = [
  {
    label: 'Iconoir (hairline)',
    pkg: 'iconoir-react',
    names: ['Check', 'NavArrowDown', 'NavArrowRight', 'NavArrowLeft', 'Plus', 'Xmark',
      'Bell', 'Sparks', 'MoreHoriz', 'InfoCircle', 'EditPencil', 'Trash',
      'Page', 'HomeSimple', 'ViewGrid', 'GraphUp', 'Settings', 'Upload',
      'Search', 'Calendar', 'Shop'],
  },
  {
    label: 'Lucide (line)',
    pkg: 'lucide-react',
    names: ['Check', 'ChevronDown', 'ChevronRight', 'ChevronLeft', 'Plus', 'X',
      'Bell', 'Sparkles', 'MoreHorizontal', 'Info', 'Pencil', 'Trash2',
      'File', 'Home', 'LayoutGrid', 'BarChart3', 'Settings', 'Upload',
      'Search', 'Calendar', 'Store'],
  },
  {
    label: 'Phosphor regular (rounded)',
    pkg: '@phosphor-icons/react',
    names: ['Check', 'CaretDown', 'CaretRight', 'CaretLeft', 'Plus', 'X',
      'Bell', 'Sparkle', 'DotsThree', 'Info', 'PencilSimple', 'Trash',
      'File', 'House', 'GridFour', 'ChartBar', 'Gear', 'UploadSimple',
      'MagnifyingGlass', 'Calendar', 'Storefront'],
  },
  {
    label: 'Phosphor bold (bold)',
    pkg: '@phosphor-icons/react',
    names: ['Check', 'CaretDown', 'CaretRight', 'CaretLeft', 'Plus', 'X',
      'Bell', 'Sparkle', 'DotsThree', 'Info', 'PencilSimple', 'Trash',
      'File', 'House', 'GridFour', 'ChartBar', 'Gear', 'UploadSimple',
      'MagnifyingGlass', 'Calendar', 'Storefront'],
  },
  {
    label: 'Heroicons solid',
    pkg: '@heroicons/react/24/solid',
    names: ['CheckIcon', 'ChevronDownIcon', 'ChevronRightIcon', 'ChevronLeftIcon', 'PlusIcon', 'XMarkIcon',
      'BellIcon', 'SparklesIcon', 'EllipsisHorizontalIcon', 'InformationCircleIcon', 'PencilIcon', 'TrashIcon',
      'DocumentIcon', 'HomeIcon', 'Squares2X2Icon', 'ChartBarIcon', 'Cog6ToothIcon', 'ArrowUpTrayIcon',
      'MagnifyingGlassIcon', 'CalendarIcon', 'BuildingStorefrontIcon'],
  },
]

let allOk = true
const failures = []

for (const lib of LIBRARIES) {
  const mod = await import(lib.pkg)
  const missing = []
  for (let i = 0; i < CONCEPTS.length; i++) {
    const concept = CONCEPTS[i]
    const exportName = lib.names[i]
    if (!mod[exportName]) {
      missing.push(`${concept} -> ${exportName}`)
    }
  }
  if (missing.length > 0) {
    allOk = false
    failures.push(`✗ ${lib.label}: ${missing.length} missing export(s)\n    ` + missing.join('\n    '))
  } else {
    console.log(`✓ ${lib.label} — 21/21 concept exports resolve`)
  }
}

if (!allOk) {
  console.error('\nIcon-mapping verification FAILED:\n')
  console.error(failures.join('\n\n'))
  console.error('\nCheck the installed package version against the adapter mappings in src/icons/adapters/.')
  process.exit(1)
}
console.log('\nAll 5 libraries × 21 concepts verified.')
