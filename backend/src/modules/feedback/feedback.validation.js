import { z } from "zod";

export const listFeedbackSchema = z.object({
  query: z.object({
    filter: z.enum(["All", "Issues", "Hard + Low", "Normal"]).optional(),
  }),
});
