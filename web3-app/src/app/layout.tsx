import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from '../providers/providers';

export const metadata = {
  title: 'Sentinel DAO',
  description: 'Governance OS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
