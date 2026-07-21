# Bankroll Manager

Application web pour remplir, importer et exporter vos données de paris (`bankroll_manager_data.xlsx`).
Elle tourne entièrement dans le navigateur — aucune donnée n'est envoyée sur internet, tout reste stocké
en local (dans le navigateur) et dans les fichiers Excel que vous importez/exportez.

## Démarrer l'application

Double-cliquez sur **`start.bat`**. Cela lance un petit serveur local et ouvre l'application dans votre
navigateur par défaut, à l'adresse http://localhost:8765. Laissez la fenêtre noire ouverte tant que
vous utilisez l'application ; fermez-la pour l'arrêter.

## Profils Tom / Micka

En haut à gauche, un sélecteur permet de basculer entre les profils **Tom** et **Micka**. Chaque
profil a ses propres entrées, son propre tableau de bord/graphique, et son propre fichier `.xlsx`
à importer/exporter — les données des deux profils sont totalement indépendantes et ne
s'affichent/se mélangent jamais entre elles.

Le profil actif est mémorisé automatiquement (il reste sélectionné au prochain lancement).

**Import automatique au premier lancement** : la toute première fois qu'un profil est utilisé
(aucune donnée), l'application charge automatiquement son fichier par défaut :
`data/bankroll_manager_data_Tom.xlsx` pour Tom, `data/bankroll_manager_data_Micka.xlsx` pour
Micka. C'est un chargement ponctuel (une copie des fichiers au moment où ils ont été ajoutés à
l'application) : une fois importées, les données vivent dans l'application et ne se resynchronisent
plus jamais automatiquement avec ces fichiers. Pour recharger un fichier plus récent, utilisez le
bouton "Importer" manuellement. Si vous supprimez toutes les entrées d'un profil, l'import
automatique ne se redéclenche pas (pour respecter une suppression volontaire) ; ré-importez alors
manuellement si besoin.

⚠️ Cette séparation fonctionne **dans un même navigateur** (les données sont stockées localement
dans le navigateur, par profil). Si Tom et Micka utilisent chacun leur propre ordinateur ou
navigateur, chacun doit simplement rester sur son profil et exporter régulièrement son propre
fichier `.xlsx` pour en garder une copie — inutile de synchroniser quoi que ce soit entre eux.

## Utilisation

1. **Importer** : au premier lancement, cliquez sur "Importer un fichier Excel" et sélectionnez votre
   fichier `bankroll_manager_data.xlsx`. Toutes vos entrées (paris, paris gratuits, dépôts, retraits)
   sont chargées.
2. **Ajouter / Modifier** : bouton "+ Ajouter" en haut à droite, ou l'icône ✏️ sur une ligne existante.
   Les champs affichés s'adaptent au type d'entrée sélectionné.
3. **Filtrer / Trier** : utilisez la barre de recherche et les filtres au-dessus du tableau ; cliquez
   sur un en-tête de colonne pour trier.
4. **Exporter** : bouton "Exporter" pour générer un nouveau fichier `.xlsx` (même structure que
   l'original : feuille "Paris" + feuille "Constantes", avec les formules de Profit / Profit cumulé).

Les données sont sauvegardées automatiquement dans le navigateur (localStorage) à chaque modification,
donc vous ne perdez rien si vous fermez l'onglet. Pensez tout de même à exporter régulièrement pour
garder une copie `.xlsx` à jour.

## Notes de compatibilité avec Excel / Power BI

- Le fichier exporté reproduit fidèlement les colonnes, la feuille "Constantes" et les formules
  (Profit, Profit cumulé, Profit cumulé à la fin du mois) de votre fichier d'origine.
- Limite technique : la bibliothèque utilisée pour générer le fichier Excel depuis le navigateur ne
  peut pas recréer l'objet "Tableau" natif d'Excel (celui que vous aviez via Insertion > Tableau).
  Si votre rapport Power BI (`bankroll_manager_stats.pbix`) est connecté à ce tableau nommé "Paris",
  il vous faudra soit re-transformer la plage en tableau une fois dans Excel (sélectionner les
  données puis Insertion > Tableau, en le nommant "Paris"), soit pointer la requête Power Query vers
  la feuille plutôt que vers le tableau.
- Le Profit est toujours recalculé à partir de "Montant gagné" et "Montant parié" (une entrée sans
  "Montant gagné" est considérée comme perdue). Si d'anciennes lignes de votre fichier avaient un
  Profit modifié à la main et désynchronisé de la formule, l'app affichera la valeur recalculée
  correcte.

## Fichiers du projet

- `index.html`, `styles.css`, `app.js` — l'application (aucune étape de build nécessaire).
- `vendor/` — bibliothèques utilisées (SheetJS pour lire/écrire les `.xlsx`, Chart.js pour le graphique),
  incluses localement pour que l'app fonctionne hors ligne.
- `data/` — fichiers Excel par défaut utilisés pour l'import automatique de chaque profil
  (`bankroll_manager_data_Tom.xlsx`, `bankroll_manager_data_Micka.xlsx`).
- `start.bat` — lance un serveur local et ouvre l'application.
