const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const blPath = path.join(__dirname, '../bl.json');
const dbStaff = new sqlite3.Database('./database/staff.db');
const dbOwners = new sqlite3.Database('./database/owners.db');
module.exports = {
    name: 'delbl',
    description: 'Supprimer une cible de la Blacklist',
    async execute(message, args) {
        message.delete({ timeout: 3000 }).catch(console.error);

        const sendMessage = async (target, content) => {
            try {
                await target.send(content);
            } catch (error) {
                if (error.code === 50007) {
                    await message.channel.send(`${message.author}, je ne peux pas t'envoyer de messages privés. Assure-toi que tes MP sont ouverts!`);
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

            if (args.length !== 1) {
                sendMessage(message.author, "❌ Usage incorrect de la commande. Format attendu : `.delbl <target>`");
                return;
            }

            const target = args[0];

            fs.readFile(blPath, 'utf8', (err, data) => {
                if (err) {
                    console.error("Erreur lors de la lecture du fichier bl.json:", err);
                    sendMessage(message.author, "❌ Une erreur est survenue lors de la lecture de la Blacklist.");
                    return;
                }

                const blacklist = JSON.parse(data);
                const index = blacklist.blacklisted_targets.indexOf(target);
                if (index === -1) {
                    sendMessage(message.author, "❌ Cette cible n'est pas dans la Blacklist.");
                    return;
                }

                blacklist.blacklisted_targets.splice(index, 1);
                fs.writeFile(blPath, JSON.stringify(blacklist, null, 2), (err) => {
                    if (err) {
                        console.error("Erreur lors de l'écriture du fichier bl.json:", err);
                        sendMessage(message.author, "❌ Une erreur est survenue lors de la suppression de la Blacklist.");
                        return;
                    }

                    sendMessage(message.author, `✅ Le target ${target} a été supprimée de la Blacklist.`);
                });
            });
        });
    }
};
