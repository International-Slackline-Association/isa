import { appColors } from 'styles/theme/colors';
import { ui } from 'styles/theme/ui';

// Drawn for the white pop-up.
const C = {
  blue: ui.blue,
  green: appColors.slackmapGreen,
  active: appColors.activeColor,
  red: appColors.lineStrokeColor,
  ink: ui.text,
  card: ui.fill,
  rock: '#C3CFDB',
  soft: '#5B6B7B',
  dim: '#9AA8B6',
};
const font = { fontFamily: 'Barlow, sans-serif', fontWeight: 800 } as const;

const Anchors = (p: { y: number; x1: number; x2: number; color: string }) => (
  <>
    <path d={`M${p.x1 - 10} ${p.y + 22} L${p.x1} ${p.y} L${p.x1 + 8} ${p.y + 22}Z`} fill={C.rock} />
    <path d={`M${p.x2 - 8} ${p.y + 22} L${p.x2} ${p.y} L${p.x2 + 10} ${p.y + 22}Z`} fill={C.rock} />
    <path
      d={`M${p.x1} ${p.y} Q${(p.x1 + p.x2) / 2} ${p.y + 6} ${p.x2} ${p.y}`}
      stroke={p.color}
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
    />
  </>
);

const Person = (p: { x: number; y: number; s?: number; fill?: string; shades?: boolean }) => (
  <g transform={`translate(${p.x} ${p.y}) scale(${p.s ?? 1})`}>
    <circle cx={0} cy={-16} r={10} fill={p.fill ?? '#8FA9C2'} />
    <path d="M-15 12 Q-15 -4 0 -4 Q15 -4 15 12Z" fill={p.fill ?? '#8FA9C2'} />
    {p.shades && (
      <path d="M-11 -19 H11 V-16 Q11 -11 5 -11 Q1 -11 0 -15 Q-1 -11 -5 -11 Q-11 -11 -11 -16Z" fill="#0b121a" />
    )}
  </g>
);

const NameTag = (p: { x: number; y: number; text: string }) => (
  <g transform={`translate(${p.x} ${p.y})`}>
    <path d={`M0 0 H${p.text.length * 8 + 18} a6 6 0 0 1 6 6 V16 a6 6 0 0 1 -6 6 H0 L-9 11Z`} fill={C.green} />
    <circle cx={2} cy={11} r={2.5} fill={C.ink} />
    <text x={10} y={16} {...font} fontSize={13} fill={C.ink}>
      {p.text}
    </text>
  </g>
);

const Arrow = (p: { x: number; y: number; w: number }) => (
  <path
    d={`M${p.x} ${p.y} h${p.w} m-8 -7 l8 7 -8 7`}
    stroke={C.soft}
    strokeWidth={2.5}
    fill="none"
    strokeLinecap="round"
  />
);

const choiceBox = { viewBox: '0 0 150 92', width: '100%', style: { maxWidth: 150 }, 'aria-hidden': true } as const;

export const AnonymousDrawing = () => (
  <svg {...choiceBox}>
    <Anchors y={70} x1={18} x2={132} color={C.active} />
    <Person x={75} y={42} s={1.15} shades />
    <g transform="translate(104 8)">
      <rect width={26} height={24} rx={8} fill={C.blue} />
      <path d="M4 22 L2 30 L11 23Z" fill={C.blue} />
      <text x={13} y={18} textAnchor="middle" {...font} fontSize={16} fill="#fff">
        ?
      </text>
    </g>
  </svg>
);

export const NamedDrawing = () => (
  <svg {...choiceBox}>
    <Anchors y={70} x1={18} x2={132} color={C.active} />
    <Person x={60} y={42} s={1.15} />
    <NameTag x={88} y={22} text="Mia" />
  </svg>
);

const SlideSvg = (p: { children: React.ReactNode }) => (
  <svg viewBox="0 0 300 130" width="100%" style={{ maxWidth: 330, display: 'block', margin: '0 auto' }} aria-hidden>
    {p.children}
  </svg>
);

const Plane = (p: { x: number; y: number }) => (
  <g transform={`translate(${p.x} ${p.y})`} fill={C.soft}>
    <path d="M0 8 L34 4 L40 0 L44 2 L40 8 L44 14 L40 16 L34 12 L0 8Z" />
    <path d="M18 7 L10 -6 L15 -6 L26 6Z M18 9 L10 22 L15 22 L26 10Z" />
  </g>
);

const Helicopter = (p: { x: number; y: number }) => (
  <g transform={`translate(${p.x} ${p.y})`} fill={C.soft}>
    <rect x={-2} y={0} width={36} height={3} rx={1.5} />
    <rect x={14} y={2} width={3} height={6} />
    <path d="M4 8 H24 Q32 8 32 15 Q32 22 24 22 H8 Q4 22 4 15Z" />
    <rect x={30} y={13} width={16} height={3} rx={1.5} />
    <path d="M8 24 H28" stroke={C.soft} strokeWidth={2} />
  </g>
);

