# Agents — WEGIn

Este arquivo contém diretrizes para revisão humana e para agentes de IA que trabalham neste projeto.

O conteúdo deste documento deve ser lido e considerado **antes de qualquer implementação, alteração ou revisão de código**.

As instruções definidas aqui servem para manter consistência na arquitetura, organização, padrões de código e decisões técnicas do projeto WEGIn.

## Estrutura do Projeto

A estrutura do projeto é modular. O código da aplicação deve ficar em `src/`, com cada pasta responsável por uma camada específica. Novos arquivos devem ser incluídos na camada correspondente, evitando concentrar regras de negócio ou componentes reutilizáveis nas rotas.

```text
.
├── assets/                    # Recursos estáticos usados pelo app
│   ├── fonts/                 # Arquivos de fontes
│   ├── icons/                 # Ícones próprios do produto
│   └── images/                # Imagens, ícones do Expo e splash screen
├── src/
│   ├── app/                   # Rotas, telas e layouts do Expo Router
│   │   ├── _layout.tsx        # Layout e navegador raiz
│   │   └── index.tsx          # Rota inicial (/)
│   ├── api/                   # Clientes HTTP, endpoints e contratos de API
│   ├── components/            # Componentes visuais reutilizáveis
│   ├── database/              # Configuração, acesso e modelos de persistência local
│   ├── hooks/                 # Hooks React reutilizáveis
│   ├── lib/                   # Utilitários, adaptadores e configurações compartilhadas
│   ├── services/              # Regras de negócio e integrações de domínio
│   ├── styles/                # Tokens, temas e estilos compartilhados
│   └── types/                 # Tipos e interfaces TypeScript compartilhados
├── app.json                   # Configuração do Expo
├── package.json               # Dependências e scripts do projeto
└── tsconfig.json              # TypeScript e aliases de importação
```

O roteamento é baseado em arquivos pelo Expo Router: arquivos em `src/app/` representam rotas, e arquivos `_layout.tsx` definem a estrutura de navegação dos respectivos segmentos. Para novas funcionalidades, mantenha a tela ou rota em `src/app/` e extraia elementos reutilizáveis para `src/components/`, regras de domínio para `src/services/` e integrações externas para `src/api/`.

O alias `@/` aponta para `src/`; use-o em importações entre módulos, por exemplo `import { Button } from '@/components/Button'`. Recursos estáticos podem ser importados por `@/assets/*`, que aponta para `assets/`.
