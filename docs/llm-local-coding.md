# Guia Definitivo: Assistente de Código AI 100% Local, Privado e Gratuito no VS Code

Este guia ensina a configurar um assistente de IA estilo Cursor / Claude Code rodando inteiramente na sua máquina (via Ollama e Cline), com controle por workspace, interface gráfica amigável e privacidade total de dados.

---

## 🔒 1. Privacidade, Segurança e Confiança

- 100% Offline e Local: O Ollama executa o modelo diretamente no seu processador e memória RAM (localhost:11434). Nenhuma linha de código, prompt ou contexto do projeto sai do seu computador.
- Sem Conexão Externa: Você pode desligar totalmente o Wi-Fi e a internet da sua máquina e todo o sistema continuará funcionando perfeitamente no VS Code.
- Código Aberto e Auditável: Tanto o Ollama quanto a extensão Cline possuem código fonte 100% aberto e auditável pela comunidade global de desenvolvedores.
- Zero Risco de Vazamento: Diferente de IAs na nuvem (ChatGPT, Claude Online, GitHub Copilot), seus dados não são enviados para nenhum servidor e não são utilizados para treinar modelos de terceiros.

---

## 🛠️ 2. Especificações do Seu Hardware

Configuração verificada no seu sistema Ubuntu:
- Sistema Operacional: Ubuntu 24.04 LTS
- Processador: Intel Core Ultra 5 235U (14 núcleos)
- Memória RAM: 16 GB (memória compartilhada para CPU e GPU integrada)
- Modelo de IA Recomendado: qwen2.5-coder:7b (Consumo equilibrado de RAM: ~4.7 GB)

---

## 🚀 3. Passo a Passo Completo de Instalação e Configuração

### Passo 1: Instalar o Servidor Local Ollama

1. Abra o terminal do Ubuntu (Ctrl + Alt + T).
2. Execute o comando oficial de instalação:
   curl -fsSL https://ollama.com/install.sh | sh
3. Confirme que a instalação foi concluída com sucesso verificando a versão:
   ollama --version
4. O serviço do Ollama é iniciado automaticamente em segundo plano no Ubuntu rodando no endereço http://localhost:11434.

---

### Passo 2: Baixar e Testar o Modelo de IA de Código

1. No mesmo terminal, baixe o modelo especialista em programação (Qwen 2.5 Coder 7B):
   ollama pull qwen2.5-coder:7b
   (Aguarde o download dos arquivos de aproximadamente 4.7 GB).

2. Faça um teste direto no terminal para garantir que o modelo responde corretamente:
   ollama run qwen2.5-coder:7b "Escreva uma função simples de ordenação em Python"
3. Para fechar a interatividade do terminal após o teste, pressione Ctrl + D.

---

### Passo 3: Instalar a Extensão Cline no VS Code

O Cline é a extensão para VS Code com a interface mais parecida com o Cursor AI e Claude Code (permite chat lateral, edição visual de código com diff lado a lado, aceitar/rejeitar alterações e visualização clara do projeto).

1. Abra o seu VS Code.
2. Acesse o painel de Extensões clicando no ícone lateral ou pressionando Ctrl + Shift + X.
3. Digite Cline na barra de pesquisa.
4. Clique no botão Instalar (Install).
5. Após a instalação, um ícone de um robô/extensão do Cline ficará disponível na barra lateral esquerda do seu VS Code.

---

### Passo 4: Conectar o Cline ao Ollama Local

1. Clique no ícone do Cline na barra lateral esquerda do VS Code.
2. Clique no ícone de Engrenagem ⚙️ (Configurações / Settings) localizado no canto superior direito do painel do Cline.
3. Altere e preencha as configurações do provedor da seguinte forma:
   - API Provider: Selecione "Ollama".
   - Ollama Base URL: Deixe o valor padrão http://localhost:11434.
   - Model ID: Selecione ou digite exatamente qwen2.5-coder:7b.
4. Clique em Done ou Save no rodapé para salvar as configurações.

---

### Passo 5: Configuração Exclusiva por Workspace / Projeto

Se você deseja que a IA funcione de forma personalizada e restrita a apenas um projeto específico (sem ler pastas pesadas ou desnecessárias):

1. Abra o projeto no VS Code (Arquivo > Abrir Pasta... ou File > Open Folder...).
2. Na raiz do seu projeto, crie um arquivo chamado .clinerules com as instruções do que a IA deve ou não fazer:

   [Conteúdo do arquivo .clinerules]:
   # Regras do Projeto
   - Escreva código limpo, moderno e otimizado.
   - Não faça commits no Git automaticamente; apenas altere os arquivos e me mostre.
   - Sempre responda em Português do Brasil.
   - Mantenha o estilo e convenções já existentes no código deste repositório.

3. Na raiz do seu projeto, crie também um arquivo chamado .clineignore para evitar que a IA gaste memória lendo pastas pesadas:

   [Conteúdo do arquivo .clineignore]:
   node_modules/
   .venv/
   venv/
   dist/
   build/
   .git/
   *.log

---

## 🎯 4. Como Usar no Dia a Dia (Estilo Cursor / Claude)

