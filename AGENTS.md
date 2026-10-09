# AGENTS.md — WEGIn

Este arquivo orienta pessoas e agentes de IA que trabalham no WEGIn. Leia-o antes de implementar, alterar ou revisar código. Ao fazer mudanças, siga os padrões existentes no projeto e mantenha este documento atualizado quando uma decisão de arquitetura mudar.

## Estrutura do projeto

O aplicativo usa Expo Router e organiza o código em `src/`. Coloque cada arquivo na pasta correspondente à sua responsabilidade:

```text
.
├── assets/
│   ├── fonts/             # Fontes
│   ├── icons/             # Ícones próprios do produto
│   └── images/            # Imagens e recursos do Expo
├── src/
│   ├── app/               # Rotas, telas e layouts do Expo Router
│   │   ├── _layout.tsx    # Layout e navegação raiz
│   │   └── index.tsx      # Rota inicial
│   ├── api/               # Cliente HTTP, chamadas e contratos da API
│   ├── components/        # Componentes visuais reutilizáveis
│   ├── database/          # Persistência local, quando necessária
│   ├── hooks/             # Hooks React reutilizáveis
│   ├── lib/               # Utilitários e configurações compartilhadas
│   ├── services/          # Operações e regras da aplicação
│   ├── styles/            # Tema, tokens e estilos compartilhados
│   └── types/             # Tipos TypeScript compartilhados
├── app.json
├── package.json
└── tsconfig.json
```

- Mantenha os arquivos de `src/app/` focados na composição das telas e na navegação. Extraia componentes reutilizáveis para `src/components/`.
- Centralize as chamadas ao backend em `src/api/`. Coloque em `src/services/` as operações que coordenam essas chamadas e aplicam regras da aplicação.
- Use `src/database/` somente para dados que precisem de persistência local.
- Use o alias `@/` para importar arquivos de `src/`, conforme a configuração do projeto. Para recursos de `assets/`, confira o alias configurado antes de usar `@/assets/`.

## Bibliotecas e reutilização

Antes de adicionar uma dependência ou criar um componente, verifique o que já existe no projeto. Prefira reutilizar componentes, padrões de acesso à API e configurações existentes.

| Biblioteca          | Uso no projeto                          |
| ------------------- | --------------------------------------- |
| NativeWind v4       | Estilização das interfaces              |
| Gluestack UI v3     | Componentes de interface                |
| Lucide React Native | Ícones de uso geral                     |
| Expo Secure Store   | Armazenamento seguro do token de acesso |

Consulte `package.json` para confirmar as versões instaladas. Não presuma que uma versão citada em documentação antiga corresponde à versão usada pelo projeto.

## Telas, componentes e ícones

- Crie telas e layouts de navegação em `src/app/`.
- Coloque componentes visuais reutilizáveis em `src/components/`. Antes de criar um componente, confira se a Gluestack UI ou o próprio projeto já oferece uma opção adequada.
- Use Lucide React Native para ícones de uso geral. Coloque em `assets/icons/` apenas ícones próprios do WEGIn ou recursos que a biblioteca não atende.
- Evite concentrar chamadas HTTP, regras da aplicação e código de persistência dentro dos componentes de tela.

## Estilização

Use NativeWind como padrão de estilização. Mantenha cores, espaçamentos e outros valores compartilhados consistentes com o tema do projeto.

Quando uma necessidade não for atendida adequadamente pelo NativeWind, use a API de estilos apropriada do React Native e organize os valores reutilizáveis em `src/styles/`. Evite espalhar estilos repetidos pelas telas.

## Acesso à API e armazenamento do token

Centralize a configuração HTTP e o tratamento comum de erros em `src/api/`. Armazene o token de acesso com Expo Secure Store; não o grave em armazenamento local sem proteção. Não inclua tokens, senhas ou outras credenciais no código-fonte ou em logs.

## Padrões do MVP

