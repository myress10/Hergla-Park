# Checklist de Validation QA & Rapport Final — Hergla-Park

Ce document contient la grille de validation complète et le compte-rendu d'exécution des tests fonctionnels, de sécurité et d'isolation multi-tenant pour l'application Hergla-Park.

---

## 📋 Grille de Test par Rôle & Fonctionnalité

| Rôle / Catégorie | Fonctionnalité à tester | Scénario & Actions de Test | Résultat attendu | Statut | Commentaire & Résultat de Test |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **ROOT** | Connexion | Se connecter avec le compte global ROOT | Accès à la supervision globale ; aucun `companyId` rattaché | `[x]` | ✅ **Validé**. Accès global actif, `companyId: null`. |
| **ROOT** | Consultation des logs (`/api/root/logs`) | Naviguer vers la vue d'audit global sans filtre | Voir l'ensemble des logs de toutes les entreprises | `[x]` | ✅ **Validé**. 15+ logs affichés, `companyId` & `company.nom` renseignés pour chaque entreprise. |
| **ROOT** | Consultation des rôles (`/api/root/roles`) | Naviguer vers la vue des rôles globaux | Accès en lecture à l'ensemble des rôles de tous les tenants | `[x]` | ✅ **Validé**. Rôles système et rôles custom de toutes les entreprises ("Responsable Café", "Manager VIP", "Contrôleur Piste") affichés avec leur nom d'entreprise. |
| **ROOT** | Intervention d'urgence sur une donnée | Modifier un espace sans `reason` puis avec `reason` | Refusé sans `reason` (HTTP 400), accepté avec `reason` (HTTP 200) + `isRootIntervention: true` | `[x]` | ✅ **Validé**. Rejet 400 sans motif (`"Intervention ROOT refusée : un motif ('reason') non vide est obligatoire"`), Succès 200 avec motif, flag `isRootIntervention: true` et motif stockés en base. |
| **SUPERADMIN** | CRUD utilisateurs & espaces | Créer, modifier, et désactiver des données dans son tenant | Succès dans son tenant. Blocage strict hors-tenant. | `[x]` | ✅ **Validé**. CRUD fonctionnel et cloisonné au tenant du JWT. |
| **SUPERADMIN** | Rôle personnalisé | Créer un rôle custom (ex: "Responsable Café") | Rôle créé avec `niveau: 20` forcé côté serveur | `[x]` | ✅ **Validé**. Forçage du niveau 20 serveur effectif (ignore toute valeur envoyée par le client). |
| **SUPERADMIN** | Hiérarchie de cumul de rôles (`mode: "add"`) | Tenter d'ajouter un rôle supérieur (ex: ADMIN level 50) à un EMPLOYE (level 20) | Requête rejetée avec HTTP 400 et message explicite | `[x]` | ✅ **Validé**. Rejet 400: `"Ce rôle est supérieur au niveau actuel de l'utilisateur. Utilisez le mode 'replace' pour une promotion explicite."` |
| **SUPERADMIN** | Promotion explicite (`mode: "replace"`) | Remplacer les rôles d'un EMPLOYE par ADMIN | Remplacement autorisé sans restriction de niveau | `[x]` | ✅ **Validé**. Succès HTTP 200/201, l'utilisateur passe au niveau ADMIN (level 50). |
| **SUPERADMIN** | Multi-entreprises (`switch-company`) | Se connecter, vérifier `availableCompanies`, puis basculer vers une autre entreprise | Nouveau JWT émis, espaces de la 2e entreprise retournés sans reconnexion | `[x]` | ✅ **Validé**. `availableCompanies` retourne Hergla Park + Gloulou Test Co. Endpoint `/api/auth/switch-company` génère un nouveau token et bascule le contexte immédiatement. Sélecteur d'entreprise actif dans le header du dashboard. |
| **SUPERADMIN** | Sécurité bascule multi-entreprises | Tenter de basculer vers une entreprise non autorisée | Bloqué avec HTTP 403 Forbidden | `[x]` | ✅ **Validé**. HTTP 403: `"Accès refusé. Vous n'êtes pas autorisé à basculer vers cette entreprise."` |
| **ADMIN / EMPLOYE** | Isolation multi-tenant | Tenter d'accéder directement aux ressources d'une autre entreprise | Bloqué avec HTTP 403 / 404 | `[x]` | ✅ **Validé**. `GET /api/espaces` ne retourne aucun espace tiers. `GET /api/espaces/space-gloulou-lounge-id` retourne HTTP 404 introuvable. `GET /api/roles` masque les rôles tiers. |
| **Plateforme** | CORS Vercel Preview | Appel API depuis un domaine de preview `*.vercel.app` | Requête autorisée sans erreur CORS | `[x]` | ✅ **Validé**. `app.enableCors()` utilise une validation dynamique d'origine supportant `/\.vercel\.app$/`. |

