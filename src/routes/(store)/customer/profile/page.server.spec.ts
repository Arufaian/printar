import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const messageMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		update: updateMock
	}
}));

vi.mock('sveltekit-superforms', async () => {
	const actual =
		await vi.importActual<typeof import('sveltekit-superforms')>('sveltekit-superforms');

	return {
		...actual,
		message: messageMock
	};
});

import { actions, load } from './+page.server';

const USER_ID = 'b7f5c31c-6c16-4f91-bcab-35b67cc8cb9b';

const buildFormRequest = (payload: Record<string, string>) => {
	const formData = new URLSearchParams();

	for (const [key, value] of Object.entries(payload)) {
		formData.append(key, value);
	}

	return new Request('http://localhost/customer/profile', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: formData.toString()
	});
};

const makeLoadEvent = (userId: string | null) =>
	({
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<typeof load>[0];

const makeActionEvent = (payload: Record<string, string>, userId: string | null) =>
	({
		request: buildFormRequest(payload),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<NonNullable<typeof actions.default>>[0];

type ActionFailureResult = {
	status: number;
	data: {
		message?: string;
		form?: {
			valid: boolean;
			errors: Record<string, string[]>;
		};
	};
};

const asActionFailureResult = (value: unknown) => value as ActionFailureResult;

describe('customer profile page server', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		messageMock.mockImplementation((form, message, options) => ({
			status: options?.status ?? 200,
			form,
			message
		}));
	});

	it('redirects unauthenticated users on load', async () => {
		await expect(load(makeLoadEvent(null))).rejects.toMatchObject({
			status: 303,
			location: '/sign-in?redirect=/customer/profile'
		});

		expect(selectMock).not.toHaveBeenCalled();
	});

	it('returns form initialized with profile name from DB', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					limit: vi.fn(async () => [{ name: 'Nuraini' }])
				}))
			}))
		}));

		const result = (await load(makeLoadEvent(USER_ID))) as {
			form: {
				data: { name: string };
			};
		};

		expect(result.form.data.name).toBe('Nuraini');
	});

	it('rejects unauthenticated update action', async () => {
		const result = await actions.default(makeActionEvent({ name: 'Nuraini' }, null));
		const output = asActionFailureResult(result);

		expect(output.status).toBe(401);
		expect(output.data.message).toContain('Silakan login terlebih dahulu');
		expect(updateMock).not.toHaveBeenCalled();
	});

	it('rejects invalid name with numbers and symbols', async () => {
		const result = await actions.default(makeActionEvent({ name: 'N4m@123' }, USER_ID));
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.form?.valid).toBe(false);
		expect(updateMock).not.toHaveBeenCalled();
	});

	it('updates profile name for valid input including apostrophe and hyphen', async () => {
		const setMock = vi.fn(() => ({
			where: vi.fn(() => ({
				returning: vi.fn(async () => [{ id: USER_ID }])
			}))
		}));

		updateMock.mockImplementationOnce(() => ({
			set: setMock
		}));

		const result = (await actions.default(
			makeActionEvent({ name: " Nur'aini-Maria " }, USER_ID)
		)) as {
			status: number;
			message: { type: string; text: string };
		};

		expect(updateMock).toHaveBeenCalledTimes(1);
		expect(setMock).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Nur'aini-Maria"
			})
		);
		expect(result.status).toBe(200);
		expect(result.message).toMatchObject({
			type: 'success',
			text: 'Nama berhasil diperbarui.'
		});
	});
});
