// import Navbar from '@/components/Navbar';
// import Providers from '@/components/Providers';
// import { cn } from '@/lib/utils';
// import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
// import './globals.css';

// import 'react-loading-skeleton/dist/skeleton.css';
// import 'simplebar-react/dist/simplebar.min.css';
// import { Toast } from '@/components/ui/toast';
// import { Toaster } from '@/components/ui/toaster';

// const inter = Inter({ subsets: ['latin'] });

// export const metadata: Metadata = {
//   title: 'Create Next App',
//   description: 'Generated by create next app',
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en" className="light">
//       <Providers>
//         <body
//           className={cn(
//             'min-h-screen font-sans antialiased grainy',
//             inter.className
//           )}
//         >
//           <Toaster />
//           <Navbar />
//           {children}
//         </body>
//       </Providers>
//     </html>
//   );
// }

import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';
import { cn, constructMetadata } from '@/lib/utils';
import { Inter } from 'next/font/google';
import './globals.css';

import 'react-loading-skeleton/dist/skeleton.css';
import 'simplebar-react/dist/simplebar.min.css';

import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata = constructMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <Providers>
        <body
          className={cn(
            'min-h-screen font-sans antialiased grainy',
            inter.className
          )}
        >
          <Toaster />
          <Navbar />
          {children}
        </body>
      </Providers>
    </html>
  );
}
