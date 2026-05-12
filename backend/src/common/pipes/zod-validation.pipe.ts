import { PipeTransform, BadRequestException } from '@nestjs/common';

interface ZodLike {
  safeParse(value: unknown): { success: boolean; data?: unknown; error?: { issues: { path: (string | number)[]; message: string }[] } };
}

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodLike) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: (result.error?.issues ?? []).map((e) => ({
          field: e.path.join('.'),
          messages: [e.message],
        })),
      });
    }
    return result.data;
  }
}
