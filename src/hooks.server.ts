import { sequence } from '@sveltejs/kit/hooks';
import { handleAuth } from '$lib/server/hooks/auth';
import { handleRbac } from '$lib/server/hooks/rbac';

export const handle = sequence(handleAuth, handleRbac);
