export enum SubscriptionPack {
  STANDARD = 'STANDARD',
  AVANCE = 'AVANCE',
  PREMIUM = 'PREMIUM',
}

export enum UpgradeRequestStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  APPROUVE = 'APPROUVE',
  REFUSE = 'REFUSE',
}

export interface PackConfig {
  id: SubscriptionPack;
  nom: string;
  badge: string;
  description: string;
  startingPrice: string;
  currency: string;
  maxEspaces: number | null; // null means unlimited
  maxUsers: number | null;
  maxCustomObjects: number | null;
  allowKartsModule: boolean;
  allowAuditLogs: boolean;
  allowCustomRoles: boolean;
  features: string[];
}

export const SUBSCRIPTION_PACKS_CONFIG: Record<SubscriptionPack, PackConfig> = {
  [SubscriptionPack.STANDARD]: {
    id: SubscriptionPack.STANDARD,
    nom: 'Standard',
    badge: '🥉 Standard',
    description: 'Idéal pour démarrer et digitaliser vos premiers espaces interactifs.',
    startingPrice: '190',
    currency: 'TND / mois',
    maxEspaces: 3,
    maxUsers: 3,
    maxCustomObjects: 0,
    allowKartsModule: false,
    allowAuditLogs: false,
    allowCustomRoles: false,
    features: [
      'Jusqu\'à 3 espaces de visite 3D',
      'Jusqu\'à 3 comptes collaborateurs',
      'Catalogue d\'objets 3D standard',
      'Éditeur de scènes interactif',
      'Support par email standard',
    ],
  },
  [SubscriptionPack.AVANCE]: {
    id: SubscriptionPack.AVANCE,
    nom: 'Avancé',
    badge: '🥈 Avancé',
    description: 'Parfait pour les parcs et entreprises en forte croissance avec besoins spécifiques.',
    startingPrice: '450',
    currency: 'TND / mois',
    maxEspaces: 6,
    maxUsers: 7,
    maxCustomObjects: 10,
    allowKartsModule: true,
    allowAuditLogs: true,
    allowCustomRoles: false,
    features: [
      'Jusqu\'à 6 espaces de visite 3D',
      'Jusqu\'à 7 comptes collaborateurs',
      'Upload de 10 modèles 3D personnalisés (.glb)',
      'Module spécifique Karts & Circuits inclus',
      'Journal d\'audit d\'activité (30 jours)',
      'Support prioritaire par email & téléphone',
    ],
  },
  [SubscriptionPack.PREMIUM]: {
    id: SubscriptionPack.PREMIUM,
    nom: 'Premium',
    badge: '🥇 Premium',
    description: 'La solution complète et illimitée pour les grands parcs multi-sites et franchises.',
    startingPrice: 'Sur Devis',
    currency: '',
    maxEspaces: null, // Unlimited
    maxUsers: null, // Unlimited
    maxCustomObjects: null, // Unlimited
    allowKartsModule: true,
    allowAuditLogs: true,
    allowCustomRoles: true,
    features: [
      'Espaces de visite 3D ILLIMITÉS',
      'Comptes collaborateurs ILLIMITÉS',
      'Uploads 3D personnalisés ILLIMITÉS',
      'Tous les modules métier & extensions futures',
      'Rôles et permissions 100% sur-mesure',
      'Historique complet des logs d\'audit',
      'Account Manager dédié & assistance 24/7',
    ],
  },
};
