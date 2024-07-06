const { MessageEmbed } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const dbOwners = new sqlite3.Database('./database/owners.db');
const dbStaff = new sqlite3.Database('./database/staff.db');

module.exports = {
    name: 'alladmins',
    description: 'Lister tous les administrateurs',
    async execute(message) {
        dbOwners.get("SELECT owner_id FROM owners WHERE owner_id = ?", [message.author.id], async (err, row) => {
            if (err) {
                console.error(err.message);
                await sendMessage(message.author, "Erreur lors de la vérification des permissions. ❌");
                return;
            }
            if (!row) {
                await sendMessage(message.author, "Vous n'avez pas les autorisations nécessaires pour utiliser cette commande. ❌");
                return;
            }

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

            dbStaff.all("SELECT staff_id FROM staff", async (err, rows) => {
                if (err) {
                    console.error("Erreur SQL:", err.message);
                    await sendMessage(message.author, "🚫 Erreur lors de la récupération des administrateurs : " + err.message + " 🚫");
                    return;
                }

                if (rows.length === 0) {
                    await sendMessage(message.author, "❌ Aucun administrateur trouvé dans la base de données.");
                    return;
                }

                const embed = new MessageEmbed()
                    .setTitle("Liste des Administrateurs")
                    .setDescription("Voici la liste des administrateurs actuellement dans la base de données.")
                    .setColor(0x1D82B6);

                for (const row of rows) {
                    try {
                        const user = await message.client.users.fetch(row.staff_id);
                        embed.addField(`Administrateur: ${user.username}`, `ID: ${user.id}`, false);
                    } catch (error) {
                        console.error("Erreur lors de la récupération de l'utilisateur:", error);
                        embed.addField(`ID: ${row.staff_id}`, `Utilisateur non trouvé`, false);
                    }
                }

                await sendMessage(message.author, { embeds: [embed] });
            });
        });
    },
};

function deleteMessage(message) {
    setTimeout(() => {
        message.delete().catch(console.error);
    }, 3000);
}
