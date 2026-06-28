/** Types for the D4 verifier core (the runtime lives in uicockpit-check.mjs). */
export interface ContractViolation {
  check: string
  severity: 'error' | 'warn' | 'info'
  file: string
  line: number
  message: string
}

export function checkContract(
  contract: unknown,
  files: { path: string; content: string }[],
): ContractViolation[]

export function runCheck(argv: string[]): Promise<number>

export function scanAndCheck(opts?: { dir?: string; contractPath?: string | null }): Promise<{
  ok: boolean
  error?: string
  contractPath?: string
  kit?: string
  fileCount?: number
  violations?: ContractViolation[]
  errors?: ContractViolation[]
  warns?: ContractViolation[]
}>
