import {useCurrentFrame} from 'remotion';
import React from 'react';
import {Eq as EqShape, Note, beatX} from './shapes';

// 音楽・ダンス系の部品: 音符、イコライザ、波形。ビートは、120BPM(1秒に2拍)で動く
export const useBeat = () => { const x = beatX(useCurrentFrame()); return {x, ph: x % 1, hit: Math.exp(-(x % 1) * 6)}; };
export {Note};
export const Eq: React.FC<Omit<React.ComponentProps<typeof EqShape>, 'frame'>> = props => <EqShape {...props} frame={useCurrentFrame()} />;
