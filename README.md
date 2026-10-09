# WEGIn

Aplicativo mobile de uma rede social interna da WEG, construído com Expo Router, React Native, NativeWind e Gluestack UI. As telas de feed e mensagens seguem também o wireframe em `wireframe/image.png`.

## Funcionalidades

- Cadastro com email `@weg.net` e login.
- Feed cronológico com atualização ao puxar e carregamento de mais publicações.
- Pesquisa por nome ou nome de usuário.
- Perfil próprio e de terceiros, com grade de fotos.
- Criação de publicação com foto da galeria ou câmera e legenda opcional.
- Edição da legenda e exclusão das próprias publicações.
- Curtir/descurtir e sair da conta.
- Comentários nas publicações, com paginação e exclusão dos próprios comentários.
- Seguir/deixar de seguir e consultar seguidores e perfis seguidos.
- Editar nome, nome de usuário, bio e foto de perfil com câmera ou galeria.
- Aba de mensagens com pesquisa, conversas entre dois perfis e histórico paginado.
- Indicador verde de mensagens recebidas ainda não lidas e exclusão das próprias mensagens com aviso para os dois perfis.
- Gestos com React Native Gesture Handler e animações com Reanimated, incluindo duplo toque para curtir.

## Executar

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env`.
3. Configure `EXPO_PUBLIC_API_URL` com a URL da Flux API, incluindo `/api`.
4. Inicie o backend conforme o README de `../Flux-API/`.
5. Execute `npm start` e abra o aplicativo no Expo Go.

Para um celular físico, use o IP local do computador (por exemplo, `http://192.168.1.10:3333/api`), com os dois dispositivos na mesma rede. No emulador Android padrão, use `http://10.0.2.2:3333/api`. No navegador ou simulador iOS local, use `http://localhost:3333/api`. Reinicie o Expo depois de mudar o ambiente.

Se letras acentuadas não entrarem ao usar o teclado do computador no emulador, confira o layout em **Configurações > Sistema > Teclado > Teclado físico** do Android emulado. Para um teclado brasileiro, selecione **Brazilian** em cada dispositivo listado, como `AT Translated Set 2 keyboard` e `qwerty2`. No Gboard, adicione **Português (Brasil)** em **Idiomas** e ative **Mostrar teclado na tela** nas opções de **Teclado físico** para testar os acentos pelo teclado virtual. Compare os dois modos de entrada antes de atribuir a falha ao APK.

## Gerar APK no Windows

Instale um JDK compatível com Gradle 8.14.3 e o SDK Android. Configure `JAVA_HOME` e `ANDROID_HOME`. O primeiro build baixa as dependências nativas e o Ninja 1.13.2 em `.tmp/`, para suportar caminhos longos no Windows, e pode instalar componentes faltantes no SDK.

Configure `EXPO_PUBLIC_API_URL` em `.env.local` com uma URL HTTPS acessível pelos celulares, incluindo `/api`. Essa URL fica incorporada no APK; alterá-la exige um novo build.

O build mostra a URL que será incorporada, recusa endereços localhost e confere o endereço dentro do APK final. A URL também invalida o cache do bundle quando muda. Uma variável `EXPO_PUBLIC_API_URL` definida no terminal tem prioridade sobre os arquivos `.env`.

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

O backend aceita uma imagem JPEG, PNG ou WebP de até 5 MB por publicação ou avatar. A edição de publicação altera a legenda; a foto é escolhida na criação. Comentários aceitam até 255 caracteres, mensagens até 1000 e a bio até 160.

O chat consulta a API a cada 7 segundos enquanto a conversa estiver em foco; a lista de conversas atualiza a cada 15 segundos. Essas consultas param com o app em segundo plano. O histórico usa paginação explícita e recupera mensagens recebidas durante pausas. A lista de conversas mostra um ponto verde quando há mensagens recebidas ainda não lidas. Ao abrir o chat, somente mensagens recebidas até o marcador exibido são marcadas como lidas. Não há indicadores de presença.

Para excluir uma mensagem própria, segure a mensagem e confirme a exclusão. A mensagem permanece no histórico como “Mensagem excluída pelo usuário” para os dois perfis. As exclusões de mensagens antigas também são sincronizadas enquanto a conversa está aberta.

Os contadores do perfil são calculados pelas listas de seguidores e seguindo, que retornam todas as conexões. Isso mantém os números consistentes com as listas, inclusive na versão da API que retorna os contadores do perfil invertidos.

As notificações foram removidas do aplicativo: não há tela, alertas push, solicitação de permissão ou chamadas aos endpoints de notificações. Respostas de rota ausente geram avisos amigáveis, preservando o erro real para não simular sucesso.

As permissões de câmera e galeria são verificadas na criação de publicação e na edição do perfil, e novamente antes de selecionar a fonte. No Android 13+, o seletor de fotos do sistema autoriza somente a imagem escolhida. Quando o sistema impede uma nova solicitação, a interface oferece abrir as configurações.

## API e migração das funcionalidades sociais

O upload protegido de avatar, a leitura e a exclusão de mensagens dependem da versão atualizada de `../Flux-API/`. Antes de iniciar essa API, aplique a migração e gere o cliente Prisma no diretório dela:

```sh
npx prisma migrate deploy
npx prisma generate
npm run dev
```

A migração `20261009120000_social_activity` adiciona os campos de imagem em `users`. Ela também inclui tabelas de notificações e dispositivos da implementação anterior; o app não usa esses recursos. Comentários, seguidores e envio de mensagens usam os endpoints existentes.

A migração `20261009140000_message_receipts_and_deletion` adiciona `readAt` e `deletedAt` às mensagens. A API no Render deve receber as duas migrações e os novos endpoints antes de usar avatar, indicadores de leitura ou exclusão no APK. A branch de publicação é `feat/social-mvp-backend`. O build da API gera o cliente Prisma, e `npm start` / `npm run start:prod` aplicam as migrações pendentes antes de iniciar o servidor.
