import {
  ArrowUpTrayIcon,
  BellIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  DocumentIcon,
  EllipsisHorizontalIcon,
  HomeIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  RssIcon,
  SparklesIcon,
  Squares2X2Icon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import type { IconAdapter, IconProps } from '../concepts'

const wrap = (Cmp: React.ComponentType<Record<string, unknown>>) =>
  function HeroiconsSolidIcon({ size = 15, className }: IconProps) {
    return (
      <Cmp
        width={size}
        height={size}
        className={className}
        style={{ display: 'block' }}
      />
    )
  }

const adapter: IconAdapter = {
  map: {
    check: wrap(CheckIcon),
    chevD: wrap(ChevronDownIcon),
    chevR: wrap(ChevronRightIcon),
    chevL: wrap(ChevronLeftIcon),
    plus: wrap(PlusIcon),
    x: wrap(XMarkIcon),
    bell: wrap(BellIcon),
    spark: wrap(SparklesIcon),
    dots: wrap(EllipsisHorizontalIcon),
    info: wrap(InformationCircleIcon),
    edit: wrap(PencilIcon),
    trash: wrap(TrashIcon),
    file: wrap(DocumentIcon),
    home: wrap(HomeIcon),
    grid: wrap(Squares2X2Icon),
    chart: wrap(ChartBarIcon),
    cog: wrap(Cog6ToothIcon),
    upload: wrap(ArrowUpTrayIcon),
    search: wrap(MagnifyingGlassIcon),
    cal: wrap(CalendarIcon),
    store: wrap(BuildingStorefrontIcon),
    chat: wrap(ChatBubbleLeftIcon),
    feed: wrap(RssIcon),
    card: wrap(CreditCardIcon),
  },
}

export default adapter
