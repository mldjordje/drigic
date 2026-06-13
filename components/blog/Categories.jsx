const categories = [
  { id: 1, text: "Hijaluron" },
  { id: 2, text: "Botoks" },
  { id: 3, text: "PRP" },
  { id: 4, text: "Anti-age" },
  { id: 5, text: "Saveti" },
  { id: 6, text: "Tretmani" },
  { id: 7, text: "Koža" },
  { id: 8, text: "Niš" },
];

export default function Categories() {
  return (
    <div className="sidebar__widget">
      <h4 className="sidebar__widget-title">Kategorije</h4>
      <div className="sidebar__cat-list">
        <ul className="list-wrap">
          {categories.map((cat) => (
            <li key={cat.id}>
              <span>{cat.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
