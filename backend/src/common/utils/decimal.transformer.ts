import { ValueTransformer } from 'typeorm';

/**
 * Convierte valores DECIMAL de SQL Server a `number` de JavaScript de forma consistente.
 */
export class ColumnDecimalTransformer implements ValueTransformer {
  to(value?: number | null): number | null {
    if (value === undefined || value === null) return null;
    return Number(value);
  }

  from(value?: string | number | null): number | null {
    if (value === undefined || value === null) return null;
    return Number(value);
  }
}
