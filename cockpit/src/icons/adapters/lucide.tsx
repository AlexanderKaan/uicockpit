import {
  BarChart3,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  File,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  Home,
  Info,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Rss,
  Search,
  Settings,
  Sparkles,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import type { IconAdapter, IconProps } from '../concepts'

const wrap = (Cmp: React.ComponentType<Record<string, unknown>>) =>
  function LucideIcon({ size = 15, className }: IconProps) {
    return <Cmp size={size} strokeWidth={1.75} className={className} />
  }

const adapter: IconAdapter = {
  map: {
    check: wrap(Check),
    chevD: wrap(ChevronDown),
    chevR: wrap(ChevronRight),
    chevL: wrap(ChevronLeft),
    plus: wrap(Plus),
    x: wrap(X),
    bell: wrap(Bell),
    spark: wrap(Sparkles),
    dots: wrap(MoreHorizontal),
    info: wrap(Info),
    edit: wrap(Pencil),
    trash: wrap(Trash2),
    file: wrap(File),
    home: wrap(Home),
    grid: wrap(LayoutGrid),
    chart: wrap(BarChart3),
    cog: wrap(Settings),
    upload: wrap(Upload),
    search: wrap(Search),
    cal: wrap(Calendar),
    store: wrap(Store),
    chat: wrap(MessageSquare),
    feed: wrap(Rss),
    card: wrap(CreditCard),
    copy: wrap(Copy),
    refresh: wrap(RefreshCw),
    thumbUp: wrap(ThumbsUp),
    thumbDown: wrap(ThumbsDown),
  },
}

export default adapter
