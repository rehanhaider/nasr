import type { StandardSchemaV1 } from '@tanstack/react-form'

/**
 * TanStack Form stores standard-schema issue objects (`{ message, path }`) in
 * `field.state.meta.errors`, not strings — rendering them directly prints
 * `[object Object]`. Pull the messages out instead.
 */
export function fieldErrorText(errors: unknown[]): string {
  return errors
    .map((err) => {
      if (!err) return ''
      if (typeof err === 'string') return err
      const message = (err as { message?: unknown }).message
      return typeof message === 'string' ? message : String(err)
    })
    .filter(Boolean)
    .join(', ')
}

/**
 * Zod's `.default()` makes a field optional on the schema's *input* side, so a
 * schema's static input type never matches the all-required `defaultValues`
 * a form is built from, and TanStack rejects it as a validator. Runtime
 * validation is unaffected — this only widens the input side so the two
 * static views line up.
 */
export function schemaValidator(
  schema: StandardSchemaV1<any, unknown>,
): StandardSchemaV1<any, unknown> {
  return schema
}
