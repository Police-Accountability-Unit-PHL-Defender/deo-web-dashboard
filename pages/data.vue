<template>
  <LayoutPageHeader>
    <template #header>
      About the data
    </template>
    <template #image>
      <img class="w-full h-full object-cover" src="~/assets/images/data.jpg" alt="A street in Philadelphia"/>
    </template>
    <template #quote>
      <Quote author="Professor Lance Hannon" source="http://www88.homepage.villanova.edu/lance.hannon/TestimonyBills210635and210636Draft.pdf" backgroundClass="bg-[#DBEEB9]" quoteMarkClass="fill-yellowgreen">
        <template #quoteText>
          <p>
            I look forward to the day that I will see Philadelphia featured not as an example where numerous statistical tests all point to racial bias in policing practices, but rather as a national leader in evidence-based justice reform.
          </p>
        </template>
      </Quote>
    </template>
  </LayoutPageHeader>
</template>

<style scoped lang="scss">
ol {
  @apply pl-6;

  & > li {
    list-style: decimal;
    list-style-position: outside;
  }
}
ul {
  list-style: disc;
  @apply m-0 pl-5;
  & > li {
    @apply my-4
  }
}
details {
  @apply -ml-6 pl-6 border-b border-neutral-600;
  & > summary {
    list-style: none;
    @apply relative cursor-pointer py-4 pr-8;

    &::marker, &::-webkit-details-marker {
      display: none;
    }

    &::after {
      content: "";
      background-image: url('~/assets/icons/chevron.svg');
      background-repeat: no-repeat;
      @apply absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8;
    }
  }
  &[open] {
    @apply pb-4;

    & > summary {
      @apply font-medium;

      &::after {
        @apply transform rotate-180;
      }
    }
  }

  p {
    @apply mb-4;
  }
}
a {
  @apply underline text-primary-600 hover:text-primary-800;
}
table.timeline {
  th {
    @apply font-medium w-[10em] align-top border border-neutral-400 p-2;
  }
  td {
    @apply border border-neutral-400 p-2;
  }
}
</style>