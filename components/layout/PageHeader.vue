<template>
  <h2 class="text-heading-1 my-20 mx-auto text-center max-w-4xl">
    <slot name="header"></slot>
  </h2>
  <div>
    <div class="w-full max-w-5xl aspect-[5/2] -mb-[15vw]">
      <slot name="image"></slot>
    </div>
    <div class="flex justify-end">
      <slot name="quote"></slot>
    </div>
  </div>
</template>