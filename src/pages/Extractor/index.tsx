import Popup from "../../components/Popup";
import { Button, message, Radio, Space, Spin } from "antd";
import { useState } from "react";

interface Contact {
  numero: string;
  nome: string;
  isSaved: boolean;
  isArchived: boolean;
}

type ContactFilter = {
  type: 'all' | 'saved' | 'unsaved';
  archived: 'all' | 'archived' | 'unarchived';
};

export default function Extractor() {
  const [contacts, setContacts] = useState<Record<string, Contact> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<ContactFilter>({ 
    type: 'all', 
    archived: 'all' 
  });

  const handleExtractContacts = () => {
    setIsLoading(true);
    chrome.runtime.sendMessage({ 
      action: "extractContacts",
      filter: filter 
    }, (response) => {
      setIsLoading(false);
      if (response && response.contacts) {
        setContacts(response.contacts);
        message.success(`Foram encontrados ${Object.keys(response.contacts).length} contatos!`);
      } else {
        message.error("Não foi possível extrair os contatos.");
      }
    });
  };

  const downloadContacts = () => {
    if (!contacts) return;

    const content = "**Nome**,**Número**\n" + Object.values(contacts)
      .map(contact => `${contact.nome},${contact.numero}`)
      .join("\n");
    
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "contatos_whatsapp.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Popup>
      <Spin spinning={isLoading} tip="Buscando contatos...">
        <div className="min-h-[400px]">
          <p className="text-center font-bold text-2xl pb-4">Extrator</p>
          
          <div className="mb-4">
            <p className="font-bold mb-2">Tipo de Contatos:</p>
            <Radio.Group 
              value={filter.type}
              onChange={e => setFilter(prev => ({ ...prev, type: e.target.value }))}
              disabled={isLoading}
            >
              <Space direction="vertical">
                <Radio value="all">Todos</Radio>
                <Radio value="saved">Apenas Salvos</Radio>
                <Radio value="unsaved">Apenas Não Salvos</Radio>
              </Space>
            </Radio.Group>
          </div>

          <div className="mb-4">
            <p className="font-bold mb-2">Status:</p>
            <Radio.Group 
              value={filter.archived}
              onChange={e => setFilter(prev => ({ ...prev, archived: e.target.value }))}
              disabled={isLoading}
            >
              <Space direction="vertical">
                <Radio value="all">Todos</Radio>
                <Radio value="archived">Apenas Arquivados</Radio>
                <Radio value="unarchived">Apenas Não Arquivados</Radio>
              </Space>
            </Radio.Group>
          </div>

          <Button 
            onClick={handleExtractContacts} 
            className="w-full mt-2" 
            type="primary"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Extraindo...' : 'Extrair'}
          </Button>
          
          <Button
            onClick={downloadContacts}
            className="w-full mt-2"
            type="default"
            disabled={!contacts || isLoading}
          >
            Baixar Contatos
          </Button>
        </div>
      </Spin>
    </Popup>
  );
}
