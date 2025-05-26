📦 Project Refactoring Rules – Frontend & Backend

--- FRONTEND (client) ---

1. Structure claire :
– Dossier client/src avec sous-dossiers : components, pages, hooks, utils, styles et theme.

2. Taille de fichier limitée :
– Chaque fichier React (page ou composant) fait au maximum 300 lignes.
– Si un fichier dépasse 300 lignes, diviser en sous-composants ou extraire la logique dans hooks ou utils.

3. Longueur de fonction limitée :
– Chaque fonction ou méthode tient en 20 lignes maximum.
– La logique complexe doit être extraite dans utils ou dans un hook.

4. Styles séparés :
– Aucune mise en style inline.
– Un fichier CSS ou SCSS par composant.
– Toutes les variables de thème (couleurs, marges, polices) centralisées dans un seul fichier theme.

5. UI simple et débutant-friendly :
– Utiliser des composants basiques pour boutons, champs et tableaux.
– Animations restrictives, uniquement des transitions CSS pour hover et focus.

6. Flux de données explicite :
– Les props descendent toujours du parent vers l’enfant.
– Pour l’état global, utiliser Context API ou hooks personnalisés sans prop-drilling profond.

7. Gestion d’état :
– Pour un partage d’état étendu, envisager React Query ou Redux, sinon Context + hooks.

8. Nommage en français, style débutant :
– Variables et fonctions nommées clairement en français, sans abréviations.

9. Documentation en tête :
– Chaque fichier commence par deux ou trois lignes décrivant le composant, son but et ses props.

10. Pas de code de debug :
– Supprimer tous les console.log, debugger et commentaires de test avant chaque commit.

11. Tests frontend :
– Ajouter au minimum des tests unitaires pour les composants critiques.

12. Commits ciblés :
– Un seul type de refactor par commit, avec message explicite.


--- BACKEND (server) ---

1. Structure claire :
– Dossier server avec sous-dossiers : routes, controllers, services, models, middlewares, config, utils et tests.

2. Routes REST simples :
– Un routeur par ressource, avec définitions GET, POST, PUT, DELETE.

3. Controllers légers :
– Chaque méthode ne dépasse pas 10 lignes et appelle uniquement un service avant de renvoyer la réponse.

4. Services dédiés :
– Toute logique métier et accès base de données dans des services séparés.

5. Modèles Mongoose en français :
– Schémas clairs avec noms de champs en français.

6. Validation des données :
– Utiliser un middleware de validation (Joi ou express-validator) avant les controllers.

7. Middleware d’erreur global :
– Un seul gestionnaire d’erreur central pour formater et renvoyer les messages d’erreur.

8. Pas de console.log en production :
– Seuls des logs via un logger (morgan ou winston) en développement.

9. Tests backend :
– Tests unitaires pour les services et controllers.

10. Sécurité et performances :
– Limiter la taille des réponses JSON, utiliser helmet, cors et rate-limit.

11. Documentation API :
– Un fichier dédié listant chaque route, les paramètres et le schéma de réponse.

12. Nommage en français :
– Fichiers, variables et fonctions tous en français.

13. Commits backend séparés :
– Un commit clair par refactor de l’API.
