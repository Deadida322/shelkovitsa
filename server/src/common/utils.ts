export const baseWhere = {
	is_deleted: false
};

export function filterDuplicateObjectById<T extends { id: number }>(arr: T[]) {
	return arr.filter(
		(value, index, self) => index === self.findIndex((t) => t.id === value.id)
	);
}
