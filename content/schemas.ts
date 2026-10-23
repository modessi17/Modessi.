import { z } from 'zod';
export const schemas = {
  pages: {
    home: z.object({
      "processList": z.array(z.object({
        "id": z.string(),
        "text": z.string()
      }))
    }),
    gallery: z.object({
      "galleryImages": z.array(z.object({
        "id": z.string(),
        "slot": z.string(),
        "alt": z.string()
      }))
    }),
    services: z.object({
      "services": z.array(z.object({
        "title": z.string(),
        "description": z.string(),
        "id": z.string()
      }))
    }),
    contact: z.object({
      "heading": z.string(),
      "subheading": z.string(),
      "description": z.string(),
      "benefits": z.array(z.object({
        "id": z.string(),
        "text": z.string()
      })),
      "hoursHeading": z.string(),
      "hours": z.array(z.object({
        "id": z.string(),
        "day": z.string(),
        "time": z.string()
      })),
      "phone": z.string(),
      "successHeading": z.string(),
      "successMessage": z.string()
    }),
    shower_builder: z.object({
      "heading": z.string(),
      "subheading": z.string(),
      "description": z.string(),
      "steps": z.array(z.object({
        "id": z.string(),
        "key": z.string(),
        "label": z.string(),
        "description": z.string(),
        "options": z.array(z.object({
          "id": z.string(),
          "name": z.string(),
          "description": z.string(),
          "image": z.string(),
          "category": z.string().optional(),
          "secondImage": z.string().optional(),
          "models": z.string().optional(),
          "group": z.string().optional(),
          "finishable": z.boolean().optional(),
          "finishImages": z.record(z.string()).optional(),
          "surfaceFinish": z.string().optional(),
          "swatch": z.string().optional()
        }))
      }))
    })
  }
};
export type Schemas = typeof schemas;
