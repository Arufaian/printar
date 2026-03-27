<script lang="ts">
	import { MailIcon, PhoneIcon, MapPinIcon } from '@lucide/svelte/icons';

	const contact = {
		email: 'printer@gmail.com',
		phone: '+62 838-1770-1312',
		address:
			'789J+CQM, Area Sawah, Tlogoadi, Kec. Mlati, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55286'
	};
</script>

<div class="flex flex-col gap-4">
	<h3 class="mb-4 font-semibold text-foreground">Contact Us</h3>
	<ul class="space-y-3" role="list">
		<li class="flex items-start gap-3">
			<MailIcon class="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
			<a
				href="mailto:{contact.email}"
				class="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden"
			>
				{contact.email}
			</a>
		</li>
		<li class="flex items-start gap-3">
			<PhoneIcon class="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
			<a
				href="tel:{contact.phone.replace(/\s+/g, '')}"
				class="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden"
			>
				{contact.phone}
			</a>
		</li>
		<li class="flex items-start gap-3">
			<MapPinIcon class="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
			<address class="text-sm text-muted-foreground not-italic">{contact.address}</address>
		</li>
	</ul>
</div>
