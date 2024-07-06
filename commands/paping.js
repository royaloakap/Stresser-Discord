const { MessageEmbed } = require('discord.js');
const { execSync } = require('child_process');

module.exports = {
    name: 'paping',
    description: 'Effectue un ping sur une adresse IP et un port spécifiques.',
    async execute(message, args) {
        // Supprimer le message de l'utilisateur
        message.delete().catch(console.error);

        // Vérifie que le nombre d'arguments est correct
        if (args.length !== 2) {
            return sendErrorMessage(message, 'Veuillez fournir une adresse IP et un port. Exemple : !paping 84.32.26.12 30126');
        }

        const ip = args[0];
        const port = args[1];

        // Vérifie que le premier argument est une adresse IP valide
        const isValidIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
        if (!isValidIP) {
            return sendErrorMessage(message, 'Veuillez fournir une adresse IP valide.');
        }

        // Vérifie que le second argument est un port valide (nombre entier)
        const isValidPort = /^\d+$/.test(port) && parseInt(port, 10) <= 65535;
        if (!isValidPort) {
            return sendErrorMessage(message, 'Veuillez fournir un port valide (nombre entier entre 1 et 65535).');
        }

        // Vérifie si les DM sont ouverts
        let dmChannel = message.author.dmChannel;
        if (!dmChannel) {
            try {
                dmChannel = await message.author.createDM();
            } catch (error) {
                return message.channel.send(`${message.author}, ❌ Veuillez ouvrir vos messages privés avec le bot pour utiliser cette commande.`);
            }
        }

        // Effectuer le scan de port avec nmap
        try {
            const output = execSync(`nmap -p ${port} ${ip}`).toString();
            const results = output.includes('open') ? 'open' : 'closed';
            const nodeResults = extractNodeResults(output); // Fonction pour extraire les résultats des nœuds
            sendNmapEmbed(message, ip, port, results, nodeResults);
        } catch (error) {
            console.error(`exec error: ${error}`);
            return sendErrorMessage(message, 'Une erreur s\'est produite lors de l\'exécution de la commande nmap.');
        }
    }
};

// Fonction pour extraire les résultats des nœuds
function extractNodeResults(output) {
    const regex = /Node\s+(\d+)\s+([\w.]+)\s+ms/g;
    const nodeResults = [];
    let match;
    while ((match = regex.exec(output)) !== null) {
        nodeResults.push(match[2]); // Ajouter le temps de réponse du nœud au tableau des résultats
    }
    return nodeResults;
}

async function sendNmapEmbed(message, ip, port, result, nodeResults) {
    const status = result === 'open' ? '✅' : '❌';
    const description = result === 'open' ? `Le port ${port} est ouvert sur ${ip}.` : `Le port ${port} est fermé sur ${ip}.`;

    const embed = new MessageEmbed()
        .setTitle('🔍 Résultats du Scan de Port')
        .setDescription(`Résultats pour ${ip}:${port}`)
        .addField('Statut', `${status} ${description}`)
        .setColor('#FF5733');

    // Ajouter les résultats des nœuds
    nodeResults.forEach((result, index) => {
        let status = result === 'Timeout' ? '❌' : '✅';
        let fieldValue = result === 'Timeout' ? 'Timeout' : `Réponse en ${result} ms`;
        // Ajout de la vérification pour éviter les champs vides
        if (status && fieldValue) {
            embed.addField(`Node ${index + 1}`, `${status} ${fieldValue} (Status ${status === '❌' ? 'None' : '200'})`);
        }
    });

    try {
        await message.author.send({ embeds: [embed] });
        await message.channel.send(`${message.author}, ✅ les résultats du scan de port ont été envoyés en DM !`)
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

function sendErrorMessage(message, errorText) {
    message.channel.send(`${message.author}, ${errorText}`)
        .then(msg => setTimeout(() => msg.delete().catch(console.error), 10000))
        .catch(error => console.error("Erreur lors de l'envoi du message :", error));
}
