export function normalizeOptionIds(formValues: FormDataEntryValue[]): string[] {
	const optionIds = formValues
		.filter((value): value is string => typeof value === 'string')
		.map((value) => value.trim())
		.filter((value) => value.length > 0);

	return Array.from(new Set(optionIds)).sort();
}
