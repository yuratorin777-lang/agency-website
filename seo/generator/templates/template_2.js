module.exports = function renderTemplate2(data, sharedBlocks) {
  const { title, heroSubtitle, problems, techStack } = data;

  return `
    <div class="max-w-6xl mx-auto px-6 py-12 space-y-20">
      <!-- HERO: Centered Header -->
      <section class="text-center max-w-3xl mx-auto pt-8">
        <div class="inline-block border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-4 py-1.5 rounded-full font-mono-code text-xs text-[#8b5cf6] uppercase tracking-widest mb-6">
          SAAS ARCHITECTURE
        </div>
        <h1 class="font-syne text-4xl sm:text-6xl font-extrabold uppercase tracking-tight text-white mb-6">${title}</h1>
        <p class="font-mono-code text-white/60 text-sm sm:text-base leading-relaxed mb-8">${heroSubtitle || ''}</p>
        <button onclick="openContactModal()" class="bg-white text-black hover:bg-white/90 font-syne font-bold px-8 py-4 rounded-xl text-xs uppercase tracking-widest transition-all">
          Начать проект &rarr;
        </button>
      </section>

      <!-- TWO COLUMN SPLIT LIST -->
      <section class="border-t border-b border-white/10 py-12">
        <h2 class="font-syne text-2xl font-bold uppercase text-white mb-8">// Проблемы и решения</h2>
        <div class="divide-y divide-white/10">
          ${(problems || []).map((p, idx) => `
            <div class="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div class="md:col-span-1 font-mono-code text-sm text-[#8b5cf6]">0${idx+1}</div>
              <div class="md:col-span-4 font-syne text-xl text-white font-bold">${p.title || p}</div>
              <div class="md:col-span-7 font-mono-code text-xs text-white/60">${p.desc || 'Разработка отказоустойчивых интерфейсов и серверной логики.'}</div>
            </div>
          `).join('')}
        </div>
      </section>

      ${sharedBlocks.portfolioSection}
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>${sharedBlocks.faqSection}</div>
        <div>${sharedBlocks.relatedServices}</div>
      </div>
    </div>
  `;
};