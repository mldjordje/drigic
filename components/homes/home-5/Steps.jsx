import React from "react";

export default function Steps() {
  const categories = [
    {
      number: "01",
      title: "Lice",
      text: "Botox, hijaluron, skin booster i tretmani harmonizacije kontura.",
    },
    {
      number: "02",
      title: "Anti-age",
      text: "Individualni planovi za osvežen izgled bez neprirodnih promena.",
    },
    {
      number: "03",
      title: "Telo",
      text: "Nehirurške procedure za definiciju i unapređenje kvaliteta kože.",
    },
    {
      number: "04",
      title: "Muška estetika",
      text: "Diskretni tretmani prilagođeni muškoj anatomiji i očekivanjima.",
    },
  ];

  return (
    <div className="feature-area-1 space" id="tretmani">
      <div className="container">
        <div className="title-area text-center">
          <h2 className="sec-title text-smoke">Oblasti tretmana</h2>
          <p className="sec-text text-smoke mt-20">
            Plan tretmana je uvek personalizovan nakon konsultacije i procene.
          </p>
        </div>
        <div className="row gx-0 gy-30">
          {categories.map((item, index) => (
            <div key={index} className="col-lg-3 col-md-6">
              <div className="process-card glass-panel h-100">
                <div className="process-card-number">{item.number}</div>
                <h4 className="process-card-title">{item.title}</h4>
                <p className="process-card-text">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
