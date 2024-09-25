const fs = require('fs');
const path = require('path');
const { makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');

// Path for the auth state
const authFilePath = path.resolve('./auth_info.json');

// Set up the authentication state
const { state, saveState } = useSingleFileAuthState(authFilePath);

// Create a WhatsApp socket connection
const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // Print QR code in terminal
});

// Save the authentication state whenever it updates
sock.ev.on('creds.update', saveState);

// Handle connection updates
sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
        const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed:', lastDisconnect.error, 'Reconnecting:', shouldReconnect);
        if (shouldReconnect) {
            startBot();
        }
    } else if (connection === 'open') {
        console.log('Connected successfully!');
    }
});

// Listen for incoming messages
sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.key.fromMe && msg.message.conversation) {
        const text = msg.message.conversation;

        // Command response handling
        if (text.toLowerCase() === 'hi') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Hello! How can I assist you today?' });
        } else if (text.toLowerCase() === 'help') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Available commands:\n1. Hi - Get a greeting\n2. Echo <message> - Repeat your message' });
        } else if (text.toLowerCase().startsWith('echo ')) {
            const echoMessage = text.slice(5); // Remove the 'echo ' part
            await sock.sendMessage(msg.key.remoteJid, { text: echoMessage });
        } else {
            // Default response for unrecognized commands
            await sock.sendMessage(msg.key.remoteJid, { text: "I'm sorry, I didn't understand that. Type 'help' for a list of commands." });
        }
    }
});

// Start the bot
function startBot() {
    console.log('Starting bot...');
}

startBot();
