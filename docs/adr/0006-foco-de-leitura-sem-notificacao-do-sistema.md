# Foco de leitura sem notificação do sistema

**Status**: superseded by ADR-0007

O Foco de leitura usa o Web Audio API para emitir o Aviso sonoro do foco quando o cronômetro chega a zero. O aviso não usa a API de notificações do sistema, não pede permissão adicional e não é enviado pelo servidor.

O áudio é desbloqueado no clique de Iniciar foco/Continuar, dentro do gesto do usuário, e o mesmo `AudioContext` é reutilizado no fim da contagem. Isso evita que a política de autoplay de navegadores móveis deixe o contexto suspenso quando o som disparar minutos depois.

**Consequências**: a decisão de não usar notificação do sistema permanece, mas a sessão deixou de ser efêmera: o ADR 0007 passou a cobrir vínculo com livro, páginas lidas e persistência local. Não há fallback de notificação push nem alarme do servidor. Navegadores sem Web Audio apenas não emitem som; o cronômetro segue funcional.
