import Popup from "../../components/Popup";
import { Button, message, Radio, Spin } from "antd";
import { useState } from "react";

interface Contact {
  numero: string;
  nome: string;
  isSaved: boolean;
  isArchived: boolean;
}

type ContactFilter = {
  type: "all" | "saved" | "unsaved";
  archived: "all" | "archived" | "unarchived";
};

interface ExportOptions {
  format: "csv" | "vcard";
  fields: "number" | "both";
}

export default function Extractor() {
  const [contacts, setContacts] = useState<Record<string, Contact> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "csv",
    fields: "both",
  });
  const [filter, setFilter] = useState<ContactFilter>({
    type: "all",
    archived: "all",
  });

  const handleExtractContacts = () => {
    setIsLoading(true);
    chrome.runtime.sendMessage(
      {
        action: "extractContacts",
        filter: filter,
      },
      (response) => {
        setIsLoading(false);
        if (response && response.contacts) {
          setContacts(response.contacts);
          message.success(
            `Foram encontrados ${
              Object.keys(response.contacts).length
            } contatos!`
          );
        } else {
          message.error("Não foi possível extrair os contatos.");
        }
      }
    );
  };

  const downloadContacts = () => {
    if (!contacts) return;

    if (exportOptions.format === "csv") {
      const header =
        exportOptions.fields === "both" ? "Nome,Número\n" : "Número\n";
      const content =
        header +
        Object.values(contacts)
          .map((contact) => {
            return exportOptions.fields === "both"
              ? `${contact.nome},${contact.numero}`
              : contact.numero;
          })
          .join("\n");

      const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "contatos_whatsapp.csv";
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      // Formato vCard
      const content = Object.values(contacts)
        .map((contact) => {
          return `BEGIN:VCARD
VERSION:3.0
${exportOptions.fields === "both" ? `FN:${contact.nome}\n` : ""}TEL;TYPE=CELL:${
            contact.numero
          }
END:VCARD`;
        })
        .join("\n");

      const blob = new Blob([content], { type: "text/vcard;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "contatos_whatsapp.vcf";
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  return (
    <Popup>
      <Spin spinning={isLoading} tip="Buscando contatos...">
        <div className="min-h-[400px]">
          <p className="text-center font-bold text-2xl pb-4">Extrator</p>

          <div className="mb-4">
            <p className="font-bold mb-2">Tipo de Contatos:</p>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              className="w-full flex"
              value={filter.type}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, type: e.target.value }))
              }
              disabled={isLoading}
            >
              <Radio.Button value="all" className="w-1/3 text-center">
                Todos
              </Radio.Button>
              <Radio.Button value="saved" className="w-1/3 text-center">
                Salvos
              </Radio.Button>
              <Radio.Button value="unsaved" className="w-1/3 text-center">
                Não Salvos
              </Radio.Button>
            </Radio.Group>
          </div>

          <div className="mb-4">
            <p className="font-bold mb-2">Status:</p>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              className="w-full flex"
              value={filter.archived}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, archived: e.target.value }))
              }
              disabled={isLoading}
            >
              <Radio.Button value="all" className="w-1/3 text-center">
                Todos
              </Radio.Button>
              <Radio.Button value="archived" className="w-1/3 text-center">
                Arquivados
              </Radio.Button>
              <Radio.Button value="unarchived" className="w-1/3 text-center">
                Não Arquivados
              </Radio.Button>
            </Radio.Group>
          </div>

          <div className="mb-4">
            <p className="font-bold mb-2">Formato do Arquivo:</p>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              className="w-full flex"
              value={exportOptions.format}
              onChange={(e) =>
                setExportOptions((prev) => ({
                  ...prev,
                  format: e.target.value,
                }))
              }
              disabled={isLoading}
            >
              <Radio.Button value="csv" className="w-1/2 text-center">
                CSV (Excel)
              </Radio.Button>
              <Radio.Button value="vcard" className="w-1/2 text-center">
                vCard (Contatos)
              </Radio.Button>
            </Radio.Group>
          </div>

          <div className="mb-4">
            <p className="font-bold mb-2">Campos:</p>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              className="w-full flex"
              value={exportOptions.fields}
              onChange={(e) =>
                setExportOptions((prev) => ({
                  ...prev,
                  fields: e.target.value,
                }))
              }
              disabled={isLoading}
            >
              <Radio.Button value="number" className="w-1/2 text-center">
                Número
              </Radio.Button>
              <Radio.Button value="both" className="w-1/2 text-center">
                Nome e Número
              </Radio.Button>
            </Radio.Group>
          </div>

          <Button
            onClick={handleExtractContacts}
            className="w-full mt-2"
            type="primary"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? "Extraindo..." : "Extrair"}
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
