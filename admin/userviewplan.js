const { MessageEmbed, WebhookClient } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const dbStaff = new sqlite3.Database('./database/staff.db');
const dbBuyers = new sqlite3.Database('./database/buyers.db');

const config = require('../config.json'); // Assurez-vous que config.json contient l'URL du webhook
const webhookClient = new WebhookClient({ url: config.WEBHOOK_ADMIN_URL });

module.exports = {
    name: 'userviewplan',
    description: "Affiche les détails du plan d'un utilisateur dans la base de données.",
    execute(message, args) {
        dbStaff.get("SELECT staff_id FROM staff WHERE staff_id = ?", [message.author.id], (err, staffRow) => {
            if (err) {
                console.error(err.message);
                message.channel.send("❌Erreur lors de la vérification des droits.❌");
                return;
            }
            if (!staffRow) {
                message.channel.send("❌Vous n'avez pas l'autorisation d'utiliser cette commande.❌");
                return;
            }
            const targetUserId = args[0];
            if (!targetUserId) {
                message.channel.send("❌Veuillez fournir l'ID Discord de l'utilisateur à inspecter. Usage: .userviewplan <ID Discord>❌");
                return;
            }
            dbBuyers.get("SELECT max_time, concurrents, vip, plan_end_time FROM buyers WHERE user_id = ?", [targetUserId], (err, row) => {
                if (err) {
                    console.error(err.message);
                    message.author.send("❌Erreur lors de la récupération des données du plan de l'utilisateur.❌");
                    return;
                }
                if (!row) {
                    message.author.send("❌Aucun plan enregistré dans la base de données pour cet utilisateur.❌");
                    return;
                }
                const currentTime = new Date();
                const endTime = new Date(row.plan_end_time);
                const timeRemaining = (endTime - currentTime) / (1000 * 60 * 60 * 24);
                const formattedTimeRemaining = timeRemaining.toFixed(2);
                const embed = new MessageEmbed()
                    .setTitle(`🗽 Détails du Plan de l'Utilisateur ${targetUserId} 🗽`)
                    .setColor(0x1D82B6)
                    .addField("🕒 Temps Max", `${row.max_time} secondes`, true)
                    .addField("🔑 Concurrents", row.concurrents.toString(), true)
                    .addField("⭐ VIP", row.vip ? "Oui" : "Non", true)
                    .addField("🕒 Temps Restant", `${formattedTimeRemaining} jours`, true)
                    .setThumbnail("https://cdn.discordapp.com/attachments/1222634820207644795/1246341229462028399/tanjiro-tanjiro-rage.mp4?ex=665c0939&is=665ab7b9&hm=35524fea1df19cc8c966b022ba9871d1e7ed2cbee7c2ca95bf0d7a5dcd411ed5&");

                message.author.send({ embeds: [embed] })
                    .then(() => {
                        message.delete();
                    })
                    .catch(() => {
                        message.channel.send("❌Impossible d'envoyer les détails du plan dans vos messages privés. Assurez-vous que vos paramètres de confidentialité le permettent.❌");
                    });
                const logEmbed = new MessageEmbed()
                    .setColor(0x00ff00)
                    .setTitle('Consultation du plan d un utilisateur !')
                    .addField('Admin', `${message.author.tag} (ID: ${message.author.id})`, true)
                    .addField('Utilisateur cible', targetUserId, true)
                    .addField('Temps Max', `${row.max_time} secondes`, true)
                    .addField('Concurrents', row.concurrents.toString(), true)
                    .addField('VIP', row.vip ? "Oui" : "Non", true)
                    .addField('Temps Restant', `${formattedTimeRemaining} jours`, true)
                    .setTimestamp();

                webhookClient.send({ embeds: [logEmbed] }).catch(console.error);
            });
        });
    },
};
