<script lang="ts">
  import { Switch as SwitchPrimitive } from "bits-ui";
  import { cn, type WithoutChild } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    checked = $bindable(false),
    class: className,
    children,
    ...restProps
  }: WithoutChild<SwitchPrimitive.RootProps> = $props();
</script>

<SwitchPrimitive.Root
  bind:ref
  bind:checked
  data-slot="switch"
  class={cn(
    "border-stroke focus-visible:border-ring focus-visible:ring-ring/50 data-[state=checked]:bg-ink inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border bg-white/80 shadow-inner transition-colors focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-white/80",
    className,
  )}
  {...restProps}
>
  {@render children?.({ checked })}
</SwitchPrimitive.Root>
