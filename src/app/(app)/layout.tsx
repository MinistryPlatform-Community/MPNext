export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col">
        <main className="flex-1">
          {children}
        </main>
    </div>
  );
}
