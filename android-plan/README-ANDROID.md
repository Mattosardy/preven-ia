# Preven-IA Android

La primera app Android se plantea como **Preven-IA Compartir y Analizar**.

## Objetivo de v1

- El usuario usa el menu Compartir de Android desde WhatsApp, Telegram, Chrome u otra app.
- Preven-IA recibe texto o URLs compartidas.
- La app analiza con el motor local y, si esta configurado, con IA online mediante backend seguro.
- Muestra un resultado preventivo y orientativo.
- Permite abrir un enlace solo despues de mostrar el aviso y el resultado.

## Lo que NO hara v1

- No leera mensajes automaticamente.
- No accedera directamente a WhatsApp, Telegram ni otras apps.
- No pedira permisos de accesibilidad.
- No usara overlay.
- No monitoreara apps.
- No interceptara enlaces de forma global.
- No pedira SMS, contactos, ubicacion, camara, microfono ni archivos.

## Modo de uso esperado

1. El usuario recibe un mensaje o enlace sospechoso.
2. Toca Compartir.
3. Elige Preven-IA.
4. Preven-IA abre la pantalla de analisis con el texto recibido.
5. El usuario confirma el analisis.
6. La app muestra senales de riesgo y recomendacion orientativa.

## Preven-IA Protect — futuro

Una version futura podria ofrecer proteccion automatica sobre enlaces abiertos. Eso podria requerir overlay o accessibility service.

Estos permisos son sensibles y requieren justificacion fuerte ante Play Store. No se incluiran en v1. Primero se validara el uso con Share Target, sin permisos invasivos.

## Implementacion futura

La app real se puede construir en Android Studio/Kotlin o con un contenedor tipo Capacitor mas adelante. La web actual solo prepara el flujo y la documentacion.
