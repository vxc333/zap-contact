# ZapContact - Extensão para WhatsApp Web

## 📱 Sobre
ZapContact é uma extensão para Chrome que permite extrair contatos do WhatsApp Web de forma organizada e eficiente.

## ✨ Funcionalidades

- 📋 Extração de contatos do WhatsApp Web
- 🔍 Filtros por tipo de contato:
  - Todos os contatos
  - Apenas contatos salvos
  - Apenas contatos não salvos
- 📂 Filtros por status:
  - Todos
  - Arquivados
  - Não arquivados
- 💾 Exportação em diferentes formatos:
  - CSV (compatível com Excel)
  - vCard (para importação direta em smartphones)
- 🎯 Opções de campos para exportação:
  - Apenas números
  - Nome e número

## 🔒 Sistema de Licença
- Sistema de autenticação por código
- Controle de dias de acesso
- Gestão de usuários autorizados

## 🛠️ Tecnologias Utilizadas

- React
- TypeScript
- Ant Design
- TailwindCSS
- Chrome Extension API

## 📦 Instalação

1. Clone o repositório
```bash
git clone https://github.com/vxc333/zap-contact.git
```
2. Instale as dependências
```bash
npm install
```
3. Faça o build do projeto
```bash
npm run build
```

4. Carregue a extensão no Chrome:
   - Abra o Chrome e vá para `chrome://extensions/`
   - Ative o "Modo do desenvolvedor"
   - Clique em "Carregar sem compactação"
   - Selecione a pasta `dist` do projeto

## 🚀 Como Usar

1. Faça login na extensão usando seu código de acesso
2. Abra o WhatsApp Web
3. Clique na extensão ZapContact
4. Selecione os filtros desejados
5. Clique em "Extrair"
6. Após a extração, clique em "Baixar Contatos" no formato desejado

## ⚠️ Observações

- A extensão funciona apenas com o WhatsApp Web aberto
- É necessário ter uma licença válida para utilizar
- Alguns contatos podem não ser detectados dependendo das configurações de privacidade

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto está sob licença privada.