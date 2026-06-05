import {
  Bell,
  Calendar,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChartBar,
  Chat,
  Check,
  CreditCard,
  DotsThree,
  File,
  Gear,
  GridFour,
  House,
  Info,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Rss,
  Sparkle,
  Storefront,
  Trash,
  UploadSimple,
  X,
} from '@phosphor-icons/react'
import type { IconAdapter, IconProps } from '../concepts'

const wrap = (Cmp: React.ComponentType<Record<string, unknown>>) =>
  function PhosphorRegularIcon({ size = 15, className }: IconProps) {
    return <Cmp size={size} weight="regular" className={className} />
  }

const adapter: IconAdapter = {
  map: {
    check: wrap(Check),
    chevD: wrap(CaretDown),
    chevR: wrap(CaretRight),
    chevL: wrap(CaretLeft),
    plus: wrap(Plus),
    x: wrap(X),
    bell: wrap(Bell),
    spark: wrap(Sparkle),
    dots: wrap(DotsThree),
    info: wrap(Info),
    edit: wrap(PencilSimple),
    trash: wrap(Trash),
    file: wrap(File),
    home: wrap(House),
    grid: wrap(GridFour),
    chart: wrap(ChartBar),
    cog: wrap(Gear),
    upload: wrap(UploadSimple),
    search: wrap(MagnifyingGlass),
    cal: wrap(Calendar),
    store: wrap(Storefront),
    chat: wrap(Chat),
    feed: wrap(Rss),
    card: wrap(CreditCard),
  },
}

export default adapter
