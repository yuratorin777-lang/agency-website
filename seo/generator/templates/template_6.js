module.exports = function renderTemplate6(data, sharedBlocks) {
  const { title, heroSubtitle } = data;

  return `
    <div class="max-w-7xl mx-auto px-6 py-12 space-y-20">
      <section class="text-center max-w-4xl mx-auto">
        <span class="font-mono-code text-xs text-[#8b5cf6] uppercase tracking-widest">// PROCESS WORKFLOW</span>
        <h1 class="font-syne text-4xl sm:text-6xl font-extrabold uppercase text-white mt-3 mb-6">${title}</h1>
        <p class="font-mono-code text-xs sm:text-sm text-white/60">${heroSubtitle || ''}</p>
      </section>

      <!-- TIMELINE STEPS -->
      <section class="relative border-l border-[#8b5cf6]/30 ml-4 md:ml-32 space-y-12 pl-6 md:pl-10">
        <div class="relative">
          <div class="absolute -left-[31px] md:-left-[47px] top-0 w-4 h-4 rounded-full bg-[#8b5cf6] ring-4 ring-[#050714]"></div>
          <div class="font-mono-code text-xs text-[#8b5cf6] mb-1">ЭТАП 01 // АНАЛИТИКА</div>
          <h3 class="font-syne text-2xl font-bold text-white uppercase">Аудит и сбор требований</h3>
          <p class="font-mono-code text-xs text-white/60 mt-2 max-w-xl">Изучаем вашу нишу, проектируем информационную архитектуру и разрабатываем ТЗ.</p>
        </div>

        <div class="relative">
          <div class="absolute -left-[31px] md:-left-[47px] top-0 w-4 h-4 rounded-full bg-[#8b5cf6] ring-4 ring-[#050714]"></div>
          <div class="font-mono-code text-xs text-[#8b5cf6] mb-1">ЭТАП 02 // ПРОЕКТИРОВАНИЕ</div>
          <h3 class="font-syne text-2xl font-bold text-white uppercase">UI/UX Дизайн & Прототипирование</h3>
          <p class="font-mono-code text-xs text-white/60 mt-2 max-w-xl">Создаем уникальную визуальную концепцию, готовим анимации и интерактивные сценарии.</p>
        </div>

        <div class="relative">
          <div class="absolute -left-[31px] md:-left-[47px] top-0 w-4 h-4 rounded-full bg-[#8b5cf6] ring-4 ring-[#050714]"></div>
          <div class="font-mono-code text-xs text-[#8b5cf6] mb-1">ЭТАП 03 // РАЗРАБОТКА</div>
          <h3 class="font-syne text-2xl font-bold text-white uppercase">Frontend & Backend разработка</h3>
          <p class="font-mono-code text-xs text-white/60 mt-2 max-w-xl">Пишем чистый код, интегрируем CMS/API и оптимизируем скорость загрузки.</p>
        </div>
      </section>

      ${sharedBlocks.portfolioSection}
      ${sharedBlocks.faqSection}
      ${sharedBlocks.relatedServices}
    </div>
  `;
};