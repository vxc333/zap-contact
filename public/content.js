// Evita inicialização duplicada
if (!window.zapContactInitialized) {
  window.zapContactInitialized = true;
  console.log("Content script carregado!");

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Mensagem recebida:", request);

    if (request.action === "extractContacts") {
      const execute = async () => {
        try {
          await scrollToBottom();
          const contacts = await getNumbers(request.filter);
          sendResponse({ contacts });
        } catch (error) {
          console.error("Erro ao extrair contatos:", error);
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
        // Seletores para números
        'span[title*="+"]',
        'span[title*="("]',
        'span[dir="auto"][title*="+"]',
        'span[dir="auto"][title*="("]',
        // Seletores para containers
        'div[role="row"]',
        'div[data-testid="cell-frame-container"]',
        "div._ak72",
        // Seletores específicos do WhatsApp
        'div[data-testid="conversation-panel-wrapper"]',
        // Novos seletores
        'div[role="gridcell"]',
        'div[role="listitem"]',
        'div[data-testid="chat-list-item"]',
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        console.log(
          `Buscando com seletor "${selector}": ${elements.length} elementos encontrados`
        );

        for (const element of elements) {
          try {
            // Busca mais abrangente pelo container
            const container =
              element.closest(
                '[role="row"], [data-testid="cell-frame-container"], ._ak72, [role="gridcell"]'
              ) || element.parentElement;

            if (!container) continue;

            // Verificação mais rigorosa para grupos
            const isGroup = Boolean(
              // Verifica ícones de grupo
              container.querySelector('[data-icon="default-group"]') ||
                container.querySelector('[data-icon="group"]') ||
                container.querySelector('svg[class*="default-group"]') ||
                // Verifica elementos específicos de grupo
                container.querySelector('[title*="grupo" i]') ||
                container.querySelector('[title*="extrator" i]') ||
                container.querySelector('[title*="comunidade" i]') ||
                // Verifica textos comuns em grupos
                container.textContent?.match(/(grupo|comunidade|!)/i) ||
                // Verifica estrutura típica de grupos
                container.querySelector('div[class*="x10l6tqk"]') ||
                container.querySelector('div[class*="x13vifvy"]') ||
                // Verifica múltiplas imagens ou avatares
                container.querySelectorAll("img").length > 1 ||
                container.querySelectorAll('[data-testid="default-group"]')
                  .length > 0 ||
                // Verifica mensagens típicas de grupo
                container.textContent?.includes("adicionou você") ||
                container.textContent?.includes("criou o grupo") ||
                container.textContent?.includes("saiu") ||
                container.textContent?.includes("adicionou") ||
                container.textContent?.includes("removeu")
            );

            if (isGroup) {
              console.log("Grupo detectado:", {
                text: container.textContent,
                hasGroupIcon: Boolean(
                  container.querySelector('[data-icon="default-group"]')
                ),
                hasMultipleImages: container.querySelectorAll("img").length > 1,
              });
              continue;
            }

            // Busca recursiva por números em todos os elementos filhos
            const findPhoneInElement = (el) => {
              if (el.title && /[\d+()]/.test(el.title)) {
                return el.title.replace(/[^\d+]/g, "");
              }
              if (el.textContent && /^[+\d\s()-]{8,}$/.test(el.textContent)) {
                return el.textContent.replace(/[^\d+]/g, "");
              }
              return "";
            };

            let phone = "";
            let name = "";

            // Busca recursiva por número
            const searchPhone = (el) => {
              phone = findPhoneInElement(el);
              if (phone) return true;

              for (const child of el.children) {
                if (searchPhone(child)) return true;
              }
              return false;
            };

            searchPhone(container);

            // Busca por nome em diferentes elementos
            const nameElements = container.querySelectorAll('span[dir="auto"]');
            for (const el of nameElements) {
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

              console.log("Contato encontrado:", {
                name: name || phone,
                phone,
                isSaved,
                isArchived,
              });

              tempContacts[phone] = {
                numero: phone,
                nome: name || phone,
                isSaved,
                isArchived,
              };
            }
          } catch (error) {
            console.error("Erro ao processar elemento:", error);
          }
        }
      }
    }

    // Função de scroll melhorada
    async function scrollToLoadMore() {
      const paneElement = document.querySelector("#pane-side");
      if (!paneElement) return;

      let lastHeight = 0;
      let unchangedCount = 0;
      const maxUnchanged = 10; // Aumentado para 10 tentativas
      const scrollStep = 300; // Scroll mais suave

      while (unchangedCount < maxUnchanged) {
        // Multiple scroll steps
        for (let i = 0; i < 5; i++) {
          paneElement.scrollTop += scrollStep;
          await sleep(200);
          await processContactElements();
        }

        const currentHeight = paneElement.scrollHeight;
        if (currentHeight === lastHeight) {
          unchangedCount++;
        } else {
          unchangedCount = 0;
          lastHeight = currentHeight;
        }

        await sleep(300);
      }

      // Volta ao topo e faz uma última verificação
      paneElement.scrollTop = 0;
      await sleep(1000);
      await processContactElements();
    }

    // Processo inicial
    await processContactElements();
    console.log("Processamento inicial concluído");

    // Scroll e processamento
    await scrollToLoadMore();
    console.log("Scroll e processamento adicional concluído");

    // Aplica os filtros
    const filteredContacts = Object.fromEntries(
      Object.entries(tempContacts).filter(([_, contact]) => {
        const typeMatch =
          filter.type === "all" ||
          (filter.type === "saved" && contact.isSaved) ||
          (filter.type === "unsaved" && !contact.isSaved);

        const archivedMatch =
          filter.archived === "all" ||
          (filter.archived === "archived" && contact.isArchived) ||
          (filter.archived === "unarchived" && !contact.isArchived);

        return typeMatch && archivedMatch;
      })
    );

    console.log(
      "Total de contatos encontrados:",
      Object.keys(filteredContacts).length
    );
    return filteredContacts;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function scrollToBottom() {
    const paneElement = document.querySelector("#pane-side");
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
