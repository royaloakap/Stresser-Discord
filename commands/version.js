const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'version',
    description: "Affiche les informations sur la version du système.",
    execute(message) {
        const embed = new MessageEmbed()
            .setTitle("🚀 $tresser - v2.5.0 Édition Expert 🚀")
            .setDescription("$tresser est une source écrite personnalisée avec moins de 800 lignes de code. Cette source a été développée par [Royaloak](https://t.me/royal_faq) 🍏")
            .setColor("#3498db")
            .setAuthor("$tresser", "https://media.discordapp.net/attachments/1167901034090336317/1178637930139500584/Fivem%20Beta%20Searcher.png?ex=6576df1c&is=65646a1c&hm=66741a504c3909986b66e4055444318ca72217ae7291f338cc3de3207f68ad57&=&format=webp")
            .addFields(
                { name: "💡Version", value: "2.5.0", inline: true },
                { name: "🔒Développeur", value: "[Royaloak](https://t.me/royaloakap)", inline: true },
                { name: "⚙️Lignes de Code", value: "< 800", inline: true },
                { name: "📈Améliorations", value: "- Ajout de la commande 'ongoing'\n- Amélioration de l'aspect visuel\n- Gestion des MP et des erreurs\n- + de 10 methods ajoutées\n- Stresser utilise Royal api !", inline: false }
            )
            .setThumbnail("https://media.discordapp.net/attachments/1167901034090336317/1178637930139500584/Fivem%20Beta%20Searcher.png?ex=6576df1c&is=65646a1c&hm=66741a504c3909986b66e4055444318ca72217ae7291f338cc3de3207f68ad57&=&format=webp")
            .setFooter("© $tresser 2024 | Source Écrite Personnalisée");

        message.author.send({ embeds: [embed] })
            .then(() => {
               
                message.delete();
            })
            .catch(error => {
                console.error("❌ Erreur lors de l'envoi du DM", error);
                message.channel.send("❌ Je ne peux pas vous envoyer de messages privés. Veuillez vérifier vos paramètres de confidentialité. ❌")
                    .then(() => {
                    
                        message.delete();
                    })
                    .catch(console.error);
            });
    }
};
