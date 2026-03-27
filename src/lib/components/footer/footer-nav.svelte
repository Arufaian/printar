<script lang="ts">
	const sections = [
		{
			title: 'Products',
			links: [
				{ label: 'Business Cards', href: '/products/business-cards' },
				{ label: 'Flyers & Brochures', href: '/products/flyers' },
				{ label: 'Banners & Posters', href: '/products/banners' },
				{ label: 'Custom Merchandise', href: '/products/merchandise' }
			]
		},
		{
			title: 'Services',
			links: [
				{ label: 'Design Services', href: '/services/design' },
				{ label: 'Bulk Orders', href: '/services/bulk' },
				{ label: 'Rush Printing', href: '/services/rush' },
				{ label: 'Shipping Options', href: '/services/shipping' }
			]
		}
	];
</script>

{#each sections as section (section)}
	<nav aria-labelledby="{section.title.toLowerCase().replace(/\s+/g, '-')}-heading">
		<h3
			id="{section.title.toLowerCase().replace(/\s+/g, '-')}-heading"
			class="mb-4 font-semibold text-foreground"
		>
			{section.title}
		</h3>
		<ul class="space-y-3" role="list">
			{#each section.links as link (link)}
				<li>
					<a
						href={link.href}
						class="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden"
					>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/each}
