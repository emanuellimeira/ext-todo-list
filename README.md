# My Todo Lists - Extensão Chrome

Uma extensão do Google Chrome para gerenciar suas tarefas organizadas por período (dia, semana, mês e ano) através de um painel lateral.

## 🚀 Funcionalidades

- ✅ **Todo Lists Organizadas**: Gerencie suas tarefas de forma organizada
- 📅 **Filtros por Período**: Visualize tarefas por dia, semana, mês ou ano
- 🎨 **Interface Moderna**: Design limpo e responsivo no painel lateral
- 💾 **Armazenamento Local**: Suas tarefas são salvas automaticamente
- 📊 **Estatísticas**: Acompanhe o progresso com contadores visuais
- 🔄 **Sincronização**: Dados sincronizados entre abas do navegador

## 📦 Instalação

### Modo Desenvolvedor (Recomendado)

1. Abra o Google Chrome
2. Acesse `chrome://extensions/`
3. Ative o "Modo do desenvolvedor" no canto superior direito
4. Clique em "Carregar sem compactação"
5. Selecione a pasta da extensão (`ext-my-todo-lists`)
6. A extensão será instalada e aparecerá na barra de ferramentas

### Uso

1. Clique no ícone da extensão na barra de ferramentas
2. O painel lateral será aberto automaticamente
3. Use os filtros (Hoje, Semana, Mês, Ano) para organizar suas tarefas
4. Adicione novas tarefas digitando no campo de texto
5. Marque tarefas como concluídas clicando no checkbox
6. Exclua tarefas usando o botão de lixeira

## 🛠️ Estrutura do Projeto

```
ext-my-todo-lists/
├── manifest.json          # Configuração da extensão
├── sidepanel.html         # Interface principal
├── styles.css             # Estilos responsivos
├── script.js              # Lógica da aplicação
├── background.js          # Script de background
├── icons/                 # Ícones da extensão
│   ├── icon16.svg
│   ├── icon32.svg
│   ├── icon48.svg
│   └── icon128.svg
└── README.md              # Documentação
```

## 🎯 Recursos Técnicos

- **Manifest V3**: Utiliza a versão mais recente da API de extensões
- **Side Panel API**: Interface integrada ao painel lateral do Chrome
- **Chrome Storage API**: Armazenamento local persistente
- **CSS Grid/Flexbox**: Layout responsivo e moderno
- **Vanilla JavaScript**: Sem dependências externas

## 🔧 Desenvolvimento

### Requisitos
- Google Chrome (versão 114+)
- Conhecimento básico de HTML, CSS e JavaScript

### Modificações

Para personalizar a extensão:

1. **Estilos**: Edite `styles.css` para alterar a aparência
2. **Funcionalidades**: Modifique `script.js` para adicionar recursos
3. **Layout**: Ajuste `sidepanel.html` para mudanças na estrutura
4. **Configurações**: Atualize `manifest.json` para permissões adicionais

## 📱 Compatibilidade

- ✅ Google Chrome 114+
- ✅ Microsoft Edge 114+
- ✅ Outros navegadores baseados em Chromium

## 🐛 Solução de Problemas

### A extensão não carrega
- Verifique se o modo desenvolvedor está ativado
- Confirme se todos os arquivos estão na pasta correta
- Recarregue a extensão em `chrome://extensions/`

### Dados não são salvos
- Verifique as permissões de armazenamento no manifest
- Teste em uma aba de navegação normal (não privada)

### Painel lateral não abre
- Atualize o Chrome para a versão mais recente
- Verifique se a API sidePanel está disponível

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:

- Reportar bugs
- Sugerir melhorias
- Enviar pull requests
- Compartilhar feedback

---

**Desenvolvido com ❤️ para produtividade**