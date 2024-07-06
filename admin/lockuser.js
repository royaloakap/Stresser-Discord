const { WebhookClient } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const dbStaff = new sqlite3.Database('./database/staff.db');
const dbSanctions = new sqlite3.Database('./database/sanctions.db');

const config = require('../config.json'); // Assurez-vous que config.json contient l'URL du webhook
const webhookClient = new WebhookClient({ url: config.WEBHOOK_ADMIN_URL });

module.exports = {
    name: 'lockuser',
    description: 'Verrouiller un utilisateur pour l\'empêcher d\'utiliser les commandes du bot',
    execute(message, args) {
        message.delete().catch(console.error);

        dbStaff.get("SELECT staff_id FROM staff WHERE staff_id = ?", [message.author.id], (err, row) => {
            if (err) {
                console.error(err.message);
                sendErrorMessage(message.author, "Erreur lors de la vérification des permissions.");
                return;
            }
            if (!row) {
                sendErrorMessage(message.author, "Vous n'avez pas les autorisations nécessaires pour utiliser cette commande.");
                return;
            }
            if (args.length < 3 || isNaN(args[0]) || isNaN(args[1])) {
                sendErrorMessage(message.author, "Usage incorrect de la commande. Format attendu : `.lockuser <user_id> <days> <reason>`\nExemple: `.lockuser 1234567890 30 Spam`");
                return;
            }
            const [user_id, days, ...reasonArgs] = args;
            const reason = reasonArgs.join(' ');
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + parseInt(days));

            dbSanctions.run('INSERT INTO sanctions (user_id, end_time, reason) VALUES (?, ?, ?)', [user_id, endDate.toISOString(), reason], function(err) {
                if (err) {
                    console.error(err.message);
                    sendErrorMessage(message.author, "Erreur lors du verrouillage de l'utilisateur.");
                    return;
                }
                sendSuccessMessage(message.author, `L'utilisateur avec l'ID ${user_id} a été verrouillé avec succès pour ${days} jours pour la raison suivante : ${reason}.`);

                const logEmbed = {
                    color: 0xff0000,
                    title: 'Utilisateur verrouillé',
                    fields: [
                        { name: 'Admin', value: `${message.author.tag} (ID: ${message.author.id})`, inline: true },
                        { name: 'Utilisateur sanctionné', value: `${user_id}`, inline: true },
                        { name: 'Durée (jours)', value: `${days}`, inline: true },
                        { name: 'Raison', value: `${reason}`, inline: true },
                        { name: 'Date de fin', value: `${endDate.toISOString()}`, inline: true }
                    ],
                    timestamp: new Date(),
                };
                webhookClient.send({ embeds: [logEmbed] }).catch(console.error);
            });
        });
    },
};

function sendErrorMessage(user, messageContent) {
    user.send(`${messageContent} ❌`).catch(() => message.channel.send(`${user}, je ne peux pas vous envoyer de messages privés. Assurez-vous que vos DM sont ouverts!`));
}

function sendSuccessMessage(user, messageContent) {
    user.send(`${messageContent} ✅`).catch(() => message.channel.send(`${user}, je ne peux pas vous envoyer de messages privés. Assurez-vous que vos DM sont ouverts!`));
}
