const { MessageEmbed } = require('discord.js');
const portscanner = require('portscanner');

module.exports = {
    name: 'scan',
    description: 'Scanner les ports ouverts et fermés d\'une adresse IP.',
    async execute(message, args) {
        if (args.length !== 1) {
            return message.reply('❌ Veuillez fournir une adresse IP à scanner. Exemple: .scan 1.1.1.1').then(msg => {
                setTimeout(() => {
                    msg.delete().catch(console.error);
                    message.delete().catch(console.error);
                }, 10000);
            });
        }

        const ip = args[0];
        const portsToScan = [
            22, 3389, 80, 443, 21, 23, 25, 110, 143,
            53, 123, 161, 3306, 1433, 1521, 5900,
            993, 995, 5060, 8080, 8443, 137, 138,
            139, 445, 1723, 3000, 8000, 8081, 9090
        ];

        const portDescriptions = {
            22: 'SSH 🖥️', 3389: 'RDP 📡', 80: 'HTTP 🌐', 443: 'HTTPS 🔒',
            21: 'FTP 📁', 23: 'Telnet 📞', 25: 'SMTP 📧', 110: 'POP3 📬',
            143: 'IMAP 📥', 53: 'DNS 🌍', 123: 'NTP ⏰', 161: 'SNMP 📈',
            3306: 'MySQL 🗄️', 1433: 'MSSQL 🗃️', 1521: 'Oracle DB 📂',
            5900: 'VNC 🖥️', 993: 'IMAP SSL 🔐', 995: 'POP3 SSL 🔐',
            5060: 'SIP 📞', 8080: 'HTTP Proxy 🌐', 8443: 'HTTPS Proxy 🔒',
            137: 'NetBIOS Name Service 📛', 138: 'NetBIOS Datagram Service 📤',
            139: 'NetBIOS Session Service 📶', 445: 'Microsoft-DS 🖧',
            1723: 'PPTP VPN 🛡️', 3000: 'Custom Service 🛠️',
            8000: 'Alternative HTTP 🌐', 8081: 'Alternative HTTP Proxy 🌐',
            9090: 'Alternative HTTP Management 🌐'
        };

        let openPorts = [];
        let closedPorts = [];

        for (let port of portsToScan) {
            try {
                let status = await portscanner.checkPortStatus(port, ip);
                if (status === 'open') {
                    openPorts.push(`${port}: ${portDescriptions[port]}`);
                } else {
                    closedPorts.push(`${port}: ${portDescriptions[port]}`);
                }
            } catch (error) {
                console.error(`Erreur lors de la vérification du port ${port} sur ${ip}:`, error);
            }
        }

        const embed = new MessageEmbed()
            .setTitle(`🔍 Résultats du scan de ports pour ${ip}`)
            .setColor(0x0099FF)
            .addField('✅ Ports ouverts', openPorts.length > 0 ? openPorts.join('\n') : 'Aucun')
            .addField('❌ Ports fermés', closedPorts.length > 0 ? closedPorts.join('\n') : 'Aucun')
            .setFooter('Scan effectué sur discord.gg/stresser');

        try {
            await message.author.send({ embeds: [embed] });
            await message.channel.send(`${message.author}, ✅ les résultats du scan ont été envoyés en DM !`)
                .then(msg => setTimeout(() => msg.delete().catch(console.error), 10000))
                .catch(error => console.error("Erreur lors de l'envoi du message :", error));
        } catch (error) {
            if (error.code === 50007) { // Cannot send messages to this user
                await message.reply('❌ Impossible de vous envoyer un message privé. Veuillez vérifier vos paramètres de confidentialité.');
            } else {
                console.error("Erreur lors de l'envoi du message en DM :", error);
            }
        } finally {
            message.delete().catch(console.error);
        }
    }
};
