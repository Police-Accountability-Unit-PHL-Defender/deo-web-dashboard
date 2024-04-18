<template>
  <div class="relative w-full">
    <div class="absolute z-0 w-full top-0 bottom-20 overflow-hidden">
      <slot name="image"></slot>
    </div>
    <h2 class="relative z-10 text-white text-heading-1 pt-12 md:pt-20 px-8 mx-auto text-center max-w-5xl">
      <slot name="header"></slot>
    </h2>
    <div class="mt-20">
      <slot name="quote"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// normal scroll links
function setupScrollLinks() {
  var scrollLinks = document.querySelectorAll('a.deo_scroll');
  scrollLinks.forEach(function(scrollLink) {
    scrollLink.addEventListener('click', function(event: Event) {
      event.preventDefault(); // prevent hyperlink default behavior
      const target = event.currentTarget as HTMLAnchorElement;
      if (!target) return
      const section = document.getElementById(target.getAttribute('href').substring(1));
      if (!section) return
      section.scrollIntoView({behavior: 'smooth'});
    })
  });
}
onMounted(() => {
  setupScrollLinks();
});
</script>