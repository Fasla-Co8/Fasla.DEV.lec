// Course catalogue: 4 levels × 20 lessons (70 original topics distributed without omission)
import { LESSONS_01_02 } from './lessons-01-02.js';
import { LESSONS_03_04 } from './lessons-03-04.js';
import { LESSONS_05_06 } from './lessons-05-06.js';
import { LESSONS_07_08 } from './lessons-07-08.js';
import { LESSONS_09_10 } from './lessons-09-10.js';
import { LESSONS_11_12 } from './lessons-11-12.js';
import { LESSONS_13_14 } from './lessons-13-14.js';
import { LESSONS_15_16 } from './lessons-15-16.js';
import { LESSONS_17_18 } from './lessons-17-18.js';
import { LESSONS_19_20 } from './lessons-19-20.js';

export const LEVELS = [
  { n: 1, name: 'أساسيات HTML', en: 'HTML Fundamentals', days: '01 – 05' },
  { n: 2, name: 'HTML المتوسط', en: 'Intermediate HTML', days: '06 – 10' },
  { n: 3, name: 'HTML المتقدم', en: 'Advanced HTML', days: '11 – 15' },
  { n: 4, name: 'هندسة HTML الاحترافية', en: 'Professional HTML Engineering', days: '16 – 20' },
];

export const LESSONS = [
  ...LESSONS_01_02,
  ...LESSONS_03_04,
  ...LESSONS_05_06,
  ...LESSONS_07_08,
  ...LESSONS_09_10,
  ...LESSONS_11_12,
  ...LESSONS_13_14,
  ...LESSONS_15_16,
  ...LESSONS_17_18,
  ...LESSONS_19_20,
].sort((a, b) => a.id - b.id);
