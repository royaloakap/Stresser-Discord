const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

module.exports = {
    name: 'helpadmins',
    description: "Affiche toutes les commandes administratives disponibles et leur utilisation.",
    async execute(message) {
        const dbStaff = new sqlite3.Database('./database/staff.db');
        dbStaff.get("SELECT staff_id FROM staff WHERE staff_id = ?", [message.author.id], async (err, staffRow) => {
            if (err) {
                console.error(err.message);
                message.author.send("Erreur lors de la vérification des droits. ❌");
                return;
            }
            if (!staffRow) {
                message.author.send("Vous n'avez pas l'autorisation d'utiliser cette commande. ❌");
                return;
            }
            const actionRow = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId('help-admin-menu')
                        .setPlaceholder('🌍 Choisissez une commande pour en savoir plus...')
                        .addOptions([
                            {
                                label: 'Add User',
                                description: 'Ajouter un utilisateur à la base de données.',
                                value: 'adduser',
                                emoji: '➕'
                            },
                            {
                                label: 'Delete User',
                                description: 'Supprimer un utilisateur de la base de données.',
                                value: 'deluser',
                                emoji: '➖'
                            },
                            {
                                label: 'User List',
                                description: 'Afficher la liste des utilisateurs enregistrés.',
                                value: 'userlist',
                                emoji: '📋'
                            },
                            {
                                label: 'View User Plan',
                                description: 'Afficher les informations du plan d\'un utilisateur.',
                                value: 'userviewplan',
                                emoji: '👤'
                            },
                            {
                                label: 'Lock User',
                                description: 'Verrouiller un utilisateur.',
                                value: 'lockuser',
                                emoji: '🔒'
                            },
                            {
                                label: 'Unlock User',
                                description: 'Déverrouiller un utilisateur.',
                                value: 'unlockuser',
                                emoji: '🔓'
                            },
                            {
                                label: 'Voir La liste des sanctions',
                                description: 'voir la liste de tous les utilisateurs sanctionné.',
                                value: 'lockall',
                                emoji: '🔒'
                            },
                            {
                                label: 'Add Blacklist',
                                description: 'Ajouter une adresse IP à la liste noire.',
                                value: 'addbl',
                                emoji: '⛔'
                            },
                            {
                                label: 'Delete Blacklist',
                                description: 'Supprimer une adresse IP de la liste noire.',
                                value: 'delbl',
                                emoji: '❌'
                            },
                            {
                                label: 'List Blacklist',
                                description: 'Afficher la liste noire des adresses IP.',
                                value: 'listbl',
                                emoji: '📃'
                            },
                            {
                                label: 'Add owner',
                                description: 'Ajouter un owner ( Seulement Royal ! ).',
                                value: 'addowner',
                                emoji: '📃'
                            },
                            {
                                label: 'dem owner',
                                description: 'Supprimer un owner ( Seulement Royal ! ).',
                                value: 'delowner',
                                emoji: '📃'
                            }
                        ]),
                );
            const embed = new MessageEmbed()
                .setTitle("Aide - Commandes Administratives 💼")
                .setColor(0xff0000)
                .setFooter("💡 Sélectionnez une commande pour voir comment l'utiliser.")
                .setDescription("Utilisez le menu ci-dessous pour choisir une commande administrative spécifique.");
            message.delete().catch(console.error);
            const sentMessage = await message.channel.send({ embeds: [embed], components: [actionRow] });
            setTimeout(() => sentMessage.delete().catch(console.error), 180000);
        });
    }
};
