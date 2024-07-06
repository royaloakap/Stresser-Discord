const sqlite3 = require('sqlite3').verbose();
const dbStaff = new sqlite3.Database('./database/staff.db');
const dbOwners = new sqlite3.Database('./database/owners.db');

module.exports = {
    name: 'addadmin',
    description: 'Ajouter un administrateur à la base de données',
    async execute(message, args) {
        console.log("Commande reçue:", args);

        const sendMessage = async (target, content) => {
            try {
                if (!target.dmChannel) {
                    await target.createDM();
                }
                await target.send(content);
            } catch (error) {
                if (error.code === 50007) {
                    const msg = await target.client.channels.cache.get(target.lastMessage.channelId).send(content + " Vos DM sont fermés.");
                    setTimeout(() => msg.delete(), 5000);
                }
            }
        };

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

            if (args.length !== 1) {
                console.log("🚫 Usage incorrect:", args);
                await sendDM(message.author, "💡 Usage : `.addadmin <user_id>` ?");
                deleteMessage(message);
                return;
            }

            const staffId = args[0];
            dbStaff.run("INSERT INTO staff (staff_id) VALUES (?)", [staffId], async function (err) {
                if (err) {
                    console.log("Erreur SQL:", err.message);
                    await sendMessage(message.author, "🚫 Erreur lors de l'ajout de l'administrateur : " + err.message + " ?");
                    deleteMessage(message);
                    return;
                }
                console.log("Administrateur ajouté:", staffId);
                await sendMessage(message.author, `⭐ Administrateur ajouté avec succès. ID de l'administrateur: ${staffId} ⭐`);
                deleteMessage(message);
            });
        });
    },
};

async function sendDM(user, content) {
    try {
        if (!user.dmChannel) {
            await user.createDM();
        }
        await user.send(content);
    } catch (error) {
        if (error.code === 50007) {
            const msg = await user.client.channels.cache.get(user.lastMessage.channelId).send(content + " Vos DM sont fermés.");
            setTimeout(() => msg.delete(), 5000);
        }
    }
}

function deleteMessage(message) {
    setTimeout(() => {
        message.delete().catch(console.error);
    }, 3000);
}
