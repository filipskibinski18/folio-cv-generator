import type { ResumeData } from '../types/resume';

export const sampleResume: ResumeData = {
  personal: { firstName: 'Aleksandra', lastName: 'Nowak', title: 'Senior Product Designer', email: 'aleksandra.nowak@example.com', phone: '+48 501 234 567', location: 'Warszawa, Polska', website: 'aleksandranowak.design' },
  summary: 'Projektuję produkty cyfrowe, które łączą potrzeby ludzi z celami biznesowymi. Od 7 lat pomagam zespołom zamieniać złożone problemy w proste, intuicyjne doświadczenia. Łączę myślenie strategiczne, badania i dbałość o każdy detal.',
  experience: [
    { id: 'exp-1', company: 'Docplanner', role: 'Senior Product Designer', location: 'Warszawa · hybrydowo', startDate: '2022-03', endDate: '', current: true, description: 'Projektowanie doświadczeń dla platformy medycznej obsługującej ponad 20 mln pacjentów miesięcznie.', bullets: [
      { id: 'b-1', text: 'Przeprojektowanie procesu rezerwacji wizyt — wzrost konwersji o **24%** i spadek porzuceń o 18%.', children: [] },
      { id: 'b-2', text: 'Rozwój design systemu: 60+ komponentów używanych przez 8 zespołów produktowych.', children: [] },
      { id: 'b-3', text: 'Prowadzenie badań z użytkownikami i warsztatów discovery we współpracy z PM i engineering.', children: [] },
    ] },
    { id: 'exp-2', company: 'Netguru', role: 'Product Designer', location: 'Poznań · zdalnie', startDate: '2019-06', endDate: '2022-02', current: false, description: 'Kompleksowe projektowanie aplikacji webowych i mobilnych dla klientów z branży fintech i e-commerce.', bullets: [
      { id: 'b-4', text: 'Realizacja 12 projektów od discovery do wdrożenia, dla klientów z Polski, UK i Niemiec.', children: [] },
      { id: 'b-5', text: 'Mentoring 3 junior designerów i wdrożenie procesu design critique.', children: [] },
    ] },
  ],
  education: [{ id: 'edu-1', institution: 'Uniwersytet SWPS', degree: 'Magister', field: 'Projektowanie komunikacji', startDate: '2014', endDate: '2019', description: 'Specjalizacja: interakcje i UX.' }],
  skills: [
    { id: 'sk-1', name: 'Projektowanie', skills: [{ id: 's-1', name: 'Product design', level: 5 }, { id: 's-2', name: 'UX research', level: 4 }, { id: 's-3', name: 'Design systems', level: 5 }, { id: 's-4', name: 'Prototypowanie', level: 5 }, { id: 's-5', name: 'Accessibility', level: 4 }] },
    { id: 'sk-2', name: 'Narzędzia', skills: [{ id: 's-6', name: 'Figma', level: 5 }, { id: 's-7', name: 'FigJam', level: 5 }, { id: 's-8', name: 'Framer', level: 4 }, { id: 's-9', name: 'HTML / CSS', level: 3 }] },
  ],
  projects: [{ id: 'proj-1', name: 'Careflow', role: 'Projekt własny · 2025', url: 'https://example.com/careflow', description: 'Koncepcja aplikacji wspierającej opiekunów osób starszych w organizacji codziennej opieki.', technologies: ['Figma', 'Research', 'Prototyp'], bullets: [] }],
  certificates: [{ id: 'cert-1', name: 'UX Design Certificate', issuer: 'Google', date: '2021', url: '' }],
  languages: [{ id: 'lang-1', name: 'Polski', level: 'Ojczysty' }, { id: 'lang-2', name: 'Angielski', level: 'C1 · zaawansowany' }],
  links: [{ id: 'link-1', label: 'LinkedIn', url: 'https://linkedin.com/in/anowak' }, { id: 'link-2', label: 'Portfolio', url: 'https://example.com/portfolio' }],
  consent: 'Wyrażam zgodę na przetwarzanie moich danych osobowych zawartych w CV na potrzeby prowadzonego procesu rekrutacyjnego.',
};
