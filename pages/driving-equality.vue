<template>
  <div class="layout-container">
    <LayoutPageHeader>
      <template #header>
        How does Driving Equality impact public safety?
      </template>
      <template #image>
        <img class="w-full h-full object-cover" src="~/assets/images/driving-equality.jpg" alt="A street in Philadelphia"/>
      </template>
      <template #quote>
        <Quote author="Marcus Biddle, Reporter" source="https://phillydefenders.org" backgroundClass="bg-[#DBEEB9]" quoteMarkClass="fill-yellowgreen">
          <template #quoteText>
            <p>
              During that police stop, I asked a lot of questions to myself: Does this officer see me as a threat? Was I being targeted? Did I have a right to defend myself if I thought my life was in danger? It turned out I had been stopped for a broken tail light. I didn’t even get a ticket. A few minutes later, I was back on the road. It turned out that my tail light wasn’t really broken, though. And that nervous feeling stuck with me. That first police stop changed my entire perception of safety.
            </p>
          </template>
        </Quote>
      </template>
    </LayoutPageHeader>
  </div>
</template>