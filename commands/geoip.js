const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../config.json');

module.exports = {
    name: 'geoip',
    description: 'Rechercher les détails d\'une adresse IP et envoyer les informations via message privé',
    async execute(message, args) {
        deleteMessage(message);

        const sendMessage = async (target, content) => {
            try {
                if (!target.dmChannel) {
                    await target.createDM();
                }
                await target.send(content);
            } catch (error) {
                if (error.code === 50007) {
                    const msg = await message.channel.send(`${target}, je ne peux pas t'envoyer de messages privés. Assure-toi que tes MP sont ouverts!`);
                    setTimeout(() => msg.delete(), 5000);
                } else {
                    console.error("❌Erreur lors de l'envoi d'un message privé:", error);
                }
            }
        };

        const isValidIp = (ip) => {
            const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            return ipRegex.test(ip);
        };

        const [ip] = args;
        if (!ip || !isValidIp(ip)) {
            await sendMessage(message.author, "💡 Usage: `.geoip <IP>` \nAssurez-vous que vous entrez une adresse IP valide.");
            return;
        }

        const infoUrl = `https://ipinfo.io/${ip}/json`;
        try {
            const response = await fetch(infoUrl);
            if (!response.ok) throw new Error("❌ Échec de récupération des détails de l'IP ❌");

            const ipDetails = await response.json();
            const embed = new MessageEmbed()
                .setTitle("🚀 Informations sur l'IP")
                .setColor(0x1D82B6)
                .addField("IP", ipDetails.ip ?? '✨', true)
                .addField("📍Région", ipDetails.region ?? '✨', true)
                .addField("🌍Pays", ipDetails.country ?? '✨', true)
                .addField("🏙️Ville", ipDetails.city ?? '✨', true)
                .addField("📮Code postal", ipDetails.postal ?? '✨', true)
                .addField("💻Fournisseur d'accès", ipDetails.org ?? '✨', true)
                .addField("💥AS", ipDetails.as ?? '✨', true)
                .addField("🚀Org", ipDetails.org ?? '✨', true)
                .addField("⏰Fuseau horaire", ipDetails.timezone ?? '✨', true);
            await sendMessage(message.author, { embeds: [embed] });
        } catch (error) {
            console.error("❌Erreur lors de la récupération ou de l'envoi des détails IP:", error);
            await sendMessage(message.author, "Erreur lors de la récupération des détails IP. ❌");
        }
    }
};

function deleteMessage(message) {
    setTimeout(() => {
        message.delete().catch(err => console.error("Erreur lors de la suppression du message:", err));
    }, 3000);
}
