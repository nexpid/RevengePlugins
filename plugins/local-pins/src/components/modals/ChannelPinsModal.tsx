import { ReactNative as RN, React } from "@vendetta/metro/common";
import { clearPins, getPins, vstorage } from "../..";
import { chPinsMessagesOverwrites, setChPinsHRCb } from "../../stuff/patcher";
import { SimpleText, openSheet } from "../../../../../stuff/types";
import FiltersActionSheet from "../sheets/FiltersActionSheet";
import { findByName, findByProps, findByStoreName } from "@vendetta/metro";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { General } from "@vendetta/ui/components";
import Big from "big.js";

const { View } = General;

const MessageStore = findByStoreName("MessageStore");
const ChannelPinsConnected = findByName("ChannelPinsConnected", false);
const messages = findByProps("fetchMessages", "sendMessage");

export default ({ channelId }: { channelId: string }) => {
  const [filters, setFilters] = React.useState<typeof vstorage.preferFilters>(
    vstorage.preferFilters ?? ["server", "local"]
  );
  const [localPinned, setLocalPinned] = React.useState<number | any[]>(0);

  setChPinsHRCb({
    filters: () =>
      openSheet(FiltersActionSheet, {
        defFilters: filters,
        set: setFilters,
      }),
    clear: () =>
      Array.isArray(localPinned) &&
      showConfirmationAlert({
        title: "Clear local pins",
        content: `Are you sure you want to clear **${localPinned.length}** pin${
          localPinned.length !== 1 ? "s" : ""
        } in this channel?`,
        confirmText: "Clear",
        confirmColor: "red" as ButtonColors,
        onConfirm: () => {
          clearPins(channelId);
          setLocalPinned([]);
        },
        isDismissable: true,
      }),
  });
  chPinsMessagesOverwrites[channelId] = (msgs) => [
    ...(filters.includes("local")
      ? Array.isArray(localPinned)
        ? localPinned
        : []
      : []),
    ...(filters.includes("server") ? msgs : []),
  ];

  React.useEffect(() => {
    (async () => {
      const parsed = [];

      const raw = getPins(channelId)?.slice().reverse() ?? [];
      for (let i = 0; i < raw.length; i++) {
        const m = raw[i];
        setLocalPinned(i / raw.length);

        let message = MessageStore.getMessage(channelId, m.id);
        if (!message) {
          const numb = new Big(m.id);
          const numbers = [numb.plus(1).toFixed(), numb.minus(1).toFixed()];

          console.log(
            await messages.fetchMessages({
              channelId,
              before: numbers[0],
              after: numbers[1],
              limit: 1,
            })
          );
          message = MessageStore.getMessage(channelId, m.id);
        }

        if (message) parsed.push(message);
      }

      setLocalPinned(parsed);
    })();
  }, []);

  return Array.isArray(localPinned) ? (
    <ChannelPinsConnected.default channelId={channelId} />
  ) : (
    <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
      <RN.ActivityIndicator size="large" style={{ marginBottom: 10 }} />
      <SimpleText variant="text-lg/semibold" color="TEXT_NORMAL" align="center">
        {Math.floor(localPinned * 100)}%
      </SimpleText>
    </View>
  );
};
