export const metadata = {
  title: 'Plant EHS Hazard Logger',
  description: 'MSME EHS Audit & Hazard Reporting Tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}