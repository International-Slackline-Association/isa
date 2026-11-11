// signature.height (or .width) is the printed size in pt. dx/dy nudge the signature from its
// default spot: centred over the signature line, bottom edge on the line.
export const signatories = {
  thomasBuckingham: {
    name: 'Thomas Buckingham',
    role: ['President', 'International Slackline Association'],
    signature: { file: 'thomas-buckingham.png', height: 47.9, dx: 5.4, dy: -3.1 },
  },
  haraldHoegglinger: {
    name: 'Harald Högglinger',
    role: ['Vice President', 'International Slackline Association'],
    signature: { file: 'harald-hoegglinger.svg', height: 29.4, dx: 7.8, dy: -6.5 },
  },
  sarahGmeiner: {
    name: 'Sarah Gmeiner',
    role: ['Chairperson Advisory Board', 'International Slackline Association'],
    signature: { file: 'sarah-gmeiner.png', height: 36, dx: 3.4, dy: 8.2 },
  },
  robertoDeOliveira: {
    name: 'Roberto de Oliveira',
    role: ['President Education Commission', 'International Slackline Association'],
    signature: { file: 'roberto-de-oliveira.png', height: 40, dy: -2 },
  },
  jonasUmlauft: {
    name: 'Jonas Umlauft',
    role: ['President Sport Commission', 'International Slackline Association'],
    signature: { file: 'jonas-umlauft.png', height: 38, dy: -2 },
  },
  liamWatfordCendra: {
    name: 'Liam Watford Cendra',
    role: ['President Safety Commission', 'International Slackline Association'],
    signature: { file: 'liam-watford-cendra.png', width: 150, dy: -4 },
  },
};
