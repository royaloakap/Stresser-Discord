const { MessageEmbed } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/buyers.db');
module.exports = {
    name: 'myplan',
    description: '💡 Affiche les détails de votre plan dans la base de données.',
    execute(message) {
        message.delete().catch(console.error);

        db.get("SELECT max_time, concurrents, vip, plan_end_time FROM buyers WHERE user_id = ?", [message.author.id], async (err, row) => {
            if (err) {
                console.error(err.message);
                sendErrorMessage(message.author, "❌Erreur lors de la récupération des données de votre plan.❌");
                return;
            }
            if (!row) {
                sendErrorMessage(message.author, "❌Aucun plan enregistré dans la base de données pour votre compte.❌");
                return;
            }

            const currentTime = new Date();
            const endTime = new Date(row.plan_end_time);
            const timeRemaining = (endTime - currentTime) / 86400000;
            const formattedTimeRemaining = timeRemaining.toFixed(2);

            const embed = new MessageEmbed()
                .setTitle(`🗽 Détails de Votre Plan ${message.author.username} 🗽`)
                .setColor(0x1D82B6)
                .addField("🕒Temps Max", `${row.max_time} secondes`, true)
                .addField("🔑Concurrents", row.concurrents.toString(), true)
                .addField("⭐VIP", row.vip ? "Oui" : "Non", true)
                .addField("🕒Temps Restant", `${formattedTimeRemaining} jours`, true)
                .setThumbnail("https://media.discordapp.net/attachments/1222634820207644795/1236588464040837142/8rmSHzK.gif?ex=665b7e00&is=665a2c80&hm=4f884f3259fd41b6fe3f23ffdfd099b08c1f88347b5f3df2e54b307d73287474&=");

            try {
                if (!message.author.dmChannel) {
                    await message.author.createDM();
                }
                await message.author.send({ embeds: [embed] });
            } catch (error) {
                if (error.code === 50007) {
                    message.channel.send(`${message.author}, je ne peux pas vous envoyer de messages privés. Veuillez vérifier vos paramètres de confidentialité. ❌`).then(msg => {
                        setTimeout(() => msg.delete().catch(console.error), 10000);
                    }).catch(console.error);
                } else {
                    console.error("❌Erreur lors de l'envoi du message en DM:", error);
                    message.channel.send("Erreur inattendue lors de l'envoi des détails du plan en DM. ❌").then(msg => {
                        setTimeout(() => msg.delete().catch(console.error), 10000);
                    }).catch(console.error);
                }
            }
        });
    }
};
function sendErrorMessage(user, messageContent) {
    user.send(`${messageContent} ❌`).catch(() => {
        user.channel.send(`${user}, je ne peux pas vous envoyer de messages privés. Assurez-vous que vos DM sont ouverts!`).then(msg => {
            setTimeout(() => msg.delete().catch(console.error), 10000);
        }).catch(console.error);
    });
}
