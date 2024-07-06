const sqlite3 = require('sqlite3').verbose();
const { WebhookClient, MessageEmbed } = require('discord.js');
const config = require('../config.json');
const dbBuyers = new sqlite3.Database('./database/buyers.db');
const dbStaff = new sqlite3.Database('./database/staff.db');

module.exports = {
    name: 'deluser',
    description: 'Supprimer un utilisateur de la base de données',
    execute(message, args) {
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
                    console.error("Erreur lors de l'envoi d'un message privé:", error);
                }
            }
        };

        dbStaff.get("SELECT * FROM staff WHERE staff_id = ?", [message.author.id], (err, row) => {
            if (err) {
                sendMessage(message.author, "Erreur lors de la vérification des autorisations : " + err.message + " ❌");
                return console.error(err.message);
            }
            if (!row) {
                sendMessage(message.author, "Vous n'avez pas les autorisations nécessaires pour exécuter cette commande. ❌");
                return;
            }

            if (args.length !== 1 || isNaN(args[0])) {
                sendMessage(message.author, "Usage incorrect de la commande. Format attendu : `.deluser <user_id>`\nExemple: `.deluser 1234567890` ❌");
                return;
            }

            const user_id = args[0];

            dbBuyers.run('DELETE FROM buyers WHERE user_id = ?', [user_id], function(err) {
                if (err) {
                    sendMessage(message.author, "Une erreur est survenue lors de la suppression de l'utilisateur : " + err.message + " ❌");
                    return console.error(err.message);
                }
                if (this.changes === 0) {
                    sendMessage(message.author, "Aucun utilisateur trouvé avec cet ID. ❌");
                } else {
                    sendMessage(message.author, "Utilisateur supprimé avec succès de la base de données. ✅");

                    const logEmbed = new MessageEmbed()
                        .setTitle('Utilisateur supprimé')
                        .setColor('#FF0000')
                        .setDescription(`Opération effectuée par **${message.author.tag}**`)
                        .addField('ID Utilisateur', user_id, true)
                        .setTimestamp()
                        .setFooter('.gg/Stresser');

                    const webhookClient = new WebhookClient({ url: config.WEBHOOK_ADMIN_URL });

                    webhookClient.send({
                        username: 'Del User',
                        avatarURL: 'https://images-ext-1.discordapp.net/external/0kdihiTJTM6sFaRfKqJPoPSVYauz20FzV9oiLMnpB_U/%3Fsize%3D4096/https/cdn.discordapp.com/guilds/1192243793848717312/users/1187143409010495598/avatars/a_32d2d1142ab1674d2a1981f66aeb7b3a.gif?width=487&height=487',
                        embeds: [logEmbed],
                    });

                    console.log(`Utilisateur supprimé avec l'ID: ${user_id}`);
                }
            });
        });

        message.delete().catch(err => console.error("Erreur lors de la suppression du message:", err));
    },
};
