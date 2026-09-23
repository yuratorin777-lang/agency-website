const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '../..');
const PAGES_DIR = path.join(__dirname, '../data/pages');
const MODULES_DIR = path.join(__dirname, 'modules');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');
const BASE_URL = 'https://cdn.bosagence.ru';

// ХЕЛПЕР: Форматирование заголовков (превращение slugs/сырых ключей в читаемый текст)
function formatTitle(rawString, fallback = '') {
  let text = rawString || fallback;
  if (!text) return '';
  
  // Если строка похожа на slug (содержит дефисы/подчеркивания и нет пробелов)
  if (/^[a-z0-9-_]+$/i.test(text.trim())) {
    text = text.replace(/[-_]+/g, ' ').trim();
  }
  
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// 1. ПОДГОТОВКА ЦЕЛЕВЫХ ДИРЕКТОРИЙ
const DIRS = {
  service: path.join(ROOT_DIR, 'services'),
  blog: path.join(ROOT_DIR, 'blog'),
  case: path.join(ROOT_DIR, 'cases'),
  tool: path.join(ROOT_DIR, 'tools')
};

Object.values(DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 2. ЗАГРУЗКА БАЗОВЫХ ШАБЛОНОВ И МОДУЛЕЙ
const baseTemplate = fs.existsSync(path.join(__dirname, 'template_base.html')) 
  ? fs.readFileSync(path.join(__dirname, 'template_base.html'), 'utf-8') : '';
let headModule = fs.existsSync(path.join(MODULES_DIR, 'head.html')) 
  ? fs.readFileSync(path.join(MODULES_DIR, 'head.html'), 'utf-8') : '';

const headerMatch = baseTemplate.match(/<header[\s\S]*?<\/header>/i);
const footerMatch = baseTemplate.match(/<footer[\s\S]*?<\/footer>/i);
const modalMatch = baseTemplate.match(/<div id="contact-modal"[\s\S]*?<\/form>\s*<\/div>\s*<\/div>\s*<\/div>/i);

// Исправление заглавной "В." в логотипе шапки (если есть сокращение)
let headerModule = headerMatch ? headerMatch[0] : '';
headerModule = headerModule.replace(/>B\.</g, '>BOS.AGENCE<');

const footerModule = footerMatch ? footerMatch[0] : '';
const modalModule = modalMatch ? modalMatch[0] : '';

function getTemplateHtml(type) {
  const customPath = path.join(__dirname, `template_${type}.html`);
  if (type && type !== 'service' && fs.existsSync(customPath)) {
    return fs.readFileSync(customPath, 'utf-8');
  }
  return baseTemplate;
}

// 3. ИЗВЛЕЧЕНИЕ ПОРТФОЛИО ИЗ INDEX.HTML
let portfolioSectionHtml = '';
if (fs.existsSync(INDEX_PATH)) {
  const indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');
  const match = indexHtml.match(/<section[^>]*id=["'](?:cases|portfolio)["'][^>]*>([\s\S]*?)<\/section>/i);
  if (match) {
    portfolioSectionHtml = match[0]
      .replace(/src=["']\.\/assets\//g, 'src="../assets/')
      .replace(/src=["']assets\//g, 'src="../assets/')
      .replace(/href=["']\.\/assets\//g, 'href="../assets/')
      .replace(/href=["']assets\//g, 'href="../assets/')
      .replace(/data-case=/g, 'data-disabled-case=')
      .replace(/href=["']#["']/g, 'href="../index.html#cases"');
  }
}

if (!fs.existsSync(PAGES_DIR)) {
  console.error(`❌ Папка ${PAGES_DIR} не найдена!`);
  process.exit(1);
}

const pageFiles = fs.readdirSync(PAGES_DIR).filter(file => file.endsWith('.json'));

const pagesRegistry = pageFiles.map(file => {
  let data = null;
  try {
    data = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, file), 'utf-8'));
  } catch (e) {
    console.warn(`⚠️ Пропущен битый JSON файл: ${file}`);
    return null;
  }

  if (!data || typeof data !== 'object') {
    console.warn(`⚠️ Пустые данные в файле: ${file}`);
    return null;
  }

  const templateType = data.template_type || data.type || 'service';
  let rawSlug = data.slug || file.replace('.json', '');
  rawSlug = rawSlug.replace(/^(blog|services|cases|tools)\//, '').replace(/\.html$/, '');
  
  const folderName = templateType === 'service' ? 'services' : templateType === 'case' ? 'cases' : templateType === 'blog' ? 'blog' : 'tools';
  const title = formatTitle(data.seo?.h1 || data.hero?.title || data.seo?.title, rawSlug);

  return {
    file,
    data,
    type: templateType,
    slug: rawSlug,
    url: `/${folderName}/${rawSlug}.html`,
    title,
    desc: data.seo?.description || data.description || 'Индивидуальная разработка и автоматизация бизнес-процессов.'
  };
}).filter(Boolean);

let sitemapUrls = [`  <url>\n    <loc>${BASE_URL}/</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <priority>1.0</priority>\n  </url>`];

console.log(`🚀 Сборка ${pagesRegistry.length} HTML-страниц...`);

pagesRegistry.forEach((pageItem) => {
  const { file, data: pageData, type: templateType, slug: cleanName, url: pageUrlPath } = pageItem;
  let currentTemplateHtml = getTemplateHtml(templateType);

  const pageSlug = `${cleanName}.html`;
  const targetDir = DIRS[templateType] || DIRS.service;
  const folderName = templateType === 'service' ? 'services' : templateType === 'case' ? 'cases' : templateType === 'blog' ? 'blog' : 'tools';
  const pageUrl = `${BASE_URL}/${folderName}/${pageSlug}`;

  const seo = pageData.seo || {};
  const hero = pageData.hero || {};
  
  const pageTitle = formatTitle(seo.title || hero.title, cleanName);
  const pageH1 = formatTitle(seo.h1 || hero.title, cleanName);

  let schemaScript = '';

  // 4. ПОДСТАНОВКА ДАННЫХ ПО ТИПАМ ШАБЛОНОВ
  if (templateType === 'blog') {
    const tocLinks = (pageData.toc || []).map(item => 
      `<a href="#${item.id}" class="block hover:text-neutral-900 transition-colors py-1 break-words">${item.title}</a>`
    ).join('');

    const relatedPosts = pagesRegistry
      .filter(p => p && (p.template_type === 'blog' || p.type === 'blog') && p.file !== file)
      .slice(0, 3)
      .map(rel => `
        <a href="${rel.url}" class="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl hover:border-neutral-400 transition-all block group min-h-[140px] flex flex-col justify-between break-words">
          <div>
            <div class="font-mono text-xs text-neutral-400 uppercase mb-2">// ${rel.data.category || 'СТАТЬЯ'}</div>
            <div class="text-sm font-semibold text-neutral-900 group-hover:text-neutral-600 transition-colors leading-snug">${rel.title} &rarr;</div>
          </div>
        </a>`
      ).join('');

    currentTemplateHtml = currentTemplateHtml
      .replace(/{{ARTICLE_CATEGORY}}/g, pageData.category || 'БЛОГ')
      .replace(/{{ARTICLE_TITLE}}/g, pageH1)
      .replace(/{{AUTHOR_AVATAR}}/g, pageData.author?.avatar || '../assets/images/author-default.png')
      .replace(/{{AUTHOR_NAME}}/g, pageData.author?.name || 'BOS.AGENCE')
      .replace(/{{AUTHOR_ROLE}}/g, pageData.author?.role || 'Digital & AI Team')
      .replace(/{{PUBLISH_DATE}}/g, pageData.publish_date || '')
      .replace(/{{READ_TIME}}/g, String(pageData.read_time || '5').replace(/\s*мин.*/i, ''))
      .replace(/{{TOC_LINKS}}/g, tocLinks)
      .replace(/{{ARTICLE_BODY}}/g, pageData.body || pageData.content || '')
      .replace(/{{RELATED_POSTS}}/g, relatedPosts);

  } else if (templateType === 'case') {
    const stackTags = (pageData.stack || []).map(tag => 
      `<span class="px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-800 break-words">${tag}</span>`
    ).join('');

    const metricsBlocks = (pageData.metrics || []).map(m => `
      <div class="text-center p-2 break-words">
        <div class="text-2xl sm:text-4xl font-light text-neutral-900 mb-1">${m.value}</div>
        <div class="font-mono text-xs text-neutral-400 uppercase">${m.label}</div>
      </div>
    `).join('');

    // Вытягиваем сжатые выжимки для верхнего карточного блока
    const problemShort = pageData.problem_short || (typeof pageData.problem === 'string' ? pageData.problem : '');
    const solutionShort = pageData.solution_short || (typeof pageData.solution === 'string' ? pageData.solution : '');

    // Используем готовое сверстанное тело из pageData.body (без дублирования через fallback)
    const caseBodyContent = pageData.body || pageData.content || '';

    currentTemplateHtml = currentTemplateHtml
      .replace(/{{CLIENT_NAME}}/g, pageData.client_name || pageData.client || 'BOS.AGENCE')
      .replace(/{{CASE_TITLE}}/g, pageH1)
      .replace(/{{CASE_METRICS}}/g, metricsBlocks)
      .replace(/{{CASE_PROBLEM}}/g, problemShort)
      .replace(/{{CASE_SOLUTION}}/g, solutionShort)
      .replace(/{{CASE_STACK}}/g, stackTags)
      .replace(/{{CASE_BODY}}/g, caseBodyContent);

  } else if (templateType === 'tool') {
    const checklistItems = (pageData.checklist || []).map((item, idx) => `
      <div class="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-start gap-4 break-words">
        <span class="font-mono text-neutral-400 font-semibold text-sm">0${idx + 1}.</span>
        <div class="flex-1">
          <h3 class="text-base font-semibold text-neutral-900 mb-1">${item.title}</h3>
          <p class="font-mono text-xs text-neutral-600 leading-relaxed break-words">${item.desc}</p>
        </div>
      </div>
    `).join('');

    currentTemplateHtml = currentTemplateHtml
      .replace(/{{TOOL_TITLE}}/g, pageH1)
      .replace(/{{TOOL_DESCRIPTION}}/g, pageData.description || seo.description || '')
      .replace(/{{RESOURCE_DOWNLOAD_LINK}}/g, pageData.download_link || '#')
      .replace(/{{CHECKLIST_ITEMS}}/g, checklistItems);

  } else {
    // ЛОГИКА ДЛЯ УСЛУГ (SERVICE)
    const valueProps = pageData.value_props || pageData.features || [];
    const techStack = pageData.technical_stack || [];
    const businessProblems = pageData.business_problems || pageData.problem_solution || [];
    const rawFaq = pageData.faq || [];
    const faq = rawFaq.map(f => ({ question: f.question || f.q || '', answer: f.answer || f.a || '' }));
    const templateId = String(pageData.template_id || 'template_1');

    const renderTechStack = () => techStack.length ? `
      <div class="my-6"><div class="font-mono-code text-xs text-[#8b5cf6] tracking-widest uppercase mb-3">// СТЕК</div>
      <div class="flex flex-wrap gap-2">${techStack.map(t => `<span class="px-3 py-1.5 bg-[#07091e] border border-white/10 rounded-lg text-xs font-mono-code text-white/80 break-words">${t}</span>`).join('')}</div></div>` : '';

    const renderValueProps = () => valueProps.length ? `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">${valueProps.map(v => `
        <div class="p-6 bg-[#07091e]/80 border border-white/10 rounded-xl min-h-[160px] flex flex-col justify-between break-words">
          <div>
            <h3 class="font-syne font-bold text-lg text-white mb-2">${v.title || ''}</h3>
            <p class="text-white/70 text-xs font-light leading-relaxed break-words">${v.desc || v.description || ''}</p>
          </div>
        </div>`).join('')}</div>` : '';

    const renderProblems = () => businessProblems.length ? `
      <div class="my-8"><h2 class="font-syne text-xl font-bold uppercase mb-6 text-white">// ЗАДАЧИ И РЕШЕНИЯ</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${businessProblems.map(p => `
        <div class="p-5 bg-black/50 border border-white/10 rounded-xl break-words">
          <div class="text-red-400 text-xs font-semibold mb-2">✕ ${p.problem}</div>
          <div class="text-emerald-400 text-xs font-semibold">✓ ${p.solution}</div>
        </div>`).join('')}</div></div>` : '';

    const renderFAQ = () => faq.length ? `
      <section class="my-12"><h2 class="font-syne text-2xl font-bold uppercase mb-6 text-white">// ВОПРОСЫ И ОТВЕТЫ</h2>
      <div class="space-y-4">${faq.map(f => `
        <details class="p-5 bg-[#07091e]/60 border border-white/10 rounded-xl group break-words">
          <summary class="font-syne font-bold text-base text-white cursor-pointer flex justify-between items-center list-none gap-4">
            <span class="break-words">${f.question}</span><span class="text-[#8b5cf6] group-open:rotate-180 transition-transform flex-shrink-0">+</span>
          </summary><p class="font-mono-code text-xs text-white/70 mt-4 leading-relaxed break-words">${f.answer}</p>
        </details>`).join('')}</div></section>` : '';

    const relatedLinks = pagesRegistry
      .filter(p => p.type === 'service' && p.file !== file)
      .slice(0, 4)
      .map(rel => `
        <a href="${rel.url}" class="p-4 border border-white/10 rounded-xl hover:border-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all block group min-h-[140px] flex flex-col justify-between break-words">
          <div class="font-mono-code text-[10px] text-[#8b5cf6] uppercase mb-1">// НАПРАВЛЕНИЕ</div>
          <div class="font-syne text-xs font-bold text-white group-hover:text-[#8b5cf6] transition-colors uppercase leading-snug break-words">${rel.title} &rarr;</div>
        </a>`
      ).join('');

    const renderRelated = () => relatedLinks ? `<section class="my-12"><h2 class="font-syne text-lg font-bold uppercase mb-4 text-white/80">// ДРУГИЕ УСЛУГИ</h2><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">${relatedLinks}</div></section>` : '';

    let textContentHtml = '';
    if (pageData.text_content) {
      if (pageData.text_content.intro) {
        textContentHtml += `<p class="text-lg text-white/80 font-light leading-relaxed mb-8 break-words">${pageData.text_content.intro}</p>`;
      }
      if (Array.isArray(pageData.text_content.sections)) {
        textContentHtml += pageData.text_content.sections.map(sec => `
          <div class="mb-8 break-words">
            <h2 class="font-syne text-2xl font-bold uppercase text-white mb-4">${formatTitle(sec.h2)}</h2>
            <p class="text-white/70 font-light leading-relaxed break-words">${sec.body}</p>
          </div>
        `).join('');
      }
    }

    let layoutContent = '';

    switch (templateId) {
      case 'template_2':
        layoutContent = `
          <div class="max-w-6xl mx-auto px-6 py-12 space-y-12">
            <section class="text-center max-w-3xl mx-auto pt-6 break-words">
              <span class="font-mono-code text-xs text-[#8b5cf6] tracking-widest uppercase mb-4 block">// ${hero.badge || 'SAAS SYSTEM'}</span>
              <h1 class="font-syne text-4xl sm:text-6xl font-bold uppercase tracking-tight mb-6 text-white leading-tight break-words">${pageH1}</h1>
              <p class="text-base text-white/70 font-light mb-8 break-words">${hero.subtitle || seo.description || ''}</p>
              <button onclick="openContactModal()" class="bg-white text-black hover:bg-white/90 font-syne font-bold px-8 py-4 rounded-xl text-xs uppercase tracking-widest">Обсудить проект &rarr;</button>
            </section>
            ${textContentHtml} ${renderProblems()} ${renderValueProps()} ${portfolioSectionHtml} ${renderFAQ()} ${renderRelated()}
          </div>`;
        break;

      case 'template_1':
      default:
        layoutContent = `
          <div class="max-w-7xl mx-auto px-6 py-12 space-y-12">
            <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div class="lg:col-span-8 bg-gradient-to-br from-[#0b0f29] to-[#07091e] border border-white/10 p-8 rounded-3xl break-words">
                <span class="font-mono-code text-xs text-[#8b5cf6] tracking-widest uppercase">// BENTO SYSTEM</span>
                <h1 class="font-syne text-4xl sm:text-6xl font-extrabold uppercase text-white mt-4 mb-4 leading-tight break-words">${pageH1}</h1>
                <p class="font-mono-code text-white/70 text-xs break-words">${hero.subtitle || seo.description || ''}</p>
              </div>
              <div class="lg:col-span-4 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 p-8 rounded-3xl flex flex-col justify-between min-h-[200px]">
                <div class="font-syne text-xl font-bold text-white mb-4">// БЫСТРЫЙ СТАРТ</div>
                <button onclick="openContactModal()" class="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-syne py-4 rounded-xl text-xs font-bold uppercase tracking-widest">Заказать</button>
              </div>
            </section>
            ${textContentHtml} ${renderValueProps()} ${renderProblems()} ${renderTechStack()} ${portfolioSectionHtml} ${renderFAQ()} ${renderRelated()}
          </div>`;
        break;
    }

    currentTemplateHtml = currentTemplateHtml.replace('{{LAYOUT_CONTENT}}', layoutContent);

    const serviceSchema = {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": pageH1,
      "description": seo.description || '',
      "provider": { "@type": "Organization", "name": "BOS.AGENCE", "url": BASE_URL }
    };
    const faqSchema = faq.length ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faq.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": { "@type": "Answer", "text": f.answer }
      }))
    } : null;

    schemaScript = `
      <script type="application/ld+json">${JSON.stringify(serviceSchema)}</script>
      ${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ''}
    `;
  }

  // ОБЩИЕ МЕТА-ТЕГИ И МОДУЛИ
  let pageContent = currentTemplateHtml
    .replace('{{HEAD_MODULE}}', headModule)
    .replace('{{HEADER_MODULE}}', headerModule)
    .replace('{{FOOTER_MODULE}}', footerModule)
    .replace('{{MODAL_MODULE}}', modalModule)
    .replace(/{{META_TITLE}}/g, pageTitle)
    .replace(/{{META_DESCRIPTION}}/g, seo.description || '')
    .replace(/{{CANONICAL_URL}}/g, pageUrl)
    .replace('{{SCHEMA_JSON}}', schemaScript);

  const targetFilePath = path.join(targetDir, pageSlug);
  fs.writeFileSync(targetFilePath, pageContent, 'utf-8');
  console.log(`[+] Сгенерирована страница: /${folderName}/${pageSlug} (Type: ${templateType})`);

  sitemapUrls.push(`  <url>\n    <loc>${pageUrl}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <priority>0.8</priority>\n  </url>`);
});

// 5. ДИНАМИЧЕСКОЕ ОБНОВЛЕНИЕ БЛОКА УСЛУГ НА ГЛАВНОЙ (INDEX.HTML)
if (fs.existsSync(INDEX_PATH)) {
  let indexContent = fs.readFileSync(INDEX_PATH, 'utf-8');
  const servicePages = pagesRegistry.filter(p => p.type === 'service').slice(0, 6);

  const serviceCardsHtml = servicePages.map(srv => `
      <a href="${srv.url}" class="p-6 bg-[#07091e] border border-white/10 rounded-2xl hover:border-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all group block min-h-[180px] flex flex-col justify-between break-words">
        <div>
          <div class="font-mono-code text-[10px] text-[#8b5cf6] uppercase tracking-widest mb-3">// НАПРАВЛЕНИЕ</div>
          <h3 class="font-syne text-lg font-bold uppercase text-white mb-2 group-hover:text-[#8b5cf6] transition-colors leading-snug break-words">${srv.title} &rarr;</h3>
          <p class="font-mono-code text-xs text-white/60 line-clamp-2 leading-relaxed break-words">${srv.desc}</p>
        </div>
      </a>`).join('\n');

  const servicesContainerHtml = `<!-- DYNAMIC_SERVICES_START -->
<section id="seo-services" class="max-w-7xl mx-auto px-6 py-20 border-t border-white/10">
  <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
    <div>
      <span class="font-mono-code text-xs text-[#8b5cf6] tracking-widest uppercase mb-2 block">// КАТАЛОГ УСЛУГ</span>
      <h2 class="font-syne text-3xl sm:text-5xl font-extrabold uppercase text-white">Решения и Экспертиза</h2>
    </div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    ${serviceCardsHtml}
  </div>
</section>
<!-- DYNAMIC_SERVICES_END -->`;

  if (indexContent.includes('<!-- DYNAMIC_SERVICES_START -->')) {
    indexContent = indexContent.replace(/<!-- DYNAMIC_SERVICES_START -->[\s\S]*?<!-- DYNAMIC_SERVICES_END -->/, servicesContainerHtml);
  } else {
    indexContent = indexContent.replace('</main>', `${servicesContainerHtml}\n</main>`);
  }
  fs.writeFileSync(INDEX_PATH, indexContent, 'utf-8');
  console.log('  Обновлен блок услуг на главной странице (index.html)');
}

// 6. ДИНАМИЧЕСКОЕ ОБНОВЛЕНИЕ КОНТЕНТ-ХАБА (КЕЙСЫ, БЛОГ, БАЗА ЗНАНИЙ) НА ГЛАВНОЙ (INDEX.HTML)
function renderContentHub() {
  if (!fs.existsSync(INDEX_PATH)) return;

  console.log('Найденные типы:', pagesRegistry.map(p => ({ title: p.title, type: p.type })));

  const cases = pagesRegistry.filter(p => p.type === 'case');
  const blog = pagesRegistry.filter(p => p.type === 'blog');
  const knowledge = pagesRegistry.filter(p => p.type === 'tool' || p.type === 'knowledge');

  // 1. Генерация HTML для кейсов (Ограничиваем 6 последними свежими)
  const casesHtml = cases.slice(-6).reverse().map(item => `
    <a href="${item.url}" class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 py-6 sm:py-8 hover:bg-neutral-50/80 transition-colors group items-start lg:items-center">
      <div class="lg:col-span-3">
        <span class="text-xs font-mono text-neutral-400 uppercase tracking-widest block mb-1">${(item.data.stack || []).slice(0, 2).join(' / ') || 'BOS.AGENCE'}</span>
        <span class="text-xs font-semibold text-neutral-900 uppercase tracking-wider">CASE</span>
      </div>
      <div class="lg:col-span-6">
        <h3 class="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900 group-hover:text-neutral-600 transition-colors mb-2">
          ${item.title}
        </h3>
        <p class="text-neutral-500 text-sm font-light line-clamp-2">
          ${item.desc}
        </p>
      </div>
      <div class="lg:col-span-3 text-left lg:text-right flex lg:flex-col justify-between items-center lg:items-end gap-2 pt-2 lg:pt-0">
        <span class="font-mono text-xl sm:text-2xl font-bold text-neutral-900">${item.data.metrics?.[0]?.value || '100%'} ${item.data.metrics?.[0]?.label || ''}</span>
        <span class="text-xs font-mono text-neutral-400 group-hover:translate-x-1 transition-transform">Читать кейс &rarr;</span>
      </div>
    </a>
  `).join('');

  // 2. Генерация HTML для блога (Ограничиваем 6 последними свежими)
  const blogHtml = blog.slice(-6).reverse().map(item => `
    <a href="${item.url}" class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 py-6 sm:py-8 hover:bg-neutral-50/80 transition-colors group items-start lg:items-center">
      <div class="lg:col-span-3">
        <span class="text-xs font-mono text-neutral-400 uppercase tracking-widest block mb-1">${item.data.publish_date || '2026'} • ${item.data.read_time || '5'} мин</span>
        <span class="text-xs font-semibold text-neutral-900 uppercase tracking-wider">${item.data.category || 'БЛОГ'}</span>
      </div>
      <div class="lg:col-span-6">
        <h3 class="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900 group-hover:text-neutral-600 transition-colors mb-2">
          ${item.title}
        </h3>
        <p class="text-neutral-500 text-sm font-light line-clamp-2">
          ${item.desc}
        </p>
      </div>
      <div class="lg:col-span-3 text-left lg:text-right pt-2 lg:pt-0">
        <span class="text-xs font-mono text-neutral-400 group-hover:translate-x-1 transition-transform inline-block">Читать статью &rarr;</span>
      </div>
    </a>
  `).join('');

  // 3. Генерация HTML для базы знаний / инструментов (Ограничиваем 6 последними свежими)
  const knowledgeHtml = knowledge.slice(-6).reverse().map(item => `
    <a href="${item.url}" class="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 py-6 sm:py-8 hover:bg-neutral-50/80 transition-colors group items-start lg:items-center">
      <div class="lg:col-span-3">
        <span class="text-xs font-mono text-neutral-400 uppercase tracking-widest block mb-1">${item.data.type || 'ИНСТРУМЕНТ'}</span>
        <span class="text-xs font-semibold text-neutral-900 uppercase tracking-wider">FREE DOWNLOAD</span>
      </div>
      <div class="lg:col-span-6">
        <h3 class="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900 group-hover:text-neutral-600 transition-colors mb-2">
          ${item.title}
        </h3>
        <p class="text-neutral-500 text-sm font-light line-clamp-2">
          ${item.desc}
        </p>
      </div>
      <div class="lg:col-span-3 text-left lg:text-right pt-2 lg:pt-0">
        <span class="text-xs font-mono text-neutral-400 group-hover:translate-x-1 transition-transform inline-block">Открыть гайд &rarr;</span>
      </div>
    </a>
  `).join('');

  let indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');

  // Обновляем цифры счетчиков в табах (показывают ПОЛНОЕ количество)
  indexHtml = indexHtml.replace(/<span id="count-cases">.*?<\/span>/g, `<span id="count-cases">${cases.length}</span>`);
  indexHtml = indexHtml.replace(/<span id="count-blog">.*?<\/span>/g, `<span id="count-blog">${blog.length}</span>`);
  indexHtml = indexHtml.replace(/<span id="count-knowledge">.*?<\/span>/g, `<span id="count-knowledge">${knowledge.length}</span>`);

  // Замена контента между маркерными комментариями
  if (indexHtml.includes('<!-- CASES_CONTENT_START -->')) {
    indexHtml = indexHtml.replace(
      /<!-- CASES_CONTENT_START -->[\s\S]*?<!-- CASES_CONTENT_END -->/,
      `<!-- CASES_CONTENT_START -->\n${casesHtml}\n<!-- CASES_CONTENT_END -->`
    );
    indexHtml = indexHtml.replace(
      /<!-- BLOG_CONTENT_START -->[\s\S]*?<!-- BLOG_CONTENT_END -->/,
      `<!-- BLOG_CONTENT_START -->\n${blogHtml}\n<!-- BLOG_CONTENT_END -->`
    );
    indexHtml = indexHtml.replace(
      /<!-- KNOWLEDGE_CONTENT_START -->[\s\S]*?<!-- KNOWLEDGE_CONTENT_END -->/,
      `<!-- KNOWLEDGE_CONTENT_START -->\n${knowledgeHtml}\n<!-- KNOWLEDGE_CONTENT_END -->`
    );
  }

  fs.writeFileSync(INDEX_PATH, indexHtml, 'utf-8');
  console.log(`  Обновлен контент-хаб на главной: Отображено по 6 свежих элементов (Всего в базе: Кейсы [${cases.length}], Блог [${blog.length}], Инструменты [${knowledge.length}])`);
}

renderContentHub();

// 7. ГЕНЕРАЦИЯ SITEMAP.XML
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>`;
fs.writeFileSync(SITEMAP_PATH, sitemapContent, 'utf-8');
console.log(`[+] Сгенерирован sitemap.xml (${sitemapUrls.length} ссылок)`);