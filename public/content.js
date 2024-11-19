// Evita inicialização duplicada
if (!window.zapContactInitialized) {
  window.zapContactInitialized = true;
  console.log('Content script carregado!');

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Mensagem recebida:', request);
    
    if (request.action === "extractContacts") {
      const execute = async () => {
        try {
          await scrollToBottom();
          const contacts = await getNumbers(request.filter);
          sendResponse({ contacts });
        } catch (error) {
          console.error('Erro ao extrair contatos:', error);
          sendResponse({ error: error.message });
        }
      };

      execute();
      return true;
    }
  });

  async function getNumbers(filter) {
    const tempContacts = {};

    // Aumenta tempo de espera inicial
    await sleep(5000);

    async function processContactElements() {
      const selectors = [
        // Seletores diretos para números
        'span[title*="+"]',
        'span[title*="("]',
        'span[dir="auto"][title*="+"]',
        'span[dir="auto"][title*="("]',
        // Seletores para células e linhas
        'div[role="gridcell"] span[dir="auto"]',
        'div[role="row"] span[dir="auto"]',
        // Seletores específicos do WhatsApp
        'div[data-testid="cell-frame-container"]',
        'div._ak72',
        'div[data-testid="conversation-panel-wrapper"]'
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`Buscando com seletor "${selector}": ${elements.length} elementos encontrados`);

        for (const element of elements) {
          try {
            // Encontra o container pai mais próximo
            const container = element.closest('[role="row"], [data-testid="cell-frame-container"], ._ak72') || element.parentElement;
            if (!container) continue;

            let phone = '';
            let name = '';

            // Busca por número em diferentes formatos
            const possiblePhoneElements = [
              element,
              ...container.querySelectorAll('span[title*="+"], span[title*="("], span[dir="auto"]')
            ];

            for (const el of possiblePhoneElements) {
              // Verifica no título
              if (el.title && /[\d+()]/.test(el.title)) {
                phone = el.title.replace(/[^\d+]/g, '');
                break;
              }
              // Verifica no texto
              if (el.textContent && /^[+\d\s()-]{8,}$/.test(el.textContent)) {
                phone = el.textContent.replace(/[^\d+]/g, '');
                break;
              }
            }

            // Busca por nome em diferentes elementos
            const possibleNameElements = container.querySelectorAll('span[dir="auto"]');
            for (const el of possibleNameElements) {
              const text = el.textContent?.trim();
              if (text && !/^[+\d\s()-]+$/.test(text) && text.length > 1) {
                name = text;
                break;
              }
            }

            if (phone && phone.length > 8 && !tempContacts[phone]) {
              const isArchived = Boolean(
                container.closest('[aria-label*="arquivada" i]') ||
                container.closest('[title*="arquivada" i]') ||
                container.closest('[data-testid*="archive"]')
              );

              const isSaved = Boolean(name && name !== phone);

              console.log('Contato encontrado:', { 
                name: name || phone, 
                phone, 
                isSaved, 
                isArchived 
              });

              tempContacts[phone] = {
                numero: phone,
                nome: name || phone,
                isSaved,
                isArchived
              };
            }
          } catch (error) {
            console.error('Erro ao processar elemento:', error);
          }
        }
      }
    }

    // Função de scroll melhorada
    async function scrollToLoadMore() {
      const paneElement = document.querySelector('#pane-side');
      if (!paneElement) return;

      let lastHeight = 0;
      let unchangedCount = 0;
      const maxUnchanged = 5; // Aumenta o número de tentativas
      const scrollStep = 500; // Scroll mais suave

      while (unchangedCount < maxUnchanged) {
        // Scroll progressivo
        for (let i = 0; i < 3; i++) {
          paneElement.scrollTop += scrollStep;
          await sleep(300);
        }

        await processContactElements();

        const currentHeight = paneElement.scrollHeight;
        if (currentHeight === lastHeight) {
          unchangedCount++;
        } else {
          unchangedCount = 0;
          lastHeight = currentHeight;
        }

        await sleep(500);
      }

      // Volta ao topo
      paneElement.scrollTop = 0;
    }

    // Processo inicial
    await processContactElements();
    console.log('Processamento inicial concluído');

    // Scroll e processamento
    await scrollToLoadMore();
    console.log('Scroll e processamento adicional concluído');

    // Aplica os filtros
    const filteredContacts = Object.fromEntries(
      Object.entries(tempContacts).filter(([_, contact]) => {
        const typeMatch = 
          filter.type === 'all' ||
          (filter.type === 'saved' && contact.isSaved) ||
          (filter.type === 'unsaved' && !contact.isSaved);

        const archivedMatch =
          filter.archived === 'all' ||
          (filter.archived === 'archived' && contact.isArchived) ||
          (filter.archived === 'unarchived' && !contact.isArchived);

        return typeMatch && archivedMatch;
      })
    );

    console.log('Total de contatos encontrados:', Object.keys(filteredContacts).length);
    return filteredContacts;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function scrollToBottom() {
    const paneElement = document.querySelector('#pane-side');
    if (!paneElement) return;

    let lastScrollHeight = 0;
    let sameHeightCount = 0;
    const scrollStep = 800; // Scroll mais suave
    const maxAttempts = 100; // Aumenta o número máximo de tentativas
    let attempts = 0;

    while (attempts < maxAttempts) {
      paneElement.scrollTop += scrollStep;
      await sleep(200); // Reduz o tempo de espera entre scrolls

      if (paneElement.scrollHeight === lastScrollHeight) {
        sameHeightCount++;
        if (sameHeightCount >= 5) break; // Aumenta o número de verificações
      } else {
        sameHeightCount = 0;
      }

      lastScrollHeight = paneElement.scrollHeight;
      attempts++;
    }

    // Aguarda um pouco mais antes de retornar ao topo
    await sleep(1000);
    paneElement.scrollTop = 0;
  }
}
