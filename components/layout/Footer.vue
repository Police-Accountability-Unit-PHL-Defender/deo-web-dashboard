<template>
  <div class="w-full bg-primary-200 py-20">
    <div class="layout-container">
      <div class="text-heading-1 text-primary-800 max-w-3xl">Do you need someone to talk about driving equality?</div>
      <Button class="mt-28">Contact us</Button>
    </div>
  </div>
  <div class="w-full bg-primary-800 pt-10">
    <div class="layout-container">
      <div class="grid md:grid-cols-3 gap-6">
        <div class="flex justify-start items-start">
          <a href="/">
            <img src="~/assets/images/defender-logo-white.png" alt="Defender Association of Philadelphia" class="w-[182px] mx-auto" />
          </a>
        </div>
        <ul class="flex flex-col gap-6">
          <li>
            <a href="#" class="text-cta-1 text-white">About Driving Equality</a>
          </li>
          <li>
            <a href="#" class="text-cta-1 text-white">About the Data</a>
          </li>
        </ul>
        <ul class="flex flex-col gap-6">
          <li>
            <a href="#" class="text-cta-1 text-white">Contact</a>
          </li>
          <li>
            <a href="#" class="text-cta-1 text-white">Instagram</a>
          </li>
          <li>
            <a href="#" class="text-cta-1 text-white">Facebook</a>
          </li>
          <li>
            <a href="#" class="text-cta-1 text-white">X (Twitter)</a>
          </li>
        </ul>
      </div>
      <div class="py-10 md:py-18 text-caption text-white">
        Copyright © 2023 Defender Association of Philadelphia. All rights reserved.
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from '@/components/ui/Button.vue'
</script>