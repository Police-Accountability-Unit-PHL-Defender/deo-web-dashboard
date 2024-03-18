<template>
  <div class="relative inline-block align-text-top">
    <div class="flex h-[1em] items-center justify-center">
      <button
        class="flex size-8 items-center justify-center border-primary-300 pt-[1px] text-primary-300 hover:border-primary-500 hover:text-primary-500"
        aria-label="info"
        @mouseenter="tooltipIsVisible = true"
        @mouseleave="tooltipIsVisible = false"
        >
        <TooltipIcon icon-classes="hover:text-primary-400 transition-colors"></TooltipIcon>
      </button>
    </div>
    <Transition name="fade">
      <div
        v-if="tooltipIsVisible"
        ref="tooltip"
        class="text-caption absolute bottom-6 left-0.5 flex w-[312px] gap-[6px] rounded-md bg-neutral-100 px-4 py-3 text-neutral-800 leading-5 tooltip"
        :style="tooltipAdjustment">
        <div>
          <slot />
          <div class="text-primary-600 font-medium mb-1">{{ props.term }}</div>
          <div class="font-normal">{{ definition }}</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from "vue"
import TooltipIcon from "../icons/TooltipIcon.vue"
const props = defineProps({
  term: { type: String, required: false },
})
const dictionary = {
  "Contraband": "Any item that police consider to be evidence of a crime, including drugs and some weapons.",
  "Contraband hit rate": "How often police find contraband when they intrude during traffic stops.",
  "Disparity": "A difference in outcomes or treatment, particularly one that is considered unfair.",
  "District": "Philadelphia Police District",
  "Division": "Philadelphia Police Division",
  "Frisk": "An open-handed pat down of the outer layer of a person’s clothing or a physical inspection of the passenger compartment and any unlocked containers within reach of a driver or passenger.",
  "Frisk rate": "How often police frisk drivers, passengers, or vehicles during traffic stops.",
  "High Injury Network": "The 12% of Philadelphia streets where 80% of all traffic deaths or serious injuries happen.",
  "Intrusion": "A frisk and/or search by police during traffic stops.",
  "Intrusion rate": "How often police frisk and/or search people or vehicles during traffic stops.",
  "PPD": "Philadelphia Police Department",
  "PSA": "Police Service Area: The smallest geographical subdivision of a police district to which police personnel are assigned.",
  "Search": "An examination by police of a person and/or their property or premises that a person would reasonably consider private with the intent of discovering evidence of the commission of a crime.",
  "Search rate": "How often police search people and/or vehicles during traffic stops.",
  "Traffic Stop": "When police pull over a vehicle for a known or suspected traffic violation.",
  "Year after": "April 1, 2022 - March 31, 2023"
}
const definition = computed(() => {
  if (!props.term) return
  return dictionary[props.term]
})

const tooltip = ref<HTMLInputElement | null>(null)
const tooltipIsVisible = ref(false)
const handleClickTooltipButton = (event: Event) => {
  tooltipIsVisible.value = !tooltipIsVisible.value
  event.stopPropagation() // prevents immediately triggering handleClickOutsideTooltip
  if (tooltipIsVisible.value) {
    document.addEventListener("click", handleClickOutsideTooltip)
  }
}
const handleClickOutsideTooltip = (event: Event) => {
  // closes tooltip when user clicks outside of tooltip
  if (tooltip.value && !tooltip.value.contains(event.target as Node)) {
    tooltipIsVisible.value = false
    document.removeEventListener("click", handleClickOutsideTooltip)
  }
}
const tooltipAdjustment = computed(() => {
  // the tooltip is left-aligned to the icon, so it could go off the right side of the screen. this ensures it doesn't
  if (!tooltipIsVisible.value || !tooltip.value) return
  const padding = 16 // number of pixels between the right edge of the screen and the right edge of the tooltip
  const excess = tooltip.value.getBoundingClientRect().right - window.innerWidth + 2 * padding
  if (excess > 0) return { transform: `translateX(-${excess}px)` }
  return {}
})
onBeforeUnmount(() => {
  // removes event listener in case tooltip is open but user navigates away and component is unmounted
  document.removeEventListener("click", handleClickOutsideTooltip)
})
</script>