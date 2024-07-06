const { MessageEmbed } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const config = require('../config.json');
const dbOwners = new sqlite3.Database('./database/owners.db');
const dbOwners2 = new sqlite3.Database('./database/owners.db'); // Renommer la deuxième base de données
module.exports = {
    name: 'allowners',
    description: 'Lister tous les owners',
    async execute(message) {
        const owners = config.OWNER_ID;
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
        if (!owners.includes(message.author.id)) {
            console.log("🚫 Autorisation refusée pour:", message.author.id);
            await sendMessage(message.author, "🚫 Vous n'avez pas les autorisations nécessaires pour utiliser cette commande. 🚫");
            return;
        }
        dbOwners2.all("SELECT owner_id FROM owners", async (err, rows) => { // Utiliser dbOwners2 pour accéder à la deuxième base de données
            if (err) {
                console.error("Erreur SQL:", err.message);
                await sendMessage(message.author, "🚫 Erreur lors de la récupération des Owners : " + err.message + " 🚫");
                return;
            }

            if (rows.length === 0) {
                await sendMessage(message.author, "❌ Aucun administrateur trouvé dans la base de données.");
                return;
            }

            const embed = new MessageEmbed()
                .setTitle("Liste des Owners")
                .setDescription("Voici la liste des Owners actuellement dans la base de données.")
                .setColor(0x1D82B6);

            for (const row of rows) {
                try {
                    const user = await message.client.users.fetch(row.owner_id);
                    embed.addField(`Administrateur: ${user.username}`, `ID: ${user.id}`, false);
                } catch (error) {
                    console.error("Erreur lors de la récupération de l'utilisateur:", error);
                    embed.addField(`ID: ${row.owner_id}`, `Utilisateur non trouvé`, false);
                }
            }

            await sendMessage(message.author, { embeds: [embed] });
        });
    },
};
function deleteMessage(message) {
    setTimeout(() => {
        message.delete().catch(console.error);
    }, 3000);
}
