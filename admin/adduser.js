const sqlite3 = require('sqlite3').verbose();
const { WebhookClient, MessageEmbed } = require('discord.js');
const config = require('../config.json');
const dbBuyers = new sqlite3.Database('./database/buyers.db');
const dbStaff = new sqlite3.Database('./database/staff.db');

module.exports = {
    name: 'adduser',
    description: 'Ajouter ou mettre à jour un utilisateur dans la base de données',
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
                    console.error("Erreur lors de l'envoi d'un message privé:", error);
                }
            }
        };

        dbStaff.get("SELECT staff_id FROM staff WHERE staff_id = ?", [message.author.id], async (err, row) => {
            if (err) {
                console.error(err.message);
                await sendMessage(message.author, "Erreur lors de la vérification des permissions. ❌");
                return;
            }
            if (!row) {
                await sendMessage(message.author, "Vous n'avez pas les autorisations nécessaires pour utiliser cette commande. ❌");
                return;
            }
            if (args.length !== 5 || isNaN(args[1]) || isNaN(args[2]) || isNaN(args[3]) || !['true', 'false'].includes(args[4].toLowerCase())) {
                await sendMessage(message.author, "Usage incorrect de la commande. Format attendu : `.adduser <user_id> <max_time> <concurrents> <days> <vip>`\nExemple: `.adduser 1234567890 60 5 30 true` ❌");
                return;
            }

            const [user_id, max_time, concurrents, days, vip] = args;
            const vipStatus = vip.toLowerCase() === 'true';
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + parseInt(days));

            dbBuyers.get("SELECT user_id FROM buyers WHERE user_id = ?", [user_id], async (err, user) => {
                if (err) {
                    console.error(err.message);
                    await sendMessage(message.author, "Erreur lors de la vérification de l'utilisateur existant. ❌");
                    return;
                }

                const logEmbed = new MessageEmbed()
                    .setTitle(user ? 'Mise à jour utilisateur' : 'Nouvel utilisateur ajouté')
                    .setColor(user ? '#FFA500' : '#00FF00')
                    .setDescription(`Opération effectuée par **${message.author.tag}**`)
                    .addField('ID Utilisateur', user_id, true)
                    .addField('Max Time', max_time, true)
                    .addField('Concurrents', concurrents, true)
                    .addField('Days', days, true)
                    .addField('VIP', vipStatus ? 'Yes' : 'No', true)
                    .addField('Plan End Time', endDate.toISOString(), true)
                    .setTimestamp()
                    .setFooter('.gg/Stresser');

                const webhookClient = new WebhookClient({ url: config.WEBHOOK_ADMIN_URL });

                if (user) {
                    dbBuyers.run("UPDATE buyers SET max_time = ?, concurrents = ?, vip = ?, plan_end_time = ? WHERE user_id = ?", [parseInt(max_time), parseInt(concurrents), vipStatus, endDate.toISOString(), user_id], async (err) => {
                        if (err) {
                            console.error(err.message);
                            await sendMessage(message.author, "Erreur lors de la mise à jour de l'utilisateur. ❌");
                            return;
                        }
                        await sendMessage(message.author, `Informations de l'utilisateur mises à jour. ID de l'utilisateur: ${user_id} ⭐`);
                        webhookClient.send({
                            username: 'Add User',
                            avatarURL: 'https://images-ext-1.discordapp.net/external/0kdihiTJTM6sFaRfKqJPoPSVYauz20FzV9oiLMnpB_U/%3Fsize%3D4096/https/cdn.discordapp.com/guilds/1192243793848717312/users/1187143409010495598/avatars/a_32d2d1142ab1674d2a1981f66aeb7b3a.gif?width=487&height=487',
                            embeds: [logEmbed],
                        });
                    });
                } else {
                    dbBuyers.run('INSERT INTO buyers (user_id, max_time, concurrents, vip, plan_end_time) VALUES (?, ?, ?, ?, ?)', [user_id, parseInt(max_time), parseInt(concurrents), vipStatus, endDate.toISOString()], async (err) => {
                        if (err) {
                            console.error(err.message);
                            await sendMessage(message.author, "Erreur lors de l'ajout de l'utilisateur à la base de données. ❌");
                            return;
                        }
                        await sendMessage(message.author, `Utilisateur ajouté avec succès à la base de données. ID de l'utilisateur: ${user_id} ✅`);
                        webhookClient.send({
                            username: 'Add user',
                            avatarURL: 'https://images-ext-1.discordapp.net/external/0kdihiTJTM6sFaRfKqJPoPSVYauz20FzV9oiLMnpB_U/%3Fsize%3D4096/https/cdn.discordapp.com/guilds/1192243793848717312/users/1187143409010495598/avatars/a_32d2d1142ab1674d2a1981f66aeb7b3a.gif?width=487&height=487',
                            embeds: [logEmbed],
                        });
                    });
                }
            });
        });
    },
};

function deleteMessage(message) {
    setTimeout(() => {
        message.delete().catch(console.error);
    }, 3000);
}
