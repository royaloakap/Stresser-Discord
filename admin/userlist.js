const { MessageEmbed, MessageActionRow, MessageButton, WebhookClient } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const dbBuyers = new sqlite3.Database('./database/buyers.db');
const dbStaff = new sqlite3.Database('./database/staff.db');

const config = require('../config.json'); 
const webhookClient = new WebhookClient({ url: config.WEBHOOK_ADMIN_URL });

const ITEMS_PER_PAGE = 10;

module.exports = {
    name: 'userlist',
    description: 'Liste tous les utilisateurs enregistrés',
    async execute(message) {
        try {
            message.delete();
            const isStaff = await checkStaffPermission(message.author.id);
            if (!isStaff) {
                return message.author.send("Vous n'avez pas l'autorisation d'utiliser cette commande. ❌");
            }
            const rows = await getUsersFromDatabase();

            if (rows.length === 0) {
                return message.author.send("Aucun utilisateur enregistré dans la base de données. ❌");
            }
            const pages = paginate(rows, ITEMS_PER_PAGE);
            await sendPage(message.author, pages, 0);

            // Log the action via webhook
            const logEmbed = new MessageEmbed()
                .setColor(0x00ff00)
                .setTitle('Consultation de la liste des utilisateurs')
                .addField('Admin', `${message.author.tag} (ID: ${message.author.id})`, true)
                .setTimestamp();

            webhookClient.send({ embeds: [logEmbed] }).catch(console.error);
        } catch (error) {
            console.error("Erreur lors de l'exécution de la commande userlist :", error);
            message.author.send("Une erreur est survenue lors de la récupération des utilisateurs. ❌");
        }
    }
};

async function getUsersFromDatabase() {
    return new Promise((resolve, reject) => {
        dbBuyers.all("SELECT user_id, max_time, concurrents, vip, plan_end_time FROM buyers", (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function checkStaffPermission(userID) {
    return new Promise((resolve, reject) => {
        dbStaff.get("SELECT staff_id FROM staff WHERE staff_id = ?", [userID], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row !== undefined);
            }
        });
    });
}

function paginate(array, pageSize) {
    const pages = [];
    while (array.length) {
        pages.push(array.splice(0, pageSize));
    }
    return pages;
}

async function sendPage(user, pages, pageIndex) {
    const embed = createEmbed(pages[pageIndex]);
    const components = createButtons(pages.length, pageIndex);

    await user.send({ embeds: [embed], components: components });

    const filter = i => i.user.id === user.id;
    const collector = user.dmChannel.createMessageComponentCollector({ filter, time: 120000 });

    collector.on('collect', async interaction => {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'next') {
            pageIndex = (pageIndex + 1) % pages.length;
        } else if (interaction.customId === 'prev') {
            pageIndex = (pageIndex - 1 + pages.length) % pages.length;
        }

        await interaction.update({
            embeds: [createEmbed(pages[pageIndex])],
            components: createButtons(pages.length, pageIndex)
        });
    });
}

function createEmbed(users) {
    const embed = new MessageEmbed()
        .setTitle("👑 Liste des Utilisateurs de $tresser 👑")
        .setDescription("Voici tous les utilisateurs et leurs informations.")
        .setColor(0x1D82B6);

    users.forEach((user, index) => {
        const formattedVip = user.vip ? "Oui" : "Non";
        const formattedTimeRemaining = calculateTimeRemaining(user.plan_end_time);

        embed.addField(
            `(ID: ${user.user_id})`,
            `⏱️ Max Time: ${user.max_time} sec ⚔️ Concurrents: ${user.concurrents} 👑 VIP: ${formattedVip} ⏳ Temps restant: ${formattedTimeRemaining} jours`,
            false
        );
    });

    return embed;
}

function createButtons(numPages, currentPage) {
    return [
        new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('prev')
                .setLabel('⬅️ Page Précédente')
                .setStyle('SECONDARY')
                .setDisabled(currentPage === 0),
            new MessageButton()
                .setCustomId('next')
                .setLabel('➡️ Page Suivante')
                .setStyle('SECONDARY')
                .setDisabled(currentPage === numPages - 1)
        )
    ];
}

function calculateTimeRemaining(planEndTime) {
    const currentTime = new Date();
    const endTime = new Date(planEndTime);
    const timeRemaining = (endTime - currentTime) / (1000 * 60 * 60 * 24);
    return timeRemaining.toFixed(2);
}