const WhySlide = () => (
  <SlideSvg>
    <rect x={8} y={10} width={284} height={110} rx={14} fill={C.card} />
    <Anchors y={78} x1={26} x2={86} color={C.active} />
    <Person x={56} y={54} s={0.8} shades />
    <Arrow x={98} y={70} w={30} />
    <g transform="translate(136 46)">
      <rect width={52} height={48} rx={12} fill={C.blue} />
      <g fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
        <circle cx={26} cy={24} r={3} fill="#fff" />
        <path d="M19 17 a10 10 0 0 0 0 14 M33 17 a10 10 0 0 1 0 14" />
        <path d="M14 12 a17 17 0 0 0 0 24 M38 12 a17 17 0 0 1 0 24" />
      </g>
    </g>
    <Arrow x={196} y={70} w={30} />
    <Plane x={238} y={28} />
    <Helicopter x={236} y={64} />
    <text x={262} y={112} textAnchor="middle" {...font} fontSize={14} fill={C.soft}>
      …
    </text>
  </SlideSvg>
);

const ActiveSlide = () => (
  <SlideSvg>
    <rect x={8} y={10} width={284} height={110} rx={14} fill={C.card} />
    <g opacity={0.55}>
      <path d="M40 56 L108 74" stroke={C.red} strokeWidth={4} strokeLinecap="round" />
      <circle cx={40} cy={56} r={4} fill={C.red} />
      <circle cx={108} cy={74} r={4} fill={C.red} />
    </g>
    <Arrow x={122} y={66} w={22} />
    <path d="M160 56 L240 74" stroke={C.active} strokeWidth={10} strokeLinecap="round" opacity={0.4} />
    <path d="M160 56 L240 74" stroke={C.active} strokeWidth={4} strokeLinecap="round" />
    <circle cx={160} cy={56} r={5} fill={C.active} />
    <circle cx={240} cy={74} r={5} fill={C.active} />
    <g transform="translate(212 20)">
      <rect width={66} height={24} rx={12} fill={C.active} />
      <text x={33} y={17} textAnchor="middle" {...font} fontSize={12.5} fill={ui.onActive}>
        until Sun
      </text>
    </g>
  </SlideSvg>
);

const AnonymousSlide = () => (
  <SlideSvg>
    <Person x={40} y={70} s={1.1} shades />
    <g transform="translate(18 92)">
      <rect width={44} height={28} rx={5} fill={C.rock} />
      <circle cx={12} cy={12} r={5} fill={C.dim} />
      <rect x={21} y={8} width={16} height={3} rx={1.5} fill={C.dim} />
      <rect x={21} y={15} width={12} height={3} rx={1.5} fill={C.dim} />
      <path d="M-3 -3 L47 31 M47 -3 L-3 31" stroke={C.red} strokeWidth={3.5} strokeLinecap="round" />
    </g>
    <path d="M78 60 h46" stroke={C.soft} strokeWidth={2.5} strokeDasharray="4 5" strokeLinecap="round" />
    <g transform="translate(96 40) rotate(-8)">
      <path d="M0 0 H54 V12 a6 6 0 0 0 0 12 V36 H0 V24 a6 6 0 0 0 0 -12Z" fill={C.green} />
      <text x={27} y={22} textAnchor="middle" {...font} fontSize={11} fill={C.ink}>
        MEMBER
      </text>
      <text x={27} y={32} textAnchor="middle" fontSize={9} fill={C.ink}>
        ★ pass
      </text>
    </g>
    <Arrow x={156} y={60} w={46} />
    <g transform="translate(212 22)">
      <rect width={76} height={78} rx={14} fill={C.card} stroke={C.blue} strokeWidth={2} />
      <circle cx={20} cy={22} r={9} fill={C.blue} />
      <path d="M15 22 l4 4 7 -8" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <text x={34} y={26} fontFamily="Barlow, sans-serif" fontSize={11} fill={C.soft}>
        a member
      </text>
      <circle cx={20} cy={52} r={9} fill={C.rock} />
      <text x={20} y={57} textAnchor="middle" {...font} fontSize={13} fill="#fff">
        ?
      </text>
      <text x={34} y={56} fontFamily="Barlow, sans-serif" fontSize={11} fill={C.soft}>
        who? –
      </text>
    </g>
  </SlideSvg>
);

const NamedSlide = () => (
  <SlideSvg>
    <rect x={8} y={10} width={284} height={110} rx={14} fill={C.card} />
    <Anchors y={50} x1={86} x2={250} color={C.active} />
    <Person x={150} y={62} s={1.1} />
    <NameTag x={184} y={34} text="by Mia" />
  </SlideSvg>
);

