/* A vocabulary in the shape most teams are writing it: a discriminated union of
 * domain blocks, validated with Zod. Nothing wrong with it — that is the point. */
const CostSummary = z.object({
  component: z.literal('cost-summary'),
  period: z.enum(['current-week', 'current-month']),
  comparisonPeriod: z.enum(['previous-week', 'previous-month']),
})
const AnomalyList = z.object({
  component: z.literal('anomaly-list'),
  severity: z.enum(['medium', 'high']),
  title: z.string().optional(),
})
const RemediationOptions = z.object({
  component: z.literal('remediation-options'),
  category: z.enum(['compute', 'storage', 'network']),
})
const Confirmation = z.object({
  component: z.literal('confirmation'),
  message: z.string(),
  actionId: z.string(),
})
export const UIBlock = z.discriminatedUnion('component', [
  CostSummary, AnomalyList, RemediationOptions, Confirmation,
])
