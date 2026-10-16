// Everything she reads lives here. Captions and promises are placeholders:
// rewrite them in your own words, the layout does not care about length.

const photo = (src, caption, { w = 3, h = 4 } = {}) => ({ src: `/photos/${src}`, caption, w, h });

export const CHAPTERS = [
  {
    id: 'college',
    year: '2018',
    title: 'where it all began',
    line: 'two friends in a college crowd, no idea what was coming',
    photos: [
      photo('college/college-2.jpg', 'College days. A mic, a blazer, and a friend on the next chair, felt clueless that she\'s the one.', { w: 4, h: 3.85 }),
      photo('college/college-1.jpg', 'Walking the same road, years before we knew it was ours.', { w: 3, h: 4.5 }),
    ],
  },
  {
    id: 'andaman',
    year: 'December 2023',
    title: 'the island',
    line: 'the spark, the sea, and the answer I had found with a tap',
    photos: [
      photo('andaman/andaman-1.jpg', 'Despite of that smerky face, you fell for him.', { w: 3, h: 4 }),
      photo('andaman/andaman-4.jpg', 'The one that didn\'t know this is the hand she\'s gonna hold.', { w: 3, h: 4.5 }),
      photo('andaman/andaman-2.jpg', 'Peace for Life ... Naahhh Just kidding.'),
      photo('andaman/andaman-3.jpg', 'Art and artist !.'),
      photo('andaman/andaman-5.jpg', 'short and tall, but life had another plan.'),
      photo('andaman/andaman-6.jpg', 'The life (jacket) that is mandatory.'),
      photo('andaman/andaman-7.jpg', 'sirrrr.'),
      photo('andaman/andaman-8.jpg', 'Rest of my lifeeee.'),
      photo('andaman/andaman-9.jpg', 'you, me and food cart ! Isn\'t enough.', { w: 4.5, h: 3 }),
      photo('andaman/andaman-10.jpg', 'How I fell for her !.'),
      photo('andaman/andaman-11.jpg', 'Basen and us, the proud selfie.'),
    ],
  },
  {
    id: 'mountains',
    year: '2024',
    title: 'up north',
    line: 'Delhi, Uttarkashi, and a bus that climbed higher than we thought it could',
    photos: [
      photo('mountains/mountains-1.jpg', 'In Auto with Aunty.', { w: 4.5, h: 3.4 }),
      photo('mountains/mountains-2.jpg', 'Chill and beyond.'),
      photo('mountains/mountains-3.jpg', 'Train that stopped like my heart when I saw her.', { w: 3, h: 4 }),
      photo('mountains/mountains-4.jpg', 'Never ending....'),
      photo('mountains/mountains-5.jpg', 'Squeezed for you ! you for me ! What a comboo.'),
      photo('mountains/mountains-6.jpg', 'A guy with Bhundar.', { w: 4.5, h: 3.4 }),
    ],
  },
  {
    id: 'chennai',
    year: 'July 2025 – April 2026',
    title: 'the golden year',
    line: 'ten months, one home, one hostel and a thousand late-night food runs',
    photos: [
      photo('chennai/chennai-1.jpg', 'Airport nights and bad phone photos. The best kind.'),
      photo('chennai/chennai-3.jpg', 'The time I came to know that she has no brain.'),
      photo('chennai/chennai-4.jpg', 'Found a mirror. Found us in it.'),
      photo('chennai/chennai-2.jpg', 'My life. #today. Every day.'),
      photo('chennai/chennai-5.jpg', 'Fav of all places, Krishna Ji!'),
    ],
  },
];

export const PROMISES = [
  { title: 'I will keep choosing you', note: 'I promise that I will always choose you till 60!' },
  { title: 'We will see the mountains again', note: 'As we plan, I promise that I will accompany you in all the journey to mountains.' },
  { title: 'Your dreams are mine too', note: 'CS for you, CA for me, and one life we build out of both.' },
  { title: 'I will always find the food', note: 'Midnight, 2 am, whenever. I promise that I will find or make you food.' },
];

export const FINALE = {
  headline: 'Two Shas. One life.',
  sub: 'CA + CS. A blog, a vlog, a brand, a home. This is only the beginning.',
  link: 'https://sha2.life',
  linkLabel: 'sha2.life - Soon to be a home for everything we do.',
};