const LinkSlide = () => (
  <SlideSvg>
    <g transform="translate(150 64)">
      <circle r={26} fill={C.blue} />
      <g fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round">
        <rect x={-17} y={-7} width={18} height={14} rx={7} />
        <rect x={-1} y={-7} width={18} height={14} rx={7} />
      </g>
    </g>
    <g stroke={C.soft} strokeWidth={2} strokeDasharray="3 5" strokeLinecap="round">
      <path d="M120 54 L72 30" />
      <path d="M120 74 L72 98" />
      <path d="M180 64 L222 64" />
    </g>
    <g transform="translate(46 12)">
      <rect width={22} height={38} rx={5} fill={C.rock} stroke={C.soft} strokeWidth={1.5} />
    </g>
    <g transform="translate(32 84)">
      <rect width={44} height={28} rx={4} fill={C.rock} stroke={C.soft} strokeWidth={1.5} />
      <rect x={-6} y={28} width={56} height={5} rx={2} fill={C.soft} />
    </g>
    <Person x={240} y={76} s={0.75} />
    <Person x={262} y={72} s={0.8} fill="#A7BBCF" />
    <Person x={282} y={78} s={0.7} fill="#8FA9C2" />
    <text x={262} y={28} textAnchor="middle" fontFamily="Barlow, sans-serif" fontWeight={700} fontSize={12} fill={C.soft}>
      your crew
    </text>
  </SlideSvg>
);

const EndSlide = () => (
  <SlideSvg>
    <g transform="translate(34 18)">
      <rect width={88} height={92} rx={12} fill="#fff" />
      <rect width={88} height={24} rx={12} fill={C.active} />
      <rect y={12} width={88} height={12} fill={C.active} />
      <text x={44} y={17} textAnchor="middle" {...font} fontSize={12} fill={ui.onActive}>
        MAX 14 DAYS
      </text>
      <text x={44} y={70} textAnchor="middle" {...font} fontSize={38} fill={C.ink}>
        14
      </text>
    </g>
    <Arrow x={140} y={64} w={30} />
    <g opacity={0.4}>
      <path d="M190 46 L270 62" stroke={C.red} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 7" />
    </g>
    <text x={230} y={38} textAnchor="middle" fontFamily="Barlow, sans-serif" fontWeight={700} fontSize={12} fill={C.soft}>
      ends by itself
    </text>
    <g transform="translate(196 78)">
      <rect width={78} height={34} rx={10} fill={C.card} stroke={C.green} strokeWidth={1.5} />
      <g transform="translate(8 9)">
        <rect width={17} height={16} rx={3} fill="#fff" stroke={C.green} strokeWidth={1.5} />
        <rect width={17} height={5} rx={2} fill={C.green} />
      </g>
      <text x={32} y={16} fontFamily="Barlow, sans-serif" fontWeight={700} fontSize={10.5} fill={C.soft}>
        reminder
      </text>
      <text x={32} y={28} fontFamily="Barlow, sans-serif" fontSize={10} fill={C.dim}>
        on your phone
      </text>
    </g>
  </SlideSvg>
);

const OpenSourceSlide = () => (
  <SlideSvg>
    <rect x={8} y={10} width={284} height={110} rx={14} fill={C.card} />
    <g transform="translate(70 30)">
      <rect width={120} height={74} rx={10} fill={C.rock} />
      <text x={16} y={30} {...font} fontSize={18} fill={C.green}>
        {'</>'}
      </text>
      <rect x={16} y={42} width={70} height={5} rx={2.5} fill={C.dim} />
      <rect x={16} y={54} width={50} height={5} rx={2.5} fill={C.dim} />
    </g>
    <g transform="translate(176 70)">
      <circle r={22} fill="none" stroke={C.blue} strokeWidth={6} />
      <path d="M16 16 L34 34" stroke={C.blue} strokeWidth={8} strokeLinecap="round" />
    </g>
  </SlideSvg>
);

export const repositoryUrl = 'https://github.com/International-Slackline-Association/isa';

export const slides: {
  drawing: React.ReactNode;
  text: React.ReactNode;
  aside?: string;
  link?: { href: string; label: string };
}[] = [
  {
    drawing: <WhySlide />,
    text: (
      <>
        Others need to know when a line is up, <b>pilots</b> among them. SlackMap passes it on:{' '}
        <b>you help keep slacklining safe without getting involved</b>.
      </>
    ),
  },
  {
    drawing: <ActiveSlide />,
    text: (
      <>
        Activating says: <b>this line or spot is rigged</b>, from now or a day you pick, until the day you pick.
      </>
    ),
  },
  {
    drawing: <AnonymousSlide />,
    text: (
      <>
        <b>Anonymous:</b> SlackMap only learns that <i>a</i> member did it, <b>never who</b>.
      </>
    ),
    aside: 'People nearby may still guess who rigs there.',
  },
  {
    drawing: <OpenSourceSlide />,
    text: (
      <>
        Don’t take our word for it: SlackMap is <b>open source</b> and uses <b>industry-standard</b> methods, so anyone
        can check how it works.
      </>
    ),
    link: { href: repositoryUrl, label: 'See the code on GitHub' },
  },
  {
    drawing: <NamedSlide />,
    text: (
      <>
        <b>With my name:</b> your name shows on it while it’s active.
      </>
    ),
  },
  {
    drawing: <LinkSlide />,
    text: (
      <>
        Either way you get a <b>manage link</b>: whoever has it can extend or deactivate. Send it to your other phone or
        your crew.
      </>
    ),
  },
  {
    drawing: <EndSlide />,
    text: (
      <>
        It <b>ends by itself</b> on its day, 14 days at most. Want a nudge? Add it to your calendar; SlackMap sends nothing.
      </>
    ),
  },
];
