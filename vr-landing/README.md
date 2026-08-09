# Hergla Park — Site Vitrine & Visite Virtuelle (Semaine 2 - Partie 2)

Site vitrine public et parcours d'onboarding interactif servant de sas d'accueil avant le lancement de la visite virtuelle 3D (build Unity WebGL).

---

## Stack technique

- **Framework** : React 19 + Vite
- **Animations & Transitions** : `framer-motion` (fond progressif, transitions de page, clavier réactif)
- **Styling** : Tailwind CSS v4
- **Internationalisation (i18n)** : `react-i18next` avec gestion complète **LTR/RTL** pour l'arabe
- **Icônes** : `lucide-react`

---

## Installation et démarrage

```bash
# 1. Se positionner dans le dossier du projet
cd hergla-park-vr-landing

# 2. Installer les modules dépendants
npm install

# 3. Lancer le serveur local
npm run dev
```

L'application est lancée par défaut sur **http://localhost:5173/**.

---

## Remplacement des contenus et images

Tous les textes et les catégories d'affichage sont traduits et configurés dans les locales i18n :
- Français : [fr.json](file:///c:/Users/Gigabyte/OneDrive/Bureau/visite%20virtuelle/hergla-park-vr-landing/src/i18n/fr.json)
- Arabe (RTL) : [ar.json](file:///c:/Users/Gigabyte/OneDrive/Bureau/visite%20virtuelle/hergla-park-vr-landing/src/i18n/ar.json)

Pour remplacer les images temporaires ou configurer la galerie, mettez à jour la constante `PARK_IMAGES` dans [WelcomePage.jsx](file:///c:/Users/Gigabyte/OneDrive/Bureau/visite%20virtuelle/hergla-park-vr-landing/src/pages/WelcomePage.jsx).

---

## 🕹️ Intégration du build Unity WebGL (Semaine 8)

Pour l'instant, un composant de simulation `UnityPlaceholder` est rendu à l'Étape 4 (LaunchPage) après un temps de chargement progressif fictif de 3,5 secondes.

### Comment brancher le build réel ?

1. Déposez votre build Unity WebGL compile (`Build/`, `TemplateData/`...) dans le dossier `public/unity-build/`.
2. Remplacez le composant [UnityPlaceholder.jsx](file:///c:/Users/Gigabyte/OneDrive/Bureau/visite%20virtuelle/hergla-park-vr-landing/src/components/UnityPlaceholder.jsx) par le lecteur Unity officiel de React (par exemple en utilisant `@unity-services/react-unity-webgl` ou le loader injecté globalement).
3. Exemple d'utilisation dans `LaunchPage.jsx` :

```jsx
import { Unity, useUnityContext } from "react-unity-webgl";

function UnityPlayer() {
  const { unityProvider } = useUnityContext({
    loaderUrl: "unity-build/my-build.loader.js",
    dataUrl: "unity-build/my-build.data",
    frameworkUrl: "unity-build/my-build.framework.js",
    codeUrl: "unity-build/my-build.wasm",
  });

  return <Unity unityProvider={unityProvider} style={{ width: 800, height: 600 }} />;
}
```
---

## Support RTL (Arabe)

La bascule de langue en haut à droite met à jour le sens du document de manière dynamique :
- Éléments de navigation, boutons d'action du bas de page et structure de grille s'inversent de droite à gauche.
- Le diagramme de touches de déplacement clavier [ControlsDiagram.jsx](file:///c:/Users/Gigabyte/OneDrive/Bureau/visite%20virtuelle/hergla-park-vr-landing/src/components/ControlsDiagram.jsx) et les icônes de Lucide restent fidèles aux configurations originales pour maintenir l'accessibilité intuitive.
