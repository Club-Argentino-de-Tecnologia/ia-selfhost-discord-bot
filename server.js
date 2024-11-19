require('dotenv').config();
const { Client, Events, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Configuración
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const OLLAMA_URL = 'http://localhost:11434/api/chat';
const MODEL_NAME = 'openhermes';
const MAX_MESSAGES = 2; // Cantidad de mensajes a mantener en el contexto
const MAX_RETRY_ATTEMPTS = 3; // Intentos de reconexión con Ollama

// Almacenamiento de conversaciones por canal
const conversationHistory = new Map();

// Cliente de Discord con intents específicos
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
});

// Al inicio del archivo, después de las otras constantes
const MESSAGE_QUEUE = new Map();  // Cola de mensajes por canal
const RATE_LIMIT = {
    messages: 10,        // Mensajes permitidos
    timeWindow: 60000,   // Ventana de tiempo (1 minuto)
    cooldown: 5000       // Tiempo entre mensajes (5 segundos)
};
const PROCESSING = new Set(); // Set para trackear canales procesando

// Función para manejar el rate limiting
function isRateLimited(channelId) {
    const now = Date.now();
    const queue = MESSAGE_QUEUE.get(channelId) || { messages: [], lastProcess: 0 };
    
    // Limpiar mensajes viejos
    queue.messages = queue.messages.filter(time => now - time < RATE_LIMIT.timeWindow);
    
    // Verificar límites
    if (queue.messages.length >= RATE_LIMIT.messages) {
        return true;
    }
    
    // Verificar cooldown
    if (now - queue.lastProcess < RATE_LIMIT.cooldown) {
        return true;
    }
    
    return false;
}

// Evento Ready
client.once(Events.ClientReady, client => {
    console.log('Bot iniciado como:', client.user.tag);
    console.log('Usando modelo:', MODEL_NAME);
});

// Función para mantener el historial de conversación
function updateConversationHistory(channelId, userMessage, botResponse) {
    if (!conversationHistory.has(channelId)) {
        conversationHistory.set(channelId, []);
    }
    
    const history = conversationHistory.get(channelId);
    history.push(
        { role: "user", content: userMessage },
        { role: "assistant", content: botResponse }
    );
    
    // Mantener solo los últimos MAX_MESSAGES mensajes
    while (history.length > MAX_MESSAGES * 2) { // *2 porque cada interacción tiene 2 mensajes
        history.shift();
    }
    
    conversationHistory.set(channelId, history);
}

const OLLAMA_OPTIONS = {
    temperature: 0.8,    // Un poco más controlado
    num_predict: 256,    // Respuestas MUY concisas
    top_k: 40,
    top_p: 0.9,
    repeat_penalty: 1.1  // Evita repeticiones
};


// Función para obtener respuesta de Ollama
async function getOllamaResponse(channelId, prompt, retryCount = 0) {
    try {
        // Construir el historial de mensajes
        const history = conversationHistory.get(channelId) || [];
        const messages = [
            { role: "system", content: process.env.SYSTEM_PROMPT },
            ...history,
            { role: "user", content: prompt }
        ];
        console.log(messages);

        const response = await axios.post(OLLAMA_URL, {
            model: MODEL_NAME,
            messages: messages,
            stream: false,
            options: OLLAMA_OPTIONS
        });

        const botResponse = response.data.message.content;
        console.log("RESPONSE:",response.data.message.content);
        updateConversationHistory(channelId, prompt, botResponse);
        return botResponse;

    } catch (error) {
        console.error('Error al comunicarse con Ollama:', error);
        
        // Intentar reconectar si es un error de conexión
        if (retryCount < MAX_RETRY_ATTEMPTS) {
            console.log(`Intento de reconexión ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return getOllamaResponse(channelId, prompt, retryCount + 1);
        }
        
        return 'Michi está durmiendo en este momento, se levantará sola o un administrador irá a despertarla en cuanto pueda 😴';
    }
}

// Evento MessageCreate
// Actualizar el event handler de mensajes
client.on(Events.MessageCreate, async interaction => {
    // Verificar si el mensaje menciona al bot
    if (!interaction.mentions.has(client.user.id) || 
        interaction.author.bot || 
        interaction.channel.id !== CHANNEL_ID) return;

    const channelId = interaction.channel.id;

    // Remover la mención del bot del mensaje para procesarlo
    const content = interaction.content
        .replace(`<@${client.user.id}>`, '')
        .trim();

    // Si el mensaje está vacío después de remover la mención, ignorar
    if (!content) return;

    // Verificar si el canal está siendo procesado
    if (PROCESSING.has(channelId)) {
        await interaction.reply("¡Pará un toque! Todavía estoy pensando la respuesta anterior 😅");
        return;
    }

    // El resto del código sigue igual...
    if (isRateLimited(channelId)) {
        await interaction.reply("Che, más despacio! Necesito un respiro 🧉 Probá en unos segundos.");
        return;
    }

    try {
        PROCESSING.add(channelId);
        await interaction.channel.sendTyping();

        const queue = MESSAGE_QUEUE.get(channelId) || { messages: [], lastProcess: 0 };
        queue.messages.push(Date.now());
        queue.lastProcess = Date.now();
        MESSAGE_QUEUE.set(channelId, queue);

        // Usar el contenido sin la mención
        const response = await getOllamaResponse(channelId, content);

        if (response.length > 2000) {
            const chunks = response.match(/.{1,2000}/g);
            for (const chunk of chunks) {
                await interaction.reply(chunk);
            }
        } else {
            await interaction.reply(response);
        }

    } catch (error) {
        console.error('Error al procesar mensaje:', error);
        await interaction.reply('Disculpá, ocurrió un error al procesar tu mensaje.');
    } finally {
        PROCESSING.delete(channelId);
    }
});

// Función para limpiar colas periódicamente
setInterval(() => {
    const now = Date.now();
    for (const [channelId, queue] of MESSAGE_QUEUE.entries()) {
        queue.messages = queue.messages.filter(time => now - time < RATE_LIMIT.timeWindow);
        if (queue.messages.length === 0) {
            MESSAGE_QUEUE.delete(channelId);
        }
    }
}, 60000); // Limpiar cada minuto

// Manejo de errores
client.on(Events.Error, error => {
    console.error('Error del cliente:', error);
});

// Comando para limpiar el historial de un canal
client.on(Events.MessageCreate, async interaction => {
    if (interaction.content === '!limpiar-historia') {
        conversationHistory.delete(interaction.channel.id);
        await interaction.reply('Historia de conversación limpiada 🧹');
    }
});

// Iniciar el bot
client.login(process.env.DISCORD_TOKEN);