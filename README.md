# Michi Bot 🐱
> La primera IA Argentina descentralizada, un proyecto del Club Argentino de Tecnología

## Sobre el Proyecto 🚀

Michi es un bot de Discord impulsado por modelos de IA open source que corre localmente en computadoras argentinas. Es parte de nuestra iniciativa de soberanía tecnológica, permitiendo que cualquier miembro del club pueda tener su propia instancia de IA corriendo en su hardware.

### Características principales ✨
- 🤖 Bot de Discord personalizado
- 💻 Corre localmente usando Ollama
- 🧠 Usa modelos de IA open source
- 🎯 Optimizado para hardware común
- 🔄 Sistema de memoria de conversación
- ⚡ Rate limiting inteligente

## Requisitos Técnicos 📋

### Hardware
- CPU: Intel i5/i7 o equivalente
- RAM: 8GB mínimo (16GB recomendado)
- Espacio en disco: 10GB libres

### Software
- Node.js 18+
- npm
- Ollama
- Conexión a Internet estable

## Instalación 🛠️

1. Cloná el repositorio:
```bash
git clone https://github.com/cat-org/michi-bot
cd michi-bot
```

2. Instalá las dependencias:
```bash
npm install
```

3. Instalá Ollama:
```bash
curl https://ollama.ai/install.sh | sh
```

4. Descargá el modelo de IA:
```bash
ollama pull openhermes
```

5. Configurá el archivo `.env`:
```env
DISCORD_TOKEN=tu_token_de_discord
DISCORD_CHANNEL_ID=id_del_canal_discord
SYSTEM_PROMPT=tu_prompt_personalizado
```

## Uso 🎮

1. Iniciá Ollama:
```bash
ollama serve
```

2. En otra terminal, iniciá el bot:
```bash
node server.js
```

3. En Discord, mencioná a @Michi para interactuar:
```
@Michi hola! 
```

### Comandos Disponibles
- `!limpiar-historia` - Limpia el historial de conversación

## Configuración ⚙️

### Rate Limiting
```javascript
const RATE_LIMIT = {
    messages: 10,        // Mensajes por minuto
    timeWindow: 60000,   // Ventana de tiempo
    cooldown: 5000       // Tiempo entre mensajes
};
```

### Opciones de Ollama
```javascript
const OLLAMA_OPTIONS = {
    temperature: 0.8,    // Creatividad
    num_predict: 256,    // Longitud máxima
    top_k: 40,          // Diversidad
    top_p: 0.9,         // Coherencia
    repeat_penalty: 1.1  // Penalización repetición
};
```

## Solución de Problemas 🔧

### CPU al máximo
- Ajustá `num_predict` a un valor más bajo
- Reducí `MAX_MESSAGES` para menos contexto
- Cerrá aplicaciones innecesarias

### Respuestas lentas
- Verificá que Ollama esté corriendo
- Usá `!limpiar-historia` 
- Revisá el rate limiting

### Bot no responde
- Asegurate de mencionar @Michi
- Verificá permisos del bot
- Chequeá los logs

## Contribuciones 🤝

¡Tu ayuda es bienvenida! Podés contribuir:
- Reportando bugs
- Sugiriendo mejoras
- Optimizando el código
- Mejorando la documentación

### Proceso
1. Forkeá el repo
2. Creá tu branch (`git checkout -b feature/nueva-feature`)
3. Commiteá tus cambios (`git commit -m 'Agrego nueva feature'`)
4. Pusheá a tu branch (`git push origin feature/nueva-feature`)
5. Abrí un Pull Request

## Recursos 📚

- [Discord.js Docs](https://discord.js.org/)
- [Ollama Docs](https://ollama.ai/docs)
- [Node.js Docs](https://nodejs.org/docs)

## Soporte 💬

- Discord: [Server del CAT](https://discord.gg/rJBsGbNM)
- GitHub Issues
- Autor: Andy Cufari
- Email: [andres@cm64.studio](mailto:andres@cm64.studio)

## Licencia 📄

Este proyecto está bajo la Licencia MIT. 

---

Hecho con 💙 por el Club Argentino de Tecnología

¿Preguntas? Unite a nuestro [Discord](https://discord.gg/rJBsGbNM) y charlamos.