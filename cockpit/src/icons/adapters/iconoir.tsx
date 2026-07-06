import {
  Bell,
  Calendar,
  ChatBubble,
  Check,
  Copy,
  CreditCard,
  EditPencil,
  GraphUp,
  HomeSimple,
  InfoCircle,
  MoreHoriz,
  NavArrowDown,
  NavArrowLeft,
  NavArrowRight,
  Page,
  Plus,
  Refresh,
  Search,
  RssFeed,
  Settings,
  Shop,
  Sparks,
  ThumbsDown,
  ThumbsUp,
  Trash,
  Upload,
  ViewGrid,
  Xmark,
} from 'iconoir-react'
import type { IconAdapter, IconProps } from '../concepts'

const wrap = (Cmp: React.ComponentType<Record<string, unknown>>) =>
  function IconoirIcon({ size = 15, className }: IconProps) {
    return <Cmp width={size} height={size} strokeWidth={1.5} className={className} />
  }

const adapter: IconAdapter = {
  map: {
    check: wrap(Check),
    chevD: wrap(NavArrowDown),
    chevR: wrap(NavArrowRight),
    chevL: wrap(NavArrowLeft),
    plus: wrap(Plus),
    x: wrap(Xmark),
    bell: wrap(Bell),
    spark: wrap(Sparks),
    dots: wrap(MoreHoriz),
    info: wrap(InfoCircle),
    edit: wrap(EditPencil),
    trash: wrap(Trash),
    file: wrap(Page),
    home: wrap(HomeSimple),
    grid: wrap(ViewGrid),
    chart: wrap(GraphUp),
    cog: wrap(Settings),
    upload: wrap(Upload),
    search: wrap(Search),
    cal: wrap(Calendar),
    store: wrap(Shop),
    chat: wrap(ChatBubble),
    feed: wrap(RssFeed),
    card: wrap(CreditCard),
    copy: wrap(Copy),
    refresh: wrap(Refresh),
    thumbUp: wrap(ThumbsUp),
    thumbDown: wrap(ThumbsDown),
  },
}

export default adapter
