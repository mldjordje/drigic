"use client";

import { useState } from "react";

const paymentMethods = [
  {
    id: "bacs",
    label: "Direct bank transfer",
    description: (
      <p>
        Make your payment directly into our bank account. Please use your Order
        ID as the payment reference. Your order will not be shipped until the
        funds have cleared in our account.
      </p>
    ),
  },
  {
    id: "cheque",
    label: "Cash on delivery",
    description: (
      <>
        <h5>Pay with cash upon delivery.</h5>
        <p>
          Your personal data will be used to process your order, support your
          experience throughout this website, and for other purposes described
          in our privacy policy.
        </p>
      </>
    ),
    defaultChecked: true,
  },
  {
    id: "cod",
    label: "Credit Cart",
    description: <p>Pay with credit cart.</p>,
  },
  {
    id: "paypal",
    label: "Paypal",
    description: (
      <p>
        Pay via PayPal; you can pay with your credit card if you don’t have a
        PayPal account.
      </p>
    ),
  },
];

const PaymentMethods = () => {
  const [activeMethod, setActiveMethod] = useState(paymentMethods[1].id);
  return (
    <>
      {paymentMethods.map(({ id, label, description, defaultChecked }) => (
        <li
          key={id}
          className={`wc_payment_method payment_method_${id} ${
            activeMethod == id ? "active" : ""
          }`}
          onClick={() => setActiveMethod(id)}
        >
          <input
            id={`payment_method_${id}`}
            type="radio"
            className="input-radio"
            readOnly
            checked={activeMethod == id}
          />
          <label htmlFor={`payment_method_${id}`}>{label}</label>
          <div className={`desc payment_box payment_method_${id}`}>
            {description}
          </div>
        </li>
      ))}
    </>
  );
};

export default PaymentMethods;
