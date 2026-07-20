# Checklist de Validation QA — Hergla-Park

Ce document sert de grille de validation pour les tests fonctionnels et d'isolation de la plateforme Hergla-Park déployée.

---

## 📋 Grille de Test par Rôle

| Rôle | Fonctionnalité à tester | Scénario & Actions de Test | Résultat attendu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **ROOT** | Connexion | Se connecter avec le compte global ROOT | Accès à une vue de supervision globale de la plateforme ; aucun `companyId` n'est rattaché au compte. | `[ ]` |
| **ROOT** | Consultation des logs (`/api/root/logs` ou `/api/audit-logs`) | Naviguer vers la vue d'audit global | Le ROOT est capable de lire l'ensemble des logs d'audit générés pour toutes les entreprises de la plateforme. | `[ ]` |
| **ROOT** | Consultation des rôles (`/api/root/roles`) | Naviguer vers la vue des rôles globaux | Accès en lecture à l'ensemble des rôles existants de tous les tenants. | `[ ]` |
| **ROOT** | Intervention d'urgence sur une donnée | Tenter de modifier un espace/utilisateur sans spécifier le champ `reason` dans la requête, puis avec le champ renseigné. | **Refusé** sans le paramètre `reason` (erreur validation). **Accepté** avec la raison. L'action apparaît dans les logs d'audit marqués du flag `isRootIntervention: true`. | `[ ]` |
| **SUPERADMIN** | CRUD utilisateurs | Créer, modifier, et désactiver/supprimer un compte utilisateur rattaché à son entreprise. | L'utilisateur est créé avec succès, modifié ou supprimé. Impossible de modifier des utilisateurs hors de l'entreprise. | `[ ]` |
| **SUPERADMIN** | CRUD espaces | Créer un nouvel espace (ex: "Kid Zone"), modifier son nom ou le supprimer. | L'espace est ajouté ou modifié avec succès. | `[ ]` |
| **SUPERADMIN** | Rôle personnalisé | Créer un rôle custom (ex: "Responsable Café") avec des permissions RBAC limitées. | Le rôle apparaît bien dans la liste locale des rôles et peut être assigné à un utilisateur du tenant. | `[ ]` |
| **SUPERADMIN** | Cumul de rôles | Attribuer le rôle ADMIN de base et le rôle custom "Responsable Café" à un utilisateur. | Les permissions se cumulent correctement (les actions autorisées par les deux rôles sont toutes accessibles). | `[ ]` |
| **SUPERADMIN** | Éditeur 3D | Ouvrir l'éditeur 3D, ajouter un meuble (D&D), modifier sa position/rotation/échelle, sauvegarder, et définir comme disposition originale. | Modifications sauvegardées avec succès en base de données. Le bouton "Reset" renvoie bien à la disposition originale. | `[ ]` |
| **ADMIN / EMPLOYE** | Accès restreint | Tenter de consulter ou modifier les données d'un espace autre que celui assigné (ex: `space-resto-demo-id`). | Requête bloquée avec un code d'erreur `403 Forbidden`. | `[ ]` |
| **ADMIN / EMPLOYE** | Statut d'espace | Modifier le statut opérationnel de son propre espace assigné (ex: passer de OUVERT à FERME). | La mise à jour est immédiatement prise en compte et visible sur l'API publique. | `[ ]` |
| **Visiteur (Public)** | Parcours en 4 étapes | Lancer le site vitrine et effectuer le parcours interactif de visite VR. | Navigation fluide sans saccades, affichage correct des instructions, bascule de langue (FR / AR) opérationnelle. | `[ ]` |
| **Tous** | Isolation multi-tenant | Tenter d'accéder à des données d'un autre tenant en modifiant les requêtes ou en forçant un `companyId` différent. | Aucune donnée d'un autre tenant ne doit fuiter. L'isolation logique filtre strictement par l'identifiant extrait du JWT. | `[ ]` |

---

## 🧪 Données de Test Initiales (Seeded)

- **Root** : `root_demo@herglapark.com`
- **SuperAdmin** : `superadmin_demo@herglapark.com`
- **Admin** : `admin_demo@herglapark.com` (Café)
- **Employé** : `employe_demo@herglapark.com` (Piste Karting)

*Veuillez consulter le fichier local `SEED_CREDENTIALS.md` à la racine de votre environnement pour obtenir les mots de passe.*
