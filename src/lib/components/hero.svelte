<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowRightIcon } from '@lucide/svelte/icons';
	import { fly } from 'svelte/transition';

	let {
		headline = 'Professional Digital Printing Services',
		description = 'Transform your ideas into stunning prints. From business cards to large format banners, we deliver exceptional quality with fast turnaround times.',
		ctaText = 'Browse category',
		ctaHref = '#categories',
		imageUrl = 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop',
		imageAlt = 'Digital printing products showcase',
		onCtaClick
	}: Props = $props();

	type Props = {
		headline?: string;
		description?: string;
		ctaText?: string;
		ctaHref?: string;
		imageUrl?: string;
		imageAlt?: string;
		onCtaClick?: () => void;
	};
</script>

<section>
	<div class="container mx-auto px-4 py-16 lg:px-8">
		<div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
			<!-- Left Content -->
			<div class="flex flex-col gap-6 lg:gap-8" in:fly={{ y: 20, duration: 600, delay: 100 }}>
				<div class="flex flex-col gap-4">
					<h1
						class="bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl xl:text-7xl"
					>
						{headline}
					</h1>
					<p class="max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:text-2xl">
						{description}
					</p>
				</div>

				<div class="flex flex-col gap-4 sm:flex-row">
					<Button
						size="lg"
						class="shadow-lg-lg shadow-lg-primary/20 hover:shadow-lg-xl hover:shadow-lg-primary/30 px-8 text-base transition-all duration-300 hover:scale-[1.02]"
						onclick={onCtaClick}
						href={ctaHref}
					>
						{ctaText}
						<ArrowRightIcon class="ml-2" />
					</Button>
				</div>
			</div>

			<!-- Right Image -->
			<div class="relative h-100 lg:h-150" in:fly={{ y: 20, duration: 600, delay: 300 }}>
				<div
					class="absolute inset-0 rounded-3xl bg-linear-to-br from-primary/20 to-accent/20 opacity-50 blur-3xl"
				></div>
				<div
					class="shadow-lg-2xl shadow-lg-primary/10 hover:shadow-lg-primary/20 relative h-full overflow-hidden rounded-3xl ring-1 ring-border/50 transition-all duration-500 hover:scale-[1.02]"
				>
					<img src={imageUrl} alt={imageAlt} class="h-full w-full object-cover" />
					<div class="absolute inset-0 bg-linear-to-t from-background/20 to-transparent"></div>
				</div>

				<!-- Floating Badge -->
				<div
					class="shadow-lg-xl absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card p-4 backdrop-blur-sm sm:block"
				>
					<div class="flex items-center gap-3">
						<div class="flex size-12 items-center justify-center rounded-full bg-primary/10">
							<svg
								class="size-6 text-primary"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								></path>
							</svg>
						</div>
						<div>
							<div class="text-sm font-semibold">Premium Quality</div>
							<div class="text-xs text-muted-foreground">Certified Printing</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Decorative Elements -->
	<div class="absolute top-0 right-0 -z-10 size-96 rounded-full bg-primary/5 blur-3xl"></div>
	<div class="absolute bottom-0 left-0 -z-10 size-96 rounded-full bg-accent/5 blur-3xl"></div>
</section>
