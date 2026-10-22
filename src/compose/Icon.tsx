import React from 'react';
import {icons} from 'lucide-react';

type Cmp = React.ComponentType<{size?: number; color?: string; strokeWidth?: number}>;
// 題材の絵(Lucideのアイコン)。名前が無ければ、何も出さない
export const Icon: React.FC<{name?: string | null; size: number; color: string; stroke?: number; style?: React.CSSProperties}> = ({name, size, color, stroke = 2, style}) => {
  const C = name ? (icons as unknown as Record<string, Cmp>)[name] : null;
  return C ? <div style={{display: 'flex', ...style}}><C size={size} color={color} strokeWidth={stroke} /></div> : null;
};