---

## 🔬 Détails des Résultats de Tests par Partie

### Partie A — Règle de hiérarchie des rôles
1. **Champ `niveau` sur `Role`** :
   - `ROOT`: 100
   - `SUPERADMIN`: 90
   - `ADMIN`: 50
   - `EMPLOYE`: 20
   - **Rôles personnalisés** : Fixés de manière inaltérable à `niveau: 20` dans `roles.service.ts` (méthode `create`).
2. **Logique de validation `add` vs `replace`** :
   - Test `mode: "add"` (SUPERADMIN level 90 + custom role level 20) : **PASS** (niveau 20 <= 90).
   - Test `mode: "add"` (EMPLOYE level 20 + role ADMIN level 50) : **PASS** (rejeté avec HTTP 400 : `"Ce rôle est supérieur au niveau actuel de l'utilisateur. Utilisez le mode 'replace' pour une promotion explicite."`).
   - Test `mode: "replace"` (EMPLOYE level 20 -> ADMIN level 50) : **PASS** (promotion autorisée).

### Partie B — Isolation multi-tenant (2e entreprise : Gloulou Test Co)
- **2e Entreprise de test** : "Gloulou Test Co" (`slug: "gloulou-test"`, ID: `8c258d5c-7fc9-4d5f-b937-a25dafbcdb40`).
- **Isolation des espaces** : `GET /api/espaces` pour le SUPERADMIN de Hergla Park retourne exactement 3 espaces (0 fuite).
- **Accès direct bloqué** : `GET /api/espaces/space-gloulou-lounge-id` retourne HTTP 404 (Introuvable).
- **Isolation des rôles** : `GET /api/roles` masque le rôle "Manager VIP" de Gloulou Test Co.

### Partie C — Re-vérification complète du rôle ROOT
- **Logs globaux** : `GET /api/root/logs` retourne les logs des deux entreprises avec `companyId` et `company.nom`.
- **Visibilité immédiate des rôles** : La création d'un rôle personnalisé dans Gloulou Test Co apparaît immédiatement dans `GET /api/root/roles` du ROOT avec le nom de l'entreprise associée.
- **Intervention d'urgence ROOT** :
  - Sans `reason` dans les query params : HTTP 400 (`"Intervention ROOT refusée : un motif ('reason') non vide est obligatoire dans les métadonnées pour toute action d'écriture ROOT."`).
  - Avec `reason=...` : HTTP 200, l'entrée `AuditLog` associée comporte `isRootIntervention: true` et `metadata.reason` renseigné.

### Partie D — CORS sur les déploiements de preview Vercel
- Configuration NestJS `app.enableCors()` validée :
  ```typescript
  const isAllowed = origin.startsWith('http://localhost') || /\.vercel\.app$/.test(origin) || origin.includes('herglapark');
  ```
- Les requêtes cross-origin provenant de n'importe quelle URL de preview Vercel (`https://*-gloulou.vercel.app`) sont acceptées.

### Partie E — SUPERADMIN multi-entreprises (Bascule sans reconnexion)
- **Modèle de données** : Modèle junction `UserCompany` ajouté dans `schema.prisma`.
- **Réponse login** : `POST /api/auth/login` renvoie `activeCompanyId` et `availableCompanies: [{ id, nom, slug }]`.
- **Endpoint bascule** : `POST /api/auth/switch-company` avec body `{ companyId: "..." }` vérifie l'association `UserCompany` et ré-émet un token JWT avec le nouveau `companyId`.
- **Sécurité** : Tentative de bascule d'un compte non rattaché (ex: EMPLOYE mono-entreprise) renvoie HTTP 403 Forbidden.
- **Interface Dashboard (Frontend)** : Sélecteur d'entreprise dynamique intégré dans la barre supérieure (`DashboardLayout.jsx`) visible dès que `availableCompanies.length > 1`.

---

## 🧪 Données de Test QA Initiales (Seeded)

| Rôle | Email | Mot de passe | Périmètre |
| :--- | :--- | :--- | :--- |
| **ROOT** | `root_demo@herglapark.com` | `DemoSecurePass!2026` | Supervision globale plateforme |
| **SUPERADMIN (Multi)** | `superadmin_demo@herglapark.com` | `DemoSecurePass!2026` | Hergla Park + Gloulou Test Co (Bascule active) |
| **SUPERADMIN (Gloulou)** | `superadmin_gloulou@glouloutest.com` | `DemoSecurePass!2026` | Gloulou Test Co uniquement |
| **ADMIN** | `admin_demo@herglapark.com` | `DemoSecurePass!2026` | Hergla Park (Café) |
| **EMPLOYE** | `employe_demo@herglapark.com` | `DemoSecurePass!2026` | Hergla Park (Piste Karting) |
