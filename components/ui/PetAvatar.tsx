import { speciesEmoji } from '@/lib/constants';
import type { Species } from '@/lib/types';

const sizes = {
  sm: 'h-9 w-9 text-lg',
  md: 'h-12 w-12 text-2xl',
  lg: 'h-28 w-28 text-6xl',
};

interface Props {
  photo: string | null;
  species: Species;
  name: string;
  size?: keyof typeof sizes;
}

/** Round pet photo, with a species emoji as the fallback when there is no photo. */
export function PetAvatar({ photo, species, name, size = 'md' }: Props) {
  const base = `${sizes[size]} shrink-0 rounded-full object-cover ring-2 ring-white`;
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={`Photo of ${name}`} className={base} />;
  }
  return (
    <span
      role="img"
      aria-label={`${species} avatar`}
      className={`${base} flex items-center justify-center ${species === 'Dog' ? 'bg-amber-200' : 'bg-pink-200'}`}
    >
      {speciesEmoji(species)}
    </span>
  );
}