1. Abra o VS Code na pasta do seu projeto.
2. Abra o painel do Cline na barra lateral esquerda.
3. Digite o que você precisa em linguagem natural. Exemplos:
   - "Crie uma função para validar formulário no arquivo validation.js"
   - "Refatore a função X do arquivo main.py para tratar exceções"
   - "Explique como funciona a lógica deste arquivo aberto"
4. Visualização das Alterações: O Cline vai propor as alterações direto no código mostrando uma tela de Diff (comparando o código original e o código novo lado a lado).
5. Aprovação Manual: Você terá botões claros para clicar em Accept (Aceitar) ou Reject (Rejeitar) cada alteração.
6. Commits e Git: Toda a gestão de versionamento (git add, git commit, git push) permanece 100% sob seu controle manual pelo terminal do VS Code.

---

## 🧹 Passo Extra: Como Desinstalar e Remover Tudo (Limpeza Completa)

Caso deseje remover completamente a ferramenta, o modelo baixado e todas as configurações da sua máquina Ubuntu, siga os passos abaixo no terminal.

### 1. Remover o modelo baixado (liberar espaço em disco)
Antes de apagar o serviço, remova o modelo de 4.7 GB para limpar o espaço:

   ollama rm qwen2.5-coder:7b

### 2. Parar e desativar o serviço do Ollama
Pare a execução do servidor em segundo plano e remova sua inicialização com o sistema:

   sudo systemctl stop ollama
   sudo systemctl disable ollama
   sudo rm /etc/systemd/system/ollama.service

### 3. Remover os arquivos executáveis do Ollama
Apague o binário e a biblioteca instalados no sistema:

   sudo rm $(which ollama)
   sudo rm -r /usr/local/lib/ollama

### 4. Remover o usuário e grupo criados pelo sistema
Remova o usuário do sistema e os grupos associados criados durante a instalação:

   sudo userdel ollama
   sudo groupdel ollama

### 5. Apagar pastas de dados e configurações restantes
Exclua a pasta oculta de modelos e caches mantidos no sistema e no seu usuário:

   sudo rm -rf /usr/share/ollama
   rm -rf ~/.ollama

### 6. Desinstalar a extensão no VS Code
1. Abra o VS Code.
2. Vá em Extensões (Ctrl + Shift + X).
3. Procure por "Cline", clique no ícone de engrenagem ao lado dele e selecione "Desinstalar".
4. Caso tenha criado arquivos no seu projeto, basta deletar os arquivos .clinerules e .clineignore da pasta.






----------------------------


# Guia Completo: Instalação, Uso e Desinstalação do Aider (Via Terminal/VS Code)

Este guia ensina a instalar, configurar e desinstalar o Aider, o agente de IA para código mais leve e rápido para rodar 100% localmente com o Ollama no Ubuntu.

---

## 🔒 Vantagens do Aider no seu Setup
- Baixíssimo uso de RAM e CPU: Não gasta recursos processando interfaces visuais complexas.
- Zero commits automáticos: Configurado para apenas editar o código na sua tela e deixar o versionamento sob seu controle manual.
- Foco em arquivos específicos: Permite adicionar apenas o arquivo que você quer alterar.

---

## 🚀 Passo 1: Instalação do Aider no Ubuntu

1. Abra o terminal do seu sistema ou o terminal integrado do VS Code (Ctrl + ').
2. Certifique-se de ter o Python 3 e o gerenciador pip instalados:
   sudo apt update
   sudo apt install -y python3-pip python3-venv

3. Instale o Aider diretamente via pip:
   python3 -m pip install -U aider-chat

4. Verifique se a instalação foi bem-sucedida:
   aider --version

---

## 🎯 Passo 2: Como Usar no Dia a Dia (Estilo Claude/Cursor)

1. Abra a pasta do seu projeto no VS Code.
2. Abra o terminal integrado do VS Code (Ctrl + ').
3. Inicie o Aider conectando ao seu modelo leve do Ollama e desativando o commit automático:

   aider --model ollama_chat/qwen2.5-coder:7b-instruct-q4_K_M --no-auto-commits

4. Adicione apenas o arquivo que você deseja modificar à sessão de conversa (isso garante velocidade máxima):
   /add src/core/events/domain-events.spec.ts

5. Digite a instrução diretamente no terminal:
   Altere todas as importações e asserções do Vitest para usar o Jest.

6. O Aider aplicará as alterações direto no arquivo aberto no seu editor do VS Code.
7. Para encerrar a sessão do Aider, digite:
   /exit

---

## 🧹 Passo 3: Como Desinstalar o Aider Completamente

Se desejar remover o Aider e seus arquivos de configuração da sua máquina:

1. Abra o terminal do Ubuntu (Ctrl + Alt + T).
2. Remova o pacote do Aider usando o pip:
   python3 -m pip uninstall -y aider-chat

3. Apague as pastas ocultas de configurações e histórico que ele cria no seu sistema:
   rm -rf ~/.aider
   rm -f .aider*

4. Confirme que ele foi desinstalado tentando rodar o comando:
   aider --version
   (Deve retornar a mensagem "comando não encontrado").
