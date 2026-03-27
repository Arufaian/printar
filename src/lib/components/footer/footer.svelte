<script lang="ts">
	import FooterBrand from './footer-brand.svelte';
	import FooterNav from './footer-nav.svelte';
	import FooterContact from './footer-contact.svelte';
	import FooterSocial from './footer-social.svelte';

	const currentYear = new Date().getFullYear();
</script>

<footer class="border-t bg-card text-card-foreground">
	<div class="container mx-auto gap-4 px-4 py-4 lg:max-w-11/12 lg:px-8 lg:py-16">
		<!-- Main footer content -->
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-12">
			<!-- Brand section - spans 3 columns on large screens -->
			<div class="lg:col-span-3">
				<FooterBrand />
			</div>

			<!-- Navigation sections - spans 6 columns on large screens -->
			<div class="grid grid-cols-2 gap-8 md:col-span-1 lg:col-span-6">
				<FooterNav />
			</div>

			<!-- Contact - spans 3 columns on large screens -->
			<div class="md:col-span-1 lg:col-span-3">
				<FooterContact />
			</div>
		</div>

		<!-- Divider -->
		<div class="my-8 border-t"></div>

		<!-- Bottom section -->
		<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
			<!-- Copyright -->
			<p class="text-center text-sm text-muted-foreground md:text-left">
				© {currentYear} PrintHub. All rights reserved.
			</p>

			<!-- Social links -->
			<FooterSocial />
		</div>
	</div>
</footer>
