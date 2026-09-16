<script lang="ts">
	import { getContext } from 'svelte';

	let navTheme = getContext<{ current: 'light' | 'dark' }>('nav-theme');
</script>

<nav
	class="fixed top-0 z-[60] flex w-full items-center justify-between px-6 py-4 transition-colors duration-300"
	class:bg-white={navTheme.current === 'light'}
	class:bg-black={navTheme.current === 'dark'}
	class:text-black={navTheme.current === 'light'}
	class:text-white={navTheme.current === 'dark'}
>
	<a href="/" class="font-semibold tracking-tight">WAWE Films</a>
	<div class="flex gap-4 text-sm">
		<a href="/">Projects</a>
		<a href="/contact">Contact</a>
	</div>
</nav>
