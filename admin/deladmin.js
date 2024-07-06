const sqlite3 = require('sqlite3').verbose();
const dbStaff = new sqlite3.Database('./database/staff.db');
const dbOwners = new sqlite3.Database('./database/owners.db');

module.exports = {
    name: 'deladmin',
    description: 'Supprimer un administrateur de la base de données',
    async execute(message, args) {
        console.log("Commande reçue:", args);

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
                console.log("Usage incorrect:", args);
                await message.author.send("💡 Usage : `.deladmin <user_id>` ")
                    .catch(async error => {
                        if (error.code === 50007) {
                            const msg = await message.channel.send("💡 Usage : `.deladmin <user_id>` Vos DM sont fermés.");
                            setTimeout(() => msg.delete(), 5000);
                        }
                    });
                setTimeout(() => message.delete(), 3000);
                return;
            }

            const staffId = args[0];
            dbStaff.run("DELETE FROM staff WHERE staff_id = ?", [staffId], async function (err) {
                if (err) {
                    console.log("Erreur SQL:", err.message);
                    await message.author.send("Erreur lors de la suppression de l'administrateur : " + err.message + " ")
                        .catch(async error => {
                            if (error.code === 50007) {
                                const msg = await message.channel.send("Erreur lors de la suppression de l'administrateur et vos DM sont fermés.");
                                setTimeout(() => msg.delete(), 5000);
                            }
                        });
                    setTimeout(() => message.delete(), 3000);
                    return;
                }
                if (this.changes === 0) {
                    console.log("🚫 Aucun administrateur trouvé avec cet ID:", staffId);
                    await message.author.send("🚫 Aucun administrateur trouvé avec cet ID. 🚫")
                        .catch(async error => {
                            if (error.code === 50007) {
                                const msg = await message.channel.send("🚫 Aucun administrateur trouvé avec cet ID et vos DM sont fermés.");
                                setTimeout(() => msg.delete(), 5000);
                            }
                        });
                } else {
                    console.log("Administrateur supprimé:", staffId);
                    await message.author.send(`✅ Administrateur supprimé avec succès. ID de l'administrateur: ${staffId}`)
                        .catch(async error => {
                            if (error.code === 50007) {
                                const msg = await message.channel.send(`✅ Administrateur supprimé avec succès. ID de l'administrateur: ${staffId} Vos DM sont fermés.`);
                                setTimeout(() => msg.delete(), 5000);
                            }
                        });
                }
                setTimeout(() => message.delete(), 3000);
            });
        });
    },
};

async function sendMessage(target, content) {
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
}
