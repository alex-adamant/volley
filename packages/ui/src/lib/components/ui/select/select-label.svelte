<script lang="ts">
  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type LabelProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    children?: Snippet;
  };

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: LabelProps = $props();
</script>

<div
  bind:this={ref}
  data-slot="select-label"
  class={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
  {...restProps}
>
  {@render children?.()}
</div>
