import { getAssetIDByName } from "@vendetta/ui/assets";
import { Module, ModuleCategory } from "../stuff/Module";
import { before, instead } from "@vendetta/patcher";
import { ReactNative as RN, i18n } from "@vendetta/metro/common";
import { findInReactTree } from "@vendetta/utils";
import { findByProps } from "@vendetta/metro";

const { convertSurrogateToName } = findByProps("convertSurrogateToName");

export default new Module({
  id: "restore-emoji-info-reaction-picker",
  label: "Restore emoji info in reaction picker",
  sublabel:
    "Holding on an emoji in the reaction picker will show the emoji info (like it did in kotlin!)",
  category: ModuleCategory.Fixes,
  extra: {
    credits: ["492949202121261067"],
  },
  icon: getAssetIDByName("ic_add_reaction_v2"),
  handlers: {
    onStart() {
      const silly = new (findByProps("MessagesHandlers").MessagesHandlers)();

      this.patches.add(
        //@ts-ignore not in RN typings
        before("render", RN.Pressable.type, ([a]) => {
          const emoji = findInReactTree(a, (x) => x?.type?.name === "Emoji");
          if (!emoji) return;
          const surr = emoji.props.surrogates;

          if (
            a?.accessibilityLabel?.includes(
              i18n.Messages.ADD_REACTION_NAMED.format({ emojiName: "" })
            )
          ) {
            a.onLongPress = () => {
              instead(
                "isModalOrActionsheetObstructing",
                silly,
                () => false,
                true
              );
              silly.handleTapEmoji({
                nativeEvent: {
                  node: {
                    surrogate: surr,
                    content: convertSurrogateToName(surr),
                  },
                },
              });
            };
          }
        })
      );
    },
    onStop() {},
  },
});