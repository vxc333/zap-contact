// Função para injetar o content script
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    return true;
  } catch (error) {
    console.error('Erro ao injetar content script:', error);
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractContacts") {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      try {
        const activeTab = tabs[0];
        if (!activeTab?.id) {
          sendResponse({ error: "Nenhuma guia ativa encontrada." });
          return;
        }

        if (!activeTab.url?.includes('web.whatsapp.com')) {
          sendResponse({ error: "Por favor, abra o WhatsApp Web primeiro." });
          return;
        }

        // Tenta injetar o content script primeiro
        await injectContentScript(activeTab.id);

        // Aguarda um momento para garantir que o script foi carregado
        setTimeout(() => {
          chrome.tabs.sendMessage(
            activeTab.id,
            { 
              action: "extractContacts",
              filter: message.filter
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error("Erro:", chrome.runtime.lastError);
                sendResponse({ 
                  error: "Por favor, recarregue a página do WhatsApp Web." 
                });
              } else {
                sendResponse(response);
              }
            }
          );
        }, 500);

      } catch (error) {
        console.error('Erro:', error);
        sendResponse({ error: "Ocorreu um erro inesperado." });
      }
    });
    return true;
  }
});
