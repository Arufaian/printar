const DESIGN_FILE_PATH_PATTERN = /^customer-design\/[A-Za-z0-9/_\-.]+$/;

export const isCustomerDesignFilePath = (value: string) => DESIGN_FILE_PATH_PATTERN.test(value);

export const parseOptionalDesignFilePath = (value: FormDataEntryValue | null) => {
	const rawValue = String(value ?? '').trim();

	if (rawValue === '') {
		return {
			ok: true as const,
			value: undefined
		};
	}

	if (
		rawValue.length > 500 ||
		rawValue.startsWith('/') ||
		rawValue.includes('..') ||
		rawValue.includes('://') ||
		!isCustomerDesignFilePath(rawValue)
	) {
		return {
			ok: false as const,
			message: 'Path file desain tidak valid.'
		};
	}

	return {
		ok: true as const,
		value: rawValue
	};
};

export const parseRequiredDesignFilePath = (value: FormDataEntryValue | null) => {
	const parsed = parseOptionalDesignFilePath(value);

	if (!parsed.ok) {
		return parsed;
	}

	if (!parsed.value) {
		return {
			ok: false as const,
			message: 'Path file desain wajib diisi.'
		};
	}

	return parsed;
};
