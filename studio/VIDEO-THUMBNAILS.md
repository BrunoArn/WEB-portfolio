# Thumbnails automáticas no upload do Studio

## Fluxo

O campo de vídeo mantém o uploader padrão do Sanity, incluindo seleção de arquivo, arrastar e colar. O componente captura o arquivo local e aguarda a referência salva pelo upload nativo. Um SHA-1 confirma que o arquivo corresponde exatamente ao asset selecionado, mesmo quando o usuário troca de arquivo durante um upload.

Se o asset já tiver uma thumbnail válida, ela é reutilizada. Caso contrário, o Studio lê um frame do arquivo local em 10% da duração (até 30 segundos), cria uma imagem WebP de até 1280×720, envia essa imagem ao Sanity e associa sua referência ao campo interno videoThumbnail do asset de vídeo. Não existe campo manual de thumbnail no formulário.

A galeria pública só recebe a URL da imagem salva no CDN. Não captura frames nem baixa vídeos para criar miniaturas. A mesma imagem serve como poster dos players normal e ampliado.

## Ativação

Publicar o Studio atualizado para que o componente seja usado nos próximos uploads e publicar o frontend para exibir as imagens. Não requer webhook, FFmpeg, credenciais adicionais ou backend de processamento.

Durante um upload, manter o Studio aberto até aparecer “Thumbnail automática salva”. A etapa termina liberando o decoder e a URL temporária. O arquivo original do vídeo não é modificado.

## Reutilização e recuperação

- A imagem pertence ao asset do vídeo, não ao projeto. Reutilizar um asset com thumbnail não exige outra captura.
- Processos simultâneos são deduplicados na sessão e protegidos por uma trava no asset. Falhas liberam a trava; uma trava de sessão interrompida expira em cinco minutos.
- Se o navegador não conseguir ler o vídeo, o Studio mostra o erro e permite tentar novamente. O vídeo permanece utilizável e a galeria mantém o símbolo de play enquanto não houver imagem.
- Formatos precisam ser decodificáveis pelo navegador do editor. Preferir MP4/H.264 ou WebM compatível; o Studio precisa estar em HTTPS ou localhost. Limite atual: 100 MiB por arquivo para essa captura.
- A automação cobre uploads pelo campo de vídeo do Studio. Arquivos novos enviados por API, scripts ou outros fluxos externos não são processados por este componente. Selecionar da biblioteca um asset que já tem thumbnail apenas reutiliza a imagem existente.
- Os vídeos atuais já receberam thumbnails persistentes e continuam usando-as.
- Alterações no CMS seguem o prazo de atualização já existente das páginas de projeto (60 segundos, sujeito à revalidação), ou o próximo build.

## Implementação

- components/VideoUploadInput.tsx: mantém o input padrão e informa o estado da geração.
- lib/video-thumbnails/capture.ts: identidade do arquivo e captura local, com limpeza de recursos.
- lib/video-thumbnails/upload.ts: correlação com o asset e deduplicação da sessão.
- lib/video-thumbnails/process.ts: persistência e idempotência no Sanity.

O endpoint, segredos, dependências e scripts do processamento por webhook foram retirados. Não é necessário configurar um webhook do Sanity para este recurso.
