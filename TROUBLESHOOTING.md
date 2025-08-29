# Solução de Problemas - Service Worker Inativo

## 🔧 Problema: Service Worker Inativo

Se o service worker estiver aparecendo como "inativo" e o clique no ícone da extensão não funcionar, siga estes passos:

### 1. Recarregar a Extensão

1. Vá para `chrome://extensions/`
2. Encontre "My Todo Lists"
3. Clique no botão de **recarregar** (ícone de seta circular)
4. Aguarde alguns segundos

### 2. Verificar Permissões

Certifique-se de que as seguintes permissões estão ativas:
- ✅ `storage` - Para salvar dados
- ✅ `sidePanel` - Para abrir painel lateral
- ✅ `activeTab` - Para acessar aba ativa

### 3. Ativar o Service Worker Manualmente

1. Em `chrome://extensions/`
2. Clique em "Detalhes" na extensão
3. Clique em "Inspecionar visualizações: service worker"
4. Se aparecer "inativa", clique neste link
5. Isso deve ativar o service worker

### 4. Testar a Funcionalidade

1. Clique no ícone da extensão na barra de ferramentas
2. O painel lateral deve abrir automaticamente
3. Se não abrir, tente:
   - Recarregar a página atual
   - Fechar e reabrir o Chrome
   - Reinstalar a extensão

### 5. Verificar Console de Erros

1. Abra o DevTools (`F12`)
2. Vá para a aba "Console"
3. Procure por erros relacionados à extensão
4. Se houver erros, anote-os para diagnóstico

### 6. Logs do Service Worker

Para verificar se o service worker está funcionando:

1. Vá para `chrome://extensions/`
2. Clique em "Inspecionar visualizações: service worker"
3. No console, você deve ver:
   - "My Todo Lists extension installed"
   - "Service worker active: {status: 'alive'}"
   - "Side panel opened successfully" (ao clicar no ícone)

### 7. Reinstalação Completa

Se nada funcionar:

1. Remova a extensão completamente
2. Reinicie o Chrome
3. Reinstale a extensão pelo modo desenvolvedor
4. Teste novamente

## 🚨 Problemas Conhecidos

### Chrome Versão Antiga
- A API `sidePanel` requer Chrome 114+
- Atualize para a versão mais recente

### Modo Incógnito
- Extensões podem não funcionar em modo privado
- Teste em uma janela normal

### Conflitos com Outras Extensões
- Desative outras extensões temporariamente
- Teste se o problema persiste

## ✅ Verificação Final

Após seguir os passos:

1. ✅ Service worker deve aparecer como "ativo"
2. ✅ Clique no ícone deve abrir o painel lateral
3. ✅ Interface deve carregar corretamente
4. ✅ Tarefas devem ser salvas e carregadas

---

**Se o problema persistir, verifique se todos os arquivos estão presentes e o Chrome está atualizado.**