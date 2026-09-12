module.exports = function renderTemplate3(data, sharedBlocks) {
  const { title, heroSubtitle, problems } = data;

  return `
    <div class="max-w-7xl mx-auto px-6 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <!-- Sticky Sidebar Header -->
        <aside class="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-6">
          <span class="font-mono-code text-xs text-[#8b5cf6] uppercase tracking-widest">// STUDIO LAYOUT</span>
          <h1 class="font-syne text-3xl sm:text-5xl font-extrabold uppercase text-white leading-tight">${title}</h1>
          <p class="font-mono-code text-xs text-white/60 leading-relaxed">${heroSubtitle || ''}</p>
          <div class="pt-4">
            <button onclick="openContactModal()" class="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-syne py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
              Связаться с студией
            </button>
          </div>
        </aside>

        <!-- Main Content Stream -->
        <main class="lg:col-span-8 space-y-16">
          <section class="bg-[#07091e] border border-white/10 p-8 rounded-3xl space-y-6">
            <h2 class="font-syne text-2xl font-bold text-white uppercase">// Решаемые задачи</h2>
            <div class="space-y-6">
              ${(problems || []).map((p) => `
                <div class="border-b border-white/5 pb-6">
                  <h3 class="font-syne text-xl text-[#8b5cf6] font-bold mb-2">${p.title || p}</h3>
                  <p class="font-mono-code text-xs text-white/70">${p.desc || 'Подробное описание архитектурного решения под ключ.'}</p>
                </div>
              `).join('')}
            </div>
          </section>

          ${sharedBlocks.portfolioSection}
          ${sharedBlocks.faqSection}
          ${sharedBlocks.relatedServices}
        </main>
      </div>
    </div>
  `;
};