const { MessageEmbed } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'methods',
    description: "Affiche la liste des méthodes disponibles.",
    async execute(message) {
        await message.delete().catch(error => console.error("❌ Erreur lors de la suppression du message:", error));

        const standardMethodsList = config.METHODS_NOVIP.map(method => `**${method}**`);
        const vipMethodsList = config.VIP_METHODS.map(method => `**${method}** (VIP)`);

        const embed = new MessageEmbed()
        .setTitle("🔥 $tresser Methods 🔥")
        .setDescription("💡 Voici la liste des méthodes disponibles pour vos tests :")
        .addField("Légende :", "L3: 🏆\nL4: 🚀\nL7: ⏳")
        .setColor(0x0099FF)
        .setFooter("🚫 Utilisez ces méthodes avec précaution. Pour plus d'informations, contactez le Support: t.me/royal_faq. 🚫");
    
        if (standardMethodsList.length > 0) {
            embed.addFields({ name: "🍏 Méthodes Standards Disponibles", value: standardMethodsList.join("\n"), inline: true });
        }

        if (vipMethodsList.length > 0) {
            embed.addFields({ name: "⭐ Méthodes VIP Disponibles", value: vipMethodsList.join("\n"), inline: true });
        }

        try {
            if (!message.author.dmChannel) {
                await message.author.createDM();
            }
            await message.author.send({ embeds: [embed] });
            message.channel.send(`${message.author}, ✅ la liste des méthodes a été envoyée en DM !`).then(msg => {
                setTimeout(() => msg.delete().catch(error => console.error("Erreur lors de la suppression du message:", error)), 10000);
            }).catch(error => console.error("Erreur lors de l'envoi du message:", error));
        } catch (error) {
            if (error.code === 50007) {
                message.channel.send(`${message.author}, je ne peux pas vous envoyer de messages privés. Veuillez vérifier vos paramètres de confidentialité. ❌`).then(msg => {
                    setTimeout(() => msg.delete().catch(error => console.error("Erreur lors de la suppression du message:", error)), 10000);
                }).catch(error => console.error("Erreur lors de l'envoi du message:", error));
            } else {
                console.error("❌Erreur lors de l'envoi du message en DM:", error);
                message.channel.send("Erreur inattendue lors de l'envoi des méthodes en DM. ❌").then(msg => {
                    setTimeout(() => msg.delete().catch(error => console.error("Erreur lors de la suppression du message:", error)), 10000);
                }).catch(error => console.error("Erreur lors de l'envoi du message:", error));
            }
        }
    }
};
