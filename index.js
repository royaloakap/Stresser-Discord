const { Client, Intents, MessageEmbed } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const sqlite3 = require('sqlite3').verbose();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});
const axios = require('axios');
const { licenseKey } = require('./config');
if (!config.licenseKey || config.licenseKey.trim() === "") {
    console.error("La clé de licence est manquante dans le fichier config.json. Contact @royaloakap Si tu as un soucis.");
    process.exit(1);
}
(async () => {
    const product = "stresserdiscord";
    const apiKey = "G1gje4OBpsAr5gpkqvEgAiRHdumxIGUo";
    const apiUrl = "https://89.213.158.173:3000/api/client";

    const headers = { 'Authorization': apiKey };
    const data = { 'licensekey': licenseKey, 'product': product };

    try {
        const response = await axios.post(apiUrl, data, { headers });
        const status = response.data;

        if (status.status_overview === "success") {
            console.log(`Ton Bot est start et a été créer par Royaloakap.Ta license ${licenseKey} est Valide  Produis: ${product}`);
            console.log("Discord ID: " + status.discord_id);
        } else {
            console.log(`Ta license ${licenseKey} est invalide ou a atteints un plafond contact moi sur discord.gg/botFR ou @royaloakap Product: ${product}`);
            console.log("Create un ticket. Discord.gg/BOTFR");
            process.exit(1);
        }
    } catch (error) {
        console.error("License Authentication échouée Contact @Royaloakap");
        console.error(error);
        process.exit(1);
    }
})();
const dbStaff = new sqlite3.Database('./database/staff.db');

client.commands = new Map();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const loadCommands = (dir) => {
    const commandFiles = fs.readdirSync(`./${dir}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./${dir}/${file}`);
        client.commands.set(command.name, command);
    }
};
loadCommands('commands');
loadCommands('admin');

client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag} !`);
    client.user.setPresence({
        status: 'DND',
        activities: [{
            name: '.gg/STRESSER',
            type: 'PLAYING'
        }]
    });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isSelectMenu()) return;

    await interaction.deferReply({ ephemeral: true });

    if (interaction.customId === 'help-admin-menu') {
        dbStaff.get("SELECT staff_id FROM staff WHERE staff_id = ?", [interaction.user.id], async (err, row) => {
            if (err) {
                console.error(err.message);
                await interaction.editReply({ content: "Erreur lors de la vérification des droits. ❌", ephemeral: true });
                return;
            }
            if (!row) {
                await interaction.editReply({ content: "Vous n'avez pas l'autorisation d'utiliser cette commande. ❌", ephemeral: true });
                return;
            }
            executeAdminHelp(interaction);
        });
    } else {
        const command = interaction.values[0];
        const embed = new MessageEmbed();

        switch (command) {
            case 'version':
                embed.setTitle('Commande: .`version` 🔖').setDescription('Obtenir des infos de Stresser.\nUsage: .`version`');
                break;
            case 'methods':
                embed.setTitle('Commande: .`methods` ⚙️').setDescription('Voir les méthodes disponibles.\nUsage: .`methods`');
                break;
            case 'claim':
                embed.setTitle('Commande: .`claim` 🔥').setDescription('Vous permet d obtenir 1 plan gratuit.\nUsage: .`claim`');
                 break;   
            case 'myplan':
                embed.setTitle('Commande: .`myplan` 📜').setDescription('Voir les infos de votre plan.\nUsage: .`myplan`');
                break; 
            case 'send':
                embed.setTitle('Commande: .`send` 🚀').setDescription('Envoyer une commande d\'envoits de paquets via Royal API.\nUsage: .`send <host> <port> <time> <method>`\nExemple: .`send 192.168.1.1 80 100 UDP`');
                break;                    
            case 'ongoing':
                embed.setTitle('Commande: .`ongoing` 🛠️').setDescription('Voir les envois en cours.\nUsage: .`ongoing`');
                break;
            case 'ping':
                embed.setTitle('Commande: .`ping` 📶').setDescription('ping une /p ou siteWeb.\nUsage: .`ping <host>`\nExemple: .`ping <host>`');
                break;     
            case 'paping':
                embed.setTitle('Commande: .`paping` 🤖').setDescription('paping une /p + port.\nUsage: .`paping <host> <port>`\nExemple: .`paping <host> <port>`');
                break;     
            case 'scan':
                embed.setTitle('Commande: .`scan` 🛡️').setDescription('scan une /p pour voir les ports ouvert.\nUsage: .`scan <host>`\nExemple: .`scan <host>`');
                break;          

            case 'geoip':
                embed.setTitle('Commande: .`geoip` 📡').setDescription('Rechercher les informations sur une adresse /P.\nUsage: .`geoip <ip_address>`\nExemple: .`geoip <host>`');
                break;
            case 'cfx':
                embed.setTitle('Commande: .`lookupcfx` 🔍').setDescription('Recherche les informations d\'un serveur FiveM via le suffixe CFX.\nUsage: .`lookupcfx <code_cfx>`\nExemple: .`lookupcfx abcd1234`');
                break;
            case 'urltoip':
                embed.setTitle('Commande: .`urltoip` 🗄️').setDescription('Obtenir /PV4 d\'un site Web via son url.\nUsage: .`urltotip <https://WebSite.com>`\nExemple: .`urltotip <https://WebSite.com>``');
                break;
            case 'helpadmins':
                embed.setTitle('Commande: .`helpadmins` 🔥').setDescription('Voir le menu Help Admins\nDescription: .`Voir le menu Admins`');
                break;
            default:
                embed.setTitle('Commande Inconnue ❓').setDescription('La commande sélectionnée n\'est pas reconnue. Veuillez choisir une option valide.');
                break;
        }

        await interaction.editReply({ embeds: [embed], ephemeral: true });
    }
});
const informedUsers = new Set();
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.channel.type === 'DM') {
        if (!informedUsers.has(message.author.id)) {
            informedUsers.add(message.author.id);
            await message.reply("Les commandes ne peuvent être utilisées que dans discord.gg/stresser , pas en messages privés.")
                .catch(error => console.error("Erreur lors de l'envoi du message en DM :", error));
        }
        return;
    }
    if (!message.content.startsWith('.') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (commandName === 'help' && args.length > 0) {
        const commandToCheck = args[0].toLowerCase();
        const command = client.commands.get(commandToCheck);
        if (!command) {
            await message.channel.send("Commande non trouvée. Faites `.help` pour voir la liste des commandes disponibles.")
                .then(msg => setTimeout(() => msg.delete().catch(console.error), 10000))
                .catch(error => console.error("Erreur lors de l'envoi du message :", error));
            await message.delete().catch(error => console.error("Erreur lors de la suppression du message :", error));
            return;
        }

        const embed = new MessageEmbed()
            .setTitle(`Commande: .${command.name} 🔖`)
            .setDescription(command.description || 'Pas de description disponible.');
        
        await message.author.send({ embeds: [embed] })
            .catch(error => console.error("Erreur lors de l'envoi du message en DM :", error));
        await message.delete().catch(error => console.error("Erreur lors de la suppression du message :", error));
        return;
    }

    if (!command) {
        await message.channel.send("Commande non trouvée, faites `.help` pour voir la liste des commandes disponibles.")
            .then(msg => setTimeout(() => msg.delete().catch(console.error), 10000))
            .catch(error => console.error("Erreur lors de l'envoi du message :", error));
        await message.delete().catch(error => console.error("Erreur lors de la suppression du message :", error));
        return;
    }

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(error);
        await message.reply({ content: 'Une erreur s\'est produite lors de l\'exécution de cette commande !', ephemeral: true });
    }
});

