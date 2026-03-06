import { z } from 'zod';
import { DOMAIN_CATEGORIES } from '../core/domain-capability';

const DomainCategorySchema = z.enum(
  DOMAIN_CATEGORIES as unknown as [string, ...string[]],
);

export const DomainClassificationSchema = z.object({
  categories: z.array(DomainCategorySchema).min(1).max(4),
  primaryCategory: DomainCategorySchema,
  hasCodingComponent: z.boolean(),
  hasPhysicalComponent: z.boolean(),
  hasCreativeComponent: z.boolean(),
  primaryLanguage: z.string().nullable(),
  suggestedTooling: z.array(z.string().max(100)).max(10),
});

export type DomainClassificationResult = z.infer<typeof DomainClassificationSchema>;
