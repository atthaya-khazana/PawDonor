import { speciesEmoji } from '@/lib/constants';
import type { Species } from '@/lib/types';

const sizes = {
  sm: 'h-9 w-9 text-lg',
  md: 'h-12 w-12 text-2xl',
  lg: 'h-28 w-28 text-6xl',
};

/**
 * One shared dummy photo per species, used when a pet has no photo of its own.
 * Files live in /public/dummy. A species without an entry keeps its emoji.
 * To give dogs a photo too, add:  Dog: '/dummy/dog.jpg'
 */
const defaultPhotos: Partial<Record<Species, string>> = {
  Cat: '/dummy/cat.jpg',
  Dog: '/dummy/dog.jpg',
};

interface Props {
  photo: string | null;
  species: Species;
  name: string;
  size?: keyof typeof sizes;
}

/** Round pet photo. Falls back to the species' dummy photo, then to the species emoji. */
export function PetAvatar({ photo, species, name, size = 'md' }: Props) {
  const base = `${sizes[size]} shrink-0 rounded-full object-cover ring-2 ring-white`;
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={`Photo of ${name}`} className={base} />;
  }
  const fallback = defaultPhotos[species];
  if (fallback) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={fallback} alt={`${species} avatar`} className={base} />;
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
