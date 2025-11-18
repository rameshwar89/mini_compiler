import "../styles/globals.css";

export const metadata = {
  title: "Mini Compiler",
  description: "A mini compiler with lexer, parser, intermediate code generator, and executor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
