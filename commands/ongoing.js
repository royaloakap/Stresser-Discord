const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../config.json');

module.exports = {
    name: 'ongoing',
    description: '💡 Afficher les envois en cours',
    async execute(message, args) {
        message.delete({ timeout: 3000 }).catch(console.error);

        try {
            const response = await fetch(`https://royal-api.cc/api/ongoing?username=${config.API_USERNAME}&key=${config.API_KEY}`);
            const data = await response.json();

            console.log('API response:', data);
            if (data.error) {
                throw new Error(`❌Erreur lors de la récupération des envois en cours: ${data.reason || 'Réponse API invalide'}`);
            }
            const ongoingAttacks = data.user_ongoing;
            if (!ongoingAttacks || ongoingAttacks.length === 0) {
                return message.author.send({ embeds: [new MessageEmbed().setDescription("⚠️ Aucune attaque en cours.").setColor("#00FF00")] });
            }
            const embed = new MessageEmbed()
                .setTitle("🛡️ envois EN COURS")
                .setColor("#1D82B6");

            ongoingAttacks.forEach(attack => {
                embed.addField("🚀ID", attack.Id.toString(), true)
                    .addField("🎯Cible", attack.Host, true)
                    .addField("🔌Port", attack.Port.toString(), true)
                    .addField("⏳Durée", `${attack.Duration} secondes`, true)
                    .addField("🔨Méthode", attack.Method, true)
                    .addField("\u200b", "\u200b"); 
            });
            message.author.send({ embeds: [embed] });
            message.channel.send({ embeds: [new MessageEmbed().setDescription("✅ Informations sur les envois en cours envoyées en message privé.").setColor("#00FF00")] });
        } catch (err) {
            console.error('❌ Erreur lors de la récupération des envois en cours:', err);
            message.channel.send({ embeds: [new MessageEmbed().setDescription("❌ Erreur lors de la récupération des envois en cours.").setColor("#FF0000")] });
        }
    }
};
