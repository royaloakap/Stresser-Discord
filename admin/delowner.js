const sqlite3 = require('sqlite3').verbose();
const dbOwners = new sqlite3.Database('./database/owners.db');
const config = require('../config.json');
module.exports = {
    name: 'delowner',
    description: 'Supprimer un owner de la base de données',
    async execute(message, args) {
        console.log("Commande reçue:", args);

        const owners = config.OWNER_ID;
        if (!owners.includes(message.author.id)) {
            console.log("Autorisation refusée pour:", message.author.id);
            await message.author.send("🚫 Vous n'avez pas les autorisations nécessaires pour utiliser cette commande. 🚫")
                .catch(async error => {
                    if (error.code === 50007) {
                        const msg = await message.channel.send("🚫 Vous n'avez pas les autorisations nécessaires pour utiliser cette commande et vos DM sont fermés. 🚫");
                        setTimeout(() => msg.delete(), 5000);
                    }
                });
            setTimeout(() => message.delete(), 3000);
            return;
        }

        if (args.length !== 1) {
            console.log("Usage incorrect:", args);
            await message.author.send("💡 Usage : `.delowner <user_id>` ")
                .catch(async error => {
                    if (error.code === 50007) {
                        const msg = await message.channel.send("💡 Usage : `.deladmin <user_id>` Vos DM sont fermés.");
                        setTimeout(() => msg.delete(), 5000);
                    }
                });
            setTimeout(() => message.delete(), 3000);
            return;
        }

        const ownersId = args[0];
        dbOwners.run("DELETE FROM owners WHERE owner_id = ?", [ownersId], async function (err) {
            if (err) {
                console.log("Erreur SQL:", err.message);
                await message.author.send("Erreur lors de la suppression de l'owner : " + err.message + " ")
                    .catch(async error => {
                        if (error.code === 50007) {
                            const msg = await message.channel.send("Erreur lors de la suppression de l'owner et vos DM sont fermés.");
                            setTimeout(() => msg.delete(), 5000);
                        }
                    });
                setTimeout(() => message.delete(), 3000);
                return;
            }
            if (this.changes === 0) {
                console.log("🚫 Aucun owner trouvé avec cet ID:", ownersId);
                await message.author.send("🚫 Aucun owner trouvé avec cet ID. 🚫")
                    .catch(async error => {
                        if (error.code === 50007) {
                            const msg = await message.channel.send("🚫 Aucun owner trouvé avec cet ID et vos DM sont fermés.");
                            setTimeout(() => msg.delete(), 5000);
                        }
                    });
            } else {
                console.log("owner supprimé:", ownersId);
                await message.author.send(`✅ owner supprimé avec succès. ID de l'owner: ${ownersId}`)
                    .catch(async error => {
                        if (error.code === 50007) {
                            const msg = await message.channel.send(`✅ owner supprimé avec succès. ID de l'owner: ${ownersId} Vos DM sont fermés.`);
                            setTimeout(() => msg.delete(), 5000);
                        }
                    });
            }
            setTimeout(() => message.delete(), 3000);
        });
    },
};
