/* GENERATED — binding B: shadcn/ui. Code you own; no runtime dependency on us.
 * The catalog (schema) and this file (implementation) are the two halves A2UI
 * deliberately keeps apart: "the catalog is schema-only… each renderer SDK
 * independently maps catalog component types to native widgets." */
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { resolve, FUNCTIONS, type Ctx, type Node } from './core'

const TONE = { done: 'default', started: 'secondary', blocked: 'outline', new: 'secondary' } as const
type Item = { name: string; status: string; hint?: string; locked?: boolean; tone?: keyof typeof TONE; href?: string }

export function Render({ node, ctx }: { node: Node; ctx: Ctx }) {
  const r = <T,>(v: T) => resolve(v, ctx.model, ctx.scope, FUNCTIONS)
  const kids = node.kids.map((k) => <Render key={k.id} node={k} ctx={ctx} />)

  switch (node.component) {
    case 'TaskList': {
      const items = (r(node.items) ?? []) as Item[]
      return (
        <ol aria-label={r(node.label)} className="divide-y rounded-md border">
          {items.map((it, i) => (
            <li key={i} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="flex flex-col gap-0.5">
                {it.locked
                  ? <span className="text-muted-foreground">{it.name}</span>
                  : <a href={it.href ?? '#'} className="font-medium underline underline-offset-4">{it.name}</a>}
                {it.hint && <span className="text-sm text-muted-foreground">{it.hint}</span>}
              </span>
              <Badge variant={TONE[it.tone ?? 'new']}>{it.status}</Badge>
            </li>
          ))}
        </ol>
      )
    }
    case 'SummaryList': {
      const items = (r(node.items) ?? []) as { label: string; value: string }[]
      return (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
          {items.map((it, i) => (
            <div key={i} className="contents">
              <dt className="text-muted-foreground">{it.label}</dt>
              <dd className="font-medium">{it.value}</dd>
            </div>
          ))}
        </dl>
      )
    }
    case 'Card':    return <Card><CardContent className="pt-6">{kids}</CardContent></Card>
    case 'Column':  return <div className="flex flex-col gap-4">{kids}</div>
    case 'Row':     return <div className="flex flex-wrap items-center gap-2">{kids}</div>
    case 'Text':    return <p className="leading-relaxed">{r(node.text)}</p>
    case 'Button':  return <Button>{r(node.label)}</Button>
    case 'Divider': return <Separator />
    default:
      /* The refusal — visible, in place, with the reason. */
      return (
        <div role="status" data-a2ui-refused={node.component}
             className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <strong className="block">Refused: {node.component}</strong>
          Not in catalog “public-service”. Nothing was rendered for component id “{node.id}”.
        </div>
      )
  }
}
