export type Diet = 'v' | 'vg' | 'gf' | 'hot';
export interface Dish { name: string; desc: string; price: number; diet: Diet[]; signature?: boolean }
export const dietLabels: Record<Diet, string> = { v: 'Vegetarian', vg: 'Vegan', gf: 'Gluten-free', hot: 'Spicy' };

export const menu: Record<string, Dish[]> = {
  Antipasti: [
    { name: 'Burrata di Andria', desc: 'Heirloom tomatoes, basil oil, aged balsamic, Sicilian sea salt', price: 16, diet: ['v', 'gf'], signature: true },
    { name: 'Vitello tonnato', desc: 'Slow-roasted veal, tuna & caper sauce, crispy capers', price: 18, diet: ['gf'] },
    { name: 'Carciofi alla giudia', desc: 'Twice-fried Roman artichokes, lemon, mint', price: 14, diet: ['vg', 'gf'] },
    { name: 'Polpo alla brace', desc: 'Grilled octopus, smoked potato, ’nduja vinaigrette', price: 21, diet: ['gf', 'hot'] },
  ],
  Primi: [
    { name: 'Tagliolini al tartufo', desc: 'Hand-cut egg pasta, Parmigiano 30 months, black truffle', price: 32, diet: ['v'], signature: true },
    { name: 'Cacio e pepe', desc: 'Tonnarelli, Pecorino Romano DOP, Tellicherry pepper', price: 19, diet: ['v'] },
    { name: 'Risotto allo zafferano', desc: 'Carnaroli rice, saffron from L’Aquila, bone-marrow butter', price: 26, diet: ['gf'] },
    { name: 'Paccheri all’arrabbiata', desc: 'San Marzano tomatoes, Calabrian chilli, garlic, parsley', price: 18, diet: ['vg', 'hot'] },
  ],
  Secondi: [
    { name: 'Ossobuco alla milanese', desc: 'Braised veal shank, gremolata, saffron risotto', price: 36, diet: ['gf'], signature: true },
    { name: 'Branzino al sale', desc: 'Salt-baked sea bass for two, Amalfi lemon, wild fennel', price: 78, diet: ['gf'] },
    { name: 'Melanzane alla parmigiana', desc: 'Layered aubergine, smoked scamorza, basil', price: 24, diet: ['v', 'gf'] },
  ],
  Dolci: [
    { name: 'Tiramisù della casa', desc: 'Mascarpone, savoiardi, single-origin espresso', price: 11, diet: ['v'], signature: true },
    { name: 'Cannoli siciliani', desc: 'Sheep’s ricotta, candied orange, Bronte pistachio', price: 12, diet: ['v'] },
    { name: 'Sorbetto al limone', desc: 'Amalfi lemon sorbet, prosecco float', price: 9, diet: ['vg', 'gf'] },
  ],
};
