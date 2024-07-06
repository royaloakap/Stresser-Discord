const { WebhookClient } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const dbStaff = new sqlite3.Database('./database/staff.db');
const dbSanctions = new sqlite3.Database('./database/sanctions.db');

const config = require('../config.json'); // Assurez-vous que config.json contient l'URL du webhook
const webhookClient = new WebhookClient({ url: config.WEBHOOK_ADMIN_URL });

module.exports = {
    name: 'unlockuser',
    description: 'Déverrouiller un utilisateur pour lui permettre d\'utiliser à nouveau les commandes du bot',
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
            if (args.length !== 1 || isNaN(args[0])) {
                sendErrorMessage(message.author, "Usage incorrect de la commande. Format attendu : `.unlockuser <user_id>`\nExemple: `.unlockuser 1234567890`");
                return;
            }
            const user_id = args[0];

            dbSanctions.run('DELETE FROM sanctions WHERE user_id = ?', [user_id], function(err) {
                if (err) {
                    console.error(err.message);
                    sendErrorMessage(message.author, "Erreur lors du déverrouillage de l'utilisateur.");
                    return;
                }
                sendSuccessMessage(message.author, `L'utilisateur avec l'ID ${user_id} a été déverrouillé avec succès.`);
                const logEmbed = {
                    color: 0x00ff00,
                    title: 'Utilisateur déverrouillé',
                    fields: [
                        { name: 'Admin', value: `${message.author.tag} (ID: ${message.author.id})`, inline: true },
                        { name: 'Utilisateur déverrouillé', value: `${user_id}`, inline: true },
                    ],
                    timestamp: new Date(),
                };
                webhookClient.send({ embeds: [logEmbed] }).catch(console.error);
            });
        });
    },
};

function sendErrorMessage(user, messageContent) {
    user.send(`${messageContent} ❌`).catch(() => {
        user.channel.send(`${user}, je ne peux pas vous envoyer de messages privés. Assurez-vous que vos DM sont ouverts!`);
    });
}

function sendSuccessMessage(user, messageContent) {
    user.send(`${messageContent} ✅`).catch(() => {
        user.channel.send(`${user}, je ne peux pas vous envoyer de messages privés. Assurez-vous que vos DM sont ouverts!`);
    });
}
