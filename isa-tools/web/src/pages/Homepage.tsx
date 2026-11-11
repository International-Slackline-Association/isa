import { Icon, IconName } from '../components/Icons';

const items: { icon: IconName; title: string; subtitle: string; route: string }[] = [
  {
    icon: 'membership',
    title: 'Certified Instructors',
    subtitle: 'List of ISA Certified instructors',
    route: '/certified-instructors',
  },
  {
    icon: 'redeem',
    title: 'Certified Riggers',
    subtitle: 'List of ISA Certified riggers',
    route: '/certified-riggers',
  },
  {
    icon: 'build',
    title: 'Certified Gears',
    subtitle: 'List of ISA Certified gears',
    route: '/certified-gears',
  },
  {
    icon: 'warning',
    title: 'Equipment Warnings',
    subtitle: 'Warnings and recalls for slackline equipment',
    route: '/equipment-warnings',
  },
  {
    icon: 'warning',
    title: 'Sair Reports',
    subtitle: 'Accident Reports',
    route: '/sair-reports',
  },
  {
    icon: 'trophy',
    title: 'World Records',
    subtitle: 'ISA recognized world records',
    route: '/world-records',
  },
  {
    icon: 'trophy',
    title: 'World Firsts',
    subtitle: 'ISA recognized world firsts',
    route: '/world-firsts',
  },
];

export function Homepage() {
  return (
    <div className="tiles">
      {items.map((item) => (
        <a key={item.route} className="tile" href={item.route}>
          <Icon name={item.icon} size={30} />
          <span>
            <span className="title">{item.title}</span>
            <span className="subtitle">{item.subtitle}</span>
          </span>
        </a>
      ))}
    </div>
  );
}
