const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const { exec } = require('child_process');

module.exports = {
    name: 'ping',
    description: 'Effectue un ping sur une adresse IP et un port spécifiques ou une requête HTTP vers un site web.',
    async execute(message, args) {
        // Supprimer le message de l'utilisateur
        message.delete().catch(console.error);

        // Vérifie que le nombre d'arguments est correct
        if (args.length !== 1 && args.length !== 2) {
            return sendErrorMessage(message, 'Veuillez fournir un "target" ou une "URL". Exemple : ping 1.1.1.1 ou .ping https://example.com');
        }

        const target = args[0];
        const port = args[1] || '';

        // Vérifie que le premier argument est soit une URL valide, soit une adresse IP
        const isValidURL = target.startsWith('http://') || target.startsWith('https://');
        const isValidIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(target);

        if (!isValidURL && !isValidIP) {
            return sendErrorMessage(message, 'Veuillez fournir une adresse IP valide ou une URL commençant par http:// ou https://');
        }

        if (isValidURL) {
            // C'est une URL
            try {
                const httpResults = [];
                for (let i = 0; i < 20; i++) {
                    const start = Date.now();
                    const response = await axios.get(target);
                    const end = Date.now();
                    const responseTime = end - start;
                    const statusCode = response.status;
                    httpResults.push({ responseTime, statusCode });
                }
                await sendHTTPEmbed(message, target, httpResults);
            } catch (error) {
                console.error(error);
                sendErrorMessage(message, 'Une erreur s\'est produite lors de la requête HTTP.');
            }
        } else if (isValidIP) {
            // C'est une adresse IP
            let pingResults = [];
            let errorSent = false;

            for (let i = 0; i < 20; i++) {
                exec(`ping -c 1 ${target} ${port ? `-p ${port}` : ''}`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        return;
                    }
                    const regex = /time=([\d.]+) ms/g;
                    const match = regex.exec(stdout);
                    if (match) {
                        pingResults.push(parseFloat(match[1]));
                    } else {
                        pingResults.push('Timeout');
                    }
                    if (pingResults.length === 20) {
                        if (!errorSent) {
                            sendPingEmbed(message, target, port, pingResults);
                            errorSent = true;
                        }
                    }
                });
            }

            // Si aucun résultat n'a été ajouté, c'est que la commande ping n'a pas fonctionné
            setTimeout(() => {
                if (pingResults.length === 0 && !errorSent) {
                    sendPingError(message, target, port);
                }
            }, 5000);
        }
    }
};

async function sendPingEmbed(message, ip, port, pingResults) {
    const embed = new MessageEmbed()
        .setTitle('🔍 Résultats du Ping')
        .setDescription(`Résultats pour ${ip}`)
        .setColor('#FF5733');

    pingResults.forEach((result, index) => {
        let status = result === 'Timeout' ? '❌' : '✅';
        let fieldValue = result === 'Timeout' ? 'Timeout' : `Réponse en ${result} ms`;
        // Ajout de la vérification pour éviter les champs vides
        if (status && fieldValue) {
            embed.addField(`Node ${index + 1}`, `${status} ${fieldValue} (Status ${status === '❌' ? 'None' : '200'})`);
        }
    });

    // Vérifier si des champs ont été ajoutés avant d'envoyer l'embed
    if (embed.fields.length > 0) {
        try {
            await message.author.send({ embeds: [embed] });
            await message.channel.send(`${message.author}, ✅ les résultats du ping ont été envoyés en DM !`)
                .then(msg => setTimeout(() => msg.delete().catch(console.error), 10000))
                .catch(error => console.error("Erreur lors de l'envoi du message :", error));
        } catch (error) {
            if (error.code === 50007) { // Cannot send messages to this user
                await message.channel.send(`${message.author}, ❌ Impossible de vous envoyer un message privé. Veuillez vérifier vos paramètres de confidentialité.`);
            } else {
                console.error("Erreur lors de l'envoi du message en DM :", error);
            }
        }
    } else {
        sendErrorMessage(message, "Aucun résultat n'a été obtenu pour le ping.");
    }
}

async function sendHTTPEmbed(message, url, httpResults) {
    const embed = new MessageEmbed()
        .setTitle('🔍 Résultats de la requête HTTP')
        .setDescription(`Résultats pour ${url}`)
        .setColor('#FF5733');

    httpResults.forEach((result, index) => {
        const status = result.statusCode === 200 ? '✅' : '❌';
        embed.addField(`Node ${index + 1}`, `${status} Réponse en ${result.responseTime} ms (Status ${result.statusCode})`);
    });

    try {
        await message.author.send({ embeds: [embed] });
        await message.channel.send(`${message.author}, ✅ les résultats de la requête HTTP ont été envoyés en DM !`)
            .then(msg => setTimeout(() => msg.delete().catch(console.error), 10000))
            .catch(error => console.error("Erreur lors de l'envoi du message :", error));
    } catch (error) {
        if (error.code === 50007) { // Cannot send messages to this user
            await message.channel.send(`${message.author}, ❌ Impossible de vous envoyer un message privé. Veuillez vérifier vos paramètres de confidentialité.`);
        } else {
            console.error("Erreur lors de l'envoi du message en DM :", error);
        }
    }
}

async function sendPingError(message, ip, port) {
    const embed = new MessageEmbed()
        .setTitle('❌ Erreur lors du Ping')
        .setDescription(`La cible ${ip}${port ? `:${port}` : ''} n'a pas répondu.`)
        .setColor('#FF5733');

    try {
        await message.author.send({ embeds: [embed] });
    } catch (error) {
        if (error.code === 50007) { // Cannot send messages to this user
            await message.channel.send(`${message.author}, ❌ Impossible de vous envoyer un message privé. Veuillez vérifier vos paramètres de confidentialité.`);
        } else {
            console.error("Erreur lors de l'envoi du message en DM :", error);
        }
    }
}

function sendErrorMessage(message, errorText) {
    message.channel.send(`${message.author}, ${errorText}`)
        .then(msg => setTimeout(() => msg.delete().catch(console.error), 10000))
        .catch(error => console.error("Erreur lors de l'envoi du message :", error));
}
