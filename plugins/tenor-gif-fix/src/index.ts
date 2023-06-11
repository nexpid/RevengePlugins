import { before } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";

const MediaManager = findByProps("downloadMediaAsset"); // thank you rosie for this snippet
const ActionSheet = findByProps("openLazy", "hideActionSheet");

const parseURL = (url: string): string | undefined => {
  const path = url.split("/");
  const tenorIndex = path.findIndex((x) => x.endsWith(".tenor.com"));
  if (tenorIndex === -1) return;

  const [host, id, file] = path.slice(tenorIndex, tenorIndex + 3);
  if (!host || !id || !file) return;

  return `https://${host}/${id.slice(0, -2)}AC/${file.split(".")[0]}.gif`;
};

let patches = [];

export default {
  onLoad: () => {
    // keep this here just in case
    patches.push(
      before("downloadMediaAsset", MediaManager, (args) => {
        const url = args[0];
        if (!url || typeof url !== "string") return;

        const parsed = parseURL(url);
        if (parsed) {
          args[0] = parsed;
          args[1] = 1;
        }
      })
    );

    patches.push(
      before("openLazy", ActionSheet, (ctx) => {
        const [_, action, args] = ctx;

        if (action !== "MediaShareActionSheet") return;

        const data = args?.syncer?.sources?.[0];
        if (!data || typeof data.uri !== "string") return;

        const parsed = parseURL(data.uri);
        if (parsed) {
          data.uri = parsed;
          data.sourceURI = parsed;
          delete data.videoURI;
          delete data.isGIFV;
        }

        args.syncer.sources[0] = data;
      })
    );
  },
  onUnload: () => {
    for (const x of patches) x();
    patches = [];
  },
};
