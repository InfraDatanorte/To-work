// O agrupamento mantém uma lista grande de profissões fácil de percorrer.
export default function CategoryOptions({ categories, emptyLabel = 'Selecione uma categoria' }) {
  const groups = {};
  for (const category of categories) {
    const group = category.group || 'Outros serviços';
    if (!groups[group]) groups[group] = [];
    groups[group].push(category);
  }
  return <><option value="">{emptyLabel}</option>{Object.keys(groups).sort((a, b) => a.localeCompare(b, 'pt-BR')).map((group) =>
    <optgroup key={group} label={group}>{groups[group].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</optgroup>
  )}</>;
}
