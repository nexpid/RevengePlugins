import { React } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";

import { ActionSheet } from "$/components/ActionSheet";

import type { vstorage } from "../..";

const { FormCheckboxRow } = Forms;

export default function({
	defFilters,
	set,
}: {
	defFilters: typeof vstorage.preferFilters;
	set: (x: typeof vstorage.preferFilters) => void;
}) {
	const [filters, setFilters] = React.useState(defFilters);
	set(filters);

	return (
		<ActionSheet title="Filters">
			<FormCheckboxRow
				label="Server pinned"
				onPress={() => {
					setFilters(
						filters.includes("server")
							? filters.filter(x => x !== "server")
							: filters.concat("server"),
					);
				}}
				selected={filters.includes("server")}
			/>
			<FormCheckboxRow
				label="Locally pinned"
				onPress={() => {
					setFilters(
						filters.includes("local")
							? filters.filter(x => x !== "local")
							: filters.concat("local"),
					);
				}}
				selected={filters.includes("local")}
			/>
		</ActionSheet>
	);
}
