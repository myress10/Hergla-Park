import KartFormRow from './KartFormRow';
import AddKartButton from './AddKartButton';
import { Flag } from 'lucide-react';

export default function KartList({
  karts,
  errors,
  onUpdateKart,
  onDeleteKart,
  onMoveUp,
  onMoveDown,
  onAddKart,
}) {
  if (karts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-navy/10 text-navy mx-auto flex items-center justify-center">
            <Flag size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Aucun kart configuré</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Commencez par ajouter votre premier kart pour configurer son numéro de course et la couleur de sa carrosserie.
          </p>
          <div className="pt-2 max-w-xs mx-auto">
            <AddKartButton onAdd={onAddKart} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {karts.map((kart, index) => (
          <KartFormRow
            key={kart.id || kart.tempId || index}
            kart={kart}
            index={index}
            totalCount={karts.length}
            onUpdate={onUpdateKart}
            onDelete={onDeleteKart}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            error={errors[index]}
          />
        ))}
      </div>

      <div className="pt-2">
        <AddKartButton onAdd={onAddKart} />
      </div>
    </div>
  );
}