client.on('error', error => {
    console.error('Une erreur est survenue avec le client Discord :', error);
});

client.login(config.TOKEN);

async function executeAdminHelp(interaction) {
    const embed = new MessageEmbed();

    switch (interaction.values[0]) {
        case 'adduser':
            embed.setTitle('Commande: .`adduser` ➕').setDescription('Ajouter un utilisateur à la base de données.\nUsage: .`adduser <id> <maxtime> <conc> <jours> <vip(true/false)>`\nExemple: .`adduser 1234 70 1 5 false`');
            break;
        case 'deluser':
            embed.setTitle('Commande: .`deluser` ➖').setDescription('Supprimer un utilisateur de la base de données.\nUsage: .`deluser <id>`\nExemple: .`deluser 1234`');
            break;
        case 'userlist':
            embed.setTitle('Commande: .`userlist` 📋').setDescription('Afficher la liste des utilisateurs enregistrés.\nUsage: .`userlist`\nExemple: .`userlist`');
            break;
        case 'userviewplan':
            embed.setTitle('Commande: .`userviewplan` 👤').setDescription('Afficher les informations du plan d\'un utilisateur.\nUsage: .`userviewplan <id>`\nExemple: .`userviewplan 1234`');
            break;
        case 'lockuser':
            embed.setTitle('Commande: .`lockuser` 🔒').setDescription('Verrouiller un utilisateur.\nUsage: .`lockuser <id>`\nExemple: .`lockuser 1234 5`');
            break;
        case 'unlockuser':
            embed.setTitle('Commande: .`unlockuser` 🔓').setDescription('Déverrouiller un utilisateur.\nUsage: .`unlockuser <id>`\nExemple: .`unlockuser 1234`');
            break;
        case 'lockall':
            embed.setTitle('Commande: .`lockall` 🔒').setDescription('Verrouiller tous les utilisateurs.\nUsage: .`lockall`\nDescription: `Verrouiller tous les utilisateurs enregistrés.`');
            break;
        case 'addbl':
            embed.setTitle('Commande: .`addbl` ⛔').setDescription('Ajouter une adresse IP à la liste noire.\nUsage: .`addbl <ip_address>`\nExemple: .`addbl 192.168.1.1`');
            break;
        case 'delbl':
            embed.setTitle('Commande: .`delbl` ❌').setDescription('Supprimer une adresse IP de la liste noire.\nUsage: .`delbl <ip_address>`\nExemple: .`delbl 192.168.1.1`');
            break;
        case 'listbl':
            embed.setTitle('Commande: .`listbl` 📃').setDescription('Afficher la liste noire des adresses IP.\nUsage: .`listbl`\nDescription: `Afficher toutes les adresses IP en liste noire.`');
            break;
        case 'addowner':
            embed.setTitle('Commande: .`addowner` 📃').setDescription('Ajouter un owner.\nUsage: .`addowner`\nDescription: `Ajouter un owner.`');
            break;
        case 'delowner':
            embed.setTitle('Commande: .`delowner` 📃').setDescription('Supprimer un owner.\nUsage: .`delowner`\nDescription: `Supprimer un owner.`');
            break;
        default:
            embed.setTitle('Commande Inconnue ❓').setDescription('La commande sélectionnée n\'est pas reconnue. Veuillez choisir une option valide.');
            break;
    }
    
    await interaction.editReply({ embeds: [embed], ephemeral: true });
}
