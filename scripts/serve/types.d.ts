export namespace WSS {
	export type IncomingMessage =
		| {
			op: "connect";
		}
		| {
			op: "ping";
		};

	export type OutgoingMessage =
		| {
			op: "connect";
			map: Record<string, string>;
		}
		| {
			op: "update";
			updates: Record<string, string>;
		}
		| {
			op: "ping";
		};
}
