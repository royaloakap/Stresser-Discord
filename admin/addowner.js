const sqlite3 = require('sqlite3').verbose();
const config = require('../config.json');
const dbOwners = new sqlite3.Database('./database/owners.db');
const dbStaff = new sqlite3.Database('./database/staff.db');

module.exports = {
    name: 'addowner',
    description: 'Ajouter un owner à la base de données',
    async execute(message, args) {
        console.log("Commande reçue:", args);

        const owners = config.OWNER_ID;
        if (!owners.includes(message.author.id)) {
            console.log("🚫 Autorisation refusée pour:", message.author.id);
            await sendDM(message.author, "🚫 Vous n'avez pas les autorisations nécessaires pour utiliser cette commande. 🚫");
            deleteMessage(message);
            return;
        }

        if (args.length !== 1) {
            console.log("🚫 Usage incorrect:", args);
            await sendDM(message.author, "💡 Usage : `.addowner <user_id>` ?");
            deleteMessage(message);
            return;
        }

        const ownerId = args[0];
        dbOwners.run("INSERT INTO owners (owner_id) VALUES (?)", [ownerId], async function (err) {
            if (err) {
                console.log("Erreur SQL:", err.message);
                await sendDM(message.author, "🚫 Erreur lors de l'ajout de l'owner : " + err.message + " ?");
                deleteMessage(message);
                return;
            }
            console.log("Owner ajouté:", ownerId);
            await sendDM(message.author, `⭐ Owner ajouté avec succès. ID de l'owner: ${ownerId} ⭐`);
            deleteMessage(message);
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
