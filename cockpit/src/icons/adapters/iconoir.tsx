import {
  Bell,
  Calendar,
  ChatBubble,
  Check,
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
  Search,
  RssFeed,
  Settings,
  Shop,
  Sparks,
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
  },
}

export default adapter
