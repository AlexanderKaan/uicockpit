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
