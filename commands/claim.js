const sqlite3 = require('sqlite3').verbose();
const dbBuyers = new sqlite3.Database('./database/buyers.db');

module.exports = {
    name: 'claim',
    description: 'Réclamer un plan de 1 heure avec 60sec, 1 concurrent, et VIP false toutes les 24 heures',
    async execute(message) {
        const userId = message.author.id;
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

        dbBuyers.get("SELECT last_claim, plan_end_time FROM buyers WHERE user_id = ?", [userId], async (err, row) => {
            if (err) {
                console.error(err.message);
                await sendMessage(message.author, "Erreur lors de la vérification de votre dernière réclamation. ❌");
                return;
            }

            const now = new Date();
            const oneDayAgo = new Date();
            oneDayAgo.setDate(now.getDate() - 1);

            if (row) {
                const planEndTime = new Date(row.plan_end_time);
                const remainingTime = planEndTime - now;
                const remainingDays = remainingTime / (1000 * 60 * 60 * 24);

                if (remainingDays > 0) {
                    await sendMessage(message.author, "Vous avez déjà un plan actif. Vous ne pouvez pas en réclamer un autre pour le moment. ❌");
                    return;
                }

                if (new Date(row.last_claim) > oneDayAgo) {
                    await sendMessage(message.author, "Vous avez déjà réclamé un plan dans les 24 dernières heures. Veuillez réessayer plus tard. ❌");
                    return;
                }
            }

            const maxTime = 60;
            const concurrents = 1;
            const vip = false;
            const hours = 1;
            const endDate = new Date();
            endDate.setHours(endDate.getHours() + hours);

            if (row) {
                dbBuyers.run("UPDATE buyers SET max_time = ?, concurrents = ?, vip = ?, plan_end_time = ?, last_claim = ? WHERE user_id = ?", [maxTime, concurrents, vip, endDate.toISOString(), now.toISOString(), userId], async function(err) {
                    if (err) {
                        console.error(err.message);
                        await sendMessage(message.author, "Erreur lors de la mise à jour de votre plan. ❌");
                    } else {
                        await sendMessage(message.author, "Votre plan a été mis à jour avec succès ! ✅");
                    }
                });
            } else {
                dbBuyers.run("INSERT INTO buyers (user_id, max_time, concurrents, vip, plan_end_time, last_claim) VALUES (?, ?, ?, ?, ?, ?)", [userId, maxTime, concurrents, vip, endDate.toISOString(), now.toISOString()], async function(err) {
                    if (err) {
                        console.error(err.message);
                        await sendMessage(message.author, "Erreur lors de l'ajout de votre plan. ❌");
                    } else {
                        await sendMessage(message.author, "Votre plan a été réclamé avec succès ! ✅");
                    }
                });
            }
        });
    },
};
function deleteMessage(message) {
    setTimeout(() => {
        message.delete().catch(console.error);
    }, 3000);
}
