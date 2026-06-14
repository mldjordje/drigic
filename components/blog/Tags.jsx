const tags = [
  { id: 1, text: "Botoks Niš" },
  { id: 2, text: "Hijaluron" },
  { id: 3, text: "PRP" },
  { id: 4, text: "Anti-age" },
  { id: 5, text: "Fileri usne" },
  { id: 6, text: "Mezoterapija" },
  { id: 7, text: "Skinbusteri" },
  { id: 8, text: "Estetska medicina" },
];

export default function Tags() {
  return (
    <div className="sidebar__widget">
      <h4 className="sidebar__widget-title">Tagovi</h4>
      <div className="sidebar__tag-list">
        <ul className="list-wrap">
          {tags.map((tag) => (
            <li key={tag.id}>
              <span>{tag.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
