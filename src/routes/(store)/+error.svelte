<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<section class="relative isolate overflow-hidden">
	<div
		class="absolute inset-0 -z-10 bg-linear-to-b from-primary/10 via-background to-background"
	></div>
	<div
		class="absolute top-20 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
	></div>

	<div class="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-16 lg:px-8">
		<div class="w-full max-w-2xl rounded-2xl p-8 text-center sm:p-12">
			<p class="text-sm font-semibold tracking-[0.25em] text-primary">Error {page.status}</p>
			<h1 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{page.error?.message}</h1>
			<p class="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
				Coba refresh halaman atau kembali ke beranda
			</p>

			<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
				<a
					href={resolve('/')}
					class="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
				>
					Kembali ke Beranda
				</a>
				<a
					href={resolve('/categories')}
					class="inline-flex items-center justify-center rounded-md border px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
				>
					Lihat Kategori
				</a>
			</div>
		</div>
	</div>
</section>
