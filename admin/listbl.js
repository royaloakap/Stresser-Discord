const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const blPath = path.join(__dirname, '../bl.json');
const dbStaff = new sqlite3.Database('./database/staff.db');
const dbOwners = new sqlite3.Database('./database/owners.db');
module.exports = {
    name: 'listbl',
    description: 'Lister les cibles de la liste noire',
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

        dbOwners.get("SELECT owner_id FROM owners WHERE owner_id = ?", [message.author.id], async (err, row) => {
            if (err) {
                console.error(err.message);
                sendMessage(message.author, "Erreur lors de la vérification des droits. ❌");
                return;
            }
            if (!row) {
                sendMessage(message.author, "Vous n'avez pas l'autorisation d'utiliser cette commande. ❌");
                return;
            }

            fs.readFile(blPath, 'utf8', async (err, data) => {
                if (err) {
                    console.error("Erreur lors de la lecture du fichier bl.json:", err);
                    sendMessage(message.author, "❌ Une erreur est survenue lors de la lecture de la liste noire.");
                    return;
                }

                const blacklist = JSON.parse(data);
                if (blacklist.blacklisted_targets.length === 0) {
                    sendMessage(message.author, "❌ La liste noire est vide.");
                    return;
                }

                let page = 0;
                const itemsPerPage = 10;
                const numPages = Math.ceil(blacklist.blacklisted_targets.length / itemsPerPage);

                const generateEmbed = start => {
                    const current = blacklist.blacklisted_targets.slice(start, start + itemsPerPage);
                    const embed = new MessageEmbed()
                        .setTitle("🔒 Liste des cibles de la liste noire")
                        .setDescription("Voici les cibles actuellement sur la liste noire.")
                        .setColor(0x1D82B6);

                    current.forEach((target, index) => {
                        embed.addField(`Cible ${start + index + 1}`, target, false);
                    });

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
                    embeds: [generateEmbed(0)],
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
                        embeds: [generateEmbed(page * itemsPerPage)],
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
