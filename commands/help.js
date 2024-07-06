const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js');
const fs = require('fs');
const path = require('path'); 

module.exports = {
    name: 'help',
    description: "Affiche toutes les commandes disponibles et leur utilisation.",
    async execute(message) {
        const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'commands')).filter(file => file.endsWith('.js'));
        const adminCommandFiles = fs.readdirSync(path.join(__dirname, '..', 'admin')).filter(file => file.endsWith('.js'));
        const totalCommands = commandFiles.length + adminCommandFiles.length;

        const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('help-menu')
                    .setPlaceholder('🌍 Choisissez une commande pour en savoir plus...')
                    .addOptions([
                        {
                            label: 'Version',
                            description: 'Obtenir des infos de $tresser',
                            value: 'version',
                            emoji: '🔖'
                        },
                        {
                            label: 'Methods',
                            description: 'Voir les méthodes disponibles',
                            value: 'methods',
                            emoji: '⚙️'
                        },
                        {
                            label: 'Claim',
                            description: 'Obtenir son plan Free 1x/jour !',
                            value: 'claim',
                            emoji: '🔥'
                        },
                        {
                            label: 'MyPlan',
                            description: 'Voir les infos de votre plan',
                            value: 'myplan',
                            emoji: '📜'
                        },
                        {
                            label: 'Send',
                            description: 'Envoyer une commande pour envoyers des paquets via Royal API',
                            value: 'send',
                            emoji: '🚀'
                        },
                        {
                            label: 'Ongoing',
                            description: 'Voir les attaques en cours',
                            value: 'ongoing',
                            emoji: '🛠️'
                        },
                        {
                            label: 'Ping',
                            description: 'Ping une /p durant 10sec',
                            value: 'ping',
                            emoji: '📶'
                        },
                        { 
                            label: 'Paping',
                            description: 'Paping une /p + port durant 10sec',
                            value: 'paping',
                            emoji: '🤖'
                        },
                        {
                            label: 'Scan',
                            description: 'Scan une /p pour obtenir les ports ouverts !',
                            value: 'scan',
                            emoji: '🛡️'
                        },
                        {
                            label: 'Geo IP',
                            description: 'Rechercher les informations sur une adresse /P',
                            value: 'geoip',
                            emoji: '📡'
                        },
                        {
                            label: 'Lookup CFX',
                            description: 'Rechercher les informations d\'un serveur FiveM',
                            value: 'cfx',
                            emoji: '🔍'
                        },
                        {
                            label: 'Url To IP',
                            description: 'Resolve un domaine pour obtenir son I/V4 ainsi que ses ports ouverts !',
                            value: 'urltoip',
                            emoji: '🗄️'
                        },
                        {
                            label: 'Help Admins',
                            description: 'Voir le menu Help Admins',
                            value: 'helpadmins',
                            emoji: '🔥'
                        },
                    ]),
            );

            const embed = new MessageEmbed()
            .setTitle(`Menu d'aide de $tresser - Cmd Disponibles : (${totalCommands}) ❤️`)
            .setColor(0x3498db)
            .setFooter("💡 Sélectionnez une commande pour voir comment l'utiliser.")
            .setDescription("Utilisez le menu ci-dessous pour choisir une commande spécifique.\nCréé par [Royaloak](https://t.me/royal_faq) 🍏 !");

        message.delete().catch(console.error);

        const sentMessage = await message.channel.send({ embeds: [embed], components: [row] });
        setTimeout(() => sentMessage.delete().catch(console.error), 200000); 
    }
};
