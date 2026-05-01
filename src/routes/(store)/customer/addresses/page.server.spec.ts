import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DrizzleQueryError } from 'drizzle-orm';

const selectMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const insertMock = vi.hoisted(() => vi.fn());
const deleteMock = vi.hoisted(() => vi.fn());
const messageMock = vi.hoisted(() => vi.fn());

vi.mock('$lib/server/db', () => ({
	db: {
		select: selectMock,
		update: updateMock,
		insert: insertMock,
		delete: deleteMock
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

	return new Request('http://localhost/customer/addresses', {
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

const makeUpsertEvent = (payload: Record<string, string>, userId: string | null) =>
	({
		request: buildFormRequest(payload),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<NonNullable<typeof actions.upsert>>[0];

const makeDeleteEvent = (payload: Record<string, string>, userId: string | null) =>
	({
		request: buildFormRequest(payload),
		locals: {
			safeGetSession: vi.fn(async () => ({
				user: userId ? { id: userId } : null
			}))
		}
	}) as unknown as Parameters<NonNullable<typeof actions.delete>>[0];

type ActionFailureResult = {
	status: number;
	data: {
		message?: string;
		form?: {
			valid: boolean;
		};
	};
};

const asActionFailureResult = (value: unknown) => value as ActionFailureResult;

describe('customer addresses page server', () => {
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
			location: '/sign-in?redirect=/customer/addresses'
		});

		expect(selectMock).not.toHaveBeenCalled();
	});

	it('returns addresses and form for authenticated user', async () => {
		selectMock.mockImplementationOnce(() => ({
			from: vi.fn(() => ({
				where: vi.fn(async () => [
					{
						id: 'f72c73e0-8c29-4d8b-93fd-b48afb9dfc1f',
						recipientName: 'Alfian Pratama',
						label: 'Rumah',
						isDefault: true,
						addressLine: 'Jl. Mawar 1',
						city: 'Bandung',
						postalCode: '40123',
						phone: '+6281212345678',
						createdAt: new Date('2026-01-01T00:00:00Z'),
						updatedAt: new Date('2026-01-02T00:00:00Z')
					}
				])
			}))
		}));

		const result = (await load(makeLoadEvent(USER_ID))) as {
			response: Array<{ city: string }>;
			form: { data: { addressLine?: string } };
		};

		expect(result.response).toHaveLength(1);
		expect(result.response[0]?.city).toBe('Bandung');
		expect(result.form).toBeTruthy();
	});

	it('rejects invalid upsert payload', async () => {
		const result = await actions.upsert(
			makeUpsertEvent(
				{
					recipientName: '',
					label: '',
					isDefault: 'false',
					addressLine: 'Jln',
					city: '',
					postalCode: '12',
					phone: 'abc'
				},
				USER_ID
			)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.form?.valid).toBe(false);
		expect(insertMock).not.toHaveBeenCalled();
		expect(updateMock).not.toHaveBeenCalled();
	});

	it('rejects unauthenticated upsert action', async () => {
		const result = await actions.upsert(
			makeUpsertEvent(
				{
					recipientName: 'Alfian Pratama',
					label: 'Rumah',
					isDefault: 'false',
					addressLine: 'Jl. Melati No 10',
					city: 'Jakarta',
					postalCode: '12345',
					phone: '+62 812-1234-5678'
				},
				null
			)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(401);
		expect(output.data.message).toContain('Silakan login terlebih dahulu');
		expect(insertMock).not.toHaveBeenCalled();
		expect(updateMock).not.toHaveBeenCalled();
	});

	it('creates address for authenticated user when id is absent', async () => {
		const valuesMock = vi.fn(async () => [{ id: 'new-id' }]);
		insertMock.mockImplementationOnce(() => ({
			values: valuesMock
		}));

		const result = (await actions.upsert(
			makeUpsertEvent(
				{
					recipientName: 'Alfian Pratama',
					label: 'Rumah',
					isDefault: 'false',
					addressLine: 'Jl. Melati No 10',
					city: 'Jakarta',
					postalCode: '12345',
					phone: '+62 812-1234-5678'
				},
				USER_ID
			)
		)) as {
			status: number;
			message: { type: string; text: string };
		};

		expect(insertMock).toHaveBeenCalledTimes(1);
		expect(valuesMock).toHaveBeenCalledWith(
			expect.objectContaining({
				profileId: USER_ID,
				recipientName: 'Alfian Pratama',
				label: 'Rumah',
				city: 'Jakarta'
			})
		);
		expect(result.message).toMatchObject({
			type: 'success',
			text: 'Alamat berhasil ditambahkan.'
		});
	});

	it('returns not found when update target is not owned by user', async () => {
		const setMock = vi.fn(() => ({
			where: vi.fn(() => ({
				returning: vi.fn(async () => [])
			}))
		}));

		updateMock.mockImplementationOnce(() => ({
			set: setMock
		}));

		const result = (await actions.upsert(
			makeUpsertEvent(
				{
					id: '7df01c0b-e1ab-4dcc-91d7-f2edaf2635d4',
					recipientName: 'Alfian Pratama',
					label: 'Kantor',
					isDefault: 'false',
					addressLine: 'Jl. Anyelir 77',
					city: 'Surabaya',
					postalCode: '60231',
					phone: '081212341234'
				},
				USER_ID
			)
		)) as {
			status: number;
			message: { type: string; text: string };
		};

		expect(result.status).toBe(404);
		expect(result.message.text).toContain('tidak ditemukan');
	});

	it('sets only one default address when creating with isDefault true', async () => {
		const resetWhereMock = vi.fn(() => ({
			returning: vi.fn(async () => [])
		}));
		const setResetMock = vi.fn(() => ({ where: resetWhereMock }));

		updateMock.mockImplementationOnce(() => ({ set: setResetMock }));

		const valuesMock = vi.fn(async () => [{ id: 'new-id' }]);
		insertMock.mockImplementationOnce(() => ({ values: valuesMock }));

		await actions.upsert(
			makeUpsertEvent(
				{
					recipientName: 'Alfian Pratama',
					label: 'Rumah',
					isDefault: 'true',
					addressLine: 'Jl. Melati No 10',
					city: 'Jakarta',
					postalCode: '12345',
					phone: '+62 812-1234-5678'
				},
				USER_ID
			)
		);

		expect(updateMock).toHaveBeenCalledTimes(1);
		expect(setResetMock).toHaveBeenCalledWith({ isDefault: false });
		expect(valuesMock).toHaveBeenCalledWith(
			expect.objectContaining({
				isDefault: true
			})
		);
	});

	it('rejects delete when id is missing', async () => {
		const result = await actions.delete(makeDeleteEvent({ id: '' }, USER_ID));
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('ID alamat wajib diisi');
		expect(deleteMock).not.toHaveBeenCalled();
	});

	it('rejects delete when id format is invalid', async () => {
		const result = await actions.delete(makeDeleteEvent({ id: 'invalid-id' }, USER_ID));
		const output = asActionFailureResult(result);

		expect(output.status).toBe(400);
		expect(output.data.message).toContain('ID alamat tidak valid');
		expect(deleteMock).not.toHaveBeenCalled();
	});

	it('rejects unauthenticated delete action', async () => {
		const result = await actions.delete(
			makeDeleteEvent({ id: '7df01c0b-e1ab-4dcc-91d7-f2edaf2635d4' }, null)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(401);
		expect(output.data.message).toContain('Silakan login terlebih dahulu');
		expect(deleteMock).not.toHaveBeenCalled();
	});

	it('deletes address owned by current user', async () => {
		const whereMock = vi.fn(() => ({
			returning: vi.fn(async () => [{ id: '7df01c0b-e1ab-4dcc-91d7-f2edaf2635d4' }])
		}));

		deleteMock.mockImplementationOnce(() => ({
			where: whereMock
		}));

		const result = (await actions.delete(
			makeDeleteEvent({ id: '7df01c0b-e1ab-4dcc-91d7-f2edaf2635d4' }, USER_ID)
		)) as {
			type: string;
			text: string;
		};

		expect(deleteMock).toHaveBeenCalledTimes(1);
		expect(result.type).toBe('success');
		expect(result.text).toBe('Alamat berhasil dihapus.');
	});

	it('returns not found when deleting address owned by another user', async () => {
		deleteMock.mockImplementationOnce(() => ({
			where: vi.fn(() => ({
				returning: vi.fn(async () => [])
			}))
		}));

		const result = await actions.delete(
			makeDeleteEvent({ id: '7df01c0b-e1ab-4dcc-91d7-f2edaf2635d4' }, USER_ID)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(404);
		expect(output.data.message).toContain('tidak ditemukan');
	});

	it('maps DrizzleQueryError when deleting address used by orders', async () => {
		deleteMock.mockImplementationOnce(() => ({
			where: vi.fn(() => ({
				returning: vi.fn(async () => {
					throw new DrizzleQueryError(
						'delete from addresses where id = $1',
						['addr-id'],
						new Error('fk')
					);
				})
			}))
		}));

		const result = await actions.delete(
			makeDeleteEvent({ id: '7df01c0b-e1ab-4dcc-91d7-f2edaf2635d4' }, USER_ID)
		);
		const output = asActionFailureResult(result);

		expect(output.status).toBe(500);
		expect(output.data.message).toContain('sedang digunakan pada pesanan');
	});
});
