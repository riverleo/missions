<script lang="ts">
	import { type Events, type Props, buttonVariants } from "./index.js";
	import { cn } from "$lib/utils.js";

	type $$Props = Props;
	type $$Events = Events;

	let className: $$Props["class"] = undefined;
	export let variant: $$Props["variant"] = "default";
	export let size: $$Props["size"] = "default";
	export let builders: $$Props["builders"] = [];
	export { className as class };

	export let href: $$Props["href"] = undefined;
	export let type: $$Props["type"] = undefined;

	function applyBuilders(node: HTMLElement) {
		if (builders && builders.length > 0) {
			builders.forEach((builder) => {
				if (builder?.action) {
					builder.action(node, builder.attrs);
				}
			});
		}
	}
</script>

<svelte:element
	this={href ? "a" : "button"}
	type={href ? undefined : type}
	{href}
	class={cn(buttonVariants({ variant, size, className }))}
	{...$$restProps}
	use:applyBuilders
	on:click
	on:keydown
	on:change
	on:keyup
	on:keypress
	on:mouseenter
	on:mouseleave
>
	<slot />
</svelte:element>
