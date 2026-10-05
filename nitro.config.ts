import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  preset: "vercel",
  vercel: {
    config: {
      regions: ["iad1"],
    },
  },
});
