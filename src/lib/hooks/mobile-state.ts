import { MediaQuery } from 'svelte/reactivity';
import { setContext, getContext } from 'svelte';

/** App mobile state management */
class MobileState {
	isMobile = $derived(new MediaQuery('max-width: 700px').current);

	// Set default data
	constructor(props: { [key: string]: any }) {
		// Merge props into this instance
		Object.assign(this, props);
	}
}

/** Hook props (isMobile can be overridden when setting hook) */
export type MobileStateProps = Pick<InstanceType<typeof MobileState>, 'isMobile'>;

/** Set app state */
export const setMobileState = (props: MobileStateProps) =>
	setContext('mobileState', new MobileState(props));

/** Use app state */
export const useMobileState = () => getContext<ReturnType<typeof setMobileState>>('mobileState');
