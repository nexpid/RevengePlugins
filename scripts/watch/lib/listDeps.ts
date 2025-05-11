import { listImports } from "../../common/parser/getImports.ts";

export const dependencyMap = new Map<string, Set<string>>();

export default async function refreshDeps(file: string) {
	const imports = await listImports(file, true);

	for (const imp of imports.values()) {
		if (!dependencyMap.has(imp)) dependencyMap.set(imp, new Set());
		dependencyMap.get(imp)!.add(file);
	}
}
