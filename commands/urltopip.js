const { MessageEmbed } = require('discord.js');
const dns = require('dns');
const portscanner = require('portscanner');

module.exports = {
    name: 'urltoip',
    description: 'Résoudre l\'adresse IP IPv4 d\'une URL et scanner les ports ouverts.',
    async execute(message, args) {
        // Supprimer le message de l'utilisateur
        message.delete().catch(console.error);

        if (args.length !== 1) {
            return message.reply('Veuillez fournir une URL valide à résoudre en adresse IP. Exemple: .urlip https://www.example.com');
        }

        let url = args[0];
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'http://' + url;
        }

        const urlWithoutProtocol = url.replace(/(^\w+:|^)\/\//, '');
        const urlNormalized = urlWithoutProtocol.endsWith('/') ? urlWithoutProtocol.slice(0, -1) : urlWithoutProtocol;

        dns.resolve4(urlNormalized, async (err, addresses) => {
            if (err) {
                console.error('Erreur lors de la résolution de l\'adresse IP :', err);
                return message.channel.send('Erreur lors de la résolution de l\'adresse IP. Veuillez vérifier l\'URL fournie.');
            }

            const ipv4Address = addresses[0];
            const openPorts = await scanOpenPorts(ipv4Address);
            const embed = generateEmbed(message, urlNormalized, ipv4Address, openPorts);
            message.author.send({ embeds: [embed] })
                .then(() => {
                    message.channel.send(`${message.author}, ✅ les informations ont été envoyées en DM !`)
                        .then(msg => setTimeout(() => msg.delete(), 10000))
                        .catch(console.error);
                })
                .catch(error => {
                    console.error('Erreur lors de l\'envoi du message en DM :', error);
                    message.channel.send('Erreur lors de l\'envoi du message en DM. Veuillez vérifier vos paramètres de confidentialité.')
                        .then(msg => setTimeout(() => msg.delete(), 10000))
                        .catch(console.error);
                });
        });

        // Vérifier si les DM sont ouverts
        if (!message.author.dmChannel) {
            return message.channel.send(`${message.author}, ❌ Veuillez ouvrir vos messages privés avec le bot pour utiliser cette commande.`);
        }
    },
};

async function scanOpenPorts(ip) {
    const portsToScan = [
        21, 22, 23, 25, 53, 80, 110, 143, 443, 587,
        993, 995, 3306, 3389, 5900, 8080, 8443
    ];
    const portDescriptions = {
        22: 'SSH 🖥️',  // Secure Shell
        3389: 'RDP 📡', // Remote Desktop Protocol
        21: 'FTP 📁',   // File Transfer Protocol
        23: 'Telnet 📞', // Telnet
        25: 'SMTP 📧',   // Simple Mail Transfer Protocol
        53: 'DNS 🌍',   // Domain Name System
        80: 'HTTP 🌐',  // HyperText Transfer Protocol
        110: 'POP3 📬', // Post Office Protocol version 3
        143: 'IMAP 📥', // Internet Message Access Protocol
        443: 'HTTPS 🔒', // HyperText Transfer Protocol Secure
        587: 'SMTP 📧',  // SMTP (Submission)
        993: 'IMAP SSL 🔐',  // IMAP over SSL
        995: 'POP3 SSL 🔐',  // POP3 over SSL
        3306: 'MySQL 🗄️',  // MySQL Database
        5900: 'VNC 🖥️',  // Virtual Network Computing
        8080: 'HTTP Proxy 🌐',  // HTTP Proxy
        8443: 'HTTPS Proxy 🔒', // HTTPS Proxy
    };
    

    const openPorts = [];

    for (const port of portsToScan) {
        const status = await portscanner.checkPortStatus(port, ip);
        if (status === 'open') {
            openPorts.push(port);
        }
    }

    return openPorts;
}

function generateEmbed(message, url, ip, openPorts) {
    const emojiSuccess = '✅';
    const emojiError = '❌';
    const statusEmoji = openPorts.length > 0 ? emojiSuccess : emojiError;
    const embed = new MessageEmbed()
        .setTitle(`${statusEmoji} 🔍  Informations sur le site Web ci dessous !`)
        .setDescription(`🌐 URL : ${url}\n🔍 Adresse IP : ${ip}`)
        .setColor(openPorts.length > 0 ? '#2ECC71' : '#E74C3C')
        .addField('🔓 Ports ouverts', openPorts.length > 0 ? openPorts.join(', ') : 'Aucun port ouvert détecté')
        .addField('🔍 Statut', openPorts.length > 0 ? 'Certains ports sont ouverts.' : 'Aucun port ouvert détecté.')
        .setFooter(`Demandé par ${message.author.tag}`, message.author.displayAvatarURL())
        .setTimestamp();

    return embed;
}
