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

* Mantenha os arquivos de `src/app/` focados na composição das telas e na navegação. Extraia componentes reutilizáveis para `src/components/`.
* Centralize as chamadas ao backend em `src/api/`. Coloque em `src/services/` as operações que coordenam essas chamadas e aplicam regras da aplicação.
* Use `src/database/` somente para dados que precisem de persistência local.
* Use o alias `@/` para importar arquivos de `src/`, conforme a configuração do projeto. Para recursos de `assets/`, confira o alias configurado antes de usar `@/assets/`.

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

* Crie telas e layouts de navegação em `src/app/`.
* Coloque componentes visuais reutilizáveis em `src/components/`. Antes de criar um componente, confira se a Gluestack UI ou o próprio projeto já oferece uma opção adequada.
* Use Lucide React Native para ícones de uso geral. Coloque em `assets/icons/` apenas ícones próprios do WEGIn ou recursos que a biblioteca não atende.
* Evite concentrar chamadas HTTP, regras da aplicação e código de persistência dentro dos componentes de tela.

## Estilização

Use NativeWind como padrão de estilização. Mantenha cores, espaçamentos e outros valores compartilhados consistentes com o tema do projeto.

Quando uma necessidade não for atendida adequadamente pelo NativeWind, use a API de estilos apropriada do React Native e organize os valores reutilizáveis em `src/styles/`. Evite espalhar estilos repetidos pelas telas.

## Acesso à API e armazenamento do token

Centralize a configuração HTTP e o tratamento comum de erros em `src/api/`. Armazene o token de acesso com Expo Secure Store; não o grave em armazenamento local sem proteção. Não inclua tokens, senhas ou outras credenciais no código-fonte ou em logs.

## Padrões do MVP

* As rotas públicas ficam em `src/app/(auth)/` e as três abas em `src/app/(main)/`. A proteção de rotas usa `Stack.Protected` e a sessão de `src/hooks/use-session.tsx`.
* Os endpoints ficam em `src/api/`. Use `apiFetch` para aplicar o token, normalizar a URL e tratar erros. Não defina Content-Type manualmente para FormData.
* No Android/iOS, a sessão persiste com Secure Store; na prévia web, o token fica somente em memória. Uma resposta 401 em rota protegida encerra a sessão.
* Prepare o upload em `PostService` e mantenha os contratos das respostas em `src/types/`. IDs são strings e datas recebidas por JSON são strings.
* Reutilize os componentes de `src/components/` e os valores de `src/styles/theme.ts`. As cores de marca para NativeWind estão em `tailwind.config.js`.
* As listas de posts são atualizadas ao receber foco e usam paginação explícita. Não adicione bibliotecas de estado ou cache para os fluxos simples do MVP.

## Antes de concluir uma alteração

* Confira se os arquivos foram colocados nas pastas corretas e se há código existente que pode ser reutilizado.
* Verifique se a alteração segue os padrões de navegação, componentes, estilos e acesso à API do projeto.
* Execute as verificações disponíveis e relevantes em `package.json`, como TypeScript e lint, e corrija os problemas introduzidos pela alteração.
* Atualize este arquivo se a mudança estabelecer um novo padrão para o projeto.
