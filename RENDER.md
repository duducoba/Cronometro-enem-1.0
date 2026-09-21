# Hospedagem no Render

O aplicativo está preparado para um Web Service Node.js com senha verificada no servidor. O cronômetro roda no navegador e continua contando mesmo quando o servidor gratuito fica inativo.

## Configuração

- Build Command: `npm run build`
- Start Command: `npm start`
- Plano: Free
- Health Check Path: `/healthz`
- Variável secreta obrigatória: `ENEM_PASSWORD`

O arquivo `render.yaml` contém a configuração equivalente para Blueprint. Conecte um repositório GitHub/GitLab/Bitbucket com este projeto. Não envie arquivos `.env`, senhas ou credenciais para o repositório.

O Render define `PORT` e `RENDER_EXTERNAL_URL`. O aplicativo usa a origem informada pelo Render para validar o login e cookies seguros. Para outro domínio, configure `APP_ORIGIN` apenas se `RENDER_EXTERNAL_URL` não existir.

## Verificações

Execute `npm run build`, `npm test` e `node test-server.mjs`.

## Marcador de tempo

O modo autêntico segue o Manual do Coordenador ENEM 2025, seção 6.4, página 50: horários do dia são apagados quando atingidos, começando por 13h30 no início. O primeiro dia termina às 19h e o segundo às 18h30, com intervalos de 15 minutos nos últimos 30 minutos.

Fonte consultada (cópia pública do manual): https://pt.scribd.com/document/920895142/Enem-2025-Manual

O modo com cronômetro mantém etiquetas regressivas: a etiqueta 5h sai quando restam 4h30, preservando a convenção antiga de tempo restante. O manual ENEM 2013 contém uma tabela explícita dessa retirada: https://pt.scribd.com/doc/171588384/ENEM-2013-Manual-Chefe-de-Sala-Aplicador-5-7

## Estado da migração

Arquivos adaptados e testados localmente. A publicação no Render precisa da conexão com a conta e o repositório. O endereço anterior não é atualizado automaticamente por estes arquivos.
