/** Types for the D4 verifier core (the runtime lives in uicockpit-check.mjs). */
export interface ContractViolation {
  check: string
  severity: 'error' | 'warn' | 'info'
  file: string
  line: number
  message: string
}

/** The adoption config (`uicockpit.json`, the shadcn components.json model). All
 *  fields optional; `check` honours `allowColors` (sanctioned foreign brand colours). */
export interface UicockpitConfig {
  prefix?: string
  tokenStrategy?: string
  darkStrategy?: string
  framework?: string
  aliasMap?: Record<string, string>
  allowColors?: string[]
}

export function checkContract(
  contract: unknown,
  files: { path: string; content: string }[],
  config?: UicockpitConfig,
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
