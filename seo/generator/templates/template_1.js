module.exports = function renderTemplate1(data, sharedBlocks) {
  const { title, heroSubtitle, problems, techStack, related } = data;
  
  return `
    <div class="max-w-7xl mx-auto px-6 py-12 space-y-16">
      <!-- HERO: Bento Header Header -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div class="lg:col-span-8 bg-gradient-to-br from-[#0b0f29] to-[#07091e] border border-white/10 p-8 sm:p-12 rounded-3xl flex flex-col justify-between">
          <span class="font-mono-code text-xs text-[#8b5cf6] tracking-[0.2em] uppercase">// BENTO ARCHITECTURE</span>
          <h1 class="font-syne text-4xl sm:text-6xl font-extrabold uppercase mt-4 mb-6 leading-tight text-white">${title}</h1>
          <p class="font-mono-code text-white/70 text-sm max-w-2xl">${heroSubtitle || ''}</p>
        </div>
        <div class="lg:col-span-4 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 p-8 rounded-3xl flex flex-col justify-between">
          <div class="font-mono-code text-xs text-[#8b5cf6] font-bold uppercase tracking-widest">[ ESTIMATE ]</div>
          <div class="font-syne text-3xl font-bold text-white my-4">Сроки: 3–14 дней</div>
          <button onclick="openContactModal()" class="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-syne py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
            Запросить расчет
          </button>
        </div>
      </section>

      <!-- BENTO GRID (2x2 + Cards) -->
      <section>
        <div class="font-mono-code text-xs text-[#8b5cf6] uppercase tracking-widest mb-6">// SYSTEM SOLUTIONS</div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${(problems || []).map((p, idx) => `
            <div class="${idx === 0 ? 'md:col-span-2 bg-[#0d102d]' : 'bg-[#07091e]'} border border-white/10 p-8 rounded-3xl hover:border-[#8b5cf6]/50 transition-all">
              <span class="font-mono-code text-xs text-[#8b5cf6]">0${idx + 1} //</span>
              <h3 class="font-syne text-2xl font-bold text-white mt-2 mb-4">${p.title || p}</h3>
              <p class="font-mono-code text-xs text-white/60 leading-relaxed">${p.desc || 'Оптимизированное решение для масштабирования бизнеса и снижения нагрузок.'}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- TECH STACK & FAQ -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-5 bg-[#07091e] border border-white/10 p-8 rounded-3xl">
          <h3 class="font-syne text-xl font-bold uppercase text-white mb-6">Стек технологий</h3>
          <div class="flex flex-wrap gap-2">
            ${(techStack || ['Next.js', 'Tailwind', 'Node.js', 'Three.js']).map(t => `
              <span class="bg-black/50 border border-white/10 px-3 py-1.5 rounded-lg font-mono-code text-xs text-white/80">${t}</span>
            `).join('')}
          </div>
        </div>
        <div class="lg:col-span-7">
          ${sharedBlocks.faqSection}
        </div>
      </div>

      ${sharedBlocks.portfolioSection}
      ${sharedBlocks.relatedServices}
    </div>
  `;
};