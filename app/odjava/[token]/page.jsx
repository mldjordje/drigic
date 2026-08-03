import UnsubscribeForm from "./UnsubscribeForm";

export const metadata = {
  title: "Odjava sa liste obaveštenja | Dr Igic Clinic",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({ params }) {
  const { token } = await params;

  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
      }}
    >
      <UnsubscribeForm token={token} />
    </main>
  );
}
