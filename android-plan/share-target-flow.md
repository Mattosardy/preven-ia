# Share Target Flow

## Android

La app futura usara `ACTION_SEND` para recibir texto compartido.

## Flujo tecnico

1. Otra app dispara un Intent con `android.intent.action.SEND`.
2. MIME esperado: `text/plain`.
3. Preven-IA recibe `Intent.EXTRA_TEXT`.
4. La app extrae URLs si existen.
5. El texto completo se envia al motor de analisis local.
6. Si esta configurado, tambien puede consultar IA online mediante backend seguro.
7. La app renderiza el resultado.

## Importante

No se lee automaticamente la pantalla. No se accede a WhatsApp ni Telegram directamente. El usuario inicia el flujo con Compartir.
