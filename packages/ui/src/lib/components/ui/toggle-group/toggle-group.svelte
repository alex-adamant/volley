<script lang="ts" module>
  import { getContext, setContext } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { toggleVariants } from "$lib/components/ui/toggle/index.js";

  type ToggleVariants = VariantProps<typeof toggleVariants>;

  interface ToggleGroupContext extends ToggleVariants {
    spacing?: number;
  }

  export function setToggleGroupCtx(props: ToggleGroupContext) {
    setContext("toggleGroup", props);
  }

  export function getToggleGroupCtx() {
    return getContext<Required<ToggleGroupContext>>("toggleGroup");
  }
</script>

<script lang="ts">
  import { ToggleGroup as ToggleGroupPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    size = "default",
    spacing = 0,
    variant = "default",
    ...restProps
  }: ToggleGroupPrimitive.RootProps &
    ToggleVariants & { spacing?: number } = $props();

  $effect(() => {
    setToggleGroupCtx({
      variant,
      size,
      spacing,
    });
  });
</script>

<ToggleGroupPrimitive.Root
  bind:ref
  data-slot="toggle-group"
  data-variant={variant}
  data-size={size}
  data-spacing={spacing}
  style={`--gap: ${spacing}`}
  class={cn(
    "group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-md data-[spacing=default]:data-[variant=outline]:shadow-xs",
    className,
  )}
  {...restProps}
/>
