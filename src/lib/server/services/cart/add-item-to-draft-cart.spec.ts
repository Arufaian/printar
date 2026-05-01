import { describe, expect, it } from 'vitest';
import { hasSameCartItemConfiguration } from './add-item-to-draft-cart';

describe('hasSameCartItemConfiguration', () => {
	it('returns true when option set and file path are the same', () => {
		const result = hasSameCartItemConfiguration({
			existingOptionIds: ['b-option', 'a-option'],
			incomingOptionIds: ['a-option', 'b-option'],
			existingFilePath: 'customer-design/user-1/sample.pdf',
			incomingFilePath: 'customer-design/user-1/sample.pdf'
		});

		expect(result).toBe(true);
	});

	it('returns false when file path differs even if option set is the same', () => {
		const result = hasSameCartItemConfiguration({
			existingOptionIds: ['a-option', 'b-option'],
			incomingOptionIds: ['b-option', 'a-option'],
			existingFilePath: 'customer-design/user-1/design-a.pdf',
			incomingFilePath: 'customer-design/user-1/design-b.pdf'
		});

		expect(result).toBe(false);
	});

	it('returns false when option set differs even if file path is the same', () => {
		const result = hasSameCartItemConfiguration({
			existingOptionIds: ['a-option'],
			incomingOptionIds: ['b-option'],
			existingFilePath: 'customer-design/user-1/design.pdf',
			incomingFilePath: 'customer-design/user-1/design.pdf'
		});

		expect(result).toBe(false);
	});
});
