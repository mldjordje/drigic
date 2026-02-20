import Link from "next/link";
import React from "react";

export default function Breadcumb2() {
  return (
    <div className="breadcumb-wrapper style2 bg-smoke">
      <div className="container-fluid">
        <div className="breadcumb-content">
          <ul className="breadcumb-menu">
            <li>
              <Link href={`/`}>Home</Link>
            </li>
            <li>
              <Link href={`/shop`}>Shop</Link>
            </li>
            <li>Printed T-Shirt</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