- As rotas públicas ficam em `src/app/(auth)/` e as quatro abas (feed, pesquisa, mensagens e perfil) em `src/app/(main)/`. A proteção de rotas usa `Stack.Protected` e a sessão de `src/hooks/use-session.tsx`. Comentários, conversas, edição do perfil e conexões são rotas protegidas na pilha raiz.
- Os endpoints ficam em `src/api/`. Use `apiFetch` para aplicar o token, normalizar a URL e tratar erros. Não defina Content-Type manualmente para FormData.
- No Android/iOS, a sessão persiste com Secure Store; na prévia web, o token fica somente em memória. Uma resposta 401 em rota protegida encerra a sessão.
- Prepare o upload em `PostService` e mantenha os contratos das respostas em `src/types/`. IDs são strings e datas recebidas por JSON são strings.
- Centralize câmera, galeria e permissões em `PostPhotoService`. Confira as permissões em cada nova publicação e antes de usar a fonte escolhida. Quando `canAskAgain` for falso, ofereça abrir as configurações. No Android 13+, use o seletor de fotos do sistema sem exigir acesso amplo aos arquivos. O plugin `scripts/with-camera-permission.js` remove bloqueios antigos da câmera em projetos Android já gerados.
- Nos campos de texto, use `defaultValue` para o valor inicial e `onChangeText` para atualizar os dados do formulário; preserve a composição do teclado para acentos. Para limpar a pesquisa, use a referência do campo e `clear()`.
- Use `FormScrollView` nos formulários. `useKeyboardInset` mede o contêiner na janela e reserva somente a área sobreposta pelo teclado; não some offsets de cabeçalho ou a altura inteira do teclado, pois isso pode duplicar o espaço já reservado pelo Android. No editor, `scrollToEndOnKeyboard` mantém a legenda e os controles finais visíveis após o redimensionamento. Mantenha NativeWind 4.2+ para compatibilidade das referências e estilos com React Native 0.81/Reanimated 4.
- Antes de sair do editor após salvar ou descartar, aguarde a liberação da proteção em `usePreventRemoveContext` e navegue no próximo frame. Bloqueie envios duplicados durante a solicitação e a saída da tela.
- Reutilize os componentes de `src/components/` e os valores de `src/styles/theme.ts`. As cores de marca para NativeWind estão em `tailwind.config.js`.
- As listas de posts são atualizadas ao receber foco e usam paginação explícita. Não adicione bibliotecas de estado ou cache para os fluxos simples do MVP.
- Comentários usam os contratos de posts com `parentId`. Mensagens têm datas JSON em string; a API devolve cada página em ordem cronológica e o chat usa uma lista invertida. `usePagedList` centraliza paginação, cancelamento e atualização ao receber foco. Chat e conversas consultam a API periodicamente somente com a tela em foco e o app ativo; não anuncie presença, leitura ou WebSocket sem suporte do backend.
- Renderize os estados de carregamento e conversa vazia fora da lista invertida do chat. `Conversation.unreadCount` alimenta o indicador verde na lista de conversas; a leitura usa `PATCH /messages/:userId/read` com `throughId`, limitado às mensagens recebidas até esse marcador. A exclusão usa `DELETE /messages/:id`, somente para o remetente, e preserva a mensagem como aviso para os dois perfis. A primeira página inclui `deletedMessages` para reconciliar também as mensagens antigas já carregadas, sem baixar novamente todo o histórico.
- A opção de excluir uma mensagem própria aparece ao segurá-la, com confirmação antes da solicitação; não exiba um botão de três pontos em cada mensagem. Disponibilize a mesma ação para leitores de tela. Mensagens recebidas ou já excluídas não oferecem essa ação.
- `UserService.getProfile` calcula os contadores pelas listas completas de `/followers/:id` e `/following/:id`, pois a API publicada tem relações de contagem invertidas. Não troque os rótulos nem inverta cegamente os campos: as listas têm a direção correta em ambas as versões da API. Se esses endpoints passarem a ter paginação, use os totais retornados pelo backend.
- A edição do perfil salva nome, usuário e bio (até 160 caracteres), e faz upload do avatar em `/users/me/avatar`. `PhotoUploadService` prepara multipart para posts e avatares, enquanto `PostPhotoService` continua responsável por câmera, galeria e permissões. Avatares em `/api/users/` usam o token; não envie credenciais a URLs externas de avatar.
- `GestureHandlerRootView` envolve a raiz. Reanimated e o plugin de Worklets configurado no Babel animam as interações; o duplo toque na foto usa Gesture Handler para curtir. Preserve as versões compatíveis com o Expo SDK instalado.
- Notificações foram retiradas do app por falta de suporte no backend publicado. Não inclua telas, contadores, registro de dispositivos push, permissões ou chamadas automáticas para esse recurso. Preserve a proteção no Git para eventuais arquivos privados de `.push/` e Firebase.
- Erros técnicos como `Cannot GET/POST/PATCH/DELETE` são normalizados em `apiFetch`; uma rota ausente continua sendo erro, nunca uma lista vazia ou um upload bem-sucedido. Atualize a API publicada antes de distribuir funções que dependam de novos endpoints.

## Antes de concluir uma alteração

- Para gerar um APK instalável no Windows, use `npm run build:apk`. O script gera o projeto Android, assina o release com a chave privada de `.signing/` e salva o APK em `builds/`. Preserve a pasta `.signing/` para atualizações e nunca versione ou registre suas credenciais. A URL `EXPO_PUBLIC_API_URL` é incorporada durante o build e deve ser acessível pelos dispositivos.
- O build carrega a URL da API com o resolvedor de ambiente do Expo, repassa o valor ao Gradle/Metro e verifica a URL dentro do APK antes de copiá-lo para `builds/`. Não use localhost no APK. A URL faz parte dos inputs da tarefa de bundle para evitar reutilizar um endereço antigo.

- Confira se os arquivos foram colocados nas pastas corretas e se há código existente que pode ser reutilizado.
- Verifique se a alteração segue os padrões de navegação, componentes, estilos e acesso à API do projeto.
- Execute as verificações disponíveis e relevantes em `package.json`, como TypeScript e lint, e corrija os problemas introduzidos pela alteração.
- Atualize este arquivo se a mudança estabelecer um novo padrão para o projeto.
