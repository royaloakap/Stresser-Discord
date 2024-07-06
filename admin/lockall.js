const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const dbSanctions = new sqlite3.Database('./database/sanctions.db');
const dbStaff = new sqlite3.Database('./database/staff.db');
const dbOwners = new sqlite3.Database('./database/owners.db');
module.exports = {
    name: 'lockall',
    description: 'Liste tous les utilisateurs verrouillés',
    async execute(message) {
        message.delete({ timeout: 3000 }).catch(console.error);

        const sendMessage = async (target, content) => {
            try {
                await target.send(content);
            } catch (error) {
                if (error.code === 50007) {
                    const channelMessage = await message.channel.send(`${message.author}, je ne peux pas t'envoyer de messages privés. Assure-toi que tes MP sont ouverts!`);
                    setTimeout(() => channelMessage.delete(), 5000);
                } else {
                    console.error("Erreur lors de l'envoi d'un message privé:", error);
                }
            }
        };
        dbStaff.get("SELECT staff_id FROM staff WHERE staff_id = ?", [message.author.id], async (err, row) => {
            if (err) {
                console.error(err.message);
                sendMessage(message.author, "Erreur lors de la vérification des droits. ❌");
                return;
            }
            if (!row) {
                sendMessage(message.author, "Vous n'avez pas l'autorisation d'utiliser cette commande. ❌");
                return;
            }

            dbSanctions.all("SELECT user_id, reason, end_time FROM sanctions", async (err, rows) => {
                if (err) {
                    console.error(err.message);
                    sendMessage(message.author, "Erreur lors de la récupération des utilisateurs verrouillés. ❌");
                    return;
                }
                if (rows.length === 0) {
                    sendMessage(message.author, "Aucun utilisateur n'est actuellement verrouillé. ❌");
                    return;
                }

                let page = 0;
                const itemsPerPage = 10;
                const numPages = Math.ceil(rows.length / itemsPerPage);

                const generateEmbed = async start => {
                    const current = rows.slice(start, start + itemsPerPage);
                    const embed = new MessageEmbed()
                        .setTitle("🔒 Liste des Utilisateurs Verrouillés")
                        .setDescription("Voici tous les utilisateurs verrouillés et les raisons de leur verrouillage.")
                        .setColor(0xFF0000);

                    for (let row of current) {
                        try {
                            const user = await message.client.users.fetch(row.user_id);
                            const endTime = new Date(row.end_time);
                            const timeRemaining = (endTime - new Date()) / 3600000; 
                            const formattedTimeRemaining = timeRemaining.toFixed(2);
                            embed.addField(
                                `Utilisateur: ${user.username} (ID ${user.id})`,
                                `🔒 Raison: ${row.reason} | ⏳ Temps restant: ${formattedTimeRemaining} heures`,
                                false
                            );
                        } catch (error) {
                            console.error("Erreur lors de la récupération de l'utilisateur verrouillé:", error);
                            embed.addField(`ID: ${row.user_id}`, `Utilisateur non trouvé`, false);
                        }
                    }
                    return embed;
                };

                const createButtons = (page) => {
                    return new MessageActionRow().addComponents(
                        new MessageButton()
                            .setCustomId('homebtn')
                            .setLabel('🏠 Home')
                            .setStyle('PRIMARY')
                            .setDisabled(page === 0),
                        new MessageButton()
                            .setCustomId('previousbtn')
                            .setLabel('⬅️ Précédent')
                            .setStyle('DANGER')
                            .setDisabled(page === 0),
                        new MessageButton()
                            .setCustomId('nextbtn')
                            .setLabel('➡️ Suivant')
                            .setStyle('SUCCESS')
                            .setDisabled(page === numPages - 1)
                    );
                };

                const embedMessage = await message.author.send({
                    embeds: [await generateEmbed(0)],
                    components: [createButtons(0)]
                });

                const filter = i => i.user.id === message.author.id;
                const collector = embedMessage.createMessageComponentCollector({ filter, time: 60000 });

                collector.on('collect', async interaction => {
                    if (interaction.customId === 'homebtn') {
                        page = 0;
                    } else if (interaction.customId === 'nextbtn' && page < numPages - 1) {
                        page++;
                    } else if (interaction.customId === 'previousbtn' && page > 0) {
                        page--;
                    }

                    await interaction.update({
                        embeds: [await generateEmbed(page * itemsPerPage)],
                        components: [createButtons(page)]
                    });
                });

                collector.on('end', async () => {
                    await embedMessage.delete(); 
                });
            });
        });
    }
};
