import { createClient } from "@sanity/client";

import { sanityEnv } from "./env";

export const sanityClient = createClient({
  projectId: sanityEnv.projectId,
  dataset: sanityEnv.dataset,
  apiVersion: "2026-10-01",
  useCdn: false,
});