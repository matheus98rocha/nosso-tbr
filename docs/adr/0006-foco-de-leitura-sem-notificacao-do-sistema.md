# Foco de leitura sem notificação do sistema

**Status**: accepted

O Foco de leitura usa o Web Audio API para emitir o Aviso sonoro do foco quando o cronômetro chega a zero. O aviso não usa a API de notificações do sistema, não pede permissão adicional e não é enviado pelo servidor.

O áudio é desbloqueado no clique de Iniciar foco/Continuar, dentro do gesto do usuário, e o mesmo `AudioContext` é reutilizado no fim da contagem. Isso evita que a política de autoplay de navegadores móveis deixe o contexto suspenso quando o som disparar minutos depois.

**Consequências**: a sessão continua local ao navegador e não cria registro, não toca livros nem outros leitores. Não há fallback de notificação push, alarme do servidor ou som persistido entre recarregamentos. Navegadores sem Web Audio apenas não emitem som; o cronômetro segue funcional.
