const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../config.json'); 

module.exports = {
    name: 'lookupcfx',
    description: 'Recherche les informations d\'un serveur FiveM via le suffixe CFX et les informations IP si disponibles.',
    async execute(message, args) {
        message.delete({ timeout: 5000 }).catch(console.error);

        if (!args[0]) {
            message.author.send("💡 Usage: `.lookupcfx <code_suffix>` ")
                .catch(() => message.channel.send(`${message.author}, je ne peux pas t'envoyer de messages privés. Assure-toi que tes MP sont ouverts!`).then(msg => msg.delete({ timeout: 5000 })));
            return;
        }

        const code_suffix = args[0];
        const serverDataUrl = `http://45.11.59.150:8000/GitHub/Royaloakap/cfxResolver/?cfx=${code_suffix}`;

        try {
            const serverResponse = await fetch(serverDataUrl);
            if (!serverResponse.ok) throw new Error("Échec de récupération des détails du serveur");

            const serverData = await serverResponse.json();
            const ip = serverData['Server IP'] || 'Non disponible ❌';
            const port = serverData['Server Port'] || 'Non disponible ❌';

            const embed = new MessageEmbed()
                .setTitle("🌐 Informations du serveur CFX 🌐")
                .setColor(0x3498db) 
                .addField("🔗 IP", ip, true)
                .addField("🚪 Port", port, true);
            if (ip && ip !== 'Non disponible ❌') {
                const ipInfo = await fetchIpInfo(ip);
                if (ipInfo) {
                    embed.addField("🌍 Pays", ipInfo.country ?? 'Non disponible ❌', true)
                         .addField("📍 Région", ipInfo.region ?? 'Non disponible ❌', true)
                         .addField("🏙️ Ville", ipInfo.city ?? 'Non disponible ❌', true)
                         .addField("📮 Code postal", ipInfo.postal ?? 'Non disponible ❌', true)
                         .addField("💻 Fournisseur d'accès", ipInfo.org ?? 'Non disponible ❌', true)
                         .addField("⏰ Fuseau horaire", ipInfo.timezone ?? 'Non disponible ❌', true);
                }
            }

            message.author.send({ embeds: [embed] })
                .catch(() => message.channel.send(`${message.author}, je ne peux pas t'envoyer de messages privés. Assure-toi que tes MP sont ouverts!`).then(msg => msg.delete({ timeout: 5000 })));
        } catch (error) {
            console.error("Erreur lors de la récupération ou de l'envoi des détails du serveur:", error);
            message.author.send("Erreur lors de la récupération des détails du serveur. ❌")
                .catch(() => message.channel.send(`${message.author}, je ne peux pas t'envoyer de messages privés. Assure-toi que tes MP sont ouverts!`).then(msg => msg.delete({ timeout: 5000 })));
        }
    }
};

async function fetchIpInfo(ip) {
    const infoUrl = `https://ipinfo.io/${ip}/json`;
    try {
        const response = await fetch(infoUrl);
        if (!response.ok) throw new Error("Échec de récupération des détails de l'IP");
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des détails IP:", error);
        return null;
    }
}
