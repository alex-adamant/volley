<script lang="ts">
  import { Switch as SwitchPrimitive } from "bits-ui";
  import { cn, type WithoutChild } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChild<SwitchPrimitive.ThumbProps> = $props();
</script>

<SwitchPrimitive.Thumb
  bind:ref
  data-slot="switch-thumb"
  class={cn(
    "pointer-events-none block h-4 w-4 translate-x-0 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4",
    className,
  )}
  {...restProps}
/>
