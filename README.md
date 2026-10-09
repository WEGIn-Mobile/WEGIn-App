# WEGIn

MVP mobile de uma rede social interna da WEG, construído com Expo Router, React Native, NativeWind e Gluestack UI. As telas seguem o wireframe em `../Wireframe/`.

## Funcionalidades

- Cadastro com email `@weg.net` e login.
- Feed cronológico com atualização ao puxar e carregamento de mais publicações.
- Pesquisa por nome ou nome de usuário.
- Perfil próprio e de terceiros, com grade de fotos.
- Criação de publicação com foto da galeria ou câmera e legenda opcional.
- Edição da legenda e exclusão das próprias publicações.
- Curtir/descurtir e sair da conta.

## Executar

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env`.
3. Configure `EXPO_PUBLIC_API_URL` com a URL da Flux API, incluindo `/api`.
4. Inicie o backend conforme o README de `../Flux-API/`.
5. Execute `npm start` e abra o aplicativo no Expo Go.

Para um celular físico, use o IP local do computador (por exemplo, `http://192.168.1.10:3333/api`), com os dois dispositivos na mesma rede. No emulador Android padrão, use `http://10.0.2.2:3333/api`. No navegador ou simulador iOS local, use `http://localhost:3333/api`. Reinicie o Expo depois de mudar o ambiente.

## Gerar APK no Windows

Instale um JDK compatível com Gradle 8.14.3 e o SDK Android. Configure `JAVA_HOME` e `ANDROID_HOME`. O primeiro build baixa as dependências nativas e o Ninja 1.13.2 em `.tmp/`, para suportar caminhos longos no Windows, e pode instalar componentes faltantes no SDK.

Configure `EXPO_PUBLIC_API_URL` em `.env.local` com uma URL HTTPS acessível pelos celulares, incluindo `/api`. Essa URL fica incorporada no APK; alterá-la exige um novo build.

```sh
npm run build:apk
```

O APK de release é salvo em `builds/WEGIn-<versão>.apk`, com o JavaScript incorporado e suporte a ARM e x86, sem precisar do Expo Go ou de um servidor Metro. Envie o arquivo ao dispositivo Android, abra-o e permita a instalação por essa origem quando o sistema solicitar.

O build gera uma chave própria na pasta `.signing/` e a reutiliza nas próximas compilações. Faça um backup privado dessa pasta completa para conseguir atualizar os aplicativos já instalados. Não envie a chave nem `android.properties` aos usuários. `builds/`, `.signing/`, `.tmp/` e os projetos nativos gerados ficam fora do Git.

## Verificação

```sh
npm run typecheck
npm run lint
```

## Organização

- `src/app/`: rotas e composição das telas.
- `src/api/`: endpoints, configuração HTTP e erros.
- `src/services/`: validação de cadastro, permissões de fotos e preparação do upload.
- `src/hooks/`: sessão e listagem de publicações.
- `src/components/`: formulários, perfil e componentes reutilizáveis.
- `src/types/`: contratos das respostas.
- `src/styles/`: valores compartilhados da interface.

A sessão usa Secure Store no Android/iOS. Na prévia web, o token fica apenas em memória e o usuário entra novamente ao recarregar a página. Uma resposta 401 de uma rota protegida encerra a sessão.

O backend aceita uma imagem JPEG, PNG ou WebP de até 5 MB por publicação. A edição altera a legenda; a foto é escolhida na criação. Comentários, mensagens, ações de seguir e recuperação de senha estão fora deste MVP.
