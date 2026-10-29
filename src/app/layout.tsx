export const metadata = {
  title: "TestService",
  description: "Gestión de testing funcional y UAT",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}