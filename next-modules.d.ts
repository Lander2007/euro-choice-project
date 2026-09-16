declare module "next" {
  export type Metadata = Record<string, any>;
  export type NextConfig = Record<string, any>;
  const next: any;
  export default next;
}

declare module "next/types.js" {
  export type Metadata = Record<string, any>;
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
  export type Viewport = any;
}

declare module "next/link" {
  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string | { pathname?: string; query?: any };
    as?: string | { pathname?: string; query?: any };
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    children?: React.ReactNode;
  }
  const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
  export default Link;
}

declare module "next/navigation" {
  export function useRouter(): {
    push(href: string, options?: any): void;
    replace(href: string, options?: any): void;
    refresh(): void;
    back(): void;
    forward(): void;
    prefetch(href: string): void;
  };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams<T = Record<string, string | string[]>>(): T;
  export function notFound(): never;
  export function redirect(url: string, type?: any): never;
}
