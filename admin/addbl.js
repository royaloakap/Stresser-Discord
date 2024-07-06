const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { WebhookClient, MessageEmbed } = require('discord.js');
const config = require('../config.json');
const blPath = path.join(__dirname, '../bl.json');
const dbStaff = new sqlite3.Database('./database/staff.db');
const dbOwners = new sqlite3.Database('./database/owners.db');

module.exports = {
    name: 'addbl',
    description: 'Ajouter une cible à la Blacklist',
    async execute(message, args) {
        message.delete({ timeout: 3000 }).catch(console.error);

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

        dbStaff.get("SELECT staff_id FROM staff WHERE staff_id = ?", [message.author.id], async (err, row) => {
            if (err) {
                console.error(err.message);
                await sendMessage(message.author, "Erreur lors de la vérification des droits. ❌");
                deleteMessage(message);
                return;
            }
            if (!row) {
                await sendMessage(message.author, "Vous n'avez pas l'autorisation d'utiliser cette commande. ❌");
                deleteMessage(message);
                return;
            }
            if (args.length !== 1) {
                await sendMessage(message.author, "❌ Usage incorrect de la commande. Format attendu : `.addbl <target>`");
                deleteMessage(message);
                return;
            }

            const target = args[0];
            const isValidIP = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(target);
            const isValidDomain = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/.test(target);

            if (!isValidIP && !isValidDomain) {
                await sendMessage(message.author, "❌ La cible doit être une IP ou un domaine valide.");
                deleteMessage(message);
                return;
            }

            fs.readFile(blPath, 'utf8', async (err, data) => {
                if (err) {
                    console.error("Erreur lors de la lecture du fichier bl.json:", err);
                    await sendMessage(message.author, "❌ Une erreur est survenue lors de la lecture de la Blacklist.");
                    deleteMessage(message);
                    return;
                }

                const blacklist = JSON.parse(data);
                if (blacklist.blacklisted_targets.includes(target)) {
                    await sendMessage(message.author, "❌ Cette cible est déjà dans la Blacklist.");
                    deleteMessage(message);
                    return;
                }

                blacklist.blacklisted_targets.push(target);
                fs.writeFile(blPath, JSON.stringify(blacklist, null, 2), async (err) => {
                    if (err) {
                        console.error("Erreur lors de l'écriture du fichier bl.json:", err);
                        await sendMessage(message.author, "❌ Une erreur est survenue lors de l'ajout à la Blacklist.");
                        deleteMessage(message);
                        return;
                    }

                    await sendMessage(message.author, `✅ La cible ${target} a été ajoutée à la Blacklist.`);
                    deleteMessage(message);
                    
                   
                    const webhookClient = new WebhookClient({ url: config.WEBHOOK_ADMIN_URL });
                    const embed = new MessageEmbed()
                        .setTitle('Nouvelle entrée dans la Blacklist')
                        .setColor('#FF0000')
                        .setDescription(`Un nouveau target a été ajoutée à la Blacklist par **${message.author.tag}**`)
                        .addField('Target', target, true)
                        .addField('Ajouté par', message.author.tag, true)
                        .setTimestamp()
                        .setFooter('.gg/Stresser');

                    webhookClient.send({
                        username: 'Add Blacklist',
                        avatarURL: 'https://images-ext-1.discordapp.net/external/0kdihiTJTM6sFaRfKqJPoPSVYauz20FzV9oiLMnpB_U/%3Fsize%3D4096/https/cdn.discordapp.com/guilds/1192243793848717312/users/1187143409010495598/avatars/a_32d2d1142ab1674d2a1981f66aeb7b3a.gif?width=487&height=487', // URL d'une image d'avatar par défaut
                        embeds: [embed],
                    });
                });
            });
        });
    }
};

function deleteMessage(message) {
    setTimeout(() => {
        message.delete().catch(console.error);
    }, 3000);
}
