# Changelog

## 1.1.0 (Android versionCode 10)

### Novidades

- Tema claro e escuro: segue o tema do dispositivo e pode ser fixado em **Meu perfil > Preferências**.
- Idiomas: português, inglês e espanhol, conforme o idioma do dispositivo (inglês quando o idioma não é suportado). Também pode ser fixado em Preferências.
- Mensagens não lidas no estilo WhatsApp: horário e contador verdes em cada conversa e badge verde na aba Mensagens.
- Confirmação de leitura nas mensagens próprias: ✓ enviada e ✓✓ lida.
- Foto de perfil com envio pela galeria ou câmera e remoção.

### Melhorias

- Curtir e seguir respondem na hora, com animação curta e feedback tátil; a mudança é desfeita se a API falhar.
- Duplo toque na foto mostra um coração sobre a imagem.
- Botões, listas, diálogos e avisos com animações suaves.
- Contadores de seguidores e seguindo maiores no perfil.
- Datas formatadas conforme o idioma e a região do dispositivo.

### Requisitos da API

Esta versão depende da branch `feat/social-mvp-backend` da Flux-API com a migração `20261016120000_add_avatars_and_message_status` aplicada (`npx prisma migrate deploy`). Publique a API antes de distribuir o APK.

### Observações para o build

- `expo-localization` é um módulo nativo e `userInterfaceStyle` passou a ser `automatic`: gere um novo APK (`npm run build:apk`).
- O build precisa de um JDK com `keytool` em `JAVA_HOME` (por exemplo, `C:\Program Files\Java\jdk-22`).
- Use a mesma chave de `.signing/` das versões anteriores para que o APK instale por cima.
